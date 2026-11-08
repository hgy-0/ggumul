# 첫 시작 — Design System Guide

> "미루고 있는 일을 N분 안에 시작하게 만드는" 동기부여 PWA

---

## 디자인 원칙

| 원칙 | 설명 |
|------|------|
| **긴장감(Urgency)** | 손실 회피 심리를 자극하는 시각적 압박. 카운트다운, 붉은 경고, 떨림 효과. |
| **연대감(Solidarity)** | 혼자가 아님을 느끼게 하는 따뜻한 톤. Streak 뱃지, 응원 메시지, 그룹 프로그레스. |
| **즉시성(Immediacy)** | 모든 인터랙션은 0.2초 내 피드백. 빠른 전환, 명확한 CTA. |
| **모바일 퍼스트** | 44px 이상 터치 타겟, Safe Area 대응, 한 손 조작 최적화. |

---

## 1. 컬러 사용 가이드

### Primary (오렌지/코랄) — `primary-*`

에너지, 시작, 행동 유도를 상징합니다.

| 용도 | 토큰 |
|------|------|
| CTA 버튼 배경 | `bg-primary-500` |
| CTA 버튼 호버 | `bg-primary-600` |
| 강조 텍스트 | `text-primary-400` |
| 아이콘 액센트 | `text-primary-500` |
| 배경 하이라이트 | `bg-primary-500/10` ~ `bg-primary-500/20` |
| 보더 강조 | `border-primary-500/50` |
| Glow 효과 | `shadow-glow-primary` |

```html
<!-- 예시: CTA 버튼 -->
<button class="btn-primary btn-lg w-full">
  지금 시작하기
</button>
```

### Success (그린) — `success-*`

성공, Streak 유지, 완료 상태를 나타냅니다.

| 용도 | 토큰 |
|------|------|
| 성공 상태 텍스트 | `text-success-400` |
| 완료 배지 배경 | `bg-success-500/15` |
| 성공 카드 보더 | `border-success-500/50` |
| 프로그레스 바 채움 | `bg-success-500` |
| Streak 유지 Glow | `shadow-glow-success` |

### Danger (레드) — `danger-*`

실패, Streak 위험, 시간 초과 경고에 사용합니다.

| 용도 | 토큰 |
|------|------|
| 경고 텍스트 | `text-danger-400` |
| 타이머 긴급 상태 | `text-danger-500` + `animate-timer-pulse` |
| 실패 카드 보더 | `border-danger-500/50` |
| 위험 버튼 | `btn-danger` |
| Streak 소멸 경고 | `shadow-glow-danger` |

### Neutral (다크 그레이) — `neutral-*`

다크 모드 기본 배경과 텍스트 시스템입니다.

| 용도 | 토큰 |
|------|------|
| 최심부 배경 | `bg-neutral-950` |
| 메인 배경 | `bg-neutral-900` |
| 카드/서피스 | `bg-neutral-800` |
| 보더 | `border-neutral-700` |
| 비활성 텍스트 | `text-neutral-400` |
| 본문 텍스트 | `text-neutral-100` ~ `text-neutral-50` |

---

## 2. 버튼 스타일

### Primary CTA
가장 중요한 행동 유도 버튼. 화면당 1개만 사용하는 것을 원칙으로 합니다.

```html
<button class="btn-primary">지금 시작하기</button>
<button class="btn-primary btn-lg w-full">5분 타이머 시작</button>
```

- 배경: `primary-500`, 호버 시 `primary-600`
- 호버 시 오렌지 Glow 효과 (`shadow-glow-primary`)
- 클릭 시 `scale(0.97)` 눌림 효과
- 비활성 시 `opacity-40`

### Secondary
보조 액션 버튼. 취소, 옵션 변경 등.

```html
<button class="btn-secondary">나중에 하기</button>
```

- 배경: `neutral-800`, 보더: `neutral-700`
- 호버 시 `neutral-700`으로 밝아짐

### Danger
파괴적 행동 또는 긴급 액션.

```html
<button class="btn-danger">Streak 포기</button>
```

- 배경: `danger-500`, Glow 효과
- 삭제/포기 등 되돌리기 어려운 액션에만 사용

### Ghost
최소한의 시각적 존재감. 보조 네비게이션.

```html
<button class="btn-ghost">건너뛰기</button>
```

### 크기 변형

