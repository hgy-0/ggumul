import { create } from 'zustand';
import type { Goal, GoalCreateUpdate } from '@/types';
import * as goalsApi from '@/api/goals';
import {
  updateGoalNotificationSchedules,
  removeGoalNotificationSchedules,
} from '@/utils/localNotifications';
import {
  saveGoalToFirestore,
  deleteGoalFromFirestore,
} from '@/utils/firestoreGoals';
import { syncUserProfile } from '@/utils/firebaseFriends';

interface GoalStore {
  goals: Goal[];
  loading: boolean;
  error: string | null;

  /** 전체 목표 목록 새로고침 */
  fetchGoals: () => Promise<void>;

  /** 새 목표 추가 */
  addGoal: (data: GoalCreateUpdate) => Promise<Goal>;

  /** 기존 목표 수정 */
  updateGoal: (id: number, data: Partial<GoalCreateUpdate>) => Promise<void>;

  /** 목표 삭제 */
  deleteGoal: (id: number) => Promise<void>;
}

export const useGoalStore = create<GoalStore>((set) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: async () => {
    set({ loading: true, error: null });
    try {
      const goals = await goalsApi.getGoals();
      set({ goals, loading: false });
      // 공개 프로필 동기화 (친구에게 보이는 통계)
      syncUserProfile(goals).catch(() => {});
    } catch (err) {
      const message = err instanceof Error ? err.message : '목표를 불러오지 못했습니다.';
      set({ error: message, loading: false });
    }
  },

  addGoal: async (data) => {
    const goal = await goalsApi.createGoal(data);
    set((state) => ({ goals: [...state.goals, goal] }));

    // Firestore에 목표 저장 (FCM 알림용)
    await saveGoalToFirestore(goal);

    // localStorage 모드에서 알림 스케줄 저장
    if (import.meta.env.VITE_SINGLE_FILE && data.notification_schedules) {
      updateGoalNotificationSchedules(goal.id, goal.name, data.notification_schedules);
    }

    return goal;
  },

  updateGoal: async (id, data) => {
    const updated = await goalsApi.updateGoal(id, data);
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? updated : g)),
    }));

    // Firestore에 목표 업데이트 (FCM 알림용)
    await saveGoalToFirestore(updated);

    // localStorage 모드에서 알림 스케줄 업데이트
    if (import.meta.env.VITE_SINGLE_FILE) {
      if (data.notification_schedules) {
        updateGoalNotificationSchedules(updated.id, updated.name, data.notification_schedules);
      } else {
        // 알림 스케줄이 없으면 제거
        removeGoalNotificationSchedules(id);
      }
    }
  },

  deleteGoal: async (id) => {
    await goalsApi.deleteGoal(id);
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));

    // Firestore에서 목표 삭제 (FCM 알림용)
    await deleteGoalFromFirestore(id);

    // localStorage 모드에서 알림 스케줄 삭제
    if (import.meta.env.VITE_SINGLE_FILE) {
      removeGoalNotificationSchedules(id);
    }
  },
}));
