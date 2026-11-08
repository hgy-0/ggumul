# 꾸물 앱 배포 가이드

## 📦 배포 준비 완료!

localStorage 버전을 Vercel에 배포하기 위한 모든 설정이 완료되었습니다.

### 현재 상태
- ✅ Git 저장소 초기화 완료
- ✅ Vercel 설정 파일 생성 완료 (`vercel.json`)
- ✅ .gitignore 설정 완료
- ✅ 첫 커밋 완료

---

## 🚀 배포 방법 (3단계)

### 1단계: GitHub 리포지토리 생성

1. GitHub에 로그인: https://github.com
2. 오른쪽 상단 `+` 버튼 클릭 → `New repository` 선택
3. 리포지토리 설정:
   - **Repository name**: `ggumul-app` (또는 원하는 이름)
   - **Description**: `꾸물 앱 - 목표 달성 습관 관리 앱`
   - **Public** 또는 **Private** 선택 (Public 추천)
   - **Initialize this repository** 체크 박스는 모두 **선택하지 마세요**
4. `Create repository` 클릭

### 2단계: GitHub에 코드 푸시

GitHub에서 제공하는 명령어를 복사하거나, 아래 명령어를 터미널에서 실행:

```bash
# 현재 디렉토리: /Users/sungin/Documents/gayoung/side/motivation/frontend

# GitHub 리포지토리 URL로 변경하세요 (예시)
git remote add origin https://github.com/YOUR_USERNAME/ggumul-app.git

# 브랜치 이름을 main으로 변경 (선택사항)
git branch -M main

# GitHub에 푸시
git push -u origin main
```

**중요**: `YOUR_USERNAME`을 실제 GitHub 사용자명으로 변경하세요!

### 3단계: Vercel에 배포

#### 방법 A: Vercel 웹사이트 사용 (추천)

1. Vercel 가입/로그인: https://vercel.com
2. `Add New...` → `Project` 클릭
3. GitHub 계정 연결
4. `ggumul-app` 리포지토리 선택
5. **Configure Project** 화면에서:
   - **Framework Preset**: 자동 감지되거나 `Vite` 선택
   - **Root Directory**: 그대로 두거나 `./` 입력
   - **Build Command**: 자동으로 `npm run build:preview` 사용 (vercel.json 설정)
   - **Output Directory**: 자동으로 `dist-preview` 사용 (vercel.json 설정)
6. `Deploy` 버튼 클릭
7. 1-2분 후 배포 완료!

#### 방법 B: Vercel CLI 사용

```bash
# Vercel CLI 설치 (한 번만)
npm install -g vercel

# 로그인
vercel login

# 배포
vercel --prod
```

---

## 🎉 배포 완료 후

배포가 완료되면 Vercel이 자동으로 URL을 제공합니다:
- 예: `https://ggumul-app.vercel.app`
- 또는 커스텀 도메인 설정 가능

### 자동 배포 설정됨
- `main` 브랜치에 푸시할 때마다 자동으로 재배포됩니다
- Pull Request를 만들면 자동으로 프리뷰 URL이 생성됩니다

---

## 🔧 배포 후 확인 사항

### 1. localStorage 동작 확인
브라우저에서 배포된 URL 접속 후:
- 개발자 도구 (F12) → Application → Local Storage 확인
- `ggumul_goals`, `ggumul_attempts` 키가 있어야 함

### 2. 샘플 데이터 확인
- 첫 접속 시 샘플 목표 3개가 자동 생성되어야 함:
  - 운동하기
  - 독서하기
  - 물 마시기

### 3. 주요 기능 테스트
- [ ] 목표 생성
- [ ] 카운트다운 시작
- [ ] 성공/실패 기록
- [ ] 스트릭 표시
- [ ] 부활 카드 사용 (실패 후)
- [ ] 통계 페이지

---

## 🐛 문제 해결

### CSS가 깨져 보이는 경우
- Vercel 빌드 로그 확인
- `npm run build:preview` 로컬에서 빌드 테스트

### localStorage가 작동하지 않는 경우
- 브라우저 시크릿 모드에서는 localStorage 제한이 있을 수 있음
- 일반 모드에서 테스트

### 빌드 실패 시
1. Vercel 대시보드 → 프로젝트 → Settings → Build & Development Settings
2. Build Command: `VITE_SINGLE_FILE=true npm run build:preview`
3. Output Directory: `dist-preview`
4. Redeploy

---

## 📱 모바일에서 테스트

1. 배포된 URL을 모바일 브라우저에서 접속
2. 홈 화면에 추가:
   - iOS: Safari → 공유 → 홈 화면에 추가
   - Android: Chrome → 메뉴 → 홈 화면에 추가
3. 앱처럼 사용 가능!

---

## 🔄 코드 업데이트 후 재배포

```bash
# 코드 수정 후
git add .
git commit -m "Update: 새로운 기능 추가"
git push

# Vercel이 자동으로 감지하고 재배포!
```

---

## 📊 다음 단계: 프로덕션 버전 배포

나중에 백엔드와 함께 프로덕션 버전을 배포하고 싶다면:

1. 백엔드 배포 (Railway / Render)
2. 프론트엔드 빌드 설정 변경:
   - `npm run build` (일반 빌드)
   - 환경변수 `VITE_API_URL` 설정
3. 별도 Vercel 프로젝트로 배포

---

## 💡 팁

- **커스텀 도메인**: Vercel 설정에서 무료로 추가 가능
- **환경변수**: Vercel 대시보드에서 추가 가능
- **분석**: Vercel Analytics 무료로 사용 가능
- **성능**: Vercel Edge Network로 전 세계 빠른 속도

---

## 🆘 도움이 필요하면

- Vercel 문서: https://vercel.com/docs
- GitHub 가이드: https://docs.github.com
