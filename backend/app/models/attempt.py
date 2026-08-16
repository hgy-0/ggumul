"""시도 모델 — 목표에 대한 일별 시도 기록"""

from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id"), nullable=False, index=True)
    attempted_date: Mapped[date] = mapped_column(Date, nullable=False)
    success: Mapped[bool] = mapped_column(nullable=False)
    failure_reason: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # 'tired', 'forgot', 'no_time', 'lazy', 'other'
    failure_memo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    used_revival: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    # 관계 설정
    goal = relationship("Goal", back_populates="attempts")

    # 같은 목표에 같은 날 중복 시도 방지
    __table_args__ = (
        UniqueConstraint("goal_id", "attempted_date", name="uq_goal_date"),
    )
