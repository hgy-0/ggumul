/**
 * localStorage 기반 데이터 저장소
 * 싱글파일 프리뷰에서 백엔드 없이 동작하도록 함
 */

import type { Goal, AttemptCreate, FailureReason, ExemptReason } from '@/types';

const STORAGE_KEYS = {
  GOALS: 'ggumul_goals',
  ATTEMPTS: 'ggumul_attempts',
  DEVICE_ID: 'ggumul_device_id',
} as const;

// 목표 타입 (localStorage용, 서버 응답과 동일하게)
export interface StoredGoal extends Omit<Goal, 'current_streak' | 'best_streak' | 'today_attempted' | 'today_success' | 'today_exempt' | 'monthly_exemptions_used' | 'is_top_priority'> {
  created_at: string;
  updated_at: string;
  is_active: boolean;
  device_id: string;
}

// 시도 기록 타입
export interface StoredAttempt {
  id: number;
  goal_id: number;
  attempted_date: string; // YYYY-MM-DD
  success: boolean;
  failure_reason?: FailureReason;
  used_revival: boolean;
  is_exempt?: boolean;
  exempt_reason?: string;
  created_at: string;
}

// localStorage에서 데이터 읽기
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// localStorage에 데이터 쓰기
function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('localStorage write failed:', error);
  }
}

// 목표 관련
export const localGoals = {
  getAll(): StoredGoal[] {
    return getFromStorage<StoredGoal[]>(STORAGE_KEYS.GOALS, []);
  },

  getById(id: number): StoredGoal | undefined {
    return this.getAll().find(g => g.id === id);
  },

  create(data: { name: string; first_action: string; countdown_seconds: number; notification_schedules?: any[] }): StoredGoal {
    const goals = this.getAll();
    const deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID) || 'local-device';

    // ID 생성: 기존 목표들 중 최대 ID + 1 (중복 방지)
    const maxId = goals.reduce((max, g) => Math.max(max, g.id), 0);
    const newId = maxId > 0 ? maxId + 1 : Date.now();

    const newGoal: StoredGoal = {
      id: newId,
      device_id: deviceId,
      name: data.name,
      first_action: data.first_action,
      countdown_seconds: data.countdown_seconds,
      revival_cards: 0,
      is_active: true,
      notification_schedules: data.notification_schedules || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    goals.push(newGoal);
    setToStorage(STORAGE_KEYS.GOALS, goals);
    return newGoal;
  },

  update(id: number, data: Partial<StoredGoal>): StoredGoal | null {
    const goals = this.getAll();
    const index = goals.findIndex(g => g.id === id);

    if (index === -1) return null;

    goals[index] = {
      ...goals[index],
      ...data,
      updated_at: new Date().toISOString(),
    };

    setToStorage(STORAGE_KEYS.GOALS, goals);
    return goals[index];
  },

  delete(id: number): boolean {
    const goals = this.getAll();
    const index = goals.findIndex(g => g.id === id);

    if (index === -1) return false;

    goals[index].is_active = false;
    goals[index].updated_at = new Date().toISOString();
    setToStorage(STORAGE_KEYS.GOALS, goals);
    return true;
  },
};

