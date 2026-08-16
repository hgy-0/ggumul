"""푸시 알림 관련 Pydantic v2 스키마"""

from pydantic import BaseModel, Field, field_validator


class PushSubscriptionCreate(BaseModel):
    """푸시 구독 등록 요청"""
    endpoint: str
    keys: dict  # {"p256dh": "...", "auth": "..."}


class NotificationScheduleCreate(BaseModel):
    """단일 알림 스케줄 생성"""
    hour: int = Field(..., ge=0, le=23)
    minute: int = Field(..., ge=0, le=59)
    days: list[int] = Field(default=[0, 1, 2, 3, 4, 5, 6], description="요일 (0=월 ~ 6=일)")

    @field_validator("days")
    @classmethod
    def validate_days(cls, v: list[int]) -> list[int]:
        if not v:
            raise ValueError("요일을 최소 하나 선택해야 합니다.")
        if any(d < 0 or d > 6 for d in v):
            raise ValueError("요일 값은 0(월)~6(일) 범위여야 합니다.")
        return sorted(set(v))


class NotificationScheduleResponse(BaseModel):
    """단일 알림 스케줄 응답"""
    id: int
    goal_id: int
    hour: int
    minute: int
    days: list[int]

    model_config = {"from_attributes": True}


class NotificationSchedulesBulk(BaseModel):
    """목표의 알림 스케줄 일괄 설정 (기존 스케줄 교체)"""
    schedules: list[NotificationScheduleCreate]
