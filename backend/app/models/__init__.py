"""모델 패키지 — 모든 SQLAlchemy 모델을 여기서 import"""

from app.models.device import Device
from app.models.goal import Goal
from app.models.attempt import Attempt
from app.models.subscription import PushSubscription
from app.models.notification_schedule import NotificationSchedule
from app.models.daily_stat import DailyStat
from app.models.device_stat import DeviceStat
from app.models.friendship import Friendship
from app.models.invite_code import InviteCode

__all__ = [
    "Device",
    "Goal",
    "Attempt",
    "PushSubscription",
    "NotificationSchedule",
    "DailyStat",
    "DeviceStat",
    "Friendship",
    "InviteCode",
]
