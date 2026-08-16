# 꾸물 앱 - 듀얼 모드 아키텍처

## 개요

이 앱은 **두 가지 모드**로 동작합니다:

1. **프로덕션 모드** (백엔드 + PostgreSQL/SQLite)
   - 실제 서비스 배포용
   - FastAPI 백엔드 + React 프론트엔드
   - 사용자 간 친구 기능, 랭킹 등 소셜 기능 지원
   - 서버 필요

2. **로컬 모드** (localStorage only)
   - 개발/테스트용
   - 싱글파일 HTML로 배포 가능
   - 백엔드 없이 브라우저에서만 동작
   - 서버 불필요, 오프라인 동작

---

## 현재 상태

> **2026-08-16 업데이트**: 아래 "남은 작업"은 사실상 완료됨.
> - 전 API(`goals`/`attempts`/`insights`/`notifications`/`stats`/`friends`/`devices`) 로컬 분기 완료
> - `utils/dataService.ts`가 인증 여부로 localStorage ↔ Firestore 자동 라우팅 (로그인 시 일회성 마이그레이션 포함) — 아키텍처가 "싱글파일 env 분기"에서 "게스트/로그인 듀얼 모드"로 확장됨
> - 전체 플로우 테스트: `frontend`에서 `npm run test:guest` (스모크 13케이스, 목표 CRUD·streak·부활카드·면제 검증)

### ✅ 완료된 작업

1. **싱글파일 빌드 시스템** (`SINGLEFILE_PREVIEW_BUILD.md` 참고)
   - `npm run build:preview` → `dist-preview/index.html` 생성 (localStorage 모드)
   - `npm run build` → `dist/` 생성 (프로덕션 모드, 백엔드 연결)
   - HashRouter 사용으로 `file://` 프로토콜 지원
   - PWA/Service Worker 비활성화

2. **localStorage 기반 데이터 저장소** (`src/utils/localStorage.ts`)
   - `localGoals`: 목표 CRUD
   - `localAttempts`: 시도 기록 CRUD
   - `calculateStreak`: 스트릭 계산 로직
   - `getTopPriorityGoalId`: 우선순위 계산 로직
   - `initializeSampleData`: 샘플 데이터 초기화

3. **Goals API localStorage 분기** (`src/api/goals.ts`)
   - `VITE_SINGLE_FILE` 환경변수로 분기
   - localStorage 모드에서 `buildGoalResponse()` 로 서버 응답과 동일한 형태 반환
   - `getGoals`, `getGoal`, `createGoal`, `updateGoal`, `deleteGoal`, `getGoalStats` 모두 분기 처리 완료

4. **Attempts API localStorage 분기** (`src/api/attempts.ts`)
   - `createAttempt`: 시도 기록 생성, 7일 연속 성공 시 부활 카드 지급
   - `useRevivalCard`: 부활 카드 사용

5. **초기 데이터 설정** (`src/main.tsx`)
   - localStorage 모드에서 샘플 목표 자동 생성
   - 운동하기, 독서하기, 물 마시기 3개 기본 목표

### ⏳ 남은 작업

1. **기타 API localStorage 분기** (선택적)
   - `insights.ts` - 인사이트 데이터
   - `notifications.ts` - 푸시 알림 (로컬 모드에서는 비활성화)
   - `stats.ts` - 전체 통계
   - `friends.ts` - 친구 기능 (로컬 모드에서는 비활성화 또는 목업)
   - `devices.ts` - 기기 등록

3. **로컬 모드 초기 데이터 생성**
   - 빈 상태에서 시작하면 아무것도 안 보이므로 샘플 데이터 제공 옵션

4. **테스트**
   - 로컬 모드에서 전체 플로우 테스트
   - 목표 생성 → 카운트다운 → 성공/실패 → 부활 카드 → 통계

5. **문서화**
   - 개발자 가이드: 새 API 추가 시 분기 처리 방법
   - 사용자 가이드: 두 모드의 차이점 설명

---

## 아키텍처 설계

### 환경변수 기반 분기

```typescript
// VITE_SINGLE_FILE이 설정되면 로컬 모드
const isLocalMode = !!import.meta.env.VITE_SINGLE_FILE;
```

**빌드 전략:**
- **로컬/테스트 모드**: `npm run build:preview` → localStorage 사용, 백엔드 불필요
  - `VITE_SINGLE_FILE=true` 환경변수 설정
  - `dist-preview/index.html` 생성 (싱글파일)
  - 개발 중 모바일 테스트용

