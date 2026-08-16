import client from './client';
import type { Goal, GoalCreateUpdate } from '@/types';
import {
  goals as dataGoals,
  attempts as dataAttempts,
  calculateStreak,
  getTopPriorityGoalId,
  getMonthlyExemptionCount,
} from '@/utils/dataService';
import type { StoredGoal } from '@/utils/localStorage';

// dataService 기반 헬퍼 (async)
async function buildGoalResponse(storedGoal: StoredGoal | undefined): Promise<Goal | null> {
  if (!storedGoal) return null;

  const today = new Date().toISOString().split('T')[0];
  const todayAttempt = await dataAttempts.getByDate(storedGoal.id, today);
  const { current, best } = await calculateStreak(storedGoal.id);
  const allGoals = await dataGoals.getAll();
  const topPriorityId = await getTopPriorityGoalId(allGoals);
  const todayExempt = !!(todayAttempt?.is_exempt);
  const monthlyExemptionsUsed = await getMonthlyExemptionCount();

  return {
    ...storedGoal,
    current_streak: current,
    best_streak: best,
    today_attempted: !!todayAttempt,
    today_success: todayAttempt?.success || false,
    today_exempt: todayExempt,
    monthly_exemptions_used: monthlyExemptionsUsed,
    is_top_priority: storedGoal.id === topPriorityId,
  };
}

/** 전체 목표 목록 조회 */
export async function getGoals(): Promise<Goal[]> {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const storedGoals = await dataGoals.getAll();
    const activeGoals = storedGoals.filter(g => g.is_active);
    const results = await Promise.all(activeGoals.map(g => buildGoalResponse(g)));
    return results.filter(Boolean) as Goal[];
  }

  const { data } = await client.get<Goal[]>('/goals');
  return data;
}

/** 개별 목표 조회 */
export async function getGoal(id: number): Promise<Goal> {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const storedGoal = await dataGoals.getById(id);
    const goal = await buildGoalResponse(storedGoal);
    if (!goal) throw new Error('Goal not found');
    return goal;
  }

  const { data } = await client.get<Goal>(`/goals/${id}`);
  return data;
}

/** 새 목표 생성 */
export async function createGoal(payload: GoalCreateUpdate): Promise<Goal> {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const storedGoal = await dataGoals.create(payload);
    return (await buildGoalResponse(storedGoal))!;
  }

  const { data } = await client.post<Goal>('/goals', payload);
  return data;
}

/** 목표 수정 */
export async function updateGoal(id: number, payload: Partial<GoalCreateUpdate>): Promise<Goal> {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const updated = await dataGoals.update(id, payload as any);
    if (!updated) throw new Error('Goal not found');
    return (await buildGoalResponse(updated))!;
  }

  const { data } = await client.put<Goal>(`/goals/${id}`, payload);
  return data;
}

/** 목표 삭제 */
export async function deleteGoal(id: number): Promise<void> {
  if (import.meta.env.VITE_SINGLE_FILE) {
    await dataGoals.delete(id);
    return;
  }

  await client.delete(`/goals/${id}`);
}

/** 목표별 통계 타입 */
export interface DailyAttemptStat {
  date: string;
  attempted: boolean;
  success: boolean;
  exempt: boolean;
}

export interface GoalStats {
  goal_id: number;
  goal_name: string;
  current_streak: number;
  best_streak: number;
  total_attempts: number;
  total_successes: number;
  success_rate: number; // 0.0 ~ 1.0
  daily_stats: DailyAttemptStat[]; // 최근 7일
}

/** 목표별 최근 7일 통계 조회 */
export async function getGoalStats(goalId: number): Promise<GoalStats> {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const goal = await dataGoals.getById(goalId);
    if (!goal) throw new Error('Goal not found');

    const goalAttempts = await dataAttempts.getByGoalId(goalId);
    const { current, best } = await calculateStreak(goalId);

    // 최근 7일 계산
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6);

    const daily_stats: DailyAttemptStat[] = [];
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const attempt = goalAttempts.find(a => a.attempted_date === dateStr);
      daily_stats.push({
        date: dateStr,
        attempted: !!attempt,
        success: attempt?.success || false,
        exempt: attempt?.is_exempt || false,
      });
    }

    // 면제 기록 제외한 실제 시도만 통계에 포함
    const recentAttempts = goalAttempts.filter(a => {
      const attemptDate = new Date(a.attempted_date);
      return attemptDate >= startDate && attemptDate <= today && !a.is_exempt;
    });

    const total_successes = recentAttempts.filter(a => a.success).length;
    const success_rate = recentAttempts.length > 0 ? total_successes / recentAttempts.length : 0;

    return {
      goal_id: goalId,
      goal_name: goal.name,
      current_streak: current,
      best_streak: best,
      total_attempts: recentAttempts.length,
      total_successes,
      success_rate,
      daily_stats,
    };
  }

  const { data } = await client.get<GoalStats>(`/goals/${goalId}/stats`);
  return data;
}
