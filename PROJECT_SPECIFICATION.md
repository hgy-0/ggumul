# 꾸물 (Ggumul) - 프로젝트 명세서

## 📋 프로젝트 개요

**프로젝트명**: 꾸물 (Ggumul)
**설명**: 5분 카운트다운 기반 습관 형성 웹 애플리케이션
**목적**: 완벽주의로 인한 미루기를 극복하고, 작은 시작을 통해 습관을 형성하도록 돕는 서비스
**배포 URL**: https://ggumul-app.vercel.app
**개발 기간**: 2025년 1월 ~ 2월

---

## 🎯 핵심 컨셉

### "5분만 해보자"

- 완벽하게 하려다가 아예 시작하지 못하는 사람들을 위한 앱
- 5분 카운트다운으로 부담 없이 시작할 수 있도록 유도
- 실패해도 괜찮다는 메시지로 심리적 부담 감소
- 연속 성공 시 부활 카드 지급으로 동기 부여

### Duolingo의 습관 형성 메커니즘 적용

- **Streak (연속 성공일)**: 매일 성공 시 연속일 증가
- **부활 카드**: 7일 연속 성공 시 1장 지급, 실패 시 사용 가능
- **친구 기능**: 친구들의 현황을 보며 동기 부여
- **통계 대시보드**: 성공률, 주간 그래프 등 시각화

---

## 🏗️ 기술 스택

### Frontend

- **Framework**: React 18.3 + TypeScript
- **Routing**: React Router v6 (HashRouter)
- **상태 관리**: Zustand
- **스타일링**: Tailwind CSS
- **빌드 도구**: Vite 5.4
- **배포**: Vercel
- **PWA**: Vite PWA Plugin (Service Worker, Manifest)

### Backend (선택적)

- **Framework**: FastAPI (Python)
- **Database**: SQLite
- **ORM**: SQLAlchemy
- **배포**: 로컬 개발 환경 (미배포)

### Firebase (친구 기능용)

- **Authentication**: Google OAuth
- **Firestore**: 친구 관계, 초대 코드, FCM 토큰 저장
- **Hosting**: Vercel (Firebase Hosting 미사용)

### 알림 시스템

- **방식**: 브라우저 Notification API (로컬 스케줄러)
- **체크 간격**: 30초
- **제약**: 앱이 열려있을 때만 작동

---

## 📱 주요 기능

### 1. 목표 관리

- **목표 생성**: 이름, 첫 행동, 카운트다운 시간 설정
- **알림 설정**: 요일별 알림 시간 설정 (여러 시간대 가능)
- **목표 수정/삭제**: 언제든지 수정 및 삭제 가능

### 2. 카운트다운 시스템

- **5분 타이머**: 시작 버튼 클릭 시 카운트다운 시작
- **중도 포기**: 타이머 진행 중 "나는 꾸물이야" 버튼으로 포기 가능
- **성공/실패 처리**:
  - 성공 시: Streak 증가, 애니메이션 표시
  - 실패 시: 실패 사유 선택, 부활 카드 사용 가능

### 3. Streak 및 부활 카드

- **현재 Streak**: 연속 성공일 표시
- **최고 Streak**: 역대 최고 기록 표시
- **부활 카드**: 7일 연속 성공 시 1장 지급
- **부활 카드 사용**: 실패 시 Streak 유지 가능

### 4. 통계 및 인사이트

- **성공률**: 전체 시도 대비 성공률
- **주간 그래프**: 최근 7일간 성공/실패 시각화
- **실패 원인 분석**: 요일별, 사유별 실패 패턴 분석
- **개선 팁**: AI가 분석한 맞춤형 조언

### 5. 친구 기능

- **초대 코드**: 24시간 유효한 고유 코드 생성
- **친구 추가**: 초대 코드로 친구 추가
- **친구 현황**: 친구들의 Streak, 성공률 확인
- **Google 로그인**: 다중 기기 동기화