// 시도 기록 관련
export const localAttempts = {
  getAll(): StoredAttempt[] {
    return getFromStorage<StoredAttempt[]>(STORAGE_KEYS.ATTEMPTS, []);
  },

  getByGoalId(goalId: number): StoredAttempt[] {
    return this.getAll().filter(a => a.goal_id === goalId);
  },

  getByDate(goalId: number, date: string): StoredAttempt | undefined {
    return this.getAll().find(a => a.goal_id === goalId && a.attempted_date === date);
  },

  create(goalId: number, data: AttemptCreate): StoredAttempt {
    const attempts = this.getAll();

    // 같은 날짜에 이미 기록이 있으면 업데이트
    const existingIndex = attempts.findIndex(
      a => a.goal_id === goalId && a.attempted_date === data.attempted_date
    );

    if (existingIndex !== -1) {
      attempts[existingIndex] = {
        ...attempts[existingIndex],
        success: data.success,
        failure_reason: data.failure_reason,
        is_exempt: data.is_exempt,
        exempt_reason: data.exempt_reason,
      };
      setToStorage(STORAGE_KEYS.ATTEMPTS, attempts);
      return attempts[existingIndex];
    }

    // ID 생성: 기존 시도들 중 최대 ID + 1 (중복 방지)
    const maxId = attempts.reduce((max, a) => Math.max(max, a.id), 0);
    const newId = maxId > 0 ? maxId + 1 : Date.now();

    const newAttempt: StoredAttempt = {
      id: newId,
      goal_id: goalId,
      attempted_date: data.attempted_date,
      success: data.success,
      failure_reason: data.failure_reason,
      used_revival: data.use_revival || false,
      is_exempt: data.is_exempt,
      exempt_reason: data.exempt_reason,
      created_at: new Date().toISOString(),
    };

    attempts.push(newAttempt);
    setToStorage(STORAGE_KEYS.ATTEMPTS, attempts);
    return newAttempt;
  },

  useRevival(goalId: number, date: string): boolean {
    const attempts = this.getAll();
    const attempt = attempts.find(a => a.goal_id === goalId && a.attempted_date === date);

    if (!attempt || attempt.success) return false;

    // 부활 카드 차감
    const goal = localGoals.getById(goalId);
    if (!goal || goal.revival_cards === 0) return false;

    localGoals.update(goalId, { revival_cards: goal.revival_cards - 1 });

    // 시도 기록 부활 처리
    attempt.success = true;
    attempt.used_revival = true;
    setToStorage(STORAGE_KEYS.ATTEMPTS, attempts);
    return true;
  },
};

