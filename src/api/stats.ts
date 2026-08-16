import client from './client';
import { attempts as dataAttempts } from '@/utils/dataService';

export const getTodayStats = async () => {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const today = new Date().toISOString().split('T')[0];
    const allAttempts = await dataAttempts.getAll();
    // 면제 기록 제외한 실제 시도만 통계에 포함
    const todayAttempts = allAttempts.filter(a => a.attempted_date === today && !a.is_exempt);

    const total_successes = todayAttempts.filter(a => a.success).length;
    const total_attempts = todayAttempts.length;
    const success_rate = total_attempts > 0 ? total_successes / total_attempts : 0;

    return {
      date: today,
      total_successes,
      total_attempts,
      success_rate,
      unique_devices: 1,
    };
  }

  const response = await client.get('/stats/today');
  return response.data;
};

export const getMyStats = async () => {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const allAttempts = await dataAttempts.getAll();

    // 최근 7일 데이터 필터링 (면제 기록 제외)
    const recentAttempts = allAttempts.filter(a => {
      const attemptDate = new Date(a.attempted_date);
      return attemptDate >= sevenDaysAgo && attemptDate <= today && !a.is_exempt;
    });

    const total_attempts = recentAttempts.length;
    const total_successes = recentAttempts.filter(a => a.success).length;
    const success_rate = total_attempts > 0 ? total_successes / total_attempts : 0;

    // 일별 통계 생성
    const daily_stats = [];
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(sevenDaysAgo);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const dayAttempts = recentAttempts.filter(a => a.attempted_date === dateStr);
      daily_stats.push({
        date: dateStr,
        attempts: dayAttempts.length,
        successes: dayAttempts.filter(a => a.success).length,
      });
    }

    const average_success_rate = success_rate;
    const difference = 0;
    const percentage_better = 0;

    return {
      device_id: 'local-device',
      period_days: 7,
      total_attempts,
      total_successes,
      success_rate,
      average_success_rate,
      daily_stats,
      comparison: {
        difference,
        percentage_better,
      },
    };
  }

  const response = await client.get('/stats/me');
  return response.data;
};