### 6. 알림 시스템

- **로컬 알림**: 30초마다 설정한 시간 체크
- **브라우저 알림**: 설정한 시간에 알림 표시
- **알림 클릭**: 해당 목표 카운트다운 페이지로 이동

### 7. 테마

- **다크 모드**: 눈의 피로 감소
- **라이트 모드**: 밝은 환경에서 가독성 향상
- **자동 전환**: 시스템 설정에 따라 자동 전환

---

## 📂 프로젝트 구조

```
motivation/
├── backend/                      # FastAPI 백엔드 (선택적)
│   ├── app/
│   │   ├── main.py              # FastAPI 앱 진입점
│   │   ├── models.py            # SQLAlchemy 모델
│   │   ├── database.py          # DB 연결 설정
│   │   └── routers/             # API 라우터
│   └── motivation.db            # SQLite 데이터베이스
│
├── frontend/                     # React 프론트엔드
│   ├── src/
│   │   ├── components/          # 재사용 가능한 컴포넌트
│   │   │   ├── Layout.tsx       # 레이아웃 (헤더, 네비게이션)
│   │   │   ├── GoalCard.tsx     # 목표 카드
│   │   │   ├── StreakBadge.tsx  # Streak 뱃지
│   │   │   ├── RevivalCardBadge.tsx # 부활 카드 뱃지
│   │   │   ├── SuccessAnimation.tsx # 성공 애니메이션
│   │   │   ├── FailureModal.tsx # 실패 모달
│   │   │   ├── StatsDashboard.tsx # 통계 대시보드
│   │   │   ├── WeeklyBarChart.tsx # 주간 그래프
│   │   │   ├── FriendsList.tsx  # 친구 목록
│   │   │   ├── FriendInvite.tsx # 친구 초대
│   │   │   └── FriendAccept.tsx # 친구 수락
│   │   │
│   │   ├── pages/               # 페이지 컴포넌트
│   │   │   ├── Dashboard.tsx    # 메인 대시보드
│   │   │   ├── GoalForm.tsx     # 목표 생성/수정
│   │   │   ├── GoalDetail.tsx   # 목표 상세
│   │   │   ├── Countdown.tsx    # 카운트다운
│   │   │   ├── Result.tsx       # 성공/실패 결과
│   │   │   ├── Insights.tsx     # 인사이트
│   │   │   ├── Stats.tsx        # 통계
│   │   │   └── Friends.tsx      # 친구
│   │   │
│   │   ├── stores/              # Zustand 상태 관리
│   │   │   ├── goalStore.ts     # 목표 상태
│   │   │   └── themeStore.ts    # 테마 상태
│   │   │
│   │   ├── utils/               # 유틸리티 함수
│   │   │   ├── localStorage.ts  # localStorage 관리
│   │   │   ├── localNotifications.ts # 로컬 알림
│   │   │   ├── firebase.ts      # Firebase 초기화
│   │   │   ├── firebaseFriends.ts # 친구 기능
│   │   │   ├── firestoreGoals.ts # Firestore 목표 동기화
│   │   │   ├── fcm.ts           # FCM (미사용)
│   │   │   └── haptic.ts        # 햅틱 피드백
│   │   │
│   │   ├── api/                 # API 클라이언트
│   │   │   ├── client.ts        # Axios 인스턴스
│   │   │   ├── goals.ts         # 목표 API
│   │   │   ├── attempts.ts      # 시도 API
│   │   │   ├── stats.ts         # 통계 API
│   │   │   ├── insights.ts      # 인사이트 API
│   │   │   └── friends.ts       # 친구 API
│   │   │
│   │   ├── hooks/               # 커스텀 훅
│   │   │   ├── useAuth.ts       # Google 인증 훅
│   │   │   └── usePushSubscription.ts # 푸시 구독 (미사용)
│   │   │
│   │   ├── types/               # TypeScript 타입 정의
│   │   │   └── index.ts
│   │   │
│   │   ├── constants/           # 상수
│   │   │   └── date.ts          # 요일 상수
│   │   │
│   │   ├── App.tsx              # 앱 루트 컴포넌트
│   │   ├── main.tsx             # React 진입점
│   │   └── index.css            # 전역 스타일
│   │
│   ├── public/
│   │   ├── firebase-messaging-sw.js # Firebase Service Worker (미사용)
│   │   ├── icon-192.png         # PWA 아이콘
│   │   └── icon-512.png         # PWA 아이콘
│   │
│   ├── dist/                     # 빌드 결과물
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── functions/                    # Firebase Cloud Functions (미배포)
│   ├── index.js                 # 알림 스케줄러 함수
│   └── package.json
│
├── firebase.json                 # Firebase 설정
├── firestore.rules              # Firestore 보안 규칙
├── firestore.indexes.json       # Firestore 인덱스
│
└── README.md
```

