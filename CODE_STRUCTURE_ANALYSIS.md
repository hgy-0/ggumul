# 기존 코드 구조 분석

> 작성일: 2026-02-01
> 목적: 실시간 동료 현황판 기능 추가를 위한 기존 코드 구조 파악

---

## 📂 백엔드 구조

### 아키텍처
- **프레임워크**: FastAPI (Python)
- **ORM**: SQLAlchemy 2.0 (async)
- **DB**: SQLite (로컬), PostgreSQL 전환 가능
- **인증**: `X-Device-Id` 헤더 기반 (device_id로 사용자 식별)

### 디렉토리 구조
```
backend/
├── app/
│   ├── main.py              # 진입점, 라우터 등록, CORS, 미들웨어
│   ├── config.py            # 설정 (DATABASE_URL, CORS_ORIGINS, VAPID)
│   ├── database.py          # 비동기 엔진, 세션, Base 클래스
│   ├── scheduler.py         # APScheduler (알림 발송 스케줄링)
│   │
│   ├── models/              # SQLAlchemy 모델
│   │   ├── device.py        # Device (device_id 저장)
│   │   ├── goal.py          # Goal (목표)
│   │   ├── attempt.py       # Attempt (시도 기록)
│   │   ├── subscription.py  # PushSubscription (푸시 구독)
│   │   └── notification_schedule.py
│   │
│   ├── schemas/             # Pydantic 스키마 (요청/응답)
│   │   ├── attempt.py
│   │   ├── insight.py
│   │   └── notification.py
│   │
│   ├── routers/             # API 라우터
│   │   ├── goals.py         # 목표 CRUD
│   │   ├── attempts.py      # 시도 기록
│   │   ├── streaks.py       # Streak 조회
│   │   ├── insights.py      # 실패 패턴 분석
│   │   ├── revival.py       # 부활 카드
│   │   └── notifications.py # 푸시 알림
│   │
│   └── services/            # (현재 없음 — 비즈니스 로직은 라우터에 직접)
│
├── requirements.txt
└── Dockerfile
```

### 현재 DB 스키마

