"""일일 통계 모델 — 전체 사용자의 날짜별 통계"""

from datetime import date, datetime

from sqlalchemy import Date, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DailyStat(Base):
    __tablename__ = "daily_stats"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, unique=True, nullable=False, index=True)
    total_attempts: Mapped[int] = mapped_column(default=0)
    total_successes: Mapped[int] = mapped_column(default=0)
    unique_devices: Mapped[int] = mapped_column(default=0)
    success_rate: Mapped[float] = mapped_column(default=0.0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
    )