| 클래스 | 패딩 | 용도 |
|--------|------|------|
| `btn-lg` | `px-8 py-4` | 메인 CTA |
| (기본) | `px-6 py-3` | 일반 버튼 |
| `btn-sm` | `px-4 py-2` | 인라인 액션 |

---

## 3. 카드 스타일

### 기본 카드

```html
<div class="card p-6">
  <h3 class="text-title text-neutral-100 mb-2">카드 제목</h3>
  <p class="text-caption text-neutral-400">카드 설명</p>
</div>
```

- 배경: `neutral-800`
- 보더: `neutral-700/50` (반투명)
- 라운딩: `rounded-card` (16px)
- 그림자: `shadow-card`

### 인터랙티브 카드

```html
<div class="card-interactive p-6">
  <!-- 호버 시 그림자 강화, 보더 밝아짐, 클릭 시 스케일 축소 -->
</div>
```

### 상태별 카드

```html
<!-- 강조 (현재 진행중) -->
<div class="card-highlighted p-6">...</div>

<!-- 위험 (Streak 소멸 임박) -->
<div class="card-danger p-6">...</div>

<!-- 성공 (오늘 미션 완료) -->
<div class="card-success p-6">...</div>
```

---

## 4. 타이머 스타일 가이드

타이머는 서비스의 핵심 UI입니다. 상태별로 시각적 긴장감이 달라집니다.

### 기본 타이머

```html
<div class="timer-ring countdown-ring-pulse">
  <!-- SVG 원형 프로그레스 -->
  <div class="timer-display text-neutral-50">
    04:32
  </div>
</div>
```

- 폰트: `text-timer-xl` (4rem, 모노스페이스)
- `tabular-nums`로 숫자 폭 고정
- 원형 링 바깥에 펄스 링 효과

### 상태별 변화

| 상태 | 남은 시간 | 스타일 |
|------|-----------|--------|
| **여유** | > 50% | `text-neutral-50` — 차분한 흰색 |
| **중반** | 50% ~ 25% | `text-primary-400` — 주의 환기 오렌지 |
| **긴급** | < 25% | `timer-display-urgent` — 빨간색 + 펄스 |
| **위독** | < 10초 | `countdown-critical` — 플래시 + 강한 Glow |
| **종료** | 0 | `text-danger-500` + `animate-shake` |

```html
<!-- 긴급 상태 -->
<div class="timer-display-urgent countdown-critical text-glow-danger">
  00:08
</div>

<!-- 종료 -->
<div class="timer-display text-danger-500 animate-shake">
  00:00
</div>
```

### 완료 시

타이머가 성공적으로 완료되면:
1. `animate-success-bounce`로 체크마크 등장
2. Confetti 애니메이션 발사
3. 카드가 `card-success`로 전환

---

## 5. Streak 뱃지 스타일

Streak은 연속 달성 일수를 나타냅니다. 연대감과 성취감의 핵심 요소입니다.

### 활성 Streak

```html
<!-- 일반 Streak -->
<span class="streak-badge">
  🔥 7일 연속
</span>

<!-- 불타는 Streak (7일 이상) -->
<span class="streak-badge-fire">
  🔥 14일 연속
</span>
```

- 7일 미만: `streak-badge` — 차분한 오렌지 뱃지
- 7일 이상: `streak-badge-fire` — 불꽃 애니메이션 + 그라데이션 배경
- pill 형태 (`rounded-badge`)

### 소멸된 Streak

```html
<span class="streak-badge-dead">
  💀 Streak 소멸
</span>
```

- 회색 톤 (`neutral-700` 배경, `neutral-400` 텍스트)
- 무채색으로 상실감 표현

### Streak 단계별 시각 강도

| 일수 | 스타일 | 효과 |
|------|--------|------|
| 1~3일 | `streak-badge` | 기본 오렌지 |
| 4~6일 | `streak-badge` + `shadow-glow-primary` | 약한 Glow |
| 7~13일 | `streak-badge-fire` | 불꽃 애니메이션 |
| 14일+ | `streak-badge-fire` + 크기 업 | 강한 불꽃 + 확대 |
| 소멸 | `streak-badge-dead` | 회색 무채색 |

---

## 6. 부활 카드 스타일

Streak이 소멸된 후 재시작을 유도하는 카드입니다. 손실 회피 + 희망 메시지를 결합합니다.

### 기본 구조

