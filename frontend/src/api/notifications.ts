import client from './client';
import type { PushSubscriptionData } from '@/types';

/** 푸시 알림 구독 정보를 서버에 전송 */
export async function subscribePush(subscription: PushSubscriptionData) {
  if (import.meta.env.VITE_SINGLE_FILE) {
    // localStorage 모드에서는 푸시 알림 기능 비활성화
    console.log('[localStorage 모드] 푸시 알림은 온라인 모드에서만 사용 가능합니다.');
    return { success: false, message: 'localStorage 모드에서는 푸시 알림을 사용할 수 없습니다.' };
  }

  const { data } = await client.post('/subscribe', subscription);
  return data;
}
