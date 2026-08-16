import { getToken, onMessage } from 'firebase/messaging';
import { messaging, isFirebaseConfigured, waitForMessaging } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getUserId } from './firebaseFriends';

/**
 * FCM 토큰 가져오기 및 저장
 */
export async function getFCMToken(): Promise<string | null> {
  if (!isFirebaseConfigured()) {
    console.log('[FCM] Firebase가 설정되지 않았습니다.');
    return null;
  }

  // Messaging 초기화 대기
  const initialized = await waitForMessaging();
  if (!initialized || !messaging) {
    console.log('[FCM] Firebase Messaging이 초기화되지 않았습니다.');
    return null;
  }

  try {
    // 알림 권한 요청
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] 알림 권한이 거부되었습니다.');
      return null;
    }

    // Service Worker 등록 확인
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    console.log('[FCM] Service Worker 등록 완료');

    // FCM 토큰 가져오기
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error('[FCM] VAPID 키가 설정되지 않았습니다.');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('[FCM] 토큰 발급 성공:', token.substring(0, 20) + '...');

      // Firestore에 토큰 저장
      await saveFCMToken(token);

      return token;
    } else {
      console.log('[FCM] 토큰 발급 실패');
      return null;
    }
  } catch (err) {
    console.error('[FCM] 토큰 가져오기 실패:', err);
    return null;
  }
}

/**
 * FCM 토큰을 Firestore에 저장
 */
async function saveFCMToken(token: string) {
  if (!db) return;

  const userId = getUserId();

  try {
    await setDoc(
      doc(db, 'fcm_tokens', userId),
      {
        user_id: userId,
        token,
        updated_at: new Date().toISOString(),
        device_info: {
          user_agent: navigator.userAgent,
          platform: navigator.platform,
        },
      },
      { merge: true }
    );

    console.log('[FCM] 토큰 저장 완료');
  } catch (err) {
    console.error('[FCM] 토큰 저장 실패:', err);
  }
}

/**
 * 포그라운드 메시지 수신 리스너 설정
 */
export function setupForegroundMessageListener() {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('[FCM] 포그라운드 메시지 수신:', payload);

    const notificationTitle = payload.notification?.title || '꾸물 알림';
    const notificationOptions = {
      body: payload.notification?.body || '탭하면 바로 카운트다운이 시작돼요 ⏱️',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: payload.data?.goalId || 'default',
      data: payload.data,
    };

    // 포그라운드에서도 알림 표시
    if (Notification.permission === 'granted') {
      const notification = new Notification(notificationTitle, notificationOptions);

      notification.onclick = () => {
        const goalId = payload.data?.goalId;
        if (goalId) {
          window.location.hash = `#/goals/${goalId}/countdown`;
        }
        notification.close();
      };
    }
  });
}