```html
<div class="revival-card">
  <div class="revival-icon">🔄</div>
  <h3 class="revival-title">Streak이 끊어졌어요</h3>
  <p class="revival-desc">
    하지만 지금 다시 시작하면<br>
    내일은 2일차가 됩니다
  </p>
  <button class="btn-primary btn-lg w-full">
    지금 다시 시작하기
  </button>
</div>
```

### 디자인 요소

- **배경**: `neutral-800` -> `danger-950/20` 그라데이션 (위에서 아래로 어두운 붉은빛)
- **보더**: `danger-500/40` — 위험 상태 암시
- **타이틀**: `text-danger-300` — 부드러운 빨강 (공격적이지 않게)
- **설명**: `text-neutral-400` — 차분한 안내
- **CTA**: `btn-primary` — 부활의 희망을 Primary 오렌지로

### 부활 카드 변형

```html
<!-- 24시간 이내 복귀 — 긴급감 강조 -->
<div class="revival-card animate-urgency-glow">
  <div class="revival-icon">⏰</div>
  <h3 class="revival-title">24시간 안에 돌아오면 Streak 복구!</h3>
  <p class="revival-desc">
    남은 시간: <span class="text-danger-400 font-semibold">18:42:30</span>
  </p>
  <button class="btn-primary btn-lg w-full animate-timer-pulse">
    지금 복구하기
  </button>
</div>

<!-- 완전 소멸 — 담담하지만 희망적 -->
<div class="revival-card">
  <div class="revival-icon">🌱</div>
  <h3 class="revival-title">새로운 시작</h3>
  <p class="revival-desc">
    이전 최고 기록: 12일<br>
    다시 도전해볼까요?
  </p>
  <button class="btn-primary btn-lg w-full">
    1일차부터 다시
  </button>
</div>
```

---

## 7. 애니메이션 가이드

| 이름 | 클래스/키프레임 | 용도 | 지속시간 |
|------|-----------------|------|----------|
| Timer Pulse | `animate-timer-pulse` | 타이머 긴급 상태 | 1.5s 반복 |
| Urgency Glow | `animate-urgency-glow` | 카드 긴급 보더 Glow | 1s 반복 |
| Success Bounce | `animate-success-bounce` | 완료 체크마크 등장 | 0.6s 1회 |
| Slide Up | `animate-slide-up` | 카드/요소 진입 | 0.4s 1회 |
| Fade In | `animate-fade-in` | 부드러운 등장 | 0.3s 1회 |
| Confetti | `confetti-fall` | 성공 축하 | 2.5s 1회 |
| Streak Fire | `animate-streak-fire` | 연속 기록 뱃지 | 0.8s 반복 |
| Shake | `animate-shake` | 실패/경고 떨림 | 0.5s 1회 |
| Critical Flash | `countdown-critical` | 마지막 10초 | 0.5s 반복 |
| Ring Expand | `countdown-ring-pulse` | 타이머 외곽 링 | 1.5s 반복 |
| Skeleton | `skeleton` | 로딩 상태 | 1.5s 반복 |

---

## 8. 레이아웃 패턴

### 모바일 기본 레이아웃

```html
<div class="min-h-screen bg-neutral-950 flex flex-col safe-top safe-bottom">
  <!-- 헤더 -->
  <header class="glass sticky top-0 z-30 px-4 py-3">
    ...
  </header>

  <!-- 메인 콘텐츠 -->
  <main class="flex-1 px-4 py-6 space-y-4">
    ...
  </main>

  <!-- 하단 CTA (고정) -->
  <footer class="sticky bottom-0 p-4 gradient-dark-fade">
    <button class="btn-primary btn-lg w-full">지금 시작하기</button>
  </footer>
</div>
```

### 글래스모피즘 헤더

```html
<header class="glass sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
  <h1 class="text-title gradient-text-primary">첫 시작</h1>
  <span class="streak-badge">🔥 7일</span>
</header>
```

---

## 9. 접근성 체크리스트

- [ ] 모든 버튼 터치 타겟 최소 44x44px (`touch-target`)
- [ ] 색상만으로 상태를 구분하지 않기 (아이콘/텍스트 병행)
- [ ] `focus-visible` 링 모든 인터랙티브 요소에 적용
- [ ] `prefers-reduced-motion` 대응 (애니메이션 비활성화)
- [ ] 명암비 WCAG AA 이상 유지
- [ ] `aria-label` 타이머, 프로그레스 바에 적용
