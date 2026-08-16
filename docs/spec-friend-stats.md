# 친구 실시간 통계 기능 명세서

> 작성일: 2026-03-13
> 상태: 검토 대기

---

## 1. 개요

### 목적
친구 카드에 표시되는 통계(오늘 달성, 연속 기록, 성공률)가 현재 하드코딩(항상 0)되어 있다. 실제 데이터를 반영하여 친구의 진행 상황을 볼 수 있게 한다.

### 핵심 원칙
- **최소 공개**: 상세 목표 내용은 비공개, 요약 통계만 공유
- **보안 유지**: 기존 `users/{uid}` 하위 데이터의 본인만 접근 규칙 유지
- **자동 업데이트**: 사용자가 목표를 달성/실패할 때 프로필 자동 갱신

---

## 2. 설계: 공개 프로필 컬렉션

### 왜 별도 컬렉션이 필요한가?
현재 보안 규칙상 `users/{uid}/goals`는 본인만 읽기 가능. 친구의 데이터를 직접 조회할 수 없으므로, 요약 통계를 공개 컬렉션에 저장한다.

### Firestore 데이터 구조

```
user_profiles/{userId}
{
  nickname: string | null,         // 표시 이름
  display_name: string | null,     // 구글 로그인 이름
  today_success: boolean,          // 오늘 목표 중 하나라도 달성했는지
  today_total: number,             // 오늘 활성 목표 수
  today_completed: number,         // 오늘 달성한 목표 수
  current_streak: number,          // 최장 연속 기록 (활성 목표 중)
  success_rate: number,            // 전체 성공률 (0~1)
  last_updated: Timestamp,         // 마지막 갱신 시각
}
```

### 보안 규칙

```
match /user_profiles/{userId} {
  allow read: if true;                                          // 누구나 읽기
  allow write: if request.auth != null && request.auth.uid == userId;  // 본인만 쓰기
}
```

---

## 3. 프로필 업데이트 시점

| 이벤트 | 업데이트 내용 |
|--------|-------------|
| 목표 달성 (성공) | `today_success`, `today_completed`, `current_streak`, `success_rate` |
| 목표 실패 | `success_rate` |
| 면제일 선언 | `today_success` (변경 없음, 면제는 성공/실패 아님) |
| 새 목표 생성 | `today_total` |
| 목표 삭제/비활성화 | `today_total`, `success_rate` 재계산 |
| 앱 진입 (날짜 변경) | `today_success: false`, `today_completed: 0` 초기화 |

### 업데이트 위치
`goalStore.ts`의 `fetchGoals()` 호출 후 — 목표 목록을 가져온 시점에서 프로필 통계를 계산하여 갱신.

---

## 4. 사용자 플로우 변화

### 변경 전 (현재)
```
친구 카드:
😴 가영이
아직 시작 안 했어요     ← 항상 이 상태
```

### 변경 후
```
친구 카드 — 오늘 달성한 경우:
🎉 가영이
오늘 목표 달성!

친구 카드 — 연속 기록 중:
💪 가영이
5일째 이어가는 중       성공률 85%

친구 카드 — 아직 미시작:
😴 가영이
아직 시작 안 했어요
```

---

## 5. 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/utils/firebaseFriends.ts` | `syncUserProfile()` 함수 추가, `getFriends()`에서 `user_profiles` 조회로 변경 |
| `src/stores/goalStore.ts` | `fetchGoals()` 후 `syncUserProfile()` 호출 추가 |
| `docs/firestore-rules.md` | `user_profiles` 컬렉션 보안 규칙 추가 |

### 변경하지 않는 파일
- `FriendsList.tsx` — 이미 `Friend` 타입의 `today_success`, `current_streak`, `success_rate`를 사용하고 있으므로 UI 변경 불필요
- `api/friends.ts` — `Friend` 타입 변경 없음

---

## 6. API 설계

### 6-1. 프로필 동기화 (쓰기)
```typescript
syncUserProfile(goals: Goal[]): Promise<void>
```
- 호출 시점: `fetchGoals()` 완료 후
- 로그인된 사용자만 실행
- 현재 목표 목록에서 통계 계산 → `user_profiles/{uid}` 문서 업데이트

### 6-2. 친구 프로필 조회 (읽기)
```typescript
getFriends(): Promise<Friend[]>
```
- 기존 friendships 쿼리로 친구 ID 목록 획득
- `user_profiles/{friendId}` 문서에서 통계 조회
- `devices/{friendId}` 대신 `user_profiles/{friendId}` 사용

---

## 7. 엣지 케이스

| 케이스 | 처리 방식 |
|--------|----------|
| 친구가 아직 프로필을 생성하지 않음 | 기존 `devices` 컬렉션 fallback, 통계는 기본값(0) |
| 날짜가 바뀌었지만 친구가 앱을 안 열음 | `last_updated` 날짜와 오늘 비교 → 다른 날이면 `today_success: false`로 간주 |
| 비로그인 사용자 | 프로필 동기화 건너뜀 (Firestore 규칙상 쓰기 불가) |
| 목표가 0개인 사용자 | `today_total: 0`, `success_rate: 0` |

---

## 8. 구현 순서

### Phase 1: 프로필 쓰기
1. `firebaseFriends.ts` — `syncUserProfile()` 함수 구현
2. `goalStore.ts` — `fetchGoals()` 후 프로필 동기화 호출
3. Firebase Console — 보안 규칙 추가

### Phase 2: 프로필 읽기
4. `firebaseFriends.ts` — `getFriends()`에서 `user_profiles` 조회로 변경

---

## 9. 확정된 결정사항

- [x] 방식: **공개 프로필 컬렉션** (`user_profiles/{userId}`)
- [x] 공개 범위: 요약 통계만 (목표 이름, 상세 내용은 비공개)
- [x] 업데이트 시점: `fetchGoals()` 후 자동 갱신
- [x] 보안: 누구나 읽기, 본인만 쓰기
