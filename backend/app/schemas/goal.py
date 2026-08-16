"""목표 관련 Pydantic v2 스키마"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.notification import NotificationScheduleCreate, NotificationScheduleResponse


class GoalCreate(BaseModel):
    """목표 생성 요청"""
    name: str = Field(..., min_length=1, max_length=100, description="목표 이름")
    first_action: str = Field(..., min_length=1, max_length=200, description="첫 번째 행동")
    countdown_seconds: int = Field(default=300, ge=60, le=3600, description="카운트다운 초")
    notification_schedules: list[NotificationScheduleCreate] = Field(default_factory=list)


class GoalUpdate(BaseModel):
    """목표 수정 요청"""
    name: Optional[str] = Field(default=None, max_length=100)
    first_action: Optional[str] = Field(default=None, max_length=200)
    countdown_seconds: Optional[int] = Field(default=None, ge=60, le=3600)
    notification_schedules: Optional[list[NotificationScheduleCreate]] = None


class GoalResponse(BaseModel):
    """목표 응답 (streak 정보 포함)"""
    id: int
    device_id: str
    name: str
    first_action: str
    countdown_seconds: int
    revival_cards: int
    is_active: bool
    notification_schedules: list[NotificationScheduleResponse] = []
    created_at: datetime
    updated_at: datetime
    # streak 정보
    current_streak: int = 0
    best_streak: int = 0
    today_attempted: bool = False
    today_success: bool = False
    # 우선순위 정보
    is_top_priority: bool = False

    model_config = {"from_attributes": True}