// Streak 계산 (면제일 건너뛰기 로직 포함)
export function calculateStreak(goalId: number): { current: number; best: number } {
  // 성공 + 면제 기록 모두 포함
  const allAttempts = localAttempts.getByGoalId(goalId)
    .filter(a => a.success || a.is_exempt)
    .sort((a, b) => b.attempted_date.localeCompare(a.attempted_date));

  if (allAttempts.length === 0) return { current: 0, best: 0 };

  // 날짜별 맵 생성 (성공/면제 구분)
  const attemptMap = new Map<string, StoredAttempt>();
  for (const a of allAttempts) {
    if (!attemptMap.has(a.attempted_date)) {
      attemptMap.set(a.attempted_date, a);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  // 현재 스트릭 계산: 오늘부터 역순으로
  // 성공 → +1 계속, 면제 → +0 건너뛰고 계속, 실패/없음 → 중단
  let current = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const attempt = attemptMap.get(dateStr);

    if (!attempt) {
      break; // 기록 없음 → 중단
    } else if (attempt.is_exempt) {
      // 면제 → 건너뛰고 계속 (streak에 포함하지 않음)
    } else if (attempt.success) {
      current++; // 성공 → +1
    } else {
      break; // 실패 → 중단
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  // 최고 스트릭 계산: 전체 기간에서 슬라이딩 윈도우
  // 성공 날짜 오름차순 정렬
  const successDates = allAttempts
    .filter(a => !a.is_exempt)
    .map(a => a.attempted_date)
    .sort();

  let best = 0;

  for (let i = 0; i < successDates.length; i++) {
    let tempStreak = 1;
    let prevDate = new Date(successDates[i]);

    for (let j = i + 1; j < successDates.length; j++) {
      const nextDate = new Date(successDates[j]);

      // prevDate와 nextDate 사이의 날짜가 모두 면제일인지 확인
      const prevCopy = new Date(prevDate);
      prevCopy.setDate(prevCopy.getDate() + 1);
      let allExempt = true;

      while (prevCopy.toISOString().split('T')[0] < nextDate.toISOString().split('T')[0]) {
        const betweenDate = prevCopy.toISOString().split('T')[0];
        const between = attemptMap.get(betweenDate);
        if (!between || !between.is_exempt) {
          allExempt = false;
          break;
        }
        prevCopy.setDate(prevCopy.getDate() + 1);
      }

      if (prevCopy.toISOString().split('T')[0] === nextDate.toISOString().split('T')[0] && allExempt) {
        // 사이 날짜가 모두 면제일이면 연결
        tempStreak++;
        prevDate = nextDate;
      } else {
        break;
      }
    }

    best = Math.max(best, tempStreak);
  }

  best = Math.max(best, current);

  return { current, best };
}

// 이번 달 면제 사용 횟수 (모든 목표의 면제 기록 중 고유 날짜 수)
export function getMonthlyExemptionCount(): number {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const allAttempts = localAttempts.getAll();
  const exemptDates = new Set<string>();

  for (const a of allAttempts) {
    if (a.is_exempt && a.attempted_date.startsWith(yearMonth)) {
      exemptDates.add(a.attempted_date);
    }
  }

  return exemptDates.size;
}

// 어제까지 연속 면제일 수 (연속 2일 제한 체크용)
export function getConsecutiveExemptDays(): number {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let count = 0;
  let checkDate = yesterday;
  const allAttempts = localAttempts.getAll();

  for (let i = 0; i < 10; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const hasExempt = allAttempts.some(a => a.is_exempt && a.attempted_date === dateStr);

    if (hasExempt) {
      count++;
      checkDate = new Date(checkDate);
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return count;
}

// 오늘 면제 여부
export function isTodayExempt(): boolean {
  const today = new Date().toISOString().split('T')[0];
  return localAttempts.getAll().some(a => a.is_exempt && a.attempted_date === today);
}

// 미완료 목표에만 면제 기록 생성 (이미 성공한 목표는 건너뜀)
export function createExemption(date: string, reason: ExemptReason): void {
  const activeGoals = localGoals.getAll().filter(g => g.is_active);

  for (const goal of activeGoals) {
    const existing = localAttempts.getByDate(goal.id, date);
    // 이미 성공한 기록이 있으면 건너뜀
    if (existing?.success) continue;

    localAttempts.create(goal.id, {
      attempted_date: date,
      success: false,
      is_exempt: true,
      exempt_reason: reason,
    });
  }
}

// 오늘 면제 취소 (기록 삭제 + 횟수 복구)
export function cancelExemption(date: string): void {
  const attempts = localAttempts.getAll();
  const filtered = attempts.filter(a => !(a.is_exempt && a.attempted_date === date));
  setToStorage(STORAGE_KEYS.ATTEMPTS, filtered);
}

// 우선순위 계산 (간단 버전)
export function getTopPriorityGoalId(goals: StoredGoal[]): number | null {
  const today = new Date().toISOString().split('T')[0];

  const activeGoals = goals.filter(g => g.is_active);
  if (activeGoals.length === 0) return null;

  // 오늘 완료 안 한 목표 중에서
  const incomplete = activeGoals.filter(g => {
    const todayAttempt = localAttempts.getByDate(g.id, today);
    return !todayAttempt || !todayAttempt.success;
  });

  if (incomplete.length === 0) return null;

  // 스트릭 높은 순
  const withStreak = incomplete.map(g => ({
    goal: g,
    streak: calculateStreak(g.id).current,
  }));

  withStreak.sort((a, b) => b.streak - a.streak);
  return withStreak[0].goal.id;
}

// 초기화 (개발용)
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.GOALS);
  localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
}

// 샘플 데이터 생성 (로컬 모드 첫 실행 시)
export function initializeSampleData(): void {
  // 이미 데이터가 있으면 스킵
  if (localGoals.getAll().length > 0) return;

  console.log('[localStorage] 샘플 데이터 초기화');

  // 샘플 목표 3개 생성
  const sampleGoals = [
    {
      name: '운동하기',
      first_action: '운동복 챙기기',
      countdown_seconds: 300
    },
    {
      name: '독서하기',
      first_action: '책 펼치기',
      countdown_seconds: 180
    },
    {
      name: '물 마시기',
      first_action: '물병 꺼내기',
      countdown_seconds: 60
    },
  ];

  sampleGoals.forEach(g => localGoals.create(g));

  console.log('[localStorage] 샘플 목표 3개 생성 완료');
}
