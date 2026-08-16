"""인사이트 서비스 — 시도 데이터 분석 및 개선 팁 생성"""

from collections import Counter

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attempt import Attempt
from app.schemas.insight import InsightResponse

# 요일 이름 매핑
DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

# 실패 이유 한국어 매핑
FAILURE_REASON_KO = {
    "tired": "피곤해서",
    "forgot": "깜빡해서",
    "no_time": "시간이 없어서",
    "lazy": "귀찮아서",
    "other": "기타",
}

# 요일 한국어 매핑
DAY_NAME_KO = {
    "Mon": "월요일",
    "Tue": "화요일",
    "Wed": "수요일",
    "Thu": "목요일",
    "Fri": "금요일",
    "Sat": "토요일",
    "Sun": "일요일",
}


async def get_insights(goal_id: int, db: AsyncSession) -> InsightResponse:
    """
    목표에 대한 인사이트를 생성한다.

    - 전체 시도 횟수, 성공 횟수, 성공률
    - 실패 이유별 카운트
    - 요일별 실패 카운트
    - 가장 많은 실패 이유, 가장 많이 실패하는 요일 기반 팁
    """
    result = await db.execute(
        select(Attempt).where(Attempt.goal_id == goal_id)
    )
    attempts = result.scalars().all()

    total_attempts = len(attempts)
    success_count = sum(1 for a in attempts if a.success)
    success_rate = (success_count / total_attempts * 100) if total_attempts > 0 else 0.0

    # 실패 시도만 필터 (부활 카드 사용하지 않은 실패)
    failed_attempts = [a for a in attempts if not a.success and not a.used_revival]

    # 실패 이유별 카운트
    reason_counter: Counter[str] = Counter()
    for a in failed_attempts:
        reason = a.failure_reason or "other"
        reason_counter[reason] += 1
    failure_by_reason = dict(reason_counter)

    # 요일별 실패 카운트
    day_counter: Counter[str] = Counter()
    for a in failed_attempts:
        day_name = DAY_NAMES[a.attempted_date.weekday()]
        day_counter[day_name] += 1
    failure_by_day_of_week = dict(day_counter)

    # 팁 생성
    tips = _generate_tips(failure_by_reason, failure_by_day_of_week, success_rate)

    return InsightResponse(
        total_attempts=total_attempts,
        success_count=success_count,
        success_rate=round(success_rate, 1),
        failure_by_reason=failure_by_reason,
        failure_by_day_of_week=failure_by_day_of_week,
        tips=tips,
    )


def _generate_tips(
    failure_by_reason: dict[str, int],
    failure_by_day_of_week: dict[str, int],
    success_rate: float,
) -> list[str]:
    """실패 패턴 기반으로 개선 팁을 생성한다."""
    tips: list[str] = []

    # 가장 많은 실패 이유 기반 팁
    if failure_by_reason:
        top_reason = max(failure_by_reason, key=failure_by_reason.get)  # type: ignore
        reason_ko = FAILURE_REASON_KO.get(top_reason, top_reason)
        reason_tips = {
            "tired": "충분한 수면을 취하고, 에너지가 높은 시간대로 카운트다운을 옮겨보세요.",
            "forgot": "알림 시간을 설정하거나, 시작 시간을 루틴에 연결해보세요.",
            "no_time": "카운트다운 시간을 줄여보세요. 1분이라도 시작하는 게 중요합니다.",
            "lazy": "첫 행동을 더 쉽게 바꿔보세요. 시작의 문턱을 낮추는 게 핵심입니다.",
            "other": "실패 메모를 분석해보고 패턴을 찾아보세요.",
        }
        tips.append(
            f"가장 많은 실패 이유: '{reason_ko}' ({failure_by_reason[top_reason]}회). "
            f"{reason_tips.get(top_reason, '패턴을 분석해보세요.')}"
        )

    # 가장 많이 실패하는 요일 기반 팁
    if failure_by_day_of_week:
        top_day = max(failure_by_day_of_week, key=failure_by_day_of_week.get)  # type: ignore
        day_ko = DAY_NAME_KO.get(top_day, top_day)
        tips.append(
            f"{day_ko}에 가장 많이 실패해요 ({failure_by_day_of_week[top_day]}회). "
            f"{day_ko}에는 카운트다운 시간을 줄이거나 더 쉬운 첫 행동을 설정해보세요."
        )

    # 성공률 기반 팁
    if success_rate >= 80:
        tips.append("훌륭한 성공률이에요! 카운트다운 시간을 줄여서 도전해보는 건 어떨까요?")
    elif success_rate >= 50:
        tips.append("절반 이상 성공하고 있어요! 실패 패턴을 줄이면 더 좋아질 거예요.")
    elif success_rate > 0:
        tips.append("첫 행동을 더 쉽게 바꾸거나, 카운트다운 시간을 늘려보세요.")

    if not tips:
        tips.append("아직 데이터가 부족해요. 꾸준히 시도해주세요!")

    return tips
