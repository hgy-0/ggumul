import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerStore {
  goalId: number | null;
  endTimestamp: number | null; // Date.now() + duration(ms)
  isRunning: boolean;

  /** 타이머 시작 (goalId, 카운트다운 초) */
  startTimer: (goalId: number, seconds: number) => void;

  /** 타이머 초기화 */
  clearTimer: () => void;
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set) => ({
      goalId: null,
      endTimestamp: null,
      isRunning: false,

      startTimer: (goalId, seconds) => {
        set({
          goalId,
          endTimestamp: Date.now() + seconds * 1000,
          isRunning: true,
        });
      },

      clearTimer: () => {
        set({
          goalId: null,
          endTimestamp: null,
          isRunning: false,
        });
      },
    }),
    {
      name: 'motivation-timer', // localStorage 키
    },
  ),
);