---

## 🗄️ 데이터 모델

### 1. Goal (목표)

```typescript
interface Goal {
  id: number;
  name: string; // 목표 이름
  first_action: string; // 첫 행동
  countdown_seconds: number; // 카운트다운 시간 (초)
  current_streak: number; // 현재 연속 성공일
  best_streak: number; // 최고 연속 성공일
  revival_cards: number; // 부활 카드 개수
  today_success: boolean; // 오늘 성공 여부
  today_attempted: boolean; // 오늘 시도 여부
  notification_schedules?: Array<{
    // 알림 스케줄
    hour: number;
    minute: number;
    days: number[];
  }>;
}
```

### 2. Attempt (시도)

```typescript
interface Attempt {
  id: number;
  goal_id: number;
  attempted_date: string; // YYYY-MM-DD
  success: boolean;
  failure_reason?: string; // "너무 피곤해서" | "시간이 없어서" | "귀찮아서" | "기타"
  used_revival_card: boolean; // 부활 카드 사용 여부
}
```

### 3. Firestore Collections

#### fcm_tokens

```typescript
{
  user_id: string; // device_id 또는 Firebase UID
  token: string; // FCM 토큰
  updated_at: string; // ISO 8601
  device_info: {
    user_agent: string;
    platform: string;
  }
}
```

#### friends

```typescript
{
  device_id: string; // 친구 ID
  nickname: string; // 닉네임
  added_at: Timestamp; // 추가 시간
}
```

#### friendships

```typescript
{
  device_id_1: string; // 사용자 1 ID
  device_id_2: string; // 사용자 2 ID
  created_at: Timestamp; // 생성 시간
}
```

#### invite_codes

```typescript
{
  code: string; // 8자리 초대 코드
  device_id: string; // 생성자 ID
  expires_at: Timestamp; // 만료 시간 (24시간)
  created_at: Timestamp; // 생성 시간
}
```

#### devices

```typescript
{
  device_id: string; // 디바이스 ID
  nickname: string; // 닉네임
  last_active: Timestamp; // 마지막 활동 시간
}
```

---

## 🔄 주요 플로우

### 1. 목표 생성 플로우

```
1. 사용자가 "새 목표" 버튼 클릭
2. GoalForm 페이지로 이동
3. 목표 정보 입력:
   - 목표 이름
   - 첫 행동
   - 카운트다운 시간
   - 알림 스케줄 (선택)
4. "저장" 버튼 클릭
5. localStorage에 저장
6. Firestore에 동기화 (Firebase 설정 시)
7. Dashboard로 리다이렉트
```

### 2. 카운트다운 플로우

```
1. 사용자가 목표 카드의 "시작" 버튼 클릭
2. Countdown 페이지로 이동
3. 3초 준비 카운트다운
4. 메인 카운트다운 시작 (5분)
5. 사용자 선택:
   a. 타이머 완료 → 성공 처리 → Result 페이지
   b. "나는 꾸물이야" 클릭 → 실패 모달 표시
      - 실패 사유 선택
      - 부활 카드 사용 여부 선택
      - Result 페이지로 이동
```

