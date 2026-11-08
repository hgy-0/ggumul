/**
 * 통합 데이터 접근 레이어
 * 인증 상태에 따라 Firestore 또는 localStorage로 자동 라우팅
 */

import { auth } from './firebase';
import type { AttemptCreate, ExemptReason } from '@/types';
import type { StoredGoal, StoredAttempt } from './localStorage';

// localStorage 모듈
import {
  localGoals,
  localAttempts,
  calculateStreak as calculateStreakLocal,
  getMonthlyExemptionCount as getMonthlyExemptionCountLocal,
  getConsecutiveExemptDays as getConsecutiveExemptDaysLocal,
  isTodayExempt as isTodayExemptLocal,
  createExemption as createExemptionLocal,
  cancelExemption as cancelExemptionLocal,
  getTopPriorityGoalId as getTopPriorityGoalIdLocal,
} from './localStorage';

// Firestore 모듈
import {
  firestoreGoals,
  firestoreAttempts,
  calculateStreakFirestore,
  getMonthlyExemptionCountFirestore,
  getConsecutiveExemptDaysFirestore,
  isTodayExemptFirestore,
  createExemptionFirestore,
  cancelExemptionFirestore,
  getTopPriorityGoalIdFirestore,
} from './firestoreData';

// 인증 여부 확인
function isAuthenticated(): boolean {
  return !!auth?.currentUser;
}

// 목표 관련
export const goals = {
  async getAll(): Promise<StoredGoal[]> {
    if (isAuthenticated()) {
      return firestoreGoals.getAll();
    }
    return localGoals.getAll();
  },

  async getById(id: number): Promise<StoredGoal | undefined> {
    if (isAuthenticated()) {
      return firestoreGoals.getById(id);
    }
    return localGoals.getById(id);
  },

  async create(data: {
    name: string;
    first_action: string;
    countdown_seconds: number;
    notification_schedules?: any[];
  }): Promise<StoredGoal> {
    if (isAuthenticated()) {
      return firestoreGoals.create(data);
    }
    return localGoals.create(data);
  },

  async update(id: number, data: Partial<StoredGoal>): Promise<StoredGoal | null> {
    if (isAuthenticated()) {
      return firestoreGoals.update(id, data);
    }
    return localGoals.update(id, data);
  },

  async delete(id: number): Promise<boolean> {
    if (isAuthenticated()) {
      return firestoreGoals.delete(id);
    }
    return localGoals.delete(id);
  },
};

// 시도 기록 관련
export const attempts = {
  async getAll(): Promise<StoredAttempt[]> {
    if (isAuthenticated()) {
      return firestoreAttempts.getAll();
    }
    return localAttempts.getAll();
  },

  async getByGoalId(goalId: number): Promise<StoredAttempt[]> {
    if (isAuthenticated()) {
      return firestoreAttempts.getByGoalId(goalId);
    }
    return localAttempts.getByGoalId(goalId);
  },

  async getByDate(goalId: number, date: string): Promise<StoredAttempt | undefined> {
    if (isAuthenticated()) {
      return firestoreAttempts.getByDate(goalId, date);
    }
    return localAttempts.getByDate(goalId, date);
  },

  async create(goalId: number, data: AttemptCreate): Promise<StoredAttempt> {
    if (isAuthenticated()) {
      return firestoreAttempts.create(goalId, data);
    }
    return localAttempts.create(goalId, data);
  },

  async useRevival(goalId: number, date: string): Promise<boolean> {
    if (isAuthenticated()) {
      return firestoreAttempts.useRevival(goalId, date);
    }
    return localAttempts.useRevival(goalId, date);
  },
};

// 유틸리티 함수들
export async function calculateStreak(goalId: number): Promise<{ current: number; best: number }> {
  if (isAuthenticated()) {
    return calculateStreakFirestore(goalId);
  }
  return calculateStreakLocal(goalId);
}

