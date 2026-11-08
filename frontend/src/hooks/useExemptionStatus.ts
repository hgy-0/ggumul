import { useState, useEffect } from 'react';
import { getMonthlyExemptionCount, getConsecutiveExemptDays } from '@/utils/dataService';
import { MONTHLY_EXEMPTION_LIMIT } from '@/types';

export function useExemptionStatus() {
  const [monthlyUsed, setMonthlyUsed] = useState(0);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [monthly, consecutive] = await Promise.all([
          getMonthlyExemptionCount(),
          getConsecutiveExemptDays(),
        ]);
        if (!cancelled) {
          setMonthlyUsed(monthly);
          setConsecutiveDays(consecutive);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const remainingCount = MONTHLY_EXEMPTION_LIMIT - monthlyUsed;
  const canUse = remainingCount > 0 && consecutiveDays < 2;

  let blockedReason = '';
  if (remainingCount <= 0) {
    blockedReason = '이번 달 쉬기 횟수를 모두 사용했어요 😢 다음 달 1일에 다시 충전돼요.';
  } else if (consecutiveDays >= 2) {
    blockedReason = '이틀 연속으로 쉬었어요. 내일은 도전해봐요!';
  }

  return { monthlyUsed, remainingCount, canUse, blockedReason, loading };
}
