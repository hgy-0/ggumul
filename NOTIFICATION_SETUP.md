# 푸시 알림 시스템 설정 가이드

꾸물 앱의 FCM 푸시 알림 시스템 배포 및 설정 가이드입니다.

## 📋 시스템 개요

### 구성 요소
1. **프론트엔드 (React)**
   - FCM 토큰 발급 및 Firestore 저장
   - 목표 생성/수정 시 Firestore에 자동 동기화
   - Service Worker를 통한 백그라운드 알림 수신

2. **Cloud Functions (Node.js)**
   - `sendScheduledNotifications`: 스케줄된 알림 발송 (매 시간 실행)
   - `sendTestNotification`: 테스트 알림 발송
   - `onGoalUpdate`: 목표 변경 감지 및 로깅

3. **Cloud Scheduler**
   - 매 시간마다 `sendScheduledNotifications` 함수 호출

4. **Firestore 컬렉션**
   - `goals`: 목표 정보 및 알림 시간
   - `fcm_tokens`: 디바이스별 FCM 토큰
   - `devices`: 디바이스 정보

## 🚀 배포 단계

### 1. Firebase 로그인

터미널에서 다음 명령어를 실행하세요:

```bash
firebase login
```

브라우저가 열리면 Google 계정으로 로그인합니다.

### 2. Firebase 프로젝트 초기화

```bash
cd /Users/sungin/Documents/gayoung/side/motivation
firebase init
```

다음 옵션을 선택하세요:
- **Features**: `Functions`, `Firestore` 선택 (스페이스바로 선택)
- **Project**: `ggumul-app` 선택
- **Language**: `JavaScript` 선택
- **ESLint**: `No`
- **Install dependencies**: `No` (이미 설치됨)
- **Firestore rules**: `firestore.rules` 사용
- **Firestore indexes**: `firestore.indexes.json` 사용

**중요**: functions 디렉토리를 덮어쓸 것인지 물으면 **`No`**를 선택하세요!

### 3. Cloud Functions 배포

```bash
firebase deploy --only functions
```

배포가 완료되면 다음과 같은 URL이 생성됩니다:
- `sendScheduledNotifications`: https://asia-northeast3-ggumul-app.cloudfunctions.net/sendScheduledNotifications
- `sendTestNotification`: https://asia-northeast3-ggumul-app.cloudfunctions.net/sendTestNotification

### 4. Cloud Scheduler 설정

Firebase Console 또는 GCP Console에서 설정:

#### 방법 A: Firebase Console
1. Firebase Console → Functions → 탭에서 "Scheduled Functions" 찾기
2. 없으면 GCP Console에서 직접 설정

#### 방법 B: GCP Console (권장)
1. [GCP Console](https://console.cloud.google.com/) 접속
2. 프로젝트 `ggumul-app` 선택
3. 왼쪽 메뉴 → Cloud Scheduler → "작업 만들기"
4. 다음 정보 입력:
   - **이름**: `notification-scheduler`
   - **리전**: `asia-northeast3 (서울)`
   - **빈도**: `0 * * * *` (매 시간 정각)
   - **시간대**: `Asia/Seoul`
   - **대상 유형**: `HTTP`
   - **URL**: `https://asia-northeast3-ggumul-app.cloudfunctions.net/sendScheduledNotifications`
   - **HTTP 메서드**: `POST`
   - **인증 헤더**: "인증 헤더 추가" 선택
     - 서비스 계정: 프로젝트 기본 서비스 계정 선택

5. "만들기" 클릭

### 5. 테스트 알림 발송

#### 방법 1: curl로 테스트

먼저 Firestore에서 deviceId 가져오기:
- Firebase Console → Firestore Database → `fcm_tokens` 컬렉션
- 문서 ID를 복사 (예: `device_1234567890_abc123`)

```bash
curl -X POST https://asia-northeast3-ggumul-app.cloudfunctions.net/sendTestNotification \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "YOUR_DEVICE_ID",
    "title": "🔔 테스트 알림",
    "body": "꾸물 앱 알림이 정상적으로 작동합니다!"
  }'
```

#### 방법 2: Postman 또는 Thunder Client 사용

- **URL**: `https://asia-northeast3-ggumul-app.cloudfunctions.net/sendTestNotification`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "deviceId": "YOUR_DEVICE_ID",
  "title": "🔔 테스트 알림",
  "body": "꾸물 앱 알림이 정상적으로 작동합니다!"
}
```

## 🧪 테스트 방법

### 1. FCM 토큰 발급 확인
1. 앱 접속 (https://ggumul-app.vercel.app)
2. 브라우저 콘솔 확인:
   ```
   [FCM] 토큰 발급 성공: cC-VGgLlkiEO_kGa_tTm...
   [FCM] 토큰 저장 완료
   ```
3. Firestore → `fcm_tokens` 컬렉션에 토큰 저장 확인

### 2. 목표 생성 및 알림 시간 설정
1. 새 목표 생성
2. 알림 설정에서 시간 지정 (예: 현재 시간 +5분)
3. Firestore → `goals` 컬렉션에서 `notification_time` 필드 확인

### 3. 스케줄러 실행 확인
1. GCP Console → Cloud Scheduler
2. 방금 만든 작업 선택
3. "지금 실행" 클릭
4. Cloud Functions 로그 확인:
   ```bash
   firebase functions:log
   ```

### 4. 알림 수신 확인
- **포그라운드 (앱 열려있을 때)**: 브라우저 알림으로 표시
- **백그라운드 (앱 닫혀있을 때)**: Service Worker가 알림 표시
- 알림 클릭 시 해당 목표의 카운트다운 페이지로 이동

## 📊 모니터링

### Cloud Functions 로그 보기
```bash
# 실시간 로그
firebase functions:log --only sendScheduledNotifications

