# 실시간 동료 현황판 기능 명세서

## 📊 개요

### 목적
- 연구 기반: 리더보드가 게임화 요소 중 가장 효과적 (참여도 향상)
- 동료 압박: 소셜 비교를 통한 동기부여 (성과 15.5% 향상)
- 즉각적 피드백: 실시간 통계로 성취감 강화

### 범위
- Phase 1: 전체 통계 대시보드 (2-3일)
- Phase 2: 친구 시스템 (4-5일)

---

## Phase 1: 전체 통계 대시보드

### 1.1 화면 구성

```
┌─────────────────────────────────────┐
│  📊 오늘의 현황                      │
│                                      │
│  🔥 오늘 34명이 시작했어요!         │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                      │
│  📈 나의 성공률                      │
│  ┌────────────────────────────────┐ │
│  │  80%                           │ │
│  │  ██████████████████░░░░░       │ │
│  └────────────────────────────────┘ │
│                                      │
│  📊 전체 평균 성공률                 │
│  ┌────────────────────────────────┐ │
│  │  65%                           │ │
│  │  █████████████░░░░░░░░░        │ │
│  └────────────────────────────────┘ │
│                                      │
│  💪 당신이 평균보다 15% 잘하고       │
│     있어요! 계속 가세요!             │
└─────────────────────────────────────┘
```

### 1.2 표시 정보

| 항목 | 설명 | 데이터 소스 |
|------|------|------------|
| 오늘 성공 수 | 오늘 하루 동안 시작에 성공한 전체 사용자 수 | `attempts` 테이블 집계 |
| 나의 성공률 | 최근 7일간 나의 성공/실패 비율 | 개인 통계 |
| 전체 평균 | 최근 7일간 전체 사용자 평균 성공률 | 전체 통계 집계 |
| 비교 메시지 | 나와 평균의 차이에 따른 격려 메시지 | 동적 생성 |

### 1.3 업데이트 주기

- **실시간이 아님**: 5분마다 폴링 (서버 부하 최소화)
- 사용자가 화면 진입 시 즉시 로드
- 백그라운드에서 자동 갱신 안 함 (배터리 절약)

---

## Phase 1 구현 상세

### 1.4 백엔드 - DB 스키마 추가

#### 새 테이블: `daily_stats`
```sql
CREATE TABLE daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    total_attempts INTEGER DEFAULT 0,
    total_successes INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_stats_date ON daily_stats(date);
```

#### 새 테이블: `device_stats`
```sql
CREATE TABLE device_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT(64) NOT NULL,
    date DATE NOT NULL,
    attempts INTEGER DEFAULT 0,
    successes INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(device_id),
    UNIQUE(device_id, date)
);

CREATE INDEX idx_device_stats_device_date ON device_stats(device_id, date);
```

### 1.5 백엔드 - API 엔드포인트

#### 1. 오늘 전체 통계
```
GET /api/stats/today
```

**응답:**
```json
{
  "date": "2026-02-01",
  "total_successes": 34,
  "total_attempts": 52,
  "success_rate": 0.65,
  "unique_users": 42
}
```

#### 2. 내 통계 (최근 7일)
```
GET /api/stats/me
```

**응답:**
```json
{
  "device_id": "abc123...",
  "period_days": 7,
  "total_attempts": 10,
  "total_successes": 8,
  "success_rate": 0.80,
  "average_success_rate": 0.65,
  "comparison": {
    "difference": 0.15,
    "percentage_better": 23.08
  }
}
```

#### 3. 통계 업데이트 (내부용)
```
POST /api/stats/update
```

**트리거 시점:**
- 사용자가 시도 결과 기록할 때 (`POST /api/attempts`)
- 자동으로 해당 날짜의 `daily_stats`, `device_stats` 업데이트

### 1.6 백엔드 - 비즈니스 로직

