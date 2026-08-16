"""스키마 패키지 — 모든 Pydantic 스키마 import"""

from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse
from app.schemas.attempt import AttemptCreate, AttemptResponse
from app.schemas.streak import StreakResponse
from app.schemas.insight import InsightResponse
from app.schemas.notification import PushSubscriptionCreate, NotificationScheduleCreate, NotificationScheduleResponse, NotificationSchedulesBulk

__all__ = [
    "GoalCreate",
    "GoalUpdate",
    "GoalResponse",
    "AttemptCreate",
    "AttemptResponse",
    "StreakResponse",
    "InsightResponse",
    "PushSubscriptionCreate",
    "NotificationScheduleCreate",
    "NotificationScheduleResponse",
    "NotificationSchedulesBulk",
]
