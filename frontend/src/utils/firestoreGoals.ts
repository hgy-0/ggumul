import { doc, setDoc, deleteDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { getUserId } from './firebaseFriends';
import type { Goal } from '@/types';

/**
 * Firestore에 목표 저장
 * FCM 알림 스케줄링을 위해 필요
 */
export async function saveGoalToFirestore(goal: Goal): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    console.log('[Firestore Goals] Firebase 미설정 - 저장 건너뜀');
    return;
  }

  try {
    const deviceId = getUserId();

    // 알림 시간이 있으면 첫 번째 스케줄의 시간을 notification_time으로 저장
    let notificationTime = null;
    if (goal.notification_schedules && goal.notification_schedules.length > 0) {
      const firstSchedule = goal.notification_schedules[0];
      notificationTime = `${String(firstSchedule.hour).padStart(2, '0')}:${String(firstSchedule.minute).padStart(2, '0')}`;
    }

    await setDoc(doc(db, 'goals', String(goal.id)), {
      id: goal.id,
      device_id: deviceId,
      name: goal.name,
      first_action: goal.first_action,
      countdown_seconds: goal.countdown_seconds,
      notifications_enabled: goal.notification_schedules && goal.notification_schedules.length > 0,
      notification_time: notificationTime,
      notification_schedules: goal.notification_schedules || [],
      current_streak: goal.current_streak || 0,
      best_streak: goal.best_streak || 0,
      revival_cards: goal.revival_cards || 0,
      today_success: goal.today_success || false,
      today_attempted: goal.today_attempted || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    console.log('[Firestore Goals] 목표 저장 완료:', goal.name);
  } catch (error) {
    console.error('[Firestore Goals] 목표 저장 실패:', error);
  }
}

/**
 * Firestore에서 목표 삭제
 */
export async function deleteGoalFromFirestore(goalId: number): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'goals', String(goalId)));
    console.log('[Firestore Goals] 목표 삭제 완료:', goalId);
  } catch (error) {
    console.error('[Firestore Goals] 목표 삭제 실패:', error);
  }
}

/**
 * Firestore에서 사용자의 모든 목표 가져오기
 */
export async function getGoalsFromFirestore(): Promise<Goal[]> {
  if (!isFirebaseConfigured() || !db) {
    return [];
  }

  try {
    const deviceId = getUserId();
    const q = query(collection(db, 'goals'), where('device_id', '==', deviceId));
    const snapshot = await getDocs(q);

    const goals: Goal[] = [];
    snapshot.forEach((doc) => {
      goals.push(doc.data() as Goal);
    });

    console.log('[Firestore Goals] 목표 가져오기 완료:', goals.length);
    return goals;
  } catch (error) {
    console.error('[Firestore Goals] 목표 가져오기 실패:', error);
    return [];
  }
}

/**
 * 목표의 오늘 상태 업데이트
 */
export async function updateGoalTodayStatus(goalId: number, success: boolean): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return;
  }

  try {
    const goalRef = doc(db, 'goals', String(goalId));
    const goalSnap = await getDoc(goalRef);

    if (goalSnap.exists()) {
      await setDoc(goalRef, {
        ...goalSnap.data(),
        today_success: success,
        today_attempted: true,
        updated_at: new Date().toISOString(),
      });

      console.log('[Firestore Goals] 목표 상태 업데이트:', goalId, success);
    }
  } catch (error) {
    console.error('[Firestore Goals] 목표 상태 업데이트 실패:', error);
  }
}
