"""친구 관계 모델"""

from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Friendship(Base):
    """
    친구 관계 테이블 (device 기반).
    device_id_1 < device_id_2 제약으로 중복 방지.
    """

    __tablename__ = "friendships"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    device_id_1: Mapped[str] = mapped_column(
        String(64), ForeignKey("devices.device_id"), nullable=False, index=True
    )
    device_id_2: Mapped[str] = mapped_column(
        String(64), ForeignKey("devices.device_id"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="active", nullable=False
    )  # active, blocked
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("device_id_1", "device_id_2", name="uq_friendship"),
        CheckConstraint("device_id_1 < device_id_2", name="ck_device_order"),
    )

    # Relationships
    device_1 = relationship(
        "Device", foreign_keys=[device_id_1], back_populates="friendships_as_device1"
    )
    device_2 = relationship(
        "Device", foreign_keys=[device_id_2], back_populates="friendships_as_device2"
    )
