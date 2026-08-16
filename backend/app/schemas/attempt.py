"""시도 관련 Pydantic v2 스키마"""

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

FailureReasonType = Literal["tired", "forgot", "no_time", "lazy", "other"]


class AttemptCreate(BaseModel):
    """시도 기록 요청"""
    attempted_date: date = Field(..., description="시도 날짜 (YYYY-MM-DD)")
    success: bool = Field(..., description="성공 여부")
    failure_reason: Optional[FailureReasonType] = Field(
        default=None,
        description="실패 이유 (tired, forgot, no_time, lazy, other)",
    )
    failure_memo: Optional[str] = Field(default=None, description="실패 메모")
    use_revival: bool = Field(default=False, description="부활 카드 사용 여부")


class AttemptResponse(BaseModel):
    """시도 응답"""
    id: int
    goal_id: int
    attempted_date: date
    success: bool
    failure_reason: Optional[str]
    failure_memo: Optional[str]
    used_revival: bool
    created_at: datetime
    # 부활 카드 지급 여부 (성공 시 streak 7배수 달성하면)
    revival_card_awarded: bool = False

    model_config = {"from_attributes": True}
