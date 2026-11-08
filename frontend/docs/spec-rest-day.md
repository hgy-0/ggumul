# 면제일(휴식 모드) 기능 명세서

> 작성일: 2026-03-12
> 상태: 검토 대기

---

## 1. 개요

### 목적
정당한 사유(여행, 아픔 등)로 목표를 수행할 수 없는 날에 streak이 끊기는 것을 방지하여, 불합리한 좌절로 인한 사용자 이탈을 막는다.

### 핵심 원칙
- "꾸물거려도 괜찮아" 컨셉에 부합: 쉬는 것도 괜찮다는 메시지
- streak 긴장감은 유지: 월 3회 제한으로 남용 방지
- 부활 카드와 공존: 면제는 "사전 보호", 부활은 "사후 복구"

---

## 2. 용어 정의

| 용어 | 설명 |
|------|------|
| 면제일 (Rest Day) | 사용자가 선언한 쉬는 날. streak 계산에서 제외됨 |
| 면제 사유 (Exempt Reason) | 면제일을 선언할 때 선택하는 이유 카테고리 |
| 월간 면제 한도 | 캘린더 월(1일~말일) 기준 최대 3회 |

---

## 3. 적용 단위

**하루 전체 면제** — 면제를 선언하면 모든 목표가 일괄 면제됨. 단순하고 직관적.
추후 목표가 많아지면 목표별 개별 면제로 확장 가능.

---

## 4. 사용자 플로우

### 4-1. 진입점 A: 홈 카드 (주요 경로)

```
[홈 화면 — GoalCard]
┌─────────────────────────────────┐
│  🏃 운동                         │
│  운동복 꺼내기                    │
│                                  │
│  미완료  🔥 12일                  │
│                                  │
│         [😌 쉬기]  [▶ 시작]      │
└─────────────────────────────────┘
```

**"쉬기" 버튼 클릭 시 → 바텀시트 등장:**

```
┌─────────────────────────────────┐
│                                  │
│  오늘은 쉬어갈까요? 😌           │
│                                  │
│  ┌─────────────┐ ┌────────────┐ │
│  │ 🤒 아파요    │ │ ✈️ 여행 중  │ │
│  └─────────────┘ └────────────┘ │
│  ┌─────────────┐ ┌────────────┐ │
│  │ 👨‍👩‍👧 약속     │ │ 😌 쉬고싶어 │ │
│  └─────────────┘ └────────────┘ │
│  ┌──────────────────────────────┐│
│  │ 💬 다른 이유                  ││
│  └──────────────────────────────┘│
│                                  │
│  이번 달 남은 횟수: 2/3          │
│                                  │
│  [취소]         [오늘 쉬어가기]   │
│                                  │
└─────────────────────────────────┘
```

**면제 완료 후 GoalCard 상태 변경:**

```
┌─────────────────────────────────┐
│  🏃 운동                         │
│  운동복 꺼내기                    │
│                                  │
│  😌 쉬는 날  🔥 12일 (유지 중)   │
│                                  │
│  [취소하고 시작하기]              │
└─────────────────────────────────┘
```

### 4-2. 진입점 B: 목표 상세 메뉴 (보조)

```
GoalDetail → 메뉴(⋯) → "오늘 쉬기"
→ 동일한 바텀시트
```

- `today_attempted = true`인 경우(이미 시도함): 메뉴에서 "오늘 쉬기" 숨김
- `today_success = true`인 경우(이미 성공): 메뉴에서 "오늘 쉬기" 숨김

### 4-3. 진입점 C: 카운트다운 포기 시 (맥락적)

```
카운트다운 → "오늘은 쉴게요" 클릭
→ 타이머 일시정지
→ 선택지 바텀시트:

┌─────────────────────────────────┐
│                                  │
│  어떤 상황인가요?                 │
│                                  │
│  [다음에 할게요]                  │
│   → 실패로 기록돼요               │
│                                  │
│  [오늘은 사정이 있어요]           │
│   → streak이 유지돼요 (2/3 남음)  │
│                                  │
└─────────────────────────────────┘

"다음에 할게요" → 기존 FailureModal 플로우
"사정이 있어요" → 면제 사유 선택 → streak 유지 → 홈으로
```