#### `app/services/stats_service.py`
```python
from datetime import date, timedelta
from sqlalchemy import select, func
from app.database import AsyncSession
from app.models import DailyStat, DeviceStat, Attempt

class StatsService:
    @staticmethod
    async def get_today_stats(db: AsyncSession):
        """오늘 전체 통계 조회"""
        today = date.today()

        # daily_stats에서 조회
        result = await db.execute(
            select(DailyStat).where(DailyStat.date == today)
        )
        daily_stat = result.scalar_one_or_none()

        if not daily_stat:
            # 없으면 실시간 계산
            return await StatsService._calculate_today_stats(db)

        return {
            "date": str(daily_stat.date),
            "total_successes": daily_stat.total_successes,
            "total_attempts": daily_stat.total_attempts,
            "success_rate": daily_stat.success_rate,
            "unique_users": daily_stat.unique_users
        }

    @staticmethod
    async def get_device_stats(device_id: str, db: AsyncSession, days: int = 7):
        """디바이스 통계 (최근 N일)"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        # 디바이스 통계
        device_result = await db.execute(
            select(
                func.sum(DeviceStat.attempts).label('total_attempts'),
                func.sum(DeviceStat.successes).label('total_successes')
            )
            .where(DeviceStat.device_id == device_id)
            .where(DeviceStat.date >= start_date)
            .where(DeviceStat.date <= end_date)
        )
        device_data = device_result.first()

        # 전체 평균
        avg_result = await db.execute(
            select(
                func.avg(DeviceStat.success_rate).label('avg_rate')
            )
            .where(DeviceStat.date >= start_date)
            .where(DeviceStat.date <= end_date)
        )
        avg_data = avg_result.first()

        device_success_rate = (
            device_data.total_successes / device_data.total_attempts
            if device_data.total_attempts > 0 else 0
        )

        avg_success_rate = avg_data.avg_rate or 0

        return {
            "device_id": device_id,
            "period_days": days,
            "total_attempts": device_data.total_attempts or 0,
            "total_successes": device_data.total_successes or 0,
            "success_rate": round(device_success_rate, 2),
            "average_success_rate": round(avg_success_rate, 2),
            "comparison": {
                "difference": round(device_success_rate - avg_success_rate, 2),
                "percentage_better": round(
                    ((device_success_rate - avg_success_rate) / avg_success_rate * 100)
                    if avg_success_rate > 0 else 0,
                    2
                )
            }
        }

    @staticmethod
    async def update_stats_on_attempt(
        device_id: str,
        goal_id: int,
        success: bool,
        db: AsyncSession
    ):
        """시도 기록 시 통계 업데이트"""
        today = date.today()

        # 1. device_stats 업데이트
        device_stat = await db.execute(
            select(DeviceStat)
            .where(DeviceStat.device_id == device_id)
            .where(DeviceStat.date == today)
        )
        device_stat = device_stat.scalar_one_or_none()

        if device_stat:
            device_stat.attempts += 1
            if success:
                device_stat.successes += 1
            device_stat.success_rate = device_stat.successes / device_stat.attempts
        else:
            device_stat = DeviceStat(
                device_id=device_id,
                date=today,
                attempts=1,
                successes=1 if success else 0,
                success_rate=1.0 if success else 0.0
            )
            db.add(device_stat)

        # 2. daily_stats 업데이트
        daily_stat = await db.execute(
            select(DailyStat).where(DailyStat.date == today)
        )
        daily_stat = daily_stat.scalar_one_or_none()

        if daily_stat:
            daily_stat.total_attempts += 1
            if success:
                daily_stat.total_successes += 1
            daily_stat.success_rate = (
                daily_stat.total_successes / daily_stat.total_attempts
            )
        else:
            daily_stat = DailyStat(
                date=today,
                total_attempts=1,
                total_successes=1 if success else 0,
                success_rate=1.0 if success else 0.0,
                unique_users=1
            )
            db.add(daily_stat)

        await db.commit()
```

### 1.7 프론트엔드 - 컴포넌트

