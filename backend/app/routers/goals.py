"""목표 API 라우터"""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_device_id, verify_goal_ownership
from app.models.attempt import Attempt
from app.models.goal import Goal
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate
from app.schemas.notification import NotificationScheduleResponse
from app.services.notification_service import sync_notification_schedules
from app.services.priority_service import get_top_priority_goal_id
from app.services.streak_service import calculate_streak

router = APIRouter(prefix="/api/goals", tags=["goals"])


async def _build_goal_response(goal: Goal, db: AsyncSession) -> GoalResponse:
    """Goal 모델을 streak 정보가 포함된 응답 스키마로 변환한다."""
    current_streak, best_streak = await calculate_streak(goal.id, db)

    # 오늘 시도 여부 확인
    today = date.today()
    today_result = await db.execute(
        select(Attempt).where(
            Attempt.goal_id == goal.id,
            Attempt.attempted_date == today,
        )
    )
    today_attempt = today_result.scalar_one_or_none()

    # 우선순위 최상위 목표 확인
    top_priority_id = await get_top_priority_goal_id(goal.device_id, db)

    # 알림 스케줄 변환
    schedules = [
        NotificationScheduleResponse(
            id=ns.id,
            goal_id=ns.goal_id,
            hour=ns.hour,
            minute=ns.minute,
            days=ns.days_list,
        )
        for ns in (goal.notification_schedules or [])
    ]

    return GoalResponse(
        id=goal.id,
        device_id=goal.device_id,
        name=goal.name,
        first_action=goal.first_action,
        countdown_seconds=goal.countdown_seconds,
        revival_cards=goal.revival_cards,
        is_active=goal.is_active,
        notification_schedules=schedules,
        created_at=goal.created_at,
        updated_at=goal.updated_at,
        current_streak=current_streak,
        best_streak=best_streak,
        today_attempted=today_attempt is not None,
        today_success=today_attempt.success if today_attempt else False,
        is_top_priority=(goal.id == top_priority_id),
    )


async def _build_goal_responses_batch(
    goals: list[Goal], db: AsyncSession
) -> list[GoalResponse]:
    """여러 Goal을 배치로 조회하여 응답을 구성한다 (N+1 방지)."""
    if not goals:
        return []

    # Extract device_id from first goal (all goals in a batch belong to the same device)
    device_id = goals[0].device_id

    goal_ids = [g.id for g in goals]
    today = date.today()

    # 배치: 오늘 시도 목록 조회
    attempts_result = await db.execute(
        select(Attempt).where(
            Attempt.goal_id.in_(goal_ids),
            Attempt.attempted_date == today,
        )
    )
    today_attempts = {a.goal_id: a for a in attempts_result.scalars().all()}

    # 배치: streak 계산 (각 goal별로 호출 — streak_service 내부 로직상 개별 계산 필요)
    streaks = {}
    for goal_id in goal_ids:
        streaks[goal_id] = await calculate_streak(goal_id, db)

    # 우선순위 최상위 목표 ID 조회
    top_priority_id = await get_top_priority_goal_id(device_id, db)

    responses = []
    for goal in goals:
        current_streak, best_streak = streaks[goal.id]
        today_attempt = today_attempts.get(goal.id)

        schedules = [
            NotificationScheduleResponse(
                id=ns.id,
                goal_id=ns.goal_id,
                hour=ns.hour,
                minute=ns.minute,
                days=ns.days_list,
            )
            for ns in (goal.notification_schedules or [])
        ]

        responses.append(GoalResponse(
            id=goal.id,
            device_id=goal.device_id,
            name=goal.name,
            first_action=goal.first_action,
            countdown_seconds=goal.countdown_seconds,
            revival_cards=goal.revival_cards,
            is_active=goal.is_active,
            notification_schedules=schedules,
            created_at=goal.created_at,
            updated_at=goal.updated_at,
            current_streak=current_streak,
            best_streak=best_streak,
            today_attempted=today_attempt is not None,
            today_success=today_attempt.success if today_attempt else False,
            is_top_priority=(goal.id == top_priority_id),
        ))

    return responses


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_in: GoalCreate,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """새 목표를 생성한다."""
    goal = Goal(
        device_id=device_id,
        name=goal_in.name,
        first_action=goal_in.first_action,
        countdown_seconds=goal_in.countdown_seconds,
    )
    db.add(goal)
    await db.flush()
    await db.refresh(goal)

    if goal_in.notification_schedules:
        await sync_notification_schedules(goal, goal_in.notification_schedules, db)
        await db.refresh(goal, attribute_names=["notification_schedules"])

    return await _build_goal_response(goal, db)