#### `devices`
```sql
CREATE TABLE devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT(64) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `goals`
```sql
CREATE TABLE goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT(64) NOT NULL,  -- FK to devices.device_id
    name TEXT(100) NOT NULL,
    first_action TEXT(200) NOT NULL,
    countdown_seconds INTEGER DEFAULT 300,
    revival_cards INTEGER DEFAULT 0,  -- 최대 3
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(device_id)
);
```

#### `attempts`
```sql
CREATE TABLE attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    attempted_date DATE NOT NULL,
    success BOOLEAN NOT NULL,
    failure_reason TEXT(20),  -- 'tired', 'forgot', 'no_time', 'lazy', 'other'
    failure_memo TEXT,
    used_revival BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id),
    UNIQUE (goal_id, attempted_date)
);
```

#### `push_subscriptions`
```sql
CREATE TABLE push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(device_id)
);
```

#### `notification_schedules`
```sql
CREATE TABLE notification_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    scheduled_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);
```

### 인증 방식
- **미들웨어**: `device_id_middleware` (main.py:54)
  - 모든 `/api` 요청에서 `X-Device-Id` 헤더 확인
  - 없으면 자동으로 `devices` 테이블에 등록
- **사용자 식별**: `device_id` = 사용자 ID (OAuth 없음)

### API 라우터 구조
```python
# app/main.py
app.include_router(goals.router)
app.include_router(attempts.router)
app.include_router(streaks.router)
app.include_router(insights.router)
app.include_router(notifications.router)
app.include_router(revival.router)
```

모든 라우터는 `prefix="/api"` 자동 적용 없음 — 각 라우터에서 수동 지정 필요

---

## 📂 프론트엔드 구조

### 아키텍처
- **프레임워크**: React 18 + TypeScript + Vite
- **상태 관리**: Zustand
- **라우팅**: React Router v6
- **스타일링**: Tailwind CSS
- **HTTP**: Axios

### 디렉토리 구조
```
frontend/
├── src/
│   ├── main.tsx              # 진입점
│   ├── App.tsx               # 라우터 설정
│   │
│   ├── pages/                # 페이지 컴포넌트
│   │   ├── Dashboard.tsx     # 홈 (목표 목록)
│   │   ├── GoalForm.tsx      # 목표 등록/수정
│   │   ├── Countdown.tsx     # 카운트다운 화면
│   │   ├── Result.tsx        # 결과 확인 (성공/실패)
│   │   └── Insights.tsx      # 인사이트 (패턴 분석)
│   │
│   ├── components/           # 재사용 컴포넌트
│   │   ├── Layout.tsx        # 공통 레이아웃
│   │   ├── GoalCard.tsx      # 목표 카드
│   │   ├── Timer.tsx         # 타이머
│   │   ├── StreakBadge.tsx   # Streak 뱃지
│   │   ├── RevivalCardBadge.tsx
│   │   ├── SuccessAnimation.tsx
│   │   ├── FailureModal.tsx
│   │   ├── RevivalModal.tsx
│   │   ├── InsightChart.tsx
│   │   ├── NotificationSettings.tsx
│   │   └── NotificationGuide.tsx
│   │
│   ├── stores/               # Zustand 스토어
│   │   ├── goalStore.ts      # 목표 목록, CRUD
│   │   └── timerStore.ts     # 타이머 상태
│   │
│   ├── api/                  # API 클라이언트
│   │   ├── client.ts         # Axios 인스턴스 (자동으로 X-Device-Id 추가)
│   │   ├── goals.ts
│   │   ├── attempts.ts
│   │   ├── insights.ts
│   │   └── notifications.ts
│   │
│   ├── utils/
│   │   ├── deviceId.ts       # device_id 생성/저장 (localStorage)
│   │   └── dateUtils.ts
│   │
│   ├── types/
│   │   └── index.ts          # TypeScript 타입 정의
│   │
│   └── constants/
│       └── date.ts
│
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### API 클라이언트 (`src/api/client.ts`)
```typescript
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 모든 요청에 X-Device-Id 헤더 자동 추가
client.interceptors.request.use((config) => {
  config.headers['X-Device-Id'] = getDeviceId();
  return config;
});
```

### 라우팅 (`src/App.tsx`)
```typescript
<Routes>
  <Route element={<Layout />}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/goals/new" element={<GoalForm />} />
    <Route path="/goals/:id/edit" element={<GoalForm />} />
    <Route path="/goals/:id/countdown" element={<Countdown />} />
    <Route path="/goals/:id/result" element={<Result />} />
    <Route path="/goals/:id/insights" element={<Insights />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route>
</Routes>
```

### 홈 화면 (`Dashboard.tsx`)
- `useGoalStore`로 목표 목록 불러오기
- `GoalCard` 컴포넌트로 각 목표 표시
- 빈 상태: "아직 목표가 없어요" + "목표 등록하기" 버튼
- 상단에 간단한 인사 문구 (오늘 완료 수)

---

## 🔍 핵심 발견 사항

### 1. 백엔드 서비스 레이어 없음
- **현재**: 비즈니스 로직이 라우터에 직접 작성됨
- **문제**: 통계 계산 같은 복잡한 로직 추가 시 라우터가 비대해질 수 있음
- **해결**: `app/services/` 폴더 생성 후 `stats_service.py` 추가

### 2. 사용자 식별 방식
- **device_id** = 실질적 사용자 ID
- OAuth 없음, 기기별로 완전히 독립적
- **중요**: 통계 집계 시 `device_id` 기준으로 계산

### 3. 인증 미들웨어
- `main.py`의 `device_id_middleware`가 자동으로 디바이스 등록
- 프론트엔드에서 `X-Device-Id` 헤더만 보내면 자동 처리
- **통계 API에서도 동일한 방식 사용 가능**

### 4. 통계 계산 기반 데이터
- **attempts** 테이블이 핵심
  - `attempted_date`: 날짜별 집계 가능
  - `success`: True/False로 성공률 계산
  - `goal_id`: 목표별 통계
