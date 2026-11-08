import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Firebase Admin 초기화
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'ggumul-app',
  });
}

const db = admin.firestore();

interface NotificationSchedule {
  user_id: string;
  goal_id: string;
  goal_name: string;
  hour: number;
  minute: number;
  days: number[]; // 0 = 일요일, 1 = 월요일, ...
}

/**
 * 현재 시간에 맞는 알림 스케줄 찾기 및 푸시 전송
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Cron job에서만 실행되도록 보안 체크
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();

    console.log(`[Cron] 알림 체크 시작: ${currentHour}:${currentMinute}, 요일: ${currentDay}`);

    // Firestore에서 모든 알림 스케줄 가져오기
    const schedulesSnapshot = await db.collection('notification_schedules').get();

    let sentCount = 0;

    for (const doc of schedulesSnapshot.docs) {
      const schedule = doc.data() as NotificationSchedule;

      // 현재 시간과 요일이 맞는지 확인
      if (
        schedule.hour === currentHour &&
        schedule.minute === currentMinute &&
        schedule.days.includes(currentDay)
      ) {
        // 해당 사용자의 FCM 토큰 가져오기
        const tokenDoc = await db.collection('fcm_tokens').doc(schedule.user_id).get();

        if (!tokenDoc.exists) {
          console.log(`[Cron] FCM 토큰 없음: user_id=${schedule.user_id}`);
          continue;
        }

        const fcmToken = tokenDoc.data()?.token;
        if (!fcmToken) {
          console.log(`[Cron] FCM 토큰 비어있음: user_id=${schedule.user_id}`);
          continue;
        }

        // FCM 푸시 메시지 전송
        try {
          await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: '꾸물 알림',
              body: `"${schedule.goal_name}" 시작할 시간이에요!`,
            },
            data: {
              goalId: schedule.goal_id,
              type: 'goal_reminder',
            },
            webpush: {
              notification: {
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                tag: `goal-${schedule.goal_id}`,
              },
              fcmOptions: {
                link: `https://ggumul-app.vercel.app/#/goals/${schedule.goal_id}/countdown`,
              },
            },
          });

          sentCount++;
          console.log(`[Cron] 푸시 전송 성공: ${schedule.goal_name} -> ${schedule.user_id}`);
        } catch (error: any) {
          console.error(`[Cron] 푸시 전송 실패:`, error.message);

          // 토큰이 유효하지 않으면 삭제
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            await db.collection('fcm_tokens').doc(schedule.user_id).delete();
            console.log(`[Cron] 유효하지 않은 토큰 삭제: ${schedule.user_id}`);
          }
        }
      }
    }

    console.log(`[Cron] 완료: ${sentCount}개 알림 전송`);

    return res.status(200).json({
      success: true,
      sent_count: sentCount,
      checked_at: now.toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] 에러:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
}