#### `src/components/StatsDashboard.tsx`
```typescript
import React, { useEffect, useState } from 'react';
import { getTodayStats, getMyStats } from '@/api/stats';

interface TodayStats {
  date: string;
  total_successes: number;
  total_attempts: number;
  success_rate: number;
  unique_users: number;
}

interface MyStats {
  success_rate: number;
  average_success_rate: number;
  comparison: {
    difference: number;
    percentage_better: number;
  };
}

export const StatsDashboard: React.FC = () => {
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [today, my] = await Promise.all([
        getTodayStats(),
        getMyStats()
      ]);
      setTodayStats(today);
      setMyStats(my);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (!todayStats || !myStats) return null;

  const getEncouragementMessage = () => {
    const diff = myStats.comparison.percentage_better;
    if (diff > 20) return "🔥 엄청나요! 평균보다 훨씬 잘하고 있어요!";
    if (diff > 0) return "💪 평균보다 잘하고 있어요! 계속 가세요!";
    if (diff > -10) return "⚡ 조금만 더 힘내면 평균을 넘어요!";
    return "🌱 천천히 해도 괜찮아요. 시작이 중요해요!";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">📊 오늘의 현황</h2>

      {/* 오늘 전체 통계 */}
      <div className="mb-6">
        <div className="text-3xl font-bold text-orange-500 mb-2">
          🔥 오늘 {todayStats.total_successes}명이 시작했어요!
        </div>
        <div className="text-sm text-gray-500">
          전체 {todayStats.total_attempts}번의 도전
        </div>
      </div>

      <div className="border-t border-gray-200 my-4"></div>

      {/* 나의 성공률 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">📈 나의 성공률</span>
          <span className="text-2xl font-bold text-blue-600">
            {Math.round(myStats.success_rate * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all"
            style={{ width: `${myStats.success_rate * 100}%` }}
          />
        </div>
      </div>

      {/* 전체 평균 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">📊 전체 평균</span>
          <span className="text-2xl font-bold text-gray-600">
            {Math.round(myStats.average_success_rate * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gray-400 h-3 rounded-full transition-all"
            style={{ width: `${myStats.average_success_rate * 100}%` }}
          />
        </div>
      </div>

      {/* 격려 메시지 */}
      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
        <p className="text-center font-medium text-gray-800">
          {getEncouragementMessage()}
        </p>
      </div>
    </div>
  );
};
```

#### `src/api/stats.ts`
```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getTodayStats = async () => {
  const response = await axios.get(`${API_URL}/stats/today`);
  return response.data;
};

export const getMyStats = async () => {
  const response = await axios.get(`${API_URL}/stats/me`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data;
};
```

### 1.8 홈 화면 통합

#### `src/pages/Home.tsx`
```typescript
import { StatsDashboard } from '@/components/StatsDashboard';

export const Home = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* 통계 대시보드 */}
      <StatsDashboard />

      {/* 기존 목표 목록 */}
      <GoalList />
    </div>
  );
};
```

---

## Phase 2: 친구 시스템

### 2.1 화면 구성

```
┌─────────────────────────────────────┐
│  👥 친구들 현황                      │
│                                      │
│  😊 김철수                           │
│     7일 연속 ⚡                      │
│     성공률 85%                       │
│                                      │
│  😎 이영희                           │
│     3일 연속                         │
│     성공률 70%                       │
│                                      │
│  😴 박민수                           │
│     오늘 아직 안 함                  │
│     성공률 60%                       │
│     [응원 보내기 👋]                 │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                      │
│  [+ 친구 초대하기]                   │
└─────────────────────────────────────┘
```

### 2.2 친구 추가 플로우

```
1. 사용자 A: "친구 초대하기" 탭
   → 초대 코드 생성 (예: MOTI-ABC123)
   → 카카오톡, 링크 복사로 공유

2. 사용자 B: 초대 링크 클릭
   → 앱 열림
   → "김철수님이 초대했어요!" 화면
   → [수락] 버튼

3. 양방향 친구 추가 완료
   → A와 B 모두 친구 목록에서 서로 확인 가능
```

### 2.3 백엔드 - DB 스키마

```sql
CREATE TABLE friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id_1 INTEGER NOT NULL,
    user_id_2 INTEGER NOT NULL,
    status TEXT DEFAULT 'active',  -- active, blocked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id_1) REFERENCES users(id),
    FOREIGN KEY (user_id_2) REFERENCES users(id),
    UNIQUE(user_id_1, user_id_2),
    CHECK(user_id_1 < user_id_2)  -- 중복 방지
);

CREATE TABLE invite_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    creator_id INTEGER NOT NULL,
    used_by_id INTEGER,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (used_by_id) REFERENCES users(id)
);

CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_friendships_user1 ON friendships(user_id_1);
CREATE INDEX idx_friendships_user2 ON friendships(user_id_2);
```

### 2.4 백엔드 - API 엔드포인트

#### 1. 초대 코드 생성
```
POST /api/friends/invite
```

