# 백그라운드 알림 설정 가이드

## 1. Firebase 서비스 계정 키 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택: `ggumul-app`
3. 프로젝트 설정 (⚙️) > 서비스 계정 탭
4. "새 비공개 키 생성" 클릭
5. JSON 파일 다운로드 (예: `ggumul-app-firebase-adminsdk.json`)

## 2. Vercel 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 추가해야 합니다:

### 2.1 FIREBASE_SERVICE_ACCOUNT_KEY

다운로드한 JSON 파일의 **전체 내용**을 복사해서 입력합니다.

```json
{
  "type": "service_account",
  "project_id": "ggumul-app",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@ggumul-app.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### 2.2 CRON_SECRET

Cron Job 보안을 위한 랜덤 문자열을 생성합니다:

```bash
# 터미널에서 실행
openssl rand -base64 32
```

생성된 문자열을 `CRON_SECRET` 환경 변수로 설정합니다.

## 3. Vercel에 환경 변수 추가하는 방법

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택: `ggumul-app`
3. Settings > Environment Variables
4. 다음 환경 변수 추가:
   - Name: `FIREBASE_SERVICE_ACCOUNT_KEY`
     - Value: (위의 JSON 전체 내용)
     - Environment: Production, Preview, Development 모두 체크
   - Name: `CRON_SECRET`
     - Value: (생성한 랜덤 문자열)
     - Environment: Production, Preview, Development 모두 체크
5. Save 클릭

## 4. 재배포

환경 변수를 추가한 후 프로젝트를 재배포해야 합니다:

1. Vercel 대시보드에서 "Deployments" 탭으로 이동
2. 최신 배포의 "..." 메뉴 클릭
3. "Redeploy" 클릭

또는 코드를 커밋하고 푸시하면 자동으로 재배포됩니다.

## 5. Vercel Cron Job 활성화

### 주의사항
- Vercel의 **Hobby (무료) 플랜**에서는 Cron Job이 **하루에 최대 20번**까지만 실행됩니다.
- 현재 설정(`* * * * *`)은 매분마다 실행되므로 20분 후에 중단됩니다.
- **Pro 플랜**($20/월)으로 업그레이드하면 무제한으로 사용 가능합니다.

### 무료 플랜에서 사용하려면:

`vercel.json` 파일의 cron 스케줄을 다음 중 하나로 변경하세요:

```json
{
  "crons": [
    {
      "path": "/api/check-notifications",
      "schedule": "*/5 * * * *"  // 5분마다 (하루 288번 -> 20번 제한 초과)
    }
  ]
}
```

또는

```json
{
  "crons": [
    {
      "path": "/api/check-notifications",
      "schedule": "0 * * * *"  // 매시간 정각 (하루 24번 -> OK!)
    }
  ]
}
```

**권장**: 매시간 정각 실행 (`0 * * * *`)

## 6. 동작 확인

1. 목표 생성 시 알림 시간 설정
2. Firestore에 `notification_schedules` 컬렉션 생성 확인
3. Firestore에 `fcm_tokens` 컬렉션에 토큰 저장 확인
4. Vercel 로그에서 Cron Job 실행 확인

## 7. 테스트 방법

현재 시간에 맞춰 알림을 설정하고 1-2분 기다려보세요:

1. 목표 생성 또는 수정
2. 알림 활성화
3. 현재 시간 + 2분 후로 알림 시간 설정
4. 저장 후 대기

알림이 오지 않으면:
- 브라우저 알림 권한 확인
- Vercel 로그 확인 (Functions > check-notifications)
- Firestore 데이터 확인

## 참고

- 무료로 사용하려면 Cron 스케줄을 조정해야 합니다
- Firebase Admin SDK는 무료입니다
- Firebase Cloud Messaging (FCM)도 무료입니다
- Vercel Serverless Functions도 무료 범위 내에서 사용 가능합니다
