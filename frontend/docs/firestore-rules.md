# Firestore 보안 규칙 & 인덱스

## 보안 규칙

Firebase Console > Firestore > Rules에 적용:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 사용자별 데이터 — 본인만 읽기/쓰기
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // FCM 알림용 루트 컬렉션 (기존 유지)
    match /goals/{goalId} {
      allow read, write: if request.auth != null;
    }

    match /devices/{deviceId} {
      allow read, write: if true;
    }

    match /fcm_tokens/{tokenId} {
      allow read, write: if true;
    }

    match /friends/{friendId} {
      allow read, write: if true;
    }

    match /cheers/{cheerId} {
      allow read, write: if true;
    }

    match /user_profiles/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 필요한 복합 인덱스

Firebase Console > Firestore > Indexes에서 생성:

### 1. attempts — goal_id + attempted_date
- Collection: `users/{uid}/attempts`
- Fields: `goal_id` ASC, `attempted_date` DESC
- 용도: `getByGoalId`, `getByDate` 쿼리

### 2. attempts — is_exempt + attempted_date
- Collection: `users/{uid}/attempts`
- Fields: `is_exempt` ASC, `attempted_date` ASC
- 용도: 월별 면제 횟수 계산

### 3. cheers — to_device_id + read + created_at
- Collection: `cheers`
- Fields: `to_device_id` ASC, `read` ASC, `created_at` DESC
- 용도: 읽지 않은 응원 조회

### 4. goals — is_active
- Collection: `users/{uid}/goals`
- Fields: `is_active` ASC
- 용도: 활성 목표 목록 조회

## 데이터 구조

```
users/{uid}/
  metadata/migration    — { migrated_from_local, migrated_at, goals_count, attempts_count }
  goals/{goalId}        — StoredGoal
  attempts/{attemptId}  — StoredAttempt (goal_id 필드로 목표 연결)
```
