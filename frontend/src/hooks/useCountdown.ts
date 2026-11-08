import { useState, useEffect, useCallback } from 'react';
import { useTimerStore } from '@/stores/timerStore';

interface CountdownResult {
  /** 남은 초 */
  remaining: number;
  /** 타이머 진행 중 여부 */
  isRunning: boolean;
  /** 시간 만료 여부 */
  isExpired: boolean;
}

/**
 * timerStore의 endTimestamp를 기반으로 남은 시간을 1초마다 계산한다.
 * Date.now() 기반이므로 탭 비활성화 후 복귀해도 정확한 시간을 표시한다.
 */
export function useCountdown(): CountdownResult {
  const { endTimestamp, isRunning } = useTimerStore();

  const calcRemaining = useCallback(() => {
    if (!endTimestamp) return 0;
    return Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
  }, [endTimestamp]);

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    if (!isRunning || !endTimestamp) {
      setRemaining(0);
      return;
    }

    // 초기값 즉시 설정
    setRemaining(calcRemaining());

    const interval = setInterval(() => {
      const r = calcRemaining();
      setRemaining(r);

      // 만료 시 인터벌 정리
      if (r <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, endTimestamp, calcRemaining]);

  return {
    remaining,
    isRunning,
    isExpired: isRunning && remaining <= 0,
  };
}