**응답:**
```json
{
  "code": "MOTI-ABC123",
  "expires_at": "2026-02-08T00:00:00Z",
  "share_url": "https://yourapp.com/invite/MOTI-ABC123"
}
```

#### 2. 초대 수락
```
POST /api/friends/accept/{code}
```

**응답:**
```json
{
  "success": true,
  "friend": {
    "id": 456,
    "name": "김철수",
    "current_streak": 7
  }
}
```

#### 3. 친구 목록 조회
```
GET /api/friends
```

**응답:**
```json
{
  "friends": [
    {
      "id": 456,
      "name": "김철수",
      "current_streak": 7,
      "success_rate": 0.85,
      "today_completed": true
    },
    {
      "id": 789,
      "name": "이영희",
      "current_streak": 3,
      "success_rate": 0.70,
      "today_completed": true
    },
    {
      "id": 101,
      "name": "박민수",
      "current_streak": 0,
      "success_rate": 0.60,
      "today_completed": false
    }
  ]
}
```

#### 4. 응원 보내기
```
POST /api/friends/{friend_id}/cheer
```

**응답:**
```json
{
  "success": true,
  "message": "응원을 보냈어요! 📣"
}
```

---

## 구현 우선순위

### Week 1: Phase 1 - 전체 통계 (즉시 효과)
- [ ] Day 1: DB 모델 + 서비스 레이어
- [ ] Day 2: 백엔드 API 라우터
- [ ] Day 3: 프론트엔드 UI + 통합 테스트

### Phase 1 상세 체크리스트

#### Day 1: 백엔드 기반 작업

**1. DB 모델 생성** (`backend/app/models/`)
- [ ] `daily_stat.py` 생성
  ```python
  from sqlalchemy.orm import Mapped, mapped_column
  from sqlalchemy import Date
  from app.database import Base

  class DailyStat(Base):
      __tablename__ = "daily_stats"
      id: Mapped[int] = mapped_column(primary_key=True)
      date: Mapped[date] = mapped_column(Date, unique=True, index=True)
      total_attempts: Mapped[int] = mapped_column(default=0)
      total_successes: Mapped[int] = mapped_column(default=0)
      unique_devices: Mapped[int] = mapped_column(default=0)
      success_rate: Mapped[float] = mapped_column(default=0.0)
  ```

- [ ] `device_stat.py` 생성
  ```python
  from sqlalchemy import String, Date, UniqueConstraint, ForeignKey

  class DeviceStat(Base):
      __tablename__ = "device_stats"
      id: Mapped[int] = mapped_column(primary_key=True)
      device_id: Mapped[str] = mapped_column(String(64), ForeignKey("devices.device_id"), index=True)
      date: Mapped[date] = mapped_column(Date, index=True)
      attempts: Mapped[int] = mapped_column(default=0)
      successes: Mapped[int] = mapped_column(default=0)
      success_rate: Mapped[float] = mapped_column(default=0.0)

      __table_args__ = (UniqueConstraint("device_id", "date"),)
  ```

- [ ] `backend/app/models/__init__.py`에 import 추가
  ```python
  from app.models.daily_stat import DailyStat
  from app.models.device_stat import DeviceStat

  __all__ = [..., "DailyStat", "DeviceStat"]
  ```

- [ ] `backend/app/main.py`에 import 추가 (테이블 자동 생성용)
  ```python
  from app.models import ..., DailyStat, DeviceStat  # noqa: F401
  ```

**2. 서비스 레이어 생성**
- [ ] `backend/app/services/` 폴더 생성
- [ ] `backend/app/services/__init__.py` 생성
- [ ] `backend/app/services/stats_service.py` 생성 (명세서 코드 참고)
  - [x] `get_today_stats()`
  - [x] `get_device_stats(device_id, days=7)`
  - [x] `update_stats_on_attempt(device_id, goal_id, success, db)`
  - [ ] `_calculate_unique_devices(db, today)` 추가 필요
    ```python
    @staticmethod
    async def _calculate_unique_devices(db: AsyncSession, date: date):
        """특정 날짜의 고유 device 수 계산"""
        result = await db.execute(
            select(func.count(func.distinct(Attempt.device_id)))
            .select_from(Attempt)
            .join(Goal, Attempt.goal_id == Goal.id)
            .where(func.date(Attempt.created_at) == date)
        )
        return result.scalar() or 0
    ```

