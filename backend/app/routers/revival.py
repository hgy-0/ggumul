"""부활 카드 API 라우터"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_device_id, verify_goal_ownership
from app.services.revival_service import use_revival_card

router = APIRouter(prefix="/api/goals/{goal_id}/revival", tags=["revival"])


class RevivalRequest(BaseModel):
    """부활 카드 사용 요청"""
    attempted_date: date = Field(..., description="부활 적용할 날짜")


@router.put("")
async def apply_revival_card(
    goal_id: int,
    req: RevivalRequest,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """
    부활 카드를 사용하여 해당 날짜의 실패 기록을 부활 처리한다.
    - 해당 날짜에 실패 기록이 있어야 함
    - 부활 카드가 1장 이상 있어야 함
    """
    await verify_goal_ownership(goal_id, device_id, db)

    success = await use_revival_card(goal_id, req.attempted_date, db)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="부활 카드를 사용할 수 없습니다. 카드가 없거나 해당 날짜에 실패 기록이 없습니다.",
        )

    return {"message": "부활 카드가 사용되었습니다."}
