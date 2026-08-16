"""Streak API 라우터"""

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_device_id, verify_goal_ownership
from app.models.attempt import Attempt
from app.schemas.streak import StreakResponse
from app.services.streak_service import calculate_streak

router = APIRouter(prefix="/api/goals/{goal_id}/streak", tags=["streaks"])


@router.get("", response_model=StreakResponse)
async def get_streak(
    goal_id: int,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """목표의 Streak 현황을 조회한다."""
    goal = await verify_goal_ownership(goal_id, device_id, db)

    current_streak, best_streak = await calculate_streak(goal_id, db)

    # 오늘 시도 여부 확인
    today = date.today()
    today_result = await db.execute(
        select(Attempt).where(
            Attempt.goal_id == goal_id,
            Attempt.attempted_date == today,
        )
    )
    today_attempt = today_result.scalar_one_or_none()

    return StreakResponse(
        current_streak=current_streak,
        best_streak=best_streak,
        revival_cards=goal.revival_cards,
        today_attempted=today_attempt is not None,
        today_success=today_attempt.success if today_attempt else False,
    )
