"""목표 우선순위 계산 서비스"""

from datetime import date, timedelta
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attempt import Attempt
from app.models.goal import Goal


async def calculate_priority_score(
    goal: Goal,
    current_streak: int,
    db: AsyncSession,
) -> float:
    """
    목표의 우선순위 점수를 계산한다.

    점수가 높을수록 우선순위가 높다.
    오늘 완료한 목표는 0점을 반환한다.

    공식:
    priority_score = (
        streak_score * 0.4 +
        urgency_score * 0.3 +
        success_rate_penalty * 0.2 +
        recency_score * 0.1
    )
    """
    # 오늘 이미 완료했으면 우선순위 없음
    today = date.today()
    today_result = await db.execute(
        select(Attempt).where(
            Attempt.goal_id == goal.id,
            Attempt.attempted_date == today,
        )
    )
    today_attempt = today_result.scalar_one_or_none()
    if today_attempt and today_attempt.success:
        return 0.0

    # 1. Streak Score (0~100): streak가 길수록 높음
    # 로그 스케일로 변환하여 너무 큰 차이 방지
    import math
    streak_score = min(100, math.log1p(current_streak) * 20)

    # 2. Urgency Score (0~100): 오늘 안 하면 streak 끊김
    # streak > 0이면 100점, 아니면 0점
    urgency_score = 100.0 if current_streak > 0 else 0.0

    # 3. Success Rate Penalty (0~100): 성공률 낮을수록 높음
    # 전체 시도 횟수와 성공 횟수 조회
    from sqlalchemy import Integer
    stats_result = await db.execute(
        select(
            func.count(Attempt.id).label("total_attempts"),
            func.sum(Attempt.success.cast(Integer)).label("total_successes"),
        ).where(Attempt.goal_id == goal.id)
    )
    stats = stats_result.one()

    if stats.total_attempts > 0:
        success_rate = (stats.total_successes or 0) / stats.total_attempts
        # 성공률이 낮을수록 높은 점수 (격려)
        success_rate_penalty = (1 - success_rate) * 100
    else:
        # 시도 기록 없으면 중간 점수
        success_rate_penalty = 50.0

    # 4. Recency Score (0~100): 최근 실패했으면 높음
    yesterday = today - timedelta(days=1)
    recent_result = await db.execute(
        select(Attempt).where(
            Attempt.goal_id == goal.id,
            Attempt.attempted_date == yesterday,
        )
    )
    yesterday_attempt = recent_result.scalar_one_or_none()

    if yesterday_attempt and not yesterday_attempt.success:
        recency_score = 100.0  # 어제 실패했으면 높은 점수
    else:
        recency_score = 0.0

    # 가중 평균 계산
    priority_score = (
        streak_score * 0.4 +
        urgency_score * 0.3 +
        success_rate_penalty * 0.2 +
        recency_score * 0.1
    )

    return round(priority_score, 2)


async def get_top_priority_goal_id(
    device_id: str,
    db: AsyncSession,
) -> Optional[int]:
    """
    기기의 활성 목표 중 우선순위가 가장 높은 목표 ID를 반환한다.
    오늘 완료하지 않은 목표만 고려한다.
    """
    from app.services.streak_service import calculate_streak

    # 활성 목표 조회
    result = await db.execute(
        select(Goal).where(
            Goal.device_id == device_id,
            Goal.is_active == True,
        )
    )
    goals = result.scalars().all()

    if not goals:
        return None

    # 각 목표의 우선순위 계산
    goal_scores = []
    for goal in goals:
        current_streak, _ = await calculate_streak(goal.id, db)
        score = await calculate_priority_score(goal, current_streak, db)

        # 점수가 0이 아닌 목표만 포함 (오늘 완료한 목표 제외)
        if score > 0:
            goal_scores.append((goal.id, score))

    if not goal_scores:
        return None

    # 점수가 가장 높은 목표 반환
    goal_scores.sort(key=lambda x: x[1], reverse=True)
    return goal_scores[0][0]
