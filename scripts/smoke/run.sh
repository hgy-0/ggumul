#!/bin/sh
# 게스트 모드 스모크 테스트: esbuild로 번들 후 Node에서 실행
set -e
cd "$(dirname "$0")/../.."
OUT=scripts/smoke/bundles
mkdir -p "$OUT"

DEFINES="--define:import.meta.env.VITE_SINGLE_FILE=\"true\" \
  --define:import.meta.env.VITE_API_URL=\"\" \
  --define:import.meta.env.VITE_FIREBASE_API_KEY=\"\" \
  --define:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN=\"\" \
  --define:import.meta.env.VITE_FIREBASE_PROJECT_ID=\"\" \
  --define:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET=\"\" \
  --define:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID=\"\" \
  --define:import.meta.env.VITE_FIREBASE_APP_ID=\"\""

npx esbuild src/utils/localStorage.ts --bundle --format=esm --alias:@=./src $DEFINES --outfile="$OUT/localStorage.bundle.mjs" --log-level=error
npx esbuild src/api/goals.ts --bundle --format=esm --alias:@=./src $DEFINES --outfile="$OUT/api-goals.bundle.mjs" --log-level=error
npx esbuild src/api/attempts.ts --bundle --format=esm --alias:@=./src $DEFINES --outfile="$OUT/api-attempts.bundle.mjs" --log-level=error

node scripts/smoke/guest-flow.test.mjs
