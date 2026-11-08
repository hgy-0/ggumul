import { useState, useCallback } from 'react';
import { subscribePush } from '@/api/notifications';

/**
 * base64url 문자열을 Uint8Array로 변환한다.
 * pushManager.subscribe()의 applicationServerKey에 필요.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * 푸시 알림 구독 훅.
 * 브라우저 Notification API + Service Worker PushManager를 사용한다.
 */
export function usePushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 알림 권한 요청
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('알림 권한이 거부되었습니다.');
        setLoading(false);
        return;
      }

      // 서비스 워커 등록 확인 (타임아웃 5초)
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('서비스 워커가 등록되지 않았습니다. 페이지를 새로고침해주세요.')), 5000),
        ),
      ]);

      // VAPID 공개키 (환경변수에서 가져옴)
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError('VAPID 키가 설정되지 않았습니다.');
        setLoading(false);
        return;
      }

      // 기존 구독 확인 또는 새 구독 생성
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });
      }

      // 서버에 구독 정보 전송
      const json = subscription.toJSON();
      await subscribePush({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: json.keys?.p256dh ?? '',
          auth: json.keys?.auth ?? '',
        },
      });

      setIsSubscribed(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '푸시 구독에 실패했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { isSubscribed, loading, error, subscribe };
}