- **프로덕션 모드**: `npm run build` → 백엔드 API 연결
  - 환경변수 없음 (일반 빌드)
  - `dist/` 폴더에 빌드 결과물 생성
  - 실제 서비스 배포용

### 데이터 흐름

#### 프로덕션 모드
```
React Component
  ↓ (API call)
src/api/goals.ts
  ↓ (axios)
FastAPI Backend
  ↓ (SQLAlchemy)
PostgreSQL/SQLite
```

#### 로컬 모드
```
React Component
  ↓ (API call)
src/api/goals.ts
  ↓ (분기: VITE_SINGLE_FILE)
src/utils/localStorage.ts
  ↓
Browser localStorage
```

### API 분기 패턴

```typescript
// src/api/goals.ts 예시
export async function getGoals(): Promise<Goal[]> {
  // 로컬 모드: localStorage에서 읽기
  if (import.meta.env.VITE_SINGLE_FILE) {
    const storedGoals = localGoals.getAll().filter(g => g.is_active);
    return storedGoals.map(g => buildGoalResponse(g)!).filter(Boolean);
  }

  // 프로덕션 모드: 백엔드 API 호출
  const { data } = await client.get<Goal[]>('/goals');
  return data;
}
```

**핵심 원칙:**
1. 함수 시그니처는 동일하게 유지 (반환 타입 `Promise<Goal[]>`)
2. 로컬 모드에서도 서버 응답과 동일한 형태의 데이터 반환
3. 컴포넌트 코드는 수정 불필요

---

## 파일 구조

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts           # axios 인스턴스 (프로덕션용)
│   │   ├── goals.ts            # ✅ localStorage 분기 완료
│   │   ├── attempts.ts         # 🚧 분기 필요
│   │   ├── insights.ts         # ⏳ 분기 필요 (선택)
│   │   ├── notifications.ts    # ⏳ 분기 필요 (선택)
│   │   ├── stats.ts            # ⏳ 분기 필요 (선택)
│   │   ├── friends.ts          # ⏳ 분기 필요 (선택)
│   │   └── devices.ts          # ⏳ 분기 필요 (선택)
│   │
│   ├── utils/
│   │   └── localStorage.ts     # ✅ localStorage 저장소
│   │
│   ├── main.tsx                # ✅ HashRouter/BrowserRouter 분기
│   └── vite-env.d.ts           # ✅ VITE_SINGLE_FILE 타입 선언
│
├── vite.config.ts              # ✅ viteSingleFile 플러그인 분기
├── package.json                # ✅ build:preview 스크립트
└── dist-preview/               # 빌드 결과물
    └── index.html              # 싱글파일 HTML
```

---

## 개발 가이드

### 1. 새 API 함수 추가 시

**백엔드 API를 호출하는 새 함수를 추가할 때:**

```typescript
// src/api/example.ts

export async function getExample(): Promise<ExampleData> {
  // 1️⃣ 로컬 모드 분기 추가
  if (import.meta.env.VITE_SINGLE_FILE) {
    // localStorage에서 데이터 읽기
    const data = localExample.getAll();
    return data;
  }

  // 2️⃣ 프로덕션 모드: 백엔드 호출
  const { data } = await client.get<ExampleData>('/example');
  return data;
}
```

**체크리스트:**
- [ ] `if (import.meta.env.VITE_SINGLE_FILE)` 분기 추가
- [ ] localStorage 로직 구현 (`src/utils/localStorage.ts`)
- [ ] 반환 타입이 서버 응답과 동일한지 확인
- [ ] 에러 처리 (localStorage에서 데이터 없을 때)

### 2. localStorage 저장소 확장

**새 데이터 타입 추가 시:**

```typescript
// src/utils/localStorage.ts

const STORAGE_KEYS = {
  GOALS: 'ggumul_goals',
  ATTEMPTS: 'ggumul_attempts',
  NEW_DATA: 'ggumul_new_data', // 추가
} as const;

