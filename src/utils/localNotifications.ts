/**
 * 로컬 알림 스케줄러
 * Service Worker 없이 브라우저 Notification API를 사용하여
 * 앱이 열려있을 때 알림을 표시합니다.
 */

interface NotificationSchedule {
  goalId: number;
  goalName: string;
  hour: number;
  minute: number;
  days: number[]; // 0 = 일요일, 1 = 월요일, ...
}

const STORAGE_KEY = 'ggumul_notification_schedules';

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('이 브라우저는 알림을 지원하지 않습니다.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * 알림 스케줄 저장
 */
export function saveNotificationSchedules(schedules: NotificationSchedule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}

/**
 * 알림 스케줄 불러오기
 */
export function getNotificationSchedules(): NotificationSchedule[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 특정 목표의 알림 스케줄 추가/업데이트
 */
export function updateGoalNotificationSchedules(
  goalId: number,
  goalName: string,
  schedules: Array<{ hour: number; minute: number; days: number[] }>
): void {
  const allSchedules = getNotificationSchedules();

  // 기존 해당 목표의 스케줄 제거
  const filtered = allSchedules.filter((s) => s.goalId !== goalId);

  // 새 스케줄 추가
  const newSchedules = schedules.map((s) => ({
    goalId,
    goalName,
    hour: s.hour,
    minute: s.minute,
    days: s.days,
  }));

  saveNotificationSchedules([...filtered, ...newSchedules]);
}

/**
 * 특정 목표의 알림 스케줄 삭제
 */
export function removeGoalNotificationSchedules(goalId: number): void {
  const allSchedules = getNotificationSchedules();
  const filtered = allSchedules.filter((s) => s.goalId !== goalId);
  saveNotificationSchedules(filtered);
}

/**
 * 알림 표시
 */
export function showNotification(title: string, body: string, data?: any): void {
  if (Notification.permission !== 'granted') {
    console.warn('알림 권한이 없습니다.');
    return;
  }

  const notification = new Notification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `goal-${data?.goalId || 'default'}`,
    data,
  });

  notification.onclick = () => {
    window.focus();
    if (data?.goalId) {
      window.location.hash = `#/goals/${data.goalId}/countdown`;
    }
    notification.close();
  };
}

/**
 * 현재 시간에 맞는 알림 체크 및 표시
 */
export function checkAndShowNotifications(): void {
  if (Notification.permission !== 'granted') {
    return;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDay = now.getDay();

  const schedules = getNotificationSchedules();

  for (const schedule of schedules) {
    // 오늘 해당하는 요일이고, 시간이 맞으면 알림 표시
    if (
      schedule.days.includes(currentDay) &&
      schedule.hour === currentHour &&
      schedule.minute === currentMinute
    ) {
      showNotification(
        `${schedule.goalName} 시작할 시간이에요!`,
        '탭하면 바로 카운트다운이 시작돼요 ⏱️',
        { goalId: schedule.goalId }
      );
    }
  }
}

/**
 * 알림 스케줄러 시작 (1분마다 체크)
 */
let notificationInterval: number | null = null;

export function startNotificationScheduler(): void {
  if (notificationInterval) {
    return; // 이미 실행 중
  }

  // 즉시 한 번 체크
  checkAndShowNotifications();

  // 30초마다 체크
  notificationInterval = window.setInterval(() => {
    checkAndShowNotifications();
  }, 30000); // 30초
}

/**
 * 알림 스케줄러 중지
 */
export function stopNotificationScheduler(): void {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
}