### 4-4. 면제 횟수 소진 시

```
면제 시도 → 월 3회 모두 사용한 상태

┌─────────────────────────────────┐
│                                  │
│  이번 달 쉬기 횟수를              │
│  모두 사용했어요 😢               │
│                                  │
│  다음 달 1일에 다시 충전돼요      │
│                                  │
│  💎 부활 카드가 있다면            │
│  실패 후에도 복구할 수 있어요     │
│                                  │
│  [알겠어요]                       │
└─────────────────────────────────┘
```

- GoalCard의 "쉬기" 버튼: 비활성화 + "이번 달 소진" 툴팁
- 카운트다운의 "사정이 있어요": 비활성화 상태로 표시

### 4-5. 면제 취소 (마음이 바뀌었을 때)

면제 선언 후 GoalCard에 "취소하고 시작하기" 링크가 표시됨.

```
"취소하고 시작하기" 클릭
→ 면제 취소 확인: "면제를 취소하고 시작할까요?"
→ 확인 시: 면제 기록 삭제 + 면제 횟수 복구 + 카운트다운 진입
```

---

## 5. 면제 사유 프리셋

| 코드 | 이모지 | 라벨 | 설명 |
|------|--------|------|------|
| `sick` | 🤒 | 아파요 | 몸이 안 좋을 때 |
| `travel` | ✈️ | 여행 중 | 여행/출장 |
| `appointment` | 👨‍👩‍👧 | 약속이 있어요 | 가족행사, 약속 등 |
| `rest` | 😌 | 쉬고 싶어요 | 특별한 이유 없이 휴식 |
| `other` | 💬 | 다른 이유 | 기타 (입력 없음, 카테고리만) |

> "쉬고 싶어요"를 포함하여 솔직한 선택지를 제공. 사유는 남용 방지가 아닌 **데이터 수집 목적**.

---

## 6. Streak 계산 로직 변경

### 현재 로직 (localStorage.ts:192-238)
```
오늘부터 역순으로 연속 성공일만 카운트.
하루라도 기록 없거나 실패 → streak 0.
```

### 변경 후 로직
```
오늘부터 역순으로 검사.
- 해당 날짜에 성공 기록 → streak +1, 계속
- 해당 날짜에 면제 기록 → streak 유지(+0), 건너뛰고 계속
- 해당 날짜에 실패/기록 없음 → streak 중단

예시:
  월(성공) - 화(면제) - 수(성공) - 목(성공)
  → 목요일 기준 current_streak = 3 (면제일은 카운트하지 않되 끊지도 않음)
```

### best_streak 계산도 동일 규칙 적용
면제일을 만나면 건너뛰고 전후를 연결.

### 부활 카드 7일 연속 지급 조건
면제일은 7일 연속 카운트에서 **제외**. 실제 행동한 7일이 필요.
```
예: 성공-성공-면제-성공-성공-성공-성공-성공 = 7일 성공 → 카드 지급
```

---

## 7. 데이터 모델 변경

### 7-1. 타입 추가/수정

```typescript
// 면제 사유 타입 (신규)
export type ExemptReason = 'sick' | 'travel' | 'appointment' | 'rest' | 'other';

// AttemptCreate 수정
export interface AttemptCreate {
  attempted_date: string;
  success: boolean;
  failure_reason?: FailureReason;
  // failure_memo 삭제
  use_revival?: boolean;
  is_exempt?: boolean;          // 신규
  exempt_reason?: ExemptReason; // 신규
}

// Goal 타입 수정
export interface Goal {
  // ... 기존 필드 유지
  today_exempt: boolean;              // 신규: 오늘 면제 여부
  monthly_exemptions_used: number;    // 신규: 이번 달 사용 횟수
}

// 상수
export const MONTHLY_EXEMPTION_LIMIT = 3;

// InsightData 수정
export interface InsightData {
  // ... 기존 필드 유지
  exempt_count: number;                      // 신규
  exempt_by_reason: Record<string, number>;  // 신규
}
```