export const localNewData = {
  getAll(): NewData[] {
    return getFromStorage<NewData[]>(STORAGE_KEYS.NEW_DATA, []);
  },

  create(data: CreateNewData): NewData {
    const items = this.getAll();
    const newItem: NewData = {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString(),
    };
    items.push(newItem);
    setToStorage(STORAGE_KEYS.NEW_DATA, items);
    return newItem;
  },

  // ... CRUD 메서드
};
```

### 3. 빌드 및 테스트

#### 로컬 모드 빌드
```bash
npm run build:preview
```

#### 테스트 방법
1. `dist-preview/index.html`을 더블클릭
2. 또는 휴대폰으로 파일 전송 후 열기
3. DevTools 콘솔에서 localStorage 확인:
   ```javascript
   localStorage.getItem('ggumul_goals')
   localStorage.getItem('ggumul_attempts')
   ```

#### 프로덕션 모드 빌드
```bash
npm run build
```

---

## 데이터 모델

### localStorage 스키마

#### Goals
```typescript
interface StoredGoal {
  id: number;
  device_id: string;
  name: string;
  first_action: string;
  countdown_seconds: number;
  revival_cards: number;
  is_active: boolean;
  notification_schedules: any[];
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}
```

**저장 위치:** `localStorage.ggumul_goals` (JSON 배열)

#### Attempts
```typescript
interface StoredAttempt {
  id: number;
  goal_id: number;
  attempted_date: string; // YYYY-MM-DD
  success: boolean;
  failure_reason?: FailureReason;
  failure_memo?: string;
  used_revival: boolean;
  created_at: string; // ISO 8601
}
```

**저장 위치:** `localStorage.ggumul_attempts` (JSON 배열)

---

## 로직 구현 상세

### Streak 계산 (`calculateStreak`)

**백엔드 로직을 프론트엔드로 복제:**

```typescript
export function calculateStreak(goalId: number): { current: number; best: number } {
  const attempts = localAttempts.getByGoalId(goalId)
    .filter(a => a.success)
    .sort((a, b) => b.attempted_date.localeCompare(a.attempted_date));

  if (attempts.length === 0) return { current: 0, best: 0 };

  const today = new Date().toISOString().split('T')[0];
  let current = 0;
  let checkDate = new Date(today);

  // 현재 스트릭: 오늘부터 역순으로 연속 성공 일수
  for (const attempt of attempts) {
    const attemptDate = attempt.attempted_date;
    const expectedDate = checkDate.toISOString().split('T')[0];

    if (attemptDate === expectedDate) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // 최고 스트릭: 전체 기록에서 가장 긴 연속 일수
  // ... (구현 생략, localStorage.ts 참고)

  return { current, best };
}
```

### 우선순위 계산 (`getTopPriorityGoalId`)

**간소화된 버전:**

```typescript
export function getTopPriorityGoalId(goals: StoredGoal[]): number | null {
  const today = new Date().toISOString().split('T')[0];

  // 오늘 완료 안 한 목표 필터링
  const incomplete = goals.filter(g => {
    const todayAttempt = localAttempts.getByDate(g.id, today);
    return g.is_active && (!todayAttempt || !todayAttempt.success);
  });

  if (incomplete.length === 0) return null;

  // 스트릭이 가장 높은 목표 반환
  const withStreak = incomplete.map(g => ({
    goal: g,
    streak: calculateStreak(g.id).current,
  }));

  withStreak.sort((a, b) => b.streak - a.streak);
  return withStreak[0].goal.id;
}
```

**참고:** 백엔드의 복잡한 우선순위 공식(streak_score * 0.4 + urgency_score * 0.3 + ...)은 로컬 모드에서 간소화됨. 필요 시 백엔드와 동일하게 구현 가능.

---

## 주의사항

### 1. localStorage 용량 제한

- **브라우저 제한:** 일반적으로 5-10MB
- **현재 예상 사용량:**
  - 목표 10개 × 1KB = 10KB
  - 시도 기록 365일 × 10개 × 0.5KB = 1.8MB
  - **총합:** 약 2MB (여유 있음)

**초과 시 대응:**
- 오래된 시도 기록 자동 삭제 (1년 이상)
- IndexedDB로 마이그레이션

### 2. 데이터 동기화 없음

로컬 모드는 **기기별 독립 저장소**입니다:
- 휴대폰 A와 휴대폰 B는 데이터 공유 안 됨
- 브라우저 캐시 삭제 시 데이터 손실
- **백업 기능 필요** (로컬 모드에서 JSON export/import)

### 3. 프로덕션 모드와 차이

| 기능 | 프로덕션 | 로컬 |
|------|---------|------|
| 친구 기능 | ✅ | ❌ (목업 또는 비활성화) |
| 푸시 알림 | ✅ | ❌ (비활성화) |
| 랭킹 | ✅ | ❌ (비활성화) |
| 데이터 백업 | ✅ (서버) | ⚠️ (수동 export) |
| 기기 간 동기화 | ✅ | ❌ |

---

## 배포 전략

### 프로덕션 배포

1. **백엔드 배포** (Railway / Render / AWS)
   ```bash
   cd backend
   # 환경변수 설정: DATABASE_URL, VAPID_KEYS 등
   # Dockerfile 빌드 또는 직접 배포
   ```

2. **프론트엔드 배포** (Vercel / Netlify / Cloudflare Pages)
   ```bash
   cd frontend
   npm run build
   # dist/ 폴더를 정적 호스팅 서비스에 업로드
   # 환경변수: VITE_API_URL=https://api.ggumul.com
   ```

### 로컬 모드 배포

1. **싱글파일 빌드**
   ```bash
   cd frontend
   npm run build:preview
   ```

2. **배포 방법:**
   - GitHub Pages에 `dist-preview/index.html` 업로드
   - 또는 파일 직접 공유 (Slack, Notion, Google Drive)

---

## 다음 단계

### 우선순위 1: Attempts API 분기 완료

**파일:** `src/api/attempts.ts`

```typescript
export async function createAttempt(goalId: number, payload: AttemptCreate) {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const attempt = localAttempts.create(goalId, payload);

    // 연속 7일 성공 시 부활 카드 지급
    const { current } = calculateStreak(goalId);
    if (current > 0 && current % 7 === 0) {
      const goal = localGoals.getById(goalId);
      if (goal) {
        localGoals.update(goalId, {
          revival_cards: goal.revival_cards + 1,
        });
      }
    }

    return attempt;
  }

  const { data } = await client.post(`/goals/${goalId}/attempts`, payload);
  return data;
}

