"""알림 스케줄 동기화 서비스"""

import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.goal import Goal
from app.models.notification_schedule import NotificationSchedule


async def sync_notification_schedules(
    goal: Goal, schedules_in: list, db: AsyncSession
) -> None:
    """목표의 알림 스케줄을 교체한다."""
    # 기존 스케줄 삭제
    result = await db.execute(
        select(NotificationSchedule).where(NotificationSchedule.goal_id == goal.id)
    )
    for old in result.scalars().all():
        await db.delete(old)
    await db.flush()

    # 새 스케줄 생성
    for s in schedules_in:
        ns = NotificationSchedule(
            goal_id=goal.id,
            hour=s.hour,
            minute=s.minute,
            days=json.dumps(s.days),
        )
        db.add(ns)
    await db.flush()
