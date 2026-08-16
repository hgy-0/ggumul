"""푸시 알림 API 라우터"""

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_device_id, verify_goal_ownership
from app.models.notification_schedule import NotificationSchedule
from app.models.subscription import PushSubscription
from app.schemas.notification import (
    NotificationScheduleResponse,
    NotificationSchedulesBulk,
    PushSubscriptionCreate,
)
from app.services.notification_service import sync_notification_schedules
from app.services.push_service import PushResult, send_push

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["notifications"])


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe_push(
    sub_in: PushSubscriptionCreate,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """푸시 알림 구독 정보를 저장한다."""
    result = await db.execute(
        select(PushSubscription).where(
            PushSubscription.device_id == device_id,
            PushSubscription.endpoint == sub_in.endpoint,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.p256dh = sub_in.keys.get("p256dh", "")
        existing.auth = sub_in.keys.get("auth", "")
    else:
        subscription = PushSubscription(
            device_id=device_id,
            endpoint=sub_in.endpoint,
            p256dh=sub_in.keys.get("p256dh", ""),
            auth=sub_in.keys.get("auth", ""),
        )
        db.add(subscription)

    await db.flush()
    return {"message": "구독이 등록되었습니다."}


@router.put("/goals/{goal_id}/notification", response_model=list[NotificationScheduleResponse])
async def set_notification_schedules(
    goal_id: int,
    body: NotificationSchedulesBulk,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """목표의 알림 스케줄을 일괄 교체한다."""
    goal = await verify_goal_ownership(goal_id, device_id, db)
    await sync_notification_schedules(goal, body.schedules, db)

    # 새로 생성된 스케줄 조회
    result = await db.execute(
        select(NotificationSchedule).where(NotificationSchedule.goal_id == goal_id)
    )
    schedules = result.scalars().all()
    return [
        NotificationScheduleResponse(
            id=ns.id, goal_id=ns.goal_id,
            hour=ns.hour, minute=ns.minute, days=ns.days_list,
        )
        for ns in schedules
    ]


@router.get("/goals/{goal_id}/notification", response_model=list[NotificationScheduleResponse])
async def get_notification_schedules(
    goal_id: int,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """목표의 알림 스케줄 목록을 조회한다."""
    await verify_goal_ownership(goal_id, device_id, db)

    result = await db.execute(
        select(NotificationSchedule).where(NotificationSchedule.goal_id == goal_id)
    )
    schedules = result.scalars().all()
    return [
        NotificationScheduleResponse(
            id=ns.id, goal_id=ns.goal_id,
            hour=ns.hour, minute=ns.minute, days=ns.days_list,
        )
        for ns in schedules
    ]


@router.post("/test-push")
async def test_push(
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """테스트 푸시 알림을 즉시 발송한다."""
    sub_result = await db.execute(
        select(PushSubscription).where(PushSubscription.device_id == device_id)
    )
    subscriptions = sub_result.scalars().all()

    if not subscriptions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="등록된 푸시 구독이 없습니다. 알림을 먼저 활성화해주세요.",
        )

    sent = 0
    errors = []
    for sub in subscriptions:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {
                "p256dh": sub.p256dh,
                "auth": sub.auth,
            },
        }
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            None, send_push, subscription_info,
            "꾸물 테스트 알림",
            "알림이 정상적으로 작동합니다!",
        )
        if result == PushResult.SUCCESS:
            sent += 1
        elif result == PushResult.GONE:
            await db.delete(sub)
        else:
            errors.append(sub.endpoint[:50])

    await db.flush()

    if sent == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"푸시 발송 실패. errors: {errors}",
        )

    return {"message": f"테스트 알림 {sent}건 발송 완료", "sent": sent}
