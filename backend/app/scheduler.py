"""스케줄러 모듈 — APScheduler 기반 정기 작업"""

import asyncio
import json
import logging
from datetime import date, datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.database import async_session
from app.models.attempt import Attempt
from app.models.goal import Goal
from app.models.notification_schedule import NotificationSchedule
from app.models.subscription import PushSubscription
from app.services.push_service import PushResult, send_push

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def _send_push_to_subscriptions(
    subscriptions: list[PushSubscription],
    title: str,
    body: str,
    db,
) -> None:
    """구독 목록에 푸시를 발송하고 만료된 구독은 삭제한다."""
    loop = asyncio.get_running_loop()
    for sub in subscriptions:
        try:
            subscription_info = {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh,
                    "auth": sub.auth,
                },
            }
            result = await loop.run_in_executor(
                None, send_push, subscription_info, title, body,
            )
            if result == PushResult.GONE:
                logger.info(f"만료된 구독 삭제: {sub.endpoint[:50]}")
                await db.delete(sub)
        except Exception:
            logger.exception(f"푸시 발송 중 예외 (endpoint: {sub.endpoint[:50]})")


async def check_notification_schedules():
    """
    매분 실행: 현재 시간/요일과 일치하는 알림 스케줄이 있는 목표를 찾아 푸시 발송.
    """
    now = datetime.now()
    current_hour = now.hour
    current_minute = now.minute
    current_weekday = now.weekday()  # 0=Monday, 6=Sunday

    async with async_session() as db:
        # 현재 시간에 매칭되는 스케줄 조회
        result = await db.execute(
            select(NotificationSchedule).where(
                NotificationSchedule.hour == current_hour,
                NotificationSchedule.minute == current_minute,
            )
        )
        schedules = result.scalars().all()

        for ns in schedules:
            try:
                # 요일 체크
                days = json.loads(ns.days) if ns.days else [0, 1, 2, 3, 4, 5, 6]
                if current_weekday not in days:
                    continue

                # 해당 목표가 활성 상태인지 확인
                goal_result = await db.execute(
                    select(Goal).where(Goal.id == ns.goal_id, Goal.is_active == True)  # noqa: E712
                )
                goal = goal_result.scalar_one_or_none()
                if not goal:
                    continue

                # 해당 디바이스의 푸시 구독 조회
                sub_result = await db.execute(
                    select(PushSubscription).where(
                        PushSubscription.device_id == goal.device_id
                    )
                )
                subscriptions = sub_result.scalars().all()

                await _send_push_to_subscriptions(
                    subscriptions,
                    f"'{goal.name}' 시작할 시간이에요!",
                    f"첫 행동: {goal.first_action}",
                    db,
                )
            except Exception:
                logger.exception(f"알림 스케줄 처리 중 예외 (schedule_id={ns.id})")

        await db.commit()


async def check_streak_danger():
    """
    매일 21:00 실행: 오늘 아직 시도하지 않은 목표에 대해 'Streak 위험' 알림 발송.
    """
    today = date.today()

    async with async_session() as db:
        # 활성 목표 조회
        result = await db.execute(
            select(Goal).where(Goal.is_active == True)  # noqa: E712
        )
        goals = result.scalars().all()

        for goal in goals:
            try:
                # 오늘 시도 여부 확인
                attempt_result = await db.execute(
                    select(Attempt).where(
                        Attempt.goal_id == goal.id,
                        Attempt.attempted_date == today,
                    )
                )
                today_attempt = attempt_result.scalar_one_or_none()

                if today_attempt is not None:
                    continue  # 이미 시도했으면 스킵

                # 해당 디바이스의 푸시 구독 조회
                sub_result = await db.execute(
                    select(PushSubscription).where(
                        PushSubscription.device_id == goal.device_id
                    )
                )
                subscriptions = sub_result.scalars().all()

                await _send_push_to_subscriptions(
                    subscriptions,
                    f"Streak 위험! '{goal.name}'",
                    "오늘 아직 시작하지 않았어요. Streak이 끊기기 전에 시작해보세요!",
                    db,
                )
            except Exception:
                logger.exception(f"Streak 위험 알림 처리 중 예외 (goal_id={goal.id})")

        await db.commit()


def start_scheduler():
    """스케줄러를 시작하고 작업을 등록한다."""
    # 매분 알림 스케줄 체크
    scheduler.add_job(
        check_notification_schedules,
        "cron",
        minute="*",
        id="check_notifications",
        replace_existing=True,
    )

    # 매일 21:00 Streak 위험 알림
    scheduler.add_job(
        check_streak_danger,
        "cron",
        hour=21,
        minute=0,
        id="streak_danger",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("스케줄러가 시작되었습니다.")


def stop_scheduler():
    """스케줄러를 종료한다."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("스케줄러가 종료되었습니다.")
