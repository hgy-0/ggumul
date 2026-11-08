import client from './client';
import type { InsightData } from '@/types';
import { MONTHLY_EXEMPTION_LIMIT } from '@/types';
import {
  attempts as dataAttempts,
  getMonthlyExemptionCount,
  calculateStreak,
} from '@/utils/dataService';

/** 특정 목표의 인사이트 데이터 조회 */
export async function getInsights(goalId: number): Promise<InsightData> {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const attempts = await dataAttempts.getByGoalId(goalId);

    // 면제 기록 제외한 실제 시도
    const realAttempts = attempts.filter(a => !a.is_exempt);
    const total_attempts = realAttempts.length;
    const success_count = realAttempts.filter(a => a.success).length;
    const success_rate = total_attempts > 0 ? (success_count / total_attempts) * 100 : 0;

    // 실패 이유별 통계
    const failure_by_reason: Record<string, number> = {};
    const failures = realAttempts.filter(a => !a.success && a.failure_reason);
    failures.forEach(attempt => {
      if (attempt.failure_reason) {
        const reason = getFailureReasonText(attempt.failure_reason);
        failure_by_reason[reason] = (failure_by_reason[reason] || 0) + 1;
      }
    });

    // 요일별 실패 통계
    const failure_by_day_of_week: Record<string, number> = {
      '월': 0, '화': 0, '수': 0, '목': 0, '금': 0, '토': 0, '일': 0
    };
    failures.forEach(attempt => {
      const date = new Date(attempt.attempted_date);
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const day = dayNames[date.getDay()];
      failure_by_day_of_week[day]++;
    });

    // 면제 통계
    const exempts = attempts.filter(a => a.is_exempt);
    const exempt_count = exempts.length;
    const exempt_by_reason: Record<string, number> = {};
    exempts.forEach(attempt => {
      if (attempt.exempt_reason) {
        const reason = getExemptReasonText(attempt.exempt_reason);
        exempt_by_reason[reason] = (exempt_by_reason[reason] || 0) + 1;
      }
    });

    // 면제 요일별 통계 (패턴 감지용)
    const exempt_by_day: Record<string, number[]> = {};
    exempts.forEach(attempt => {
      const date = new Date(attempt.attempted_date);
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const day = dayNames[date.getDay()];
      const weekNum = Math.floor(date.getDate() / 7);
      if (!exempt_by_day[day]) exempt_by_day[day] = [];
      exempt_by_day[day].push(weekNum);
    });

    // 팁 생성
    const tips: string[] = [];
    const monthlyUsed = await getMonthlyExemptionCount();

    if (success_rate < 50 && total_attempts >= 3) {
      tips.push('목표를 더 작은 단위로 나눠보세요.');
    }

    // 가장 많은 실패 이유 찾기
    const topFailureReason = Object.entries(failure_by_reason)
      .sort((a, b) => b[1] - a[1])[0];
    if (topFailureReason && topFailureReason[1] >= 3) {
      if (topFailureReason[0] === '시간이 부족했어요') {
        tips.push(`'시간 부족'이 반복되네요. 알림 시간을 바꿔볼까요?`);
      } else {
        tips.push(`'${topFailureReason[0]}' 문제를 먼저 해결해보세요.`);
      }
    }

    // 가장 많이 실패하는 요일 찾기
    const topFailureDay = Object.entries(failure_by_day_of_week)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])[0];
    if (topFailureDay && topFailureDay[1] >= 2) {
      tips.push(`${topFailureDay[0]}요일에 특히 주의하세요.`);
    }

    // 면제 요일 패턴 감지 (같은 요일에 3번 이상 면제 사용)
    for (const [day, weeks] of Object.entries(exempt_by_day)) {
      if (weeks.length >= 3) {
        tips.push(`${day}요일에 자주 쉬고 있어요. ${day}요일은 쉬는 날로 설정해볼까요?`);
        break;
      }
    }

    // 면제 사용률 팁
    if (monthlyUsed === 0 && total_attempts >= 7) {
      tips.push('이번 달 면제를 아직 사용하지 않았어요. 필요할 때 편하게 쉬어도 괜찮아요.');
    } else if (monthlyUsed >= MONTHLY_EXEMPTION_LIMIT) {
      tips.push('이번 달 면제를 모두 사용했어요. 목표 난이도를 조정해볼까요?');
    } else if (monthlyUsed === 1) {
      tips.push('이번 달 면제를 1번 썼어요. 필요할 때 편하게 쉬어도 돼요.');
    }

    // streak 기반 팁
    const { current: successStreak } = await calculateStreak(goalId);
    if (successStreak >= 7) {
      tips.push('7일 넘게 이어가고 있어요! 이 페이스를 유지해보세요.');
    }

    if (tips.length === 0) {
      tips.push('꾸준히 하고 있어요! 계속 이대로 가세요.');
    }

    return {
      total_attempts,
      success_count,
      success_rate,
      failure_by_reason,
      failure_by_day_of_week,
      exempt_count,
      exempt_by_reason,
      tips,
    };
  }

  const { data } = await client.get<InsightData>(`/goals/${goalId}/insights`);
  return data;
}

// 실패 이유 코드를 한글로 변환
function getFailureReasonText(reason: string): string {
  const reasonMap: Record<string, string> = {
    'tired': '몸이 피곤했어요',
    'forgot': '깜빡했어요',
    'no_time': '시간이 부족했어요',
    'lazy': '의욕이 없었어요',
    'too_busy': '너무 바빴어요',
    'not_feeling_well': '컨디션이 안 좋았어요',
    'no_motivation': '동기부여가 안 됐어요',
    'other': '기타',
  };
  return reasonMap[reason] || reason;
}

// 면제 이유 코드를 한글로 변환
function getExemptReasonText(reason: string): string {
  const reasonMap: Record<string, string> = {
    'sick': '아파요',
    'travel': '여행 중',
    'appointment': '약속이 있어요',
    'rest': '쉬고 싶어요',
    'other': '다른 이유',
  };
  return reasonMap[reason] || reason;
}
