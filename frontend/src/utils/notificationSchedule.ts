import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { getUserId } from './firebaseFriends';

interface NotificationSchedule {
  user_id: string;
  goal_id: string;
  goal_name: string;
  hour: number;
  minute: number;
  days: number[];
}

/**
 * 목표의 알림 스케줄을 Firestore에 저장
 */
export async function saveNotificationSchedules(
  goalId: number,
  goalName: string,
  schedules: Array<{ hour: number; minute: number; days: number[] }>
): Promise<void> {
  if (!db) return;

  const userId = getUserId();

  try {
    // 기존 스케줄 삭제
    await deleteNotificationSchedules(goalId);

    // 새 스케줄 저장
    for (const schedule of schedules) {
      const scheduleId = `${userId}_${goalId}_${schedule.hour}_${schedule.minute}`;
      const scheduleDoc: NotificationSchedule = {
        user_id: userId,
        goal_id: String(goalId),
        goal_name: goalName,
        hour: schedule.hour,
        minute: schedule.minute,
        days: schedule.days,
      };

      await setDoc(doc(db, 'notification_schedules', scheduleId), scheduleDoc);
    }

    console.log(`[NotificationSchedule] 저장 완료: ${schedules.length}개`);
  } catch (error) {
    console.error('[NotificationSchedule] 저장 실패:', error);
    throw error;
  }
}

/**
 * 목표의 알림 스케줄을 Firestore에서 삭제
 */
export async function deleteNotificationSchedules(goalId: number): Promise<void> {
  if (!db) return;

  const userId = getUserId();

  try {
    const q = query(
      collection(db, 'notification_schedules'),
      where('user_id', '==', userId),
      where('goal_id', '==', String(goalId))
    );

    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
    }

    console.log(`[NotificationSchedule] 삭제 완료: goal_id=${goalId}`);
  } catch (error) {
    console.error('[NotificationSchedule] 삭제 실패:', error);
    throw error;
  }
}

/**
 * 사용자의 모든 알림 스케줄 삭제
 */
export async function deleteAllNotificationSchedules(): Promise<void> {
  if (!db) return;

  const userId = getUserId();

  try {
    const q = query(
      collection(db, 'notification_schedules'),
      where('user_id', '==', userId)
    );

    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
    }

    console.log(`[NotificationSchedule] 모든 스케줄 삭제 완료`);
  } catch (error) {
    console.error('[NotificationSchedule] 전체 삭제 실패:', error);
    throw error;
  }
}
