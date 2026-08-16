#!/bin/bash
set -e

echo "==============================="
echo "  꾸물 프로젝트 설치 스크립트"
echo "==============================="
echo ""

# 색상
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "\n${GREEN}▶ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
fail() { echo -e "${RED}✖ $1${NC}"; exit 1; }

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── 사전 조건 확인 ──────────────────────────
step "사전 조건 확인"

if ! command -v node &>/dev/null; then
  fail "Node.js가 설치되어 있지 않습니다. https://nodejs.org 에서 설치해주세요."
fi
echo "  Node.js $(node -v)"

if ! command -v npm &>/dev/null; then
  fail "npm이 설치되어 있지 않습니다."
fi
echo "  npm $(npm -v)"

if ! command -v python3 &>/dev/null; then
  fail "Python3가 설치되어 있지 않습니다. brew install python3"
fi
echo "  Python $(python3 --version)"

# ── 백엔드 설치 ──────────────────────────────
step "백엔드 의존성 설치"

cd "$ROOT_DIR/backend"

if [ ! -d "venv" ]; then
  echo "  가상환경 생성 중..."
  python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "  백엔드 패키지 설치 완료"

# .env 파일 생성 (없을 때만)
if [ ! -f ".env" ]; then
  cat > .env <<'EOF'
DATABASE_URL=sqlite+aiosqlite:///./motivation.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
VAPID_PRIVATE_KEY=
VAPID_PUBLIC_KEY=
VAPID_CLAIMS_EMAIL=mailto:admin@example.com
EOF
  warn ".env 파일이 생성되었습니다. 푸시 알림을 쓰려면 VAPID 키를 입력하세요."
else
  echo "  .env 파일이 이미 존재합니다."
fi

deactivate

# ── 프론트엔드 설치 ──────────────────────────
step "프론트엔드 의존성 설치"

cd "$ROOT_DIR/frontend"
npm install --silent
echo "  프론트엔드 패키지 설치 완료"

# ── 완료 ─────────────────────────────────────
echo ""
echo "==============================="
echo -e "${GREEN}  설치 완료!${NC}"
echo "==============================="
echo ""
echo "실행 방법:"
echo ""
echo "  [백엔드]"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --reload"
echo ""
echo "  [프론트엔드] (새 터미널)"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "  브라우저에서 http://localhost:5173 접속"
echo ""