@router.get("", response_model=list[GoalResponse])
async def list_goals(
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """디바이스의 활성 목표 목록을 조회한다 (streak 정보 포함)."""
    result = await db.execute(
        select(Goal).where(
            Goal.device_id == device_id,
            Goal.is_active == True,  # noqa: E712
        ).order_by(Goal.created_at.desc())
    )
    goals = result.scalars().all()

    return await _build_goal_responses_batch(goals, db)


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """목표 상세 정보를 조회한다."""
    goal = await verify_goal_ownership(goal_id, device_id, db)
    return await _build_goal_response(goal, db)


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    goal_in: GoalUpdate,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """목표를 수정한다."""
    goal = await verify_goal_ownership(goal_id, device_id, db)

    # 전달된 필드만 업데이트 (notification_schedules 제외)
    update_data = goal_in.model_dump(exclude_unset=True, exclude={"notification_schedules"})
    for field, value in update_data.items():
        setattr(goal, field, value)

    # 알림 스케줄 업데이트
    if goal_in.notification_schedules is not None:
        await sync_notification_schedules(goal, goal_in.notification_schedules, db)

    await db.flush()
    await db.refresh(goal, attribute_names=["notification_schedules"])

    return await _build_goal_response(goal, db)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """목표를 삭제한다 (soft delete: is_active=False)."""
    goal = await verify_goal_ownership(goal_id, device_id, db)
    goal.is_active = False
    await db.flush()


class DailyAttemptStat(BaseModel):
    """일별 시도 통계"""
    date: str  # YYYY-MM-DD
    attempted: bool
    success: bool


class GoalStatsResponse(BaseModel):
    """목표별 통계 응답"""
    goal_id: int
    goal_name: str
    current_streak: int
    best_streak: int
    total_attempts: int
    total_successes: int
    success_rate: float  # 0.0 ~ 1.0
    daily_stats: list[DailyAttemptStat]  # 최근 7일


@router.get("/{goal_id}/stats", response_model=GoalStatsResponse)
async def get_goal_stats(
    goal_id: int,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """목표별 최근 7일 통계를 조회한다."""
    goal = await verify_goal_ownership(goal_id, device_id, db)

    # Streak 계산
    current_streak, best_streak = await calculate_streak(goal_id, db)

    # 최근 7일 날짜 범위
    today = date.today()
    start_date = today - timedelta(days=6)

    # 최근 7일 시도 기록 조회
    result = await db.execute(
        select(Attempt).where(
            Attempt.goal_id == goal_id,
            Attempt.attempted_date >= start_date,
            Attempt.attempted_date <= today,
        ).order_by(Attempt.attempted_date)
    )
    attempts = {a.attempted_date: a for a in result.scalars().all()}

    # 전체 통계 계산 (최근 7일)
    total_attempts = len(attempts)
    total_successes = sum(1 for a in attempts.values() if a.success)
    success_rate = total_successes / total_attempts if total_attempts > 0 else 0.0

    # 일별 통계 생성 (최근 7일)
    daily_stats = []
    for i in range(7):
        target_date = start_date + timedelta(days=i)
        attempt = attempts.get(target_date)
        daily_stats.append(DailyAttemptStat(
            date=target_date.isoformat(),
            attempted=attempt is not None,
            success=attempt.success if attempt else False,
        ))

    return GoalStatsResponse(
        goal_id=goal.id,
        goal_name=goal.name,
        current_streak=current_streak,
        best_streak=best_streak,
        total_attempts=total_attempts,
        total_successes=total_successes,
        success_rate=success_rate,
        daily_stats=daily_stats,
    )