### 7-2. localStorage StoredAttempt 수정

```typescript
interface StoredAttempt {
  id: number;
  goal_id: number;
  attempted_date: string;
  success: boolean;
  failure_reason?: string;
  // failure_memo 삭제
  used_revival?: boolean;
  is_exempt?: boolean;          // 신규
  exempt_reason?: string;       // 신규
}
```

---

## 8. API 변경

### 8-1. 면제일 선언
```
POST /goals/{goalId}/exempt
Body: { attempted_date: string, exempt_reason: ExemptReason }
Response: { message: string, monthly_exemptions_remaining: number }
```

localStorage 모드에서는 `localAttempts.create()`를 `is_exempt: true`로 호출.

### 8-2. 면제일 취소
```
DELETE /goals/{goalId}/exempt?date={YYYY-MM-DD}
Response: { message: string, monthly_exemptions_remaining: number }
```

localStorage 모드에서는 해당 날짜의 면제 기록 삭제.

### 8-3. 월간 면제 사용 현황
```
GET /exemptions/monthly
Response: { used: number, limit: number, remaining: number }
```

localStorage 모드에서는 이번 달 면제 기록을 직접 카운트.

---

## 9. 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/types/index.ts` | `ExemptReason` 타입 추가, `AttemptCreate`에서 `failure_memo` 삭제, `Goal`에 면제 필드 추가, `InsightData` 확장 |
| `src/components/GoalCard.tsx` | "쉬기" 버튼 추가, 면제 상태 UI, 면제 취소 링크 |
| `src/components/ExemptModal.tsx` | **신규** — 면제 사유 선택 바텀시트 |
| `src/components/FailureModal.tsx` | `failure_memo` textarea 삭제, 하드코딩 색상→시맨틱 토큰 |
| `src/pages/Countdown.tsx` | "오늘은 쉴게요" 클릭 시 분기 추가 (실패 vs 면제) |
| `src/pages/GoalDetail.tsx` | 메뉴에 "오늘 쉬기" 추가, 면제 상태 표시 |
| `src/pages/Result.tsx` | `failure_memo` 파라미터 제거 |
| `src/pages/Insights.tsx` | 면제 통계 섹션 추가, 패턴 분석 팁 강화 |
| `src/api/attempts.ts` | 면제 기록 생성/취소 API 함수 추가 |
| `src/api/insights.ts` | 면제 통계 계산 추가, 패턴 분석 팁 로직 강화 |
| `src/utils/localStorage.ts` | `StoredAttempt`에서 `failure_memo` 삭제, 면제 필드 추가, `calculateStreak` 면제일 건너뛰기 로직 |
| `src/stores/goalStore.ts` | 면제 관련 액션 추가 |

---

## 10. 인사이트 팁 강화

### 현재 팁 로직 (insights.ts)
- 성공률 50% 미만 → "목표를 더 작은 단위로 나눠보세요"
- 최다 실패 사유 3회 이상 → "'피곤' 문제를 먼저 해결해보세요"
- 최다 실패 요일 2회 이상 → "월요일에 특히 주의하세요"

### 추가할 팁
```
- 면제일 + 요일 교차분석:
  "3주 연속 월요일에 쉬었어요. 월요일은 쉬는 날로 설정해볼까요?"

- 실패 사유 + 시간대 분석:
  "'시간 부족'이 반복되네요. 알림 시간을 바꿔볼까요?"

- 면제 사용률:
  "이번 달 면제를 1번만 사용했어요. 필요할 때 편하게 쉬어도 괜찮아요."
  "이번 달 면제를 모두 사용했어요. 목표 난이도를 조정해볼까요?"

- streak 기반:
  "7일 넘게 이어가고 있어요! 이 페이스를 유지해보세요."
```