# 최근 로그
firebase functions:log --limit 50
```

### Firestore 데이터 확인
- Firebase Console → Firestore Database
- 컬렉션별 확인:
  - `goals`: 목표 및 알림 시간
  - `fcm_tokens`: FCM 토큰
  - `devices`: 디바이스 정보

## 🔧 문제 해결

### 알림이 오지 않을 때

1. **FCM 토큰 확인**
   - Firestore → `fcm_tokens`에 토큰이 있는지 확인
   - 브라우저 콘솔에서 토큰 발급 로그 확인

2. **목표 데이터 확인**
   - Firestore → `goals`에 목표가 저장되었는지 확인
   - `notification_time` 필드가 있는지 확인
   - `notifications_enabled: true`인지 확인

3. **Cloud Functions 로그 확인**
   ```bash
   firebase functions:log
   ```
   - 에러 메시지 확인
   - "알림 발송 성공" 로그 확인

4. **Service Worker 확인**
   - Chrome DevTools → Application → Service Workers
   - `firebase-messaging-sw.js`가 activated 상태인지 확인

5. **브라우저 알림 권한 확인**
   - Chrome: 주소창 왼쪽 자물쇠 → 권한 → 알림
   - "허용됨"으로 되어 있는지 확인

### 자주 발생하는 오류

#### 1. "Missing or insufficient permissions"
- Firestore 규칙이 올바른지 확인
- Firebase Console → Firestore Database → Rules에서 확인

#### 2. "Service Worker registration failed"
- HTTPS로 접속 중인지 확인 (localhost는 예외)
- `/firebase-messaging-sw.js` 파일이 public 디렉토리에 있는지 확인

#### 3. "Messaging is not initialized"
- Firebase Messaging 초기화가 완료될 때까지 대기
- `waitForMessaging()` 함수가 제대로 작동하는지 확인

## 💰 비용 정보

### Firebase 무료 플랜 (Spark Plan)
- Cloud Functions: 125,000 호출/월
- Firestore: 1GB 저장소, 50,000 읽기/일
- FCM: 무제한 무료

### 예상 사용량
- Cloud Scheduler: 24회/일 (시간당 1회)
- Cloud Functions 호출: ~720회/월
- Firestore 읽기: 목표당 24회/일

**결론**: 사용자가 100명 이하면 무료 플랜으로 충분합니다!

## 📝 다음 단계

1. ✅ Cloud Functions 배포
2. ✅ Cloud Scheduler 설정
3. ✅ 테스트 알림 발송
4. ⏳ 실제 알림 수신 확인
5. ⏳ 프로덕션 모니터링

## 🔗 참고 링크

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Cloud Functions for Firebase](https://firebase.google.com/docs/functions)
- [Cloud Scheduler](https://cloud.google.com/scheduler/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
