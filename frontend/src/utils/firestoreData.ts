/**
 * Firestore 기반 데이터 저장소
 * localStorage.ts의 API를 미러링하되 Firestore를 사용
 */

import type { AttemptCreate, ExemptReason } from '@/types';
import { auth, db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

// localStorage.ts에서 타입 재내보내기 (두 모듈이 동일한 타입을 공유)
export type { StoredGoal, StoredAttempt } from './localStorage';
import type { StoredGoal, StoredAttempt } from './localStorage';

// 인증된 사용자의 uid를 가져오는 헬퍼
function getUid(): string {
  const user = auth?.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.uid;
}

// 컬렉션 경로 헬퍼
function goalsRef(uid: string) {
  return collection(db, 'users', uid, 'goals');
}

function attemptsRef(uid: string) {
  return collection(db, 'users', uid, 'attempts');
}

function goalDocRef(uid: string, id: number) {
  return doc(db, 'users', uid, 'goals', String(id));
}

function attemptDocRef(uid: string, id: number) {
  return doc(db, 'users', uid, 'attempts', String(id));
}

// 목표 관련
export const firestoreGoals = {
  async getAll(): Promise<StoredGoal[]> {
    const uid = getUid();
    const q = query(goalsRef(uid), where('is_active', '==', true));
    const snapshot = await getDocs(q);

    const goals: StoredGoal[] = [];
    snapshot.forEach((d) => goals.push(d.data() as StoredGoal));

    return goals.sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async getById(id: number): Promise<StoredGoal | undefined> {
    const uid = getUid();
    const snap = await getDoc(goalDocRef(uid, id));
    if (!snap.exists()) return undefined;
    return snap.data() as StoredGoal;
  },

  async create(data: {
    name: string;
    first_action: string;
    countdown_seconds: number;
    notification_schedules?: any[];
  }): Promise<StoredGoal> {
    const uid = getUid();
    const newId = Date.now();
    const now = new Date().toISOString();

    const newGoal: StoredGoal = {
      id: newId,
      device_id: uid,
      name: data.name,
      first_action: data.first_action,
      countdown_seconds: data.countdown_seconds,
      revival_cards: 0,
      is_active: true,
      notification_schedules: data.notification_schedules || [],
      created_at: now,
      updated_at: now,
    };

    await setDoc(goalDocRef(uid, newId), newGoal);
    return newGoal;
  },

  async update(id: number, data: Partial<StoredGoal>): Promise<StoredGoal | null> {
    const uid = getUid();
    const ref = goalDocRef(uid, id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const updated: StoredGoal = {
      ...(snap.data() as StoredGoal),
      ...data,
      updated_at: new Date().toISOString(),
    };

    await setDoc(ref, updated);
    return updated;
  },

  async delete(id: number): Promise<boolean> {
    const uid = getUid();
    const ref = goalDocRef(uid, id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return false;

    const updated: StoredGoal = {
      ...(snap.data() as StoredGoal),
      is_active: false,
      updated_at: new Date().toISOString(),
    };

    await setDoc(ref, updated);
    return true;
  },
};

// 시도 기록 관련
export const firestoreAttempts = {
  async getAll(): Promise<StoredAttempt[]> {
    const uid = getUid();
    const snapshot = await getDocs(attemptsRef(uid));

    const attempts: StoredAttempt[] = [];
    snapshot.forEach((d) => attempts.push(d.data() as StoredAttempt));
    return attempts;
  },

  async getByGoalId(goalId: number): Promise<StoredAttempt[]> {
    const uid = getUid();
    const q = query(attemptsRef(uid), where('goal_id', '==', goalId));
    const snapshot = await getDocs(q);

    const attempts: StoredAttempt[] = [];
    snapshot.forEach((d) => attempts.push(d.data() as StoredAttempt));
    return attempts;
  },

  async getByDate(goalId: number, date: string): Promise<StoredAttempt | undefined> {
    const uid = getUid();
    const q = query(
      attemptsRef(uid),
      where('goal_id', '==', goalId),
      where('attempted_date', '==', date)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as StoredAttempt;
  },

  async create(goalId: number, data: AttemptCreate): Promise<StoredAttempt> {
    const uid = getUid();

    // 같은 날짜에 이미 기록이 있으면 업데이트 (upsert)
    const existing = await this.getByDate(goalId, data.attempted_date);

    if (existing) {
      const updated: StoredAttempt = {
        ...existing,
        success: data.success,
        failure_reason: data.failure_reason,
        is_exempt: data.is_exempt,
        exempt_reason: data.exempt_reason,
      };
      await setDoc(attemptDocRef(uid, existing.id), updated);
      return updated;
    }

    const newId = Date.now();
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

    await setDoc(attemptDocRef(uid, newId), newAttempt);
    return newAttempt;
  },

  async useRevival(goalId: number, date: string): Promise<boolean> {
    const attempt = await this.getByDate(goalId, date);
    if (!attempt || attempt.success) return false;

    const goal = await firestoreGoals.getById(goalId);
    if (!goal || goal.revival_cards === 0) return false;

    // 목표의 부활 카드 차감
    await firestoreGoals.update(goalId, { revival_cards: goal.revival_cards - 1 });

    // 시도 기록 부활 처리
    const uid = getUid();
    const updated: StoredAttempt = {
      ...attempt,
      success: true,
      used_revival: true,
    };
    await setDoc(attemptDocRef(uid, attempt.id), updated);
    return true;
  },
};

// Streak 계산 (면제일 건너뛰기 로직 포함) — localStorage.ts와 동일한 알고리즘
export async function calculateStreakFirestore(
  goalId: number
): Promise<{ current: number; best: number }> {
  const allAttempts = (await firestoreAttempts.getByGoalId(goalId))
    .filter((a) => a.success || a.is_exempt)
    .sort((a, b) => b.attempted_date.localeCompare(a.attempted_date));

  if (allAttempts.length === 0) return { current: 0, best: 0 };

  // 날짜별 맵 생성
  const attemptMap = new Map<string, StoredAttempt>();
  for (const a of allAttempts) {
    if (!attemptMap.has(a.attempted_date)) {
      attemptMap.set(a.attempted_date, a);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  // 현재 스트릭 계산
  let current = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const attempt = attemptMap.get(dateStr);

    if (!attempt) {
      break;
    } else if (attempt.is_exempt) {
      // 면제 → 건너뛰고 계속
    } else if (attempt.success) {
      current++;
    } else {
      break;
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  // 최고 스트릭 계산
  const successDates = allAttempts
    .filter((a) => !a.is_exempt)
    .map((a) => a.attempted_date)
    .sort();

  let best = 0;

  for (let i = 0; i < successDates.length; i++) {
    let tempStreak = 1;
    let prevDate = new Date(successDates[i]);

    for (let j = i + 1; j < successDates.length; j++) {
      const nextDate = new Date(successDates[j]);

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
export async function getMonthlyExemptionCountFirestore(): Promise<number> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const allAttempts = await firestoreAttempts.getAll();
  const exemptDates = new Set<string>();

  for (const a of allAttempts) {
    if (a.is_exempt && a.attempted_date.startsWith(yearMonth)) {
      exemptDates.add(a.attempted_date);
    }
  }

  return exemptDates.size;
}

// 어제까지 연속 면제일 수 (연속 2일 제한 체크용)
export async function getConsecutiveExemptDaysFirestore(): Promise<number> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let count = 0;
  let checkDate = yesterday;
  const allAttempts = await firestoreAttempts.getAll();

  for (let i = 0; i < 10; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const hasExempt = allAttempts.some((a) => a.is_exempt && a.attempted_date === dateStr);

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
export async function isTodayExemptFirestore(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const allAttempts = await firestoreAttempts.getAll();
  return allAttempts.some((a) => a.is_exempt && a.attempted_date === today);
}

// 미완료 목표에만 면제 기록 생성 (이미 성공한 목표는 건너뜀)
export async function createExemptionFirestore(date: string, reason: ExemptReason): Promise<void> {
  const uid = getUid();
  const activeGoals = await firestoreGoals.getAll();
  const batch = writeBatch(db);

  for (const goal of activeGoals) {
    const existing = await firestoreAttempts.getByDate(goal.id, date);
    // 이미 성공한 기록이 있으면 건너뜀
    if (existing?.success) continue;

    if (existing) {
      // 기존 기록 업데이트
      const updated: StoredAttempt = {
        ...existing,
        success: false,
        is_exempt: true,
        exempt_reason: reason,
      };
      batch.set(attemptDocRef(uid, existing.id), updated);
    } else {
      // 새 기록 생성
      const newId = Date.now() + goal.id; // 같은 루프에서 중복 방지
      const newAttempt: StoredAttempt = {
        id: newId,
        goal_id: goal.id,
        attempted_date: date,
        success: false,
        used_revival: false,
        is_exempt: true,
        exempt_reason: reason,
        created_at: new Date().toISOString(),
      };
      batch.set(attemptDocRef(uid, newId), newAttempt);
    }
  }

  await batch.commit();
}

// 오늘 면제 취소 (면제 기록 삭제)
export async function cancelExemptionFirestore(date: string): Promise<void> {
  const uid = getUid();
  const allAttempts = await firestoreAttempts.getAll();
  const batch = writeBatch(db);

  for (const a of allAttempts) {
    if (a.is_exempt && a.attempted_date === date) {
      batch.delete(attemptDocRef(uid, a.id));
    }
  }

  await batch.commit();
}

// 우선순위 계산 (간단 버전)
export async function getTopPriorityGoalIdFirestore(goals: StoredGoal[]): Promise<number | null> {
  const today = new Date().toISOString().split('T')[0];

  const activeGoals = goals.filter((g) => g.is_active);
  if (activeGoals.length === 0) return null;

  // 오늘 완료 안 한 목표 중에서
  const incompleteResults = await Promise.all(
    activeGoals.map(async (g) => {
      const todayAttempt = await firestoreAttempts.getByDate(g.id, today);
      return { goal: g, done: !!todayAttempt?.success };
    })
  );

  const incomplete = incompleteResults.filter((r) => !r.done).map((r) => r.goal);

  if (incomplete.length === 0) return null;

  // 스트릭 높은 순
  const withStreak = await Promise.all(
    incomplete.map(async (g) => ({
      goal: g,
      streak: (await calculateStreakFirestore(g.id)).current,
    }))
  );

  withStreak.sort((a, b) => b.streak - a.streak);
  return withStreak[0].goal.id;
}