- **현재 집계 테이블 없음** → 새로 추가 필요 (daily_stats, user_stats)

### 5. 프론트엔드 상태 관리
- **Zustand** 사용 (Redux보다 간단)
- `goalStore`: 목표 목록 관리
- **새로운 statsStore 필요**: 통계 데이터 관리

### 6. Dashboard 통합 지점
- `src/pages/Dashboard.tsx` 77-83줄
  - 현재: 간단한 인사 문구만 표시
  - **추가 위치**: 인사 문구 위에 `<StatsDashboard />` 삽입

---

## ✅ 명세서와의 호환성 체크

| 항목 | 명세서 계획 | 기존 코드 | 호환성 | 비고 |
|------|------------|----------|--------|------|
| **DB 엔진** | SQLite/PostgreSQL | ✅ 동일 | ✅ | `database.py`에서 이미 지원 |
| **비동기 ORM** | SQLAlchemy async | ✅ 동일 | ✅ | `AsyncSession`, `async_session` 사용 |
| **새 테이블 추가** | `daily_stats`, `user_stats` | ❌ 없음 | ✅ | models에 추가하면 자동 생성 |
| **API prefix** | `/api/stats/...` | `/api` 자동 적용 안 됨 | ⚠️ | 라우터에서 `prefix="/api/stats"` 명시 필요 |
| **인증 방식** | `device_id` | ✅ 동일 | ✅ | 미들웨어 자동 처리 |
| **프론트 API 클라이언트** | Axios + 헤더 | ✅ 동일 | ✅ | `client.ts`에 이미 구현됨 |
| **컴포넌트 위치** | `components/StatsDashboard.tsx` | ❌ 없음 | ✅ | 새로 생성 |
| **Dashboard 통합** | 상단에 위젯 | ✅ 가능 | ✅ | 77줄 위에 삽입 |

---

## 🛠️ 구현 시 필요한 작업

### 백엔드
1. ✅ `app/services/` 폴더 생성
2. ✅ `app/services/stats_service.py` 추가 (비즈니스 로직)
3. ✅ `app/models/daily_stat.py` 추가
4. ✅ `app/models/user_stat.py` 추가
5. ✅ `app/models/__init__.py` 업데이트 (import 추가)
6. ✅ `app/routers/stats.py` 추가 (API 엔드포인트)
7. ✅ `app/main.py`에 라우터 등록

### 프론트엔드
1. ✅ `src/api/stats.ts` 추가
2. ✅ `src/components/StatsDashboard.tsx` 추가
3. ✅ `src/pages/Dashboard.tsx` 수정 (위젯 삽입)
4. ⚠️ (선택) `src/stores/statsStore.ts` 추가 (필요시)

### 기타
- DB 마이그레이션 불필요 (SQLAlchemy가 자동 생성)
- 환경변수 추가 불필요 (기존 설정 재사용)

---

## 📝 명세서 수정 사항

### 수정 필요
1. **API prefix**
   - 명세서: `/api/stats/today`
   - 실제 구현: 라우터에서 `prefix="/api/stats"` 명시 필요

2. **사용자 식별**
   - 명세서: `user_id`
   - 실제: `device_id` 사용 (일관성 유지)
   - 모델/API 응답에서 모두 `device_id`로 통일

3. **API 응답 필드명**
   - 명세서: `user_id`
   - 수정: `device_id`

### 명세서는 그대로 유지 가능
- DB 스키마
- 비즈니스 로직
- UI 구조
- 구현 순서

---

## 🎯 다음 단계

1. **명세서 미세 조정** (user_id → device_id)
2. **Phase 1 구현 시작**
   - Day 1: DB 모델 + 마이그레이션
   - Day 2: 백엔드 API
   - Day 3: 프론트엔드 UI

---

## 요약

✅ **기존 코드는 명세서와 거의 완벽하게 호환됨**
✅ **서비스 레이어만 추가하면 바로 구현 가능**
⚠️ **user_id → device_id 용어 통일 필요**
🚀 **구현 준비 완료!**