export async function getMonthlyExemptionCount(): Promise<number> {
  if (isAuthenticated()) {
    return getMonthlyExemptionCountFirestore();
  }
  return getMonthlyExemptionCountLocal();
}

export async function getConsecutiveExemptDays(): Promise<number> {
  if (isAuthenticated()) {
    return getConsecutiveExemptDaysFirestore();
  }
  return getConsecutiveExemptDaysLocal();
}

export async function isTodayExempt(): Promise<boolean> {
  if (isAuthenticated()) {
    return isTodayExemptFirestore();
  }
  return isTodayExemptLocal();
}

export async function createExemption(date: string, reason: ExemptReason): Promise<void> {
  if (isAuthenticated()) {
    return createExemptionFirestore(date, reason);
  }
  return createExemptionLocal(date, reason);
}

export async function cancelExemption(date: string): Promise<void> {
  if (isAuthenticated()) {
    return cancelExemptionFirestore(date);
  }
  return cancelExemptionLocal(date);
}

export async function getTopPriorityGoalId(goalsData: StoredGoal[]): Promise<number | null> {
  if (isAuthenticated()) {
    return getTopPriorityGoalIdFirestore(goalsData);
  }
  return getTopPriorityGoalIdLocal(goalsData);
}

// localStorage → Firestore 일회성 마이그레이션
export async function migrateLocalStorageToFirestore(): Promise<void> {
  if (!isAuthenticated()) return;

  const uid = auth!.currentUser!.uid;

  // 이미 마이그레이션했는지 확인
  const { doc, getDoc, setDoc, writeBatch } = await import('firebase/firestore');
  const { db } = await import('./firebase');

  const metaRef = doc(db, 'users', uid, 'metadata', 'migration');
  const metaSnap = await getDoc(metaRef);

  if (metaSnap.exists() && metaSnap.data()?.migrated_from_local) {
    console.log('[Migration] 이미 마이그레이션 완료됨');
    return;
  }

  // localStorage에서 데이터 읽기
  const localGoalsList = localGoals.getAll();
  const localAttemptsList = localAttempts.getAll();

  if (localGoalsList.length === 0 && localAttemptsList.length === 0) {
    console.log('[Migration] localStorage에 데이터 없음 — 건너뜀');
    // 마이그레이션 완료 플래그만 설정
    await setDoc(metaRef, { migrated_from_local: true, migrated_at: new Date().toISOString() });
    return;
  }

  console.log(`[Migration] 시작: ${localGoalsList.length}개 목표, ${localAttemptsList.length}개 시도 기록`);

  // Firestore batch write (500개 제한이므로 나눠서 처리)
  const BATCH_LIMIT = 450;
  let batch = writeBatch(db);
  let batchCount = 0;

  // 목표 마이그레이션
  for (const goal of localGoalsList) {
    const goalRef = doc(db, 'users', uid, 'goals', String(goal.id));
    const existingGoal = await getDoc(goalRef);
    if (!existingGoal.exists()) {
      batch.set(goalRef, { ...goal, device_id: uid });
      batchCount++;
    }

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  // 시도 기록 마이그레이션
  for (const attempt of localAttemptsList) {
    const attemptRef = doc(db, 'users', uid, 'attempts', String(attempt.id));
    const existingAttempt = await getDoc(attemptRef);
    if (!existingAttempt.exists()) {
      batch.set(attemptRef, attempt);
      batchCount++;
    }

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  // 남은 batch 커밋
  if (batchCount > 0) {
    await batch.commit();
  }

  // 마이그레이션 완료 플래그 설정
  await setDoc(metaRef, {
    migrated_from_local: true,
    migrated_at: new Date().toISOString(),
    goals_count: localGoalsList.length,
    attempts_count: localAttemptsList.length,
  });

  console.log(`[Migration] 완료: ${localGoalsList.length}개 목표, ${localAttemptsList.length}개 시도 기록`);
}
