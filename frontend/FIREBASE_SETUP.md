# Firebase 설정 가이드

이 문서는 "꾸물" 앱에서 친구 기능을 사용하기 위한 Firebase 설정 방법을 안내합니다.

## 왜 Firebase가 필요한가요?

LocalStorage 모드에서도 친구 기능을 사용하려면 실시간 데이터 동기화가 필요합니다. Firebase는 무료 플랜으로도 충분히 사용할 수 있으며, 다음 기능을 제공합니다:

- **Firestore**: 친구 관계 및 초대 코드 저장
- **Cloud Messaging** (선택): 푸시 알림 (현재는 로컬 알림으로 구현)

## Firebase 무료 플랜 (Spark Plan) 제한

- Firestore: 1GB 저장소, 하루 50,000 읽기 / 20,000 쓰기
- 소규모 앱에는 충분합니다!

## 1단계: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속합니다
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: "ggumul-app")
4. Google 애널리틱스는 선택사항 (추천: 비활성화)
5. "프로젝트 만들기" 클릭

## 2단계: 웹 앱 추가

1. Firebase 프로젝트 개요 페이지에서 "웹 아이콘" (</>) 클릭
2. 앱 닉네임 입력 (예: "ggumul-web")
3. "Firebase 호스팅 설정" 체크 해제 (Vercel 사용 중)
4. "앱 등록" 클릭
5. **Firebase 구성 정보 복사** (다음 단계에서 사용)

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## 3단계: Firestore 데이터베이스 생성

1. 왼쪽 메뉴에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 클릭
3. **프로덕션 모드에서 시작** 선택
4. 위치 선택 (추천: `asia-northeast3` - 서울)
5. "사용 설정" 클릭

## 4단계: Firestore 보안 규칙 설정

Firestore 데이터베이스가 생성되면 "규칙" 탭으로 이동하여 다음 규칙을 설정합니다:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // 디바이스 정보: 본인만 쓰기 가능, 모두 읽기 가능
    match /devices/{deviceId} {
      allow read: if true;
      allow write: if request.auth == null; // 익명 사용자 허용
    }

    // 친구 관계: 본인 관련 데이터만 읽기/쓰기 가능
    match /friendships/{friendshipId} {
      allow read: if true;
      allow write: if request.auth == null; // 익명 사용자 허용
    }

    // 초대 코드: 모두 읽기/쓰기 가능 (24시간 후 자동 만료)
    match /invite_codes/{code} {
      allow read, write: if true;
    }
  }
}
```

**중요**: 위 규칙은 개발/테스트용입니다. 실제 프로덕션에서는 더 엄격한 규칙을 설정하세요.

## 5단계: 환경 변수 설정

### 로컬 개발 환경

`.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```bash
# Firebase 설정
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# 싱글파일 모드 활성화
VITE_SINGLE_FILE=true
```

### Vercel 배포 환경

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 (ggumul-app)
3. "Settings" > "Environment Variables" 메뉴
4. 위의 환경 변수들을 하나씩 추가:
   - Key: `VITE_FIREBASE_API_KEY`
   - Value: Firebase 설정에서 복사한 apiKey
   - Environment: `Production`, `Preview`, `Development` 모두 선택
5. 모든 Firebase 환경 변수 추가 후 "Save" 클릭
6. 재배포 트리거: 프로젝트 메인 페이지에서 "Deployments" 탭 > 최신 배포 > "Redeploy"

## 6단계: 로컬 테스트

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속 후:
1. 친구 페이지 (`/#/friends`) 이동
2. "친구 초대" 버튼 클릭
3. 초대 코드가 생성되는지 확인

## 7단계: 배포

```bash
npm run build:preview
git add .
git commit -m "Add Firebase for friends feature"
git push
```

Vercel이 자동으로 배포합니다.

## 문제 해결

### "Firebase가 설정되지 않았습니다" 오류

- 환경 변수가 올바르게 설정되었는지 확인
- Vercel 환경 변수 설정 후 재배포 필요
- 브라우저 콘솔에서 `import.meta.env.VITE_FIREBASE_API_KEY` 확인

### Firestore 권한 오류

- Firebase Console > Firestore > 규칙 탭에서 보안 규칙 확인
- 위의 보안 규칙을 정확히 복사했는지 확인

### 초대 코드가 작동하지 않음

- Firestore Console에서 `invite_codes` 컬렉션 확인
- 만료 시간 확인 (24시간)
- 브라우저 콘솔에서 에러 메시지 확인

## 비용 절감 팁

Firebase 무료 플랜을 계속 사용하려면:

1. **Firestore 인덱스 최적화**: 불필요한 쿼리 줄이기
2. **만료된 초대 코드 정기 삭제**: Firebase Console에서 수동 삭제 또는 Cloud Function으로 자동화
3. **사용량 모니터링**: Firebase Console > 사용량 탭에서 주기적으로 확인

## 알림 기능

현재는 **로컬 알림**으로 구현되어 있습니다:
- 앱이 열려있을 때만 작동
- 브라우저 알림 권한 필요
- 1분마다 스케줄 확인

Firebase Cloud Messaging을 사용하면 백그라운드 알림도 가능하지만, Service Worker 설정이 추가로 필요합니다.

## 다음 단계

친구 기능이 정상 작동하면:
1. 친구들에게 초대 코드 공유
2. 서로의 진행 상황 확인
3. 함께 목표 달성!

질문이 있다면 GitHub Issues에 남겨주세요.