**3. 기존 코드에 통계 업데이트 연동**
- [ ] `backend/app/routers/attempts.py` 수정
  - 시도 기록 엔드포인트에서 `StatsService.update_stats_on_attempt()` 호출
  ```python
  from app.services.stats_service import StatsService

  @router.post("/attempts")
  async def create_attempt(...):
      # 기존 로직
      ...
      # 통계 업데이트 추가
      await StatsService.update_stats_on_attempt(
          device_id=device_id,
          goal_id=goal_id,
          success=attempt.success,
          db=db
      )
      return {"success": True}
  ```

#### Day 2: 백엔드 API

**1. 라우터 생성**
- [ ] `backend/app/routers/stats.py` 생성
  ```python
  from fastapi import APIRouter, Depends
  from app.dependencies import get_device_id
  from app.database import get_db
  from app.services.stats_service import StatsService

  router = APIRouter(prefix="/api/stats", tags=["stats"])

  @router.get("/today")
  async def get_today_stats(db: AsyncSession = Depends(get_db)):
      return await StatsService.get_today_stats(db)

  @router.get("/me")
  async def get_my_stats(
      device_id: str = Depends(get_device_id),
      db: AsyncSession = Depends(get_db)
  ):
      return await StatsService.get_device_stats(device_id, db)
  ```

- [ ] `backend/app/main.py`에 라우터 등록
  ```python
  from app.routers import ..., stats
  app.include_router(stats.router)
  ```

**2. 테스트**
- [ ] 서버 재시작 후 테이블 생성 확인
- [ ] Swagger UI에서 API 테스트 (http://localhost:8000/docs)
- [ ] 시도 기록 후 통계 업데이트 확인

#### Day 3: 프론트엔드

**1. API 클라이언트**
- [ ] `frontend/src/api/stats.ts` 생성
  ```typescript
  import client from './client';

  export const getTodayStats = async () => {
    const response = await client.get('/stats/today');
    return response.data;
  };

  export const getMyStats = async () => {
    const response = await client.get('/stats/me');
    return response.data;
  };
  ```

**2. 컴포넌트 생성**
- [ ] `frontend/src/components/StatsDashboard.tsx` 생성 (명세서 코드 참고)
- [ ] 스타일링: Tailwind CSS 클래스 적용
- [ ] 로딩/에러 상태 처리

**3. Dashboard 통합**
- [ ] `frontend/src/pages/Dashboard.tsx` 수정
  - 77줄 위에 `<StatsDashboard />` 추가
  ```typescript
  import StatsDashboard from '@/components/StatsDashboard';

  export default function Dashboard() {
    ...
    return (
      <div>
        {/* 통계 대시보드 추가 */}
        <StatsDashboard />

        {/* 상단 인사 (기존 코드) */}
        <div className="mb-6">
          ...
        </div>
      </div>
    );
  }
  ```

**4. 통합 테스트**
- [ ] 목표 등록
- [ ] 카운트다운 시작
- [ ] 성공/실패 기록
- [ ] 통계 위젯에 반영 확인
- [ ] 새로고침 후 통계 유지 확인

### Week 2: Phase 2 - 친구 시스템 (차별화)
- [ ] Day 1-2: DB 스키마 + 초대 로직
- [ ] Day 3-4: 친구 목록 API + UI
- [ ] Day 5: 응원 기능 + 알림 연동

---

## 성공 지표 (KPI)

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 통계 조회율 | 80% 이상 | 홈 방문 중 통계 위젯 노출 |
| 친구 초대 전환율 | 20% 이상 | 초대 코드 생성 후 수락 비율 |
| 평균 친구 수 | 2명 이상 | 사용자당 평균 친구 수 |
| 재방문율 증가 | +30% | 기능 출시 전후 비교 |

---

## 다음 단계

이 명세서를 기반으로:
1. ✅ 명세서 검토 및 피드백
2. Phase 1 구현 시작
3. 테스트 및 배포
4. Phase 2 진행

---

## 참고 연구

- **Fogg Behavioral Model**: 동기 × 능력 × 트리거 = 행동
- **Gamification Research**: 리더보드가 가장 효과적 (Journal of Business Research, 2021)
- **Social Accountability**: 동료 압박이 성과 15.5% 향상 (Frontiers in Psychology, 2025)