### "이렇게 해보세요" 박스 구성
```
┌─────────────────────────────────┐
│  💡 이렇게 해보세요              │
│                                  │
│  • '시간 부족'이 3번 반복됐어요.  │
│    알림 시간을 30분 앞당겨볼까요? │
│                                  │
│  • 화요일에 자주 실패하네요.      │
│    화요일 목표를 더 작게          │
│    조정해보는 건 어때요?          │
│                                  │
│  • 이번 달 면제를 1번 썼어요.     │
│    필요할 때 편하게 쉬어도 돼요.  │
└─────────────────────────────────┘
```

---

## 11. 제약 조건 & 엣지 케이스

| 케이스 | 처리 방식 |
|--------|----------|
| 이미 시도한 날(today_attempted=true)에 면제 시도 | 불가. "쉬기" 버튼 숨김. 이미 실패했다면 부활 카드 사용 |
| 이미 성공한 목표가 있는 날에 면제 | 성공한 목표는 유지, 미완료 목표만 면제 처리 |
| 면제 후 마음 바뀜 | "취소하고 시작하기"로 면제 취소 + 횟수 복구 + 카운트다운 진입 |
| 월말+월초 연속 면제 | 연속 면제 최대 2일 제한으로 방지 (월 경계와 무관하게 적용) |
| 면제일에 알림 | 면제 선언 후 해당 목표의 당일 알림은 더 이상 표시하지 않음 |
| 여러 목표 중 일부만 면제 (옵션 A) | MVP에서는 전체 면제. 추후 확장 |
| 면제일의 부활 카드 7일 카운트 | 면제일은 제외. 실제 성공 7일 필요 |

---

## 12. failure_memo 삭제 범위

### 삭제 대상
- `src/types/index.ts`: `AttemptCreate.failure_memo` 필드 삭제
- `src/utils/localStorage.ts`: `StoredAttempt.failure_memo` 필드 삭제, 관련 저장 로직 정리
- `src/components/FailureModal.tsx`: textarea UI 삭제, `memo` state 삭제, `onSubmit` 시그니처에서 memo 제거
- `src/pages/Result.tsx`: `handleFailure`에서 memo 파라미터 제거

### 기존 데이터
localStorage에 이미 저장된 failure_memo 데이터는 무시됨 (읽지 않으므로 영향 없음).

---

## 13. 구현 순서 (제안)

### Phase 1: 기반 작업
1. 타입 정의 변경 (types/index.ts)
2. failure_memo 삭제 (FailureModal, Result, localStorage, types)
3. localStorage 면제 기록 저장/조회 로직 (localStorage.ts)
4. calculateStreak 면제일 건너뛰기 로직

### Phase 2: UI 구현
5. ExemptModal 컴포넌트 (바텀시트)
6. GoalCard에 "쉬기" 버튼 + 면제 상태 UI
7. GoalDetail 메뉴에 "오늘 쉬기" 추가
8. Countdown 포기 시 분기 UI

### Phase 3: 인사이트 강화
9. insights.ts 면제 통계 + 패턴 분석 팁 로직
10. Insights.tsx 면제 통계 UI + 팁 강화

### Phase 4: 검증
11. 엣지 케이스 테스트
12. 배포

---

## 14. 확정된 결정사항

- [x] 적용 단위: **하루 전체** (모든 목표 일괄 면제)
- [x] 월간 면제 한도: **월 3회** (캘린더 월 기준)
- [x] 연속 면제 제한: **최대 2일 연속** (월 경계와 무관)
- [x] 구현 범위: **localStorage 모드 먼저** (서버 API는 추후)

## 15. 후속 작업: 서버 연결 (Firestore 전환)

> 면제일 기능 완성 후 반드시 진행할 것.

목표/시도 기록 등 모든 데이터를 Firebase Firestore에 저장하도록 전환.
- 구글 로그인과 데이터가 연동되어야 의미가 있음
- 친구 기능도 서버 없이는 제대로 동작 불가
- Firestore 무료 티어로 소규모 사용자 충분히 커버