### 3. Streak 계산 플로우

```
1. 시도 성공 시:
   - today_success = true
   - today_attempted = true
   - current_streak += 1
   - best_streak = max(best_streak, current_streak)
   - 7일 연속 성공 시 revival_cards += 1

2. 시도 실패 시:
   a. 부활 카드 사용:
      - revival_cards -= 1
      - used_revival_card = true
      - current_streak 유지
   b. 부활 카드 미사용:
      - current_streak = 0
      - used_revival_card = false

3. 매일 자정 (로컬):
   - 모든 목표의 today_success, today_attempted 초기화
```

### 4. 알림 플로우

```
1. 앱 시작 시:
   - 알림 권한 요청
   - 로컬 스케줄러 시작 (30초 간격)

2. 30초마다:
   - 현재 시간 체크
   - localStorage에서 알림 스케줄 조회
   - 현재 시간과 일치하는 목표 찾기
   - 브라우저 알림 표시

3. 알림 클릭 시:
   - 해당 목표의 Countdown 페이지로 이동
```

---

## 🎨 디자인 가이드

### 색상 팔레트 (다크 모드)

- **배경**: `#0F172A` (slate-900)
- **서페이스**: `#1E293B` (slate-800)
- **텍스트**: `#F1F5F9` (slate-100)
- **Primary**: `#3B82F6` (blue-500)
- **Success**: `#10B981` (green-500)
- **Danger**: `#EF4444` (red-500)

### 타이포그래피

- **폰트**: Pretendard Variable, Inter
- **제목**: 24px, Bold
- **본문**: 16px, Regular
- **캡션**: 14px, Regular

### 애니메이션

- **성공**: 3D 회전 카드 애니메이션 + 파티클 효과
- **버튼**: hover 시 scale(1.05), active 시 scale(0.95)
- **모달**: slide-up 애니메이션

---

## 🔒 보안

