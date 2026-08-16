import client from './client';
import type { AttemptCreate } from '@/types';
import {
  attempts as dataAttempts,
  goals as dataGoals,
  calculateStreak,
} from '@/utils/dataService';

/** 시도 기록 생성 (성공/실패) */
export async function createAttempt(goalId: number, payload: AttemptCreate) {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const attempt = await dataAttempts.create(goalId, payload);

    // 성공한 경우 연속 7일마다 부활 카드 지급
    if (payload.success) {
      const { current } = await calculateStreak(goalId);
      if (current > 0 && current % 7 === 0) {
        const goal = await dataGoals.getById(goalId);
        if (goal) {
          await dataGoals.update(goalId, {
            revival_cards: goal.revival_cards + 1,
          });
        }
      }
    }

    return attempt;
  }

  const { data } = await client.post(`/goals/${goalId}/attempts`, payload);
  return data;
}

/** 부활 카드 사용 (기존 실패 기록에 부활 적용) */
export async function useRevivalCard(goalId: number, attemptedDate: string) {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const success = await dataAttempts.useRevival(goalId, attemptedDate);
    if (!success) {
      throw new Error('부활 카드를 사용할 수 없습니다.');
    }
    return { message: '부활 카드가 사용되었습니다.' };
  }

  const { data } = await client.put(`/goals/${goalId}/revival`, { attempted_date: attemptedDate });
  return data;
}
