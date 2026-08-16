"""부활 카드 서비스 — 실패한 시도에 부활 카드를 사용하는 로직"""

from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attempt import Attempt
from app.models.goal import Goal


async def use_revival_card(goal_id: int, attempted_date: date, db: AsyncSession) -> bool:
    """
    해당 날짜의 실패 시도에 부활 카드를 사용한다.

    - 해당 날짜의 실패 attempt를 찾아 used_revival=True로 업데이트
    - goal의 revival_cards를 1 차감

    Returns:
        부활 카드 사용 성공 여부
    """
    # 목표 조회
    goal_result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = goal_result.scalar_one_or_none()

    if goal is None or goal.revival_cards <= 0:
        return False

    # 해당 날짜의 실패 시도 조회 (아직 부활 카드 미사용 건만)
    attempt_result = await db.execute(
        select(Attempt).where(
            Attempt.goal_id == goal_id,
            Attempt.attempted_date == attempted_date,
            Attempt.success == False,  # noqa: E712
            Attempt.used_revival == False,  # noqa: E712
        )
    )
    attempt = attempt_result.scalar_one_or_none()

    if attempt is None:
        return False

    # 부활 카드 사용 처리
    attempt.used_revival = True
    goal.revival_cards -= 1
    await db.flush()

    return True
