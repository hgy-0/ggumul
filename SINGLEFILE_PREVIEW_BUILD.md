# 싱글파일 프리뷰 빌드 가이드

서버 배포 없이 HTML 파일 하나로 프로젝트를 공유하는 방법

## 한 줄 요약

```bash
npm run build:preview
```

`dist-preview/index.html` 생성 → 더블클릭하면 브라우저에서 바로 열림.

---

## 목차

1. [사용법](#사용법)
2. [페이지 이동](#페이지-이동)
3. [프로덕션 빌드와 차이](#프로덕션-빌드와-차이)
4. [기술 상세](#기술-상세)
5. [버전 관리](#버전-관리)
6. [제약 사항과 대응](#제약-사항과-대응)
7. [앞으로의 방향](#앞으로의-방향)

---

## 사용법

### 1. 빌드

```bash
cd frontend
npm run build:preview
```

### 2. 결과물 확인

```
dist-preview/
└── index.html    ← 이 파일 하나가 전부 (약 330KB)
```

### 3. 공유

- 카카오톡 / 슬랙에 파일 첨부
- Google Drive / Notion에 업로드
- 이메일 첨부

### 4. 열기

받은 사람이 `index.html` 더블클릭 → 브라우저에서 바로 렌더링.

**설치 없음. 서버 없음. 인터넷 없어도 됨.**

---

## 페이지 이동

싱글파일 프리뷰는 URL에 `#`이 붙는 HashRouter 방식입니다.

| 페이지 | 주소 |
|--------|------|
| 홈 | `index.html#/` |
| 새 목표 등록 | `index.html#/goals/new` |
| 목표 상세 | `index.html#/goals/:id/detail` |
| 카운트다운 | `index.html#/goals/:id/countdown` |
| 결과 화면 | `index.html#/goals/:id/result` |
| 통계 | `index.html#/stats` |
| 친구 | `index.html#/friends` |

---

## 프로덕션 빌드와 차이

|  | `npm run build` | `npm run build:preview` |
|---|-----------------|-------------------------|
| **출력 경로** | `dist/` | `dist-preview/` |
| **파일 구조** | HTML + JS + CSS 분리 | HTML 하나에 전부 인라인 |
| **Router** | BrowserRouter | HashRouter |
| **용도** | 서버 배포 | 파일 공유 / 오프라인 데모 |
| **서버 필요** | ✅ 필요 | ❌ 불필요 |
| **파일 크기** | ~330KB (분산) | ~330KB (단일) |
| **PWA** | ✅ 활성화 | ❌ 비활성화 |
| **Service Worker** | ✅ 활성화 | ❌ 비활성화 |

**프로덕션 배포에는 영향 없습니다.** 환경변수 `VITE_SINGLE_FILE`로 모든 분기가 격리되어 있습니다.

---

## 기술 상세

### 환경변수 분기 구조

```bash
npm run build           →  VITE_SINGLE_FILE 미설정  →  프로덕션 모드
npm run build:preview   →  VITE_SINGLE_FILE=true    →  싱글파일 모드
```

이 환경변수 하나로 3곳에서 분기합니다:

### 1) `vite.config.ts` — 빌드 플러그인 분기

```typescript
import { viteSingleFile } from 'vite-plugin-singlefile';

const isSingleFile = !!process.env.VITE_SINGLE_FILE;

export default defineConfig({
  plugins: [
    react(),
    ...(isSingleFile ? [] : [
      VitePWA({ ... }) // 싱글파일에서는 PWA 비활성화
    ]),
    ...(isSingleFile ? [viteSingleFile()] : []), // 프리뷰일 때만 활성화
  ],
});
```

**`viteSingleFile()`이 하는 일:**

- Vite가 빌드한 `.js`, `.css` 파일을 읽어서 `index.html` 안에 `<script>`, `<style>` 태그로 인라인
- 외부 파일 참조(`<script src="...">`)가 사라지므로 단독 실행 가능
- 내부적으로 Rollup의 `generateBundle` 훅에서 asset을 HTML에 삽입

### 2) `src/main.tsx` — Router 분기

```typescript
import { HashRouter, BrowserRouter } from 'react-router-dom';

const Router = import.meta.env.VITE_SINGLE_FILE ? HashRouter : BrowserRouter;

// 서비스 워커도 싱글파일에서는 비활성화
if ('serviceWorker' in navigator && !import.meta.env.VITE_SINGLE_FILE) {
  navigator.serviceWorker.register('/push-sw.js', { ... });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
```

**왜 HashRouter인가:**

- **BrowserRouter**는 `history.pushState()` API를 사용 → 서버가 모든 경로에 `index.html`을 리턴해줘야 동작
- **HashRouter**는 URL의 `#` 뒤 부분만 사용 → 서버 없이 `file://` 프로토콜에서 동작
- 예: `file:///path/index.html#/goals/new`

### 3) `src/vite-env.d.ts` — 타입 선언

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
  readonly VITE_SINGLE_FILE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**참고:** Vite는 `VITE_` 접두어가 붙은 환경변수만 클라이언트 번들에 노출합니다. `process.env`는 Node.js 전용이라 `vite.config.ts`에서만 접근 가능하고, 클라이언트 코드에서는 `import.meta.env`를 사용해야 합니다.

### 4) `package.json` — 스크립트

```json
{
  "scripts": {
    "build": "tsc && vite build",
    "build:preview": "VITE_SINGLE_FILE=true vite build --outDir dist-preview"
  }
}
```

`--outDir dist-preview`: 프로덕션 `dist/`와 출력 경로를 분리해서 서로 덮어쓰지 않음.

---

## 빌드 파이프라인 흐름

```
[소스 코드]
    │
    ├─ npm run build ─────────────────────────────────────────┐
    │   vite.config: react() + VitePWA()                      │
    │   main.tsx: BrowserRouter                               │
    │   output: dist/                                         │
    │     ├── index.html           (소량, JS/CSS 외부 참조)   │
    │     ├── assets/index-xxx.js  (대량)                     │
    │     └── assets/index-xxx.css (대량)                     │
    │                                                         │
    ├─ npm run build:preview ─────────────────────────────────┤
    │   vite.config: react() + viteSingleFile()               │
    │   main.tsx: HashRouter                                  │
    │   output: dist-preview/                                 │
    │     └── index.html           (330KB, 전부 인라인)       │
    └─────────────────────────────────────────────────────────┘
```

---

## 왜 React 앱을 그냥 파일로 못 여나?

일반적인 React 빌드(`npm run build`)를 `file://`로 열면 흰 화면이 뜹니다. 이유가 2가지:

### 문제 1: ES Module CORS 차단

Vite 빌드 결과물은 `<script type="module">`로 JS를 로드합니다:

```html
<script type="module" src="/assets/index-xxx.js"></script>
```

브라우저는 `file://` 프로토콜에서 ES Module 로딩을 CORS 정책으로 차단합니다. 같은 디렉토리에 있어도 "cross-origin"으로 간주합니다.

**해결:** `viteSingleFile`은 이 JS를 `<script type="module">인라인 코드</script>`로 바꿔서 외부 파일 fetch 자체를 제거합니다.

### 문제 2: BrowserRouter의 History API

```
file:///Users/me/dist/index.html
```

이 URL에서 `/goals/new`로 이동하면 브라우저가 로컬 파일시스템에서 해당 경로를 찾으려 합니다 (당연히 없음).

**해결:** HashRouter는 `#` 뒤를 클라이언트에서만 처리하므로 파일시스템 경로와 충돌하지 않습니다:

```
file:///Users/me/dist-preview/index.html#/goals/new
                                         ↑ 여기부터는 브라우저가 서버에 요청하지 않음
```

---

## 버전 관리

### 방법 A: 파일명에 날짜/버전 붙이기

```bash
npm run build:preview
cp dist-preview/index.html ./previews/v1.0_20250214.html
```

Google Drive 등에 `previews/` 폴더를 만들어 아카이빙.

### 방법 B: Git 태그와 연동

```bash
npm run build:preview
cp dist-preview/index.html ./previews/$(git describe --tags --always).html
```

### 방법 C: CI에서 자동 생성

PR 머지 시 GitHub Actions에서 자동 빌드 → Artifact로 첨부:

```yaml
# .github/workflows/preview.yml
name: Build Preview
on:
  push:
    branches: [main]
jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build:preview
      - uses: actions/upload-artifact@v4
        with:
          name: preview-${{ github.sha }}
          path: dist-preview/index.html
```

`main`에 머지될 때마다 GitHub Actions의 Artifacts 탭에서 HTML 파일 다운로드 가능.

---

## 제약 사항과 대응

| 제약 | 현재 상태 | 대응 방안 |
|------|-----------|-----------|
| **외부 이미지 URL** | 해당 없음 (lucide 아이콘 = 인라인 SVG) | 이미지를 `src/assets/`에 넣으면 자동 인라인됨 |
| **파일 크기 증가** | 현재 330KB | 이미지가 많아지면 `build.assetsInlineLimit` 조정 |
| **실제 API 호출** | 전부 목업 데이터 | `VITE_SINGLE_FILE`일 때 목업 모드 강제 전환 가능 |
| **웹폰트** | 인터넷 필요 (CDN) | `vite-plugin-webfont-dl`로 폰트 번들링 가능 |
| **localStorage** | `file://`에서도 동작 | 문제 없음 |

### API 연동 후 목업 분기 예시

나중에 실제 API를 붙이게 되면:

```typescript
// src/api/client.ts
export async function fetchGoals() {
  if (import.meta.env.VITE_SINGLE_FILE) {
    // 싱글파일 프리뷰에서는 목업 데이터 반환
    return [
      { id: 1, name: '운동하기', first_action: '운동복 챙기기' },
      { id: 2, name: '독서하기', first_action: '책 펼치기' },
    ];
  }

  // 프로덕션에서는 실제 API 호출
  return fetch('/api/goals').then((r) => r.json());
}
```

이렇게 하면 프리뷰 빌드에서는 항상 목업 데이터로 동작하고, 프로덕션에서는 실제 API를 호출합니다.

---

## 앞으로의 방향

### Phase 1: 지금 (즉시 적용 가능)

**현재 상태:** `npm run build:preview` → HTML 파일 수동 공유

이 방식만으로도 Figma 시안 대신 **실제 동작하는 인터랙티브 프로토타입**을 공유할 수 있습니다. 카운트다운, 탭 전환, 아코디언, 체크리스트 등 Figma에서 표현 불가능한 인터랙션을 비개발자가 직접 체험 가능.

**활용 시나리오:**

- 기획 리뷰 시 HTML 파일 전달 → 실제 플로우 확인
- 수정 피드백 → AI 코드 수정 → `build:preview` → 파일 재전달
- 버전별 HTML 아카이빙으로 변경 히스토리 추적

### Phase 2: 자동화 (CI/CD 연동)

**목표:** 코드 푸시하면 프리뷰 HTML이 자동 생성되어 팀원 접근 가능

- GitHub Actions에서 `build:preview` 자동 실행
- PR마다 프리뷰 HTML을 Artifact로 첨부 → 리뷰어가 다운받아 바로 확인
- Slack 웹훅으로 "새 프리뷰 빌드 나왔습니다" 자동 알림

### Phase 3: 페이지별 독립 프리뷰

**목표:** 화면 하나당 HTML 파일 하나

현재는 전체 앱이 하나의 `index.html`로 나옵니다. 특정 화면만 빠르게 공유하고 싶을 때:

```bash
npm run build:preview -- --page=countdown
# → dist-preview/countdown.html (해당 페이지만)
```

**구현 방향:**

- Vite의 `build.rollupOptions.input`으로 멀티 엔트리포인트 설정
- 각 페이지 컴포넌트를 독립 엔트리로 빌드
- 라우터 없이 단일 컴포넌트만 렌더링

### Phase 4: 피드백 루프 내장

**목표:** 프리뷰 HTML 안에서 바로 피드백을 남길 수 있게

비개발자가 프리뷰를 보면서 "여기 간격 줄여주세요"를 화면 위에 직접 마킹:

- 프리뷰 빌드에만 오버레이 피드백 UI 삽입 (`VITE_SINGLE_FILE` 분기)
- 화면 클릭 → 해당 좌표에 코멘트 입력 → JSON으로 export
- 개발자가 JSON 받아서 어디를 고쳐야 하는지 파악

기술적으로 가능한 접근:

```typescript
if (import.meta.env.VITE_SINGLE_FILE) {
  // 프리뷰에서만 피드백 오버레이 렌더링
  // 클릭 좌표 + 스크린샷 + 코멘트를 localStorage에 저장
  // "피드백 내보내기" 버튼으로 JSON 다운로드
}
```

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `vite.config.ts` | `VITE_SINGLE_FILE`로 `viteSingleFile()` 플러그인 분기 |
| `src/main.tsx` | `VITE_SINGLE_FILE`로 HashRouter / BrowserRouter 분기 |
| `src/vite-env.d.ts` | `VITE_SINGLE_FILE` 환경변수 타입 선언 |
| `package.json` | `build:preview` 스크립트 (`--outDir dist-preview`) |

---

## 트러블슈팅

### Q: 빌드 후 HTML을 열었는데 흰 화면이 나와요

**A:** 브라우저 콘솔(F12)을 열어 에러 확인:

- `CORS error`: 정상. HashRouter가 제대로 동작하는지 URL 확인 (`#/` 있는지)
- `Module not found`: 빌드가 제대로 안 된 것. `npm run build:preview` 다시 실행

### Q: 페이지 이동이 안 돼요

**A:** URL에 `#`이 붙어있는지 확인:

- ✅ 정상: `file:///path/index.html#/goals/new`
- ❌ 오류: `file:///path/index.html/goals/new`

### Q: 웹폰트가 안 나와요

**A:** 웹폰트는 CDN에서 로드하므로 인터넷 연결 필요. 오프라인에서도 작동하게 하려면:

```bash
npm install -D vite-plugin-webfont-dl
```

`vite.config.ts`에 추가:

```typescript
import webfontDownload from 'vite-plugin-webfont-dl';

plugins: [
  ...(isSingleFile ? [webfontDownload()] : []),
]
```

### Q: 파일 크기가 너무 커요

**A:** 이미지를 많이 사용하면 커질 수 있습니다:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    assetsInlineLimit: 4096, // 4KB 이하만 인라인 (기본값)
  },
});
```

값을 낮추면 큰 이미지는 별도 파일로 분리됩니다 (단, 싱글파일이 아니게 됨).

---

## 요약

```bash
# 빌드
npm run build:preview

# 결과
dist-preview/index.html (330KB)

# 공유
파일 첨부 → 더블클릭 → 브라우저 실행
```

**핵심 장점:**

✅ 서버 불필요
✅ 설치 불필요
✅ 실제 동작하는 프로토타입
✅ Figma 대체 가능
✅ 빠른 피드백 루프

**프로덕션 배포와 완전히 분리되어 안전합니다.**