### Firestore 보안 규칙

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /friends/{friendId} {
      allow read, write: if true;
    }
    match /friendships/{friendshipId} {
      allow read, write: if true;
    }
    match /invite_codes/{code} {
      allow read, write: if true;
    }
    match /devices/{deviceId} {
      allow read, write: if true;
    }
    match /fcm_tokens/{userId} {
      allow read, write: if true;
    }
    match /goals/{goalId} {
      allow read, write: if true;
    }
  }
}
```

**주의**: 현재 모든 사용자에게 읽기/쓰기 권한이 열려있음. 프로덕션에서는 인증 기반으로 변경 필요.

---

## 🚀 배포

### 프론트엔드 (Vercel)

1. **빌드 명령어**: `cd frontend && npm run build`
2. **출력 디렉토리**: `frontend/dist`
3. **환경 변수**:
   ```
   VITE_SINGLE_FILE=true
   VITE_FIREBASE_API_KEY=AIzaSyDyqv2s0k5v1oqgXGD261Z0DcCpASOPdT4
   VITE_FIREBASE_AUTH_DOMAIN=ggumul-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=ggumul-app
   VITE_FIREBASE_STORAGE_BUCKET=ggumul-app.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=990747737980
   VITE_FIREBASE_APP_ID=1:990747737980:web:c5f40c6e3da595549f6ef9
   VITE_VAPID_PUBLIC_KEY=BMIJrKBc5jN7g-w_7rO1ussjsv2zSCMxNRmJAIfnZOxtj5-IPlESlHn9SzrmksdbOdv4QhD7-tOAv5v0K6iQUWo
   ```

### 백엔드 (미배포)

- 로컬 개발 환경에서만 사용
- SQLite 데이터베이스
- 필요 시 Railway, Render 등에 배포 가능

---

## 📊 성능 최적화

### 빌드 최적화

- **코드 스플리팅**: React Router 기반 라우트별 분리
- **이미지 최적화**: WebP 형식, lazy loading
- **CSS 최적화**: Tailwind CSS의 PurgeCSS

### 런타임 최적화

- **메모이제이션**: React.memo, useMemo, useCallback 사용
- **가상화**: 긴 목록에 대한 가상 스크롤링 (필요 시)
- **디바운싱**: 검색, 입력 등에 디바운스 적용

---

## 🧪 테스트

### 수동 테스트 체크리스트

- [ ] 목표 생성/수정/삭제
- [ ] 카운트다운 시작/완료/포기
- [ ] Streak 증가/감소
- [ ] 부활 카드 획득/사용
- [ ] 알림 수신
- [ ] 친구 추가/목록 조회
- [ ] Google 로그인/로그아웃
- [ ] 통계 대시보드
- [ ] 인사이트 생성
- [ ] 다크/라이트 모드 전환

### 브라우저 호환성

- ✅ Chrome 90+
- ✅ Safari 14+
- ✅ Firefox 88+
- ✅ Edge 90+

---

## 🐛 알려진 이슈

### 1. 알림 제약

- **문제**: 앱이 닫혀있을 때 알림이 오지 않음
- **원인**: 브라우저 제약 (백그라운드 실행 불가)
- **해결 방법**: Firebase Cloud Functions + Cloud Scheduler (유료)

### 2. localStorage 용량 제한

- **문제**: 약 5-10MB 용량 제한
- **영향**: 시도 기록이 많아지면 용량 초과 가능
- **해결 방법**: 주기적으로 오래된 데이터 삭제 (3개월 이상)

### 3. 다중 기기 동기화

- **문제**: localStorage는 기기별로 독립적
- **영향**: 다른 기기에서 동일한 데이터 접근 불가
- **해결 방법**: Google 로그인 사용 + Firestore 동기화

---

## 📈 향후 개선 사항

### 단기 (1개월)

- [ ] PWA 오프라인 지원 개선
- [ ] 알림 스케줄 다중 시간대 지원
- [ ] 목표 카테고리 추가 (운동, 공부, 독서 등)
- [ ] 성공/실패 통계 차트 개선

### 중기 (3개월)

- [ ] 소셜 기능 강화 (댓글, 좋아요)
- [ ] 리더보드 (주간/월간 랭킹)
- [ ] 배지 시스템 (업적)
- [ ] 커스텀 테마

### 장기 (6개월)

- [ ] 네이티브 앱 (React Native)
- [ ] AI 기반 목표 추천
- [ ] 커뮤니티 기능
- [ ] 프리미엄 플랜 (무제한 목표, 고급 통계)

---

## 💰 비용 분석

### 현재 비용 (무료)

- **Vercel**: 무료 (Hobby Plan)
- **Firebase**: 무료 (Spark Plan)
- **총 비용**: **0원/월**

### 예상 비용 (사용자 100명 기준)

- **Vercel**: 무료 (월 100GB 대역폭)
- **Firebase**:
  - Firestore: 무료 (1GB 저장소, 50,000 읽기/일)
  - Authentication: 무료
- **Cloud Functions (선택)**: ~$5/월
- **총 비용**: **0-5원/월**

---

## 📞 연락처

- **개발자**: 홍가영
- **이메일**: utube.gayoung@gmail.com
- **GitHub**: https://github.com/robin-young0/ggumul-app

---

## 📝 라이선스

이 프로젝트는 개인 프로젝트이며, 상업적 사용을 금지합니다.

---

## 🙏 감사의 말

- **Duolingo**: Streak 시스템 영감
- **React 커뮤니티**: 훌륭한 도구와 라이브러리
- **Claude AI**: 개발 전반에 걸친 지원

---

**마지막 업데이트**: 2025년 2월 27일
