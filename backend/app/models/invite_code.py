"""초대 코드 모델"""

from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class InviteCode(Base):
    """
    친구 초대 코드 테이블.
    7일간 유효한 초대 코드를 생성하고 관리.
    """

    __tablename__ = "invite_codes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    creator_device_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("devices.device_id"), nullable=False
    )
    used_by_device_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("devices.device_id"), nullable=True
    )
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relationships
    creator = relationship("Device", foreign_keys=[creator_device_id])
    used_by = relationship("Device", foreign_keys=[used_by_device_id])
