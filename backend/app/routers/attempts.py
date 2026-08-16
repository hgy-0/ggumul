"""시도 API 라우터"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_device_id, verify_goal_ownership
from app.models.attempt import Attempt
from app.schemas.attempt import AttemptCreate, AttemptResponse
from app.services.revival_service import use_revival_card
from app.services.streak_service import calculate_streak, check_and_award_revival
from app.services.stats_service import StatsService

router = APIRouter(prefix="/api/goals/{goal_id}/attempts", tags=["attempts"])


@router.post("", response_model=AttemptResponse, status_code=status.HTTP_201_CREATED)
async def create_attempt(
    goal_id: int,
    attempt_in: AttemptCreate,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """
    시도를 기록한다.

    - success=True이면 streak 체크 후 부활 카드 지급 여부 확인
    - success=False이고 use_revival=True이면 부활 카드 사용 처리
    - 같은 날 중복 시도 시 409 Conflict 반환
    """
    await verify_goal_ownership(goal_id, device_id, db)

    target_date = attempt_in.attempted_date

    # 같은 날 중복 시도 확인
    existing = await db.execute(
        select(Attempt).where(
            Attempt.goal_id == goal_id,
            Attempt.attempted_date == target_date,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="해당 날짜에 이미 시도를 기록했습니다.",
        )

    # 시도 생성
    attempt = Attempt(
        goal_id=goal_id,
        attempted_date=target_date,
        success=attempt_in.success,
        failure_reason=attempt_in.failure_reason if not attempt_in.success else None,
        failure_memo=attempt_in.failure_memo if not attempt_in.success else None,
        used_revival=False,
    )
    db.add(attempt)
    await db.flush()

    revival_card_awarded = False

    if attempt_in.success:
        # 성공 시 streak 계산 후 부활 카드 지급 확인
        current_streak, _ = await calculate_streak(goal_id, db)
        revival_card_awarded = await check_and_award_revival(goal_id, current_streak, db)
    elif attempt_in.use_revival:
        # 실패 시 부활 카드 사용 요청
        await use_revival_card(goal_id, target_date, db)

    # 통계 업데이트
    await StatsService.update_stats_on_attempt(
        device_id=device_id, goal_id=goal_id, success=attempt_in.success, db=db
    )

    await db.refresh(attempt)

    return AttemptResponse(
        id=attempt.id,
        goal_id=attempt.goal_id,
        attempted_date=attempt.attempted_date,
        success=attempt.success,
        failure_reason=attempt.failure_reason,
        failure_memo=attempt.failure_memo,
        used_revival=attempt.used_revival,
        created_at=attempt.created_at,
        revival_card_awarded=revival_card_awarded,
    )
