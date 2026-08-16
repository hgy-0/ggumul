"""디바이스별 통계 모델 — device_id별 날짜별 통계"""

from datetime import date, datetime

from sqlalchemy import Date, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DeviceStat(Base):
    __tablename__ = "device_stats"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("devices.device_id"),
        nullable=False,
        index=True,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    attempts: Mapped[int] = mapped_column(default=0)
    successes: Mapped[int] = mapped_column(default=0)
    success_rate: Mapped[float] = mapped_column(default=0.0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
    )

    # 같은 device_id에 같은 날 중복 방지
    __table_args__ = (UniqueConstraint("device_id", "date", name="uq_device_date"),)