export async function useRevivalCard(goalId: number, attemptedDate: string) {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const success = localAttempts.useRevival(goalId, attemptedDate);
    if (!success) {
      throw new Error('부활 카드를 사용할 수 없습니다.');
    }
    return { message: '부활 카드가 사용되었습니다.' };
  }

  const { data } = await client.put(`/goals/${goalId}/revival`, {
    attempted_date: attemptedDate,
  });
  return data;
}
```

### 우선순위 2: 초기 데이터 생성

**로컬 모드에서 빈 화면 방지:**

```typescript
// src/utils/localStorage.ts

export function initializeSampleData(): void {
  if (localGoals.getAll().length > 0) return; // 이미 데이터 있으면 스킵

  // 샘플 목표 생성
  const sampleGoals = [
    { name: '운동하기', first_action: '운동복 챙기기', countdown_seconds: 300 },
    { name: '독서하기', first_action: '책 펼치기', countdown_seconds: 180 },
  ];

  sampleGoals.forEach(g => localGoals.create(g));
}
```

**호출 위치:** `src/main.tsx`

```typescript
if (import.meta.env.VITE_SINGLE_FILE) {
  initializeSampleData();
}
```

### 우선순위 3: 테스트

- [ ] 목표 생성 → localStorage 저장 확인
- [ ] 카운트다운 → 성공/실패 기록
- [ ] 스트릭 계산 정확도
- [ ] 부활 카드 사용
- [ ] 7일 연속 성공 시 부활 카드 지급
- [ ] 목표 수정/삭제
- [ ] 통계 페이지

---

## 참고 문서

- `SINGLEFILE_PREVIEW_BUILD.md` - 싱글파일 빌드 가이드
- `src/utils/localStorage.ts` - localStorage 저장소 구현
- `src/api/goals.ts` - API 분기 예시
- `backend/app/routers/goals.py` - 백엔드 로직 참고

---

## 컨텍스트 handoff 요약

**현재 구현 상태:**
- ✅ 싱글파일 빌드 시스템 (preview=localStorage, build=production)
- ✅ localStorage 기반 저장소 완료
- ✅ Goals API 분기 완료
- ✅ Attempts API 분기 완료
- ✅ 샘플 데이터 초기화 완료
- ⏳ 기타 API 분기 필요 (선택적: friends, notifications 등)

**다음 작업자가 해야 할 일:**
1. 로컬 모드 end-to-end 테스트
   - 목표 생성 → 카운트다운 → 성공/실패 → 부활 카드 → 통계
   - 모바일 기기에서 `dist-preview/index.html` 테스트
2. 필요 시 나머지 API 분기 (friends, notifications 등)
3. 프로덕션/로컬 모드 동시 유지 관리
4. 백업/복원 기능 추가 (localStorage → JSON export/import)

**빌드 방법:**
- 테스트용 (localStorage): `npm run build:preview` → `dist-preview/index.html`
- 배포용 (백엔드): `npm run build` → `dist/`

**핵심 원칙:**
- 두 모드는 **완전히 독립적**으로 동작
- 컴포넌트는 **모드를 인식하지 않음**
- API 레이어에서 **투명하게 분기**
- localStorage 로직은 **백엔드 로직 복제**
