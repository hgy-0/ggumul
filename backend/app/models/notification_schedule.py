"""알림 스케줄 모델 — 목표별 다중 알림 시간 설정"""

import json
from typing import Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class NotificationSchedule(Base):
    __tablename__ = "notification_schedules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    goal_id: Mapped[int] = mapped_column(
        ForeignKey("goals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    hour: Mapped[int] = mapped_column(nullable=False)  # 0-23
    minute: Mapped[int] = mapped_column(nullable=False)  # 0-59
    days: Mapped[str] = mapped_column(
        Text, default="[0,1,2,3,4,5,6]"
    )  # JSON array of day numbers (0=Mon, 6=Sun)

    @property
    def days_list(self) -> list[int]:
        return json.loads(self.days) if self.days else [0, 1, 2, 3, 4, 5, 6]

    @days_list.setter
    def days_list(self, value: list[int]):
        self.days = json.dumps(value)
