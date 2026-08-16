const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * 매일 정해진 시간에 실행되는 알림 스케줄러
 * Cloud Scheduler에서 매 시간마다 호출
 */
exports.sendScheduledNotifications = functions
  .region('asia-northeast3') // 서울 리전
  .https.onRequest(async (req, res) => {
    try {
      console.log('[Scheduler] 알림 스케줄러 시작');

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      console.log(`[Scheduler] 현재 시각: ${currentHour}:${currentMinute}`);

      // Firestore에서 모든 활성 디바이스의 목표 가져오기
      const devicesSnapshot = await admin.firestore().collection('devices').get();

      if (devicesSnapshot.empty) {
        console.log('[Scheduler] 등록된 디바이스가 없습니다.');
        return res.status(200).json({ message: '등록된 디바이스가 없습니다.' });
      }

      let notificationsSent = 0;
      const promises = [];

      // 각 디바이스의 목표 확인
      for (const deviceDoc of devicesSnapshot.docs) {
        const deviceId = deviceDoc.id;
        const deviceData = deviceDoc.data();

        // 해당 디바이스의 목표 가져오기
        const goalsSnapshot = await admin.firestore()
          .collection('goals')
          .where('device_id', '==', deviceId)
          .get();

        if (goalsSnapshot.empty) continue;

        // 디바이스의 FCM 토큰 가져오기
        const fcmTokenDoc = await admin.firestore()
          .collection('fcm_tokens')
          .doc(deviceId)
          .get();

        if (!fcmTokenDoc.exists) {
          console.log(`[Scheduler] 디바이스 ${deviceId}의 FCM 토큰이 없습니다.`);
          continue;
        }

        const fcmToken = fcmTokenDoc.data().token;

        // 각 목표의 알림 설정 확인
        for (const goalDoc of goalsSnapshot.docs) {
          const goal = goalDoc.data();
          const goalId = goalDoc.id;

          // 알림 활성화 여부 확인
          if (!goal.notifications_enabled) continue;

          // 오늘 이미 성공했는지 확인
          if (goal.today_success) continue;

          // 알림 시간이 설정되어 있는지 확인
          if (!goal.notification_time) continue;

          // 알림 시간 파싱 (HH:MM 형식)
          const [notifHour, notifMinute] = goal.notification_time.split(':').map(Number);

          // 현재 시간과 비교 (±5분 범위 내)
          const timeDiff = Math.abs(
            (currentHour * 60 + currentMinute) - (notifHour * 60 + notifMinute)
          );

          if (timeDiff <= 5) {
            // 알림 발송
            const message = {
              notification: {
                title: '🎯 목표 시간이에요!',
                body: `"${goal.name}" - ${goal.first_action}을 시작해볼까요?`,
              },
              data: {
                goalId: String(goalId),
                goalName: goal.name,
                type: 'goal_reminder',
              },
              token: fcmToken,
            };

            promises.push(
              admin.messaging().send(message)
                .then(() => {
                  console.log(`[Scheduler] 알림 발송 성공: ${goal.name} (${deviceId})`);
                  notificationsSent++;
                })
                .catch((error) => {
                  console.error(`[Scheduler] 알림 발송 실패: ${goal.name}`, error);
                })
            );
          }
        }
      }

      await Promise.all(promises);

      console.log(`[Scheduler] 총 ${notificationsSent}개의 알림 발송 완료`);
      return res.status(200).json({
        message: '알림 발송 완료',
        notificationsSent,
      });

    } catch (error) {
      console.error('[Scheduler] 에러 발생:', error);
      return res.status(500).json({ error: error.message });
    }
  });

/**
 * 테스트용 알림 발송 함수
 * HTTP 요청으로 즉시 알림 발송
 */
exports.sendTestNotification = functions
  .region('asia-northeast3')
  .https.onRequest(async (req, res) => {
    try {
      const { deviceId, goalId, title, body } = req.body;

      if (!deviceId) {
        return res.status(400).json({ error: 'deviceId가 필요합니다.' });
      }

      // FCM 토큰 가져오기
      const fcmTokenDoc = await admin.firestore()
        .collection('fcm_tokens')
        .doc(deviceId)
        .get();

      if (!fcmTokenDoc.exists) {
        return res.status(404).json({ error: 'FCM 토큰을 찾을 수 없습니다.' });
      }

      const fcmToken = fcmTokenDoc.data().token;

      // 알림 발송
      const message = {
        notification: {
          title: title || '🔔 테스트 알림',
          body: body || '꾸물 앱 알림 테스트입니다!',
        },
        data: {
          goalId: goalId ? String(goalId) : '',
          type: 'test',
        },
        token: fcmToken,
      };

      await admin.messaging().send(message);

      console.log(`[Test] 테스트 알림 발송 성공: ${deviceId}`);
      return res.status(200).json({
        message: '테스트 알림 발송 성공',
        deviceId,
      });

    } catch (error) {
      console.error('[Test] 에러 발생:', error);
      return res.status(500).json({ error: error.message });
    }
  });

/**
 * 목표 알림 시간 업데이트 시 트리거
 * Firestore의 goals 컬렉션 변경 감지
 */
exports.onGoalUpdate = functions
  .region('asia-northeast3')
  .firestore.document('goals/{goalId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // 알림 설정이 변경되었는지 확인
    if (before.notification_time !== after.notification_time ||
        before.notifications_enabled !== after.notifications_enabled) {

      console.log(`[Goal Update] 목표 ${context.params.goalId}의 알림 설정 변경됨`);
      console.log(`  - 알림 시간: ${before.notification_time} → ${after.notification_time}`);
      console.log(`  - 알림 활성화: ${before.notifications_enabled} → ${after.notifications_enabled}`);
    }

    return null;
  });
