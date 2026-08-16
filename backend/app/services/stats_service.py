"""통계 서비스 — 통계 계산 및 업데이트 비즈니스 로직"""

from datetime import date, timedelta

from sqlalchemy import Integer, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Attempt, DailyStat, DeviceStat, Goal


class StatsService:
    @staticmethod
    async def get_today_stats(db: AsyncSession):
        """오늘 전체 통계 조회"""
        today = date.today()

        # daily_stats에서 조회
        result = await db.execute(select(DailyStat).where(DailyStat.date == today))
        daily_stat = result.scalar_one_or_none()

        if not daily_stat:
            # 없으면 실시간 계산
            return await StatsService._calculate_today_stats(db)

        return {
            "date": str(daily_stat.date),
            "total_successes": daily_stat.total_successes,
            "total_attempts": daily_stat.total_attempts,
            "success_rate": round(daily_stat.success_rate, 2),
            "unique_devices": daily_stat.unique_devices,
        }

    @staticmethod
    async def _calculate_today_stats(db: AsyncSession):
        """오늘 통계 실시간 계산 (캐시 없을 때)"""
        today = date.today()

        # 오늘 시도 집계
        result = await db.execute(
            select(
                func.count(Attempt.id).label("total_attempts"),
                func.sum(func.cast(Attempt.success, Integer)).label("total_successes"),
            )
            .select_from(Attempt)
            .where(Attempt.attempted_date == today)
        )
        row = result.first()

        total_attempts = row.total_attempts or 0
        total_successes = row.total_successes or 0
        success_rate = total_successes / total_attempts if total_attempts > 0 else 0.0

        # 고유 디바이스 수
        unique_devices = await StatsService._calculate_unique_devices(db, today)

        return {
            "date": str(today),
            "total_successes": total_successes,
            "total_attempts": total_attempts,
            "success_rate": round(success_rate, 2),
            "unique_devices": unique_devices,
        }

    @staticmethod
    async def _calculate_unique_devices(db: AsyncSession, target_date: date):
        """특정 날짜의 고유 device 수 계산"""
        result = await db.execute(
            select(func.count(func.distinct(Goal.device_id)))
            .select_from(Attempt)
            .join(Goal, Attempt.goal_id == Goal.id)
            .where(Attempt.attempted_date == target_date)
        )
        return result.scalar() or 0

    @staticmethod
    async def get_device_stats(device_id: str, db: AsyncSession, days: int = 7):
        """디바이스 통계 (최근 N일)"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)  # days-1로 수정: 오늘 포함 7일

        # 디바이스 통계
        device_result = await db.execute(
            select(
                func.sum(DeviceStat.attempts).label("total_attempts"),
                func.sum(DeviceStat.successes).label("total_successes"),
            )
            .where(DeviceStat.device_id == device_id)
            .where(DeviceStat.date >= start_date)
            .where(DeviceStat.date <= end_date)
        )
        device_data = device_result.first()

        # 일별 통계 조회 (최근 7일)
        daily_result = await db.execute(
            select(DeviceStat)
            .where(DeviceStat.device_id == device_id)
            .where(DeviceStat.date >= start_date)
            .where(DeviceStat.date <= end_date)
            .order_by(DeviceStat.date.asc())
        )
        daily_records = daily_result.scalars().all()

        # 일별 데이터를 딕셔너리로 변환 (날짜를 키로)
        daily_dict = {
            str(record.date): {
                "date": str(record.date),
                "attempts": record.attempts,
                "successes": record.successes,
            }
            for record in daily_records
        }

        # 최근 7일간의 모든 날짜를 생성하고, 데이터 없는 날은 0으로 채움
        daily_stats = []
        for i in range(days):
            current_date = start_date + timedelta(days=i)
            date_str = str(current_date)

            if date_str in daily_dict:
                daily_stats.append(daily_dict[date_str])
            else:
                daily_stats.append({
                    "date": date_str,
                    "attempts": 0,
                    "successes": 0,
                })

        # 전체 평균
        avg_result = await db.execute(
            select(func.avg(DeviceStat.success_rate).label("avg_rate"))
            .where(DeviceStat.date >= start_date)
            .where(DeviceStat.date <= end_date)
        )
        avg_data = avg_result.first()

        total_attempts = device_data.total_attempts or 0
        total_successes = device_data.total_successes or 0

        device_success_rate = (
            total_successes / total_attempts if total_attempts > 0 else 0.0
        )

        avg_success_rate = avg_data.avg_rate or 0.0

        return {
            "device_id": device_id,
            "period_days": days,
            "total_attempts": total_attempts,
            "total_successes": total_successes,
            "success_rate": round(device_success_rate, 2),
            "average_success_rate": round(avg_success_rate, 2),
            "daily_stats": daily_stats,  # 🆕 추가
            "comparison": {
                "difference": round(device_success_rate - avg_success_rate, 2),
                "percentage_better": round(
                    (
                        (device_success_rate - avg_success_rate)
                        / avg_success_rate
                        * 100
                    )
                    if avg_success_rate > 0
                    else 0,
                    2,
                ),
            },
        }

    @staticmethod
    async def update_stats_on_attempt(
        device_id: str, goal_id: int, success: bool, db: AsyncSession
    ):
        """시도 기록 시 통계 업데이트"""
        today = date.today()

        # 1. device_stats 업데이트
        device_stat_result = await db.execute(
            select(DeviceStat)
            .where(DeviceStat.device_id == device_id)
            .where(DeviceStat.date == today)
        )
        device_stat = device_stat_result.scalar_one_or_none()

        if device_stat:
            device_stat.attempts += 1
            if success:
                device_stat.successes += 1
            device_stat.success_rate = device_stat.successes / device_stat.attempts
        else:
            device_stat = DeviceStat(
                device_id=device_id,
                date=today,
                attempts=1,
                successes=1 if success else 0,
                success_rate=1.0 if success else 0.0,
            )
            db.add(device_stat)

        # 2. daily_stats 업데이트
        daily_stat_result = await db.execute(
            select(DailyStat).where(DailyStat.date == today)
        )
        daily_stat = daily_stat_result.scalar_one_or_none()

        if daily_stat:
            daily_stat.total_attempts += 1
            if success:
                daily_stat.total_successes += 1
            daily_stat.success_rate = (
                daily_stat.total_successes / daily_stat.total_attempts
            )
            # unique_devices는 실시간 계산
            daily_stat.unique_devices = await StatsService._calculate_unique_devices(
                db, today
            )
        else:
            daily_stat = DailyStat(
                date=today,
                total_attempts=1,
                total_successes=1 if success else 0,
                success_rate=1.0 if success else 0.0,
                unique_devices=1,
            )
            db.add(daily_stat)

        await db.commit()
