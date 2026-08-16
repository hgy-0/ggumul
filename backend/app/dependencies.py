"""공통 의존성 모듈"""

from fastapi import Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.goal import Goal


async def get_device_id(x_device_id: str = Header(default=None)) -> str:
    """
    Request 헤더에서 X-Device-Id를 추출하는 의존성.

    X-Device-Id 헤더가 없으면 400 에러를 반환한다.
    자동 생성하지 않고 클라이언트가 반드시 제공해야 한다.
    """
    if not x_device_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Device-Id 헤더가 필요합니다.",
        )
    return x_device_id


async def verify_goal_ownership(
    goal_id: int, device_id: str, db: AsyncSession
) -> Goal:
    """
    goal_id로 목표를 조회하고 device_id 소유권을 검증한다.

    존재하지 않으면 404, 소유권이 다르면 403을 발생시킨다.
    """
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()

    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="목표를 찾을 수 없습니다.",
        )
    if goal.device_id != device_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="접근 권한이 없습니다.",
        )
    return goal
