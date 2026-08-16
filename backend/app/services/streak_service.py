"""Streak 서비스 — 연속 성공 계산 및 부활 카드 지급 핵심 로직"""

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attempt import Attempt
from app.models.goal import Goal


async def calculate_streak(goal_id: int, db: AsyncSession) -> tuple[int, int]:
    """
    현재 streak과 최고 streak을 계산한다.

    - 오늘부터 역순으로 연속 성공(success=True 또는 used_revival=True)을 카운트
    - 오늘 아직 시도하지 않았으면 어제부터 카운트 (하루가 끝날 때 판정하므로 끊기지 않음)
    - best_streak은 전체 기간에서 가장 긴 연속 성공 구간

    Returns:
        (current_streak, best_streak) 튜플
    """
    # 해당 목표의 모든 시도를 날짜 오름차순으로 조회
    result = await db.execute(
        select(Attempt)
        .where(Attempt.goal_id == goal_id)
        .order_by(Attempt.attempted_date.asc())
    )
    attempts = result.scalars().all()

    if not attempts:
        return (0, 0)

    # 날짜 → 성공 여부 매핑 (success 또는 used_revival이면 성공으로 간주)
    date_success: dict[date, bool] = {}
    for a in attempts:
        date_success[a.attempted_date] = a.success or a.used_revival

    # --- best_streak 계산 (전체 기간에서 가장 긴 연속 성공 구간) ---
    best_streak = 0
    current_run = 0
    sorted_dates = sorted(date_success.keys())

    for i, d in enumerate(sorted_dates):
        if date_success[d]:
            if i == 0:
                current_run = 1
            else:
                # 이전 날짜와 연속인지 확인
                prev_date = sorted_dates[i - 1]
                if (d - prev_date).days == 1 and date_success[prev_date]:
                    current_run += 1
                else:
                    current_run = 1
        else:
            current_run = 0
        best_streak = max(best_streak, current_run)

    # --- current_streak 계산 (오늘 기준 역순) ---
    today = date.today()
    current_streak = 0

    # 오늘 시도했는지 확인
    if today in date_success:
        check_date = today
    else:
        # 오늘 아직 안 했으면 어제부터 체크 (끊기지 않음)
        check_date = today - timedelta(days=1)

    while check_date in date_success:
        if date_success[check_date]:
            current_streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    return (current_streak, best_streak)


async def check_and_award_revival(goal_id: int, current_streak: int, db: AsyncSession) -> bool:
    """
    현재 streak이 7의 배수이고 부활 카드가 3장 미만이면 1장 지급한다.

    Returns:
        부활 카드가 지급되었으면 True
    """
    if current_streak == 0 or current_streak % 7 != 0:
        return False

    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()

    if goal is None:
        return False

    if goal.revival_cards < 3:
        goal.revival_cards += 1
        await db.flush()
        return True

    return False
