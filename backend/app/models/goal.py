"""목표 모델 — 사용자가 등록한 목표 정보"""

from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("devices.device_id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    first_action: Mapped[str] = mapped_column(String(200), nullable=False)
    countdown_seconds: Mapped[int] = mapped_column(default=300)
    revival_cards: Mapped[int] = mapped_column(default=0)  # 최대 3장
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
    )

    # 관계 설정
    attempts = relationship("Attempt", back_populates="goal", lazy="selectin")
    notification_schedules = relationship(
        "NotificationSchedule", lazy="selectin", cascade="all, delete-orphan",
        passive_deletes=True,
    )
