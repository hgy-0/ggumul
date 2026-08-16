"""Streak 관련 Pydantic v2 스키마"""

from pydantic import BaseModel


class StreakResponse(BaseModel):
    """Streak 현황 응답"""
    current_streak: int
    best_streak: int
    revival_cards: int
    today_attempted: bool
    today_success: bool
