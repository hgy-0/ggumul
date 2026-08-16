"""디바이스 모델 — 기기 식별용"""

from datetime import datetime

from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    nickname: Mapped[str | None] = mapped_column(String(50), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    # Relationships for friendships
    friendships_as_device1 = relationship(
        "Friendship", foreign_keys="Friendship.device_id_1", back_populates="device_1"
    )
    friendships_as_device2 = relationship(
        "Friendship", foreign_keys="Friendship.device_id_2", back_populates="device_2"
    )
