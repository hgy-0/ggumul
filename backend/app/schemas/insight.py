"""인사이트 관련 Pydantic v2 스키마"""

from pydantic import BaseModel


class InsightResponse(BaseModel):
    """인사이트 응답"""
    total_attempts: int
    success_count: int
    success_rate: float
    failure_by_reason: dict[str, int]  # 실패 이유별 카운트
    failure_by_day_of_week: dict[str, int]  # 요일별 실패 카운트 (Mon~Sun)
    tips: list[str]  # 개선 팁 목록
