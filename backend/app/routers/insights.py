"""인사이트 API 라우터"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_device_id, verify_goal_ownership
from app.schemas.insight import InsightResponse
from app.services.insight_service import get_insights

router = APIRouter(prefix="/api/goals/{goal_id}/insights", tags=["insights"])


@router.get("", response_model=InsightResponse)
async def get_goal_insights(
    goal_id: int,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """목표의 인사이트를 조회한다."""
    await verify_goal_ownership(goal_id, device_id, db)
    return await get_insights(goal_id, db)
