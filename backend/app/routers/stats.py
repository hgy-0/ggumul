"""통계 API 라우터"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_device_id
from app.services.stats_service import StatsService

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/today")
async def get_today_stats(db: AsyncSession = Depends(get_db)):
    """
    오늘 전체 통계 조회.

    - 오늘 하루 동안의 전체 사용자 통계 반환
    - total_successes, total_attempts, success_rate, unique_devices
    """
    return await StatsService.get_today_stats(db)


@router.get("/me")
async def get_my_stats(
    device_id: str = Depends(get_device_id), db: AsyncSession = Depends(get_db)
):
    """
    내 통계 (최근 7일).

    - 현재 디바이스의 최근 7일 통계 반환
    - 전체 평균과 비교
    """
    return await StatsService.get_device_stats(device_id, db)
