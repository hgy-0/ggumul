# 배포 가이드 (무료)

## 구조

```
Vercel (프론트엔드)  ←→  Railway (백엔드 + PostgreSQL)
  *.vercel.app              *.railway.app
```

---

## 1단계: GitHub에 코드 올리기

```bash
cd /Users/dongbin-shin/Documents/codes/playground/motivation
git init
git add .
git commit -m "Initial commit"
```

GitHub에서 새 레포 생성 후:

```bash
git remote add origin https://github.com/<너의계정>/motivation.git
git push -u origin main
```

---

## 2단계: Railway 백엔드 배포

1. https://railway.app 가입 (GitHub 로그인)
2. **New Project** → **Deploy from GitHub repo** 선택
3. 방금 올린 repo 선택, **Root Directory**를 `backend`로 설정
4. Railway가 Dockerfile을 감지해서 자동 빌드함

### PostgreSQL 추가

5. 같은 프로젝트에서 **+ New** → **Database** → **PostgreSQL** 클릭
6. PostgreSQL이 추가되면 `DATABASE_URL` 변수가 자동 생성됨

### 환경변수 설정 (백엔드 서비스 → Variables 탭)

| 변수명 | 값 |
|--------|-----|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` 를 선택 (자동 연결) → 앞에 `postgresql+asyncpg` 로 변경 필요* |
| `CORS_ORIGINS` | (3단계에서 Vercel URL 나오면 추가) |
| `VAPID_PRIVATE_KEY` | VAPID 키 (아래 생성 방법) |
| `VAPID_PUBLIC_KEY` | VAPID 키 |
| `VAPID_CLAIMS_EMAIL` | `mailto:your@email.com` |

> **\*** Railway가 주는 URL은 `postgresql://...` 형식인데, SQLAlchemy async는 `postgresql+asyncpg://...`가 필요합니다. Railway Variables에서 직접 입력하세요.

### VAPID 키 생성 (터미널에서)

```bash
pip3 install pywebpush
python3 -c "from pywebpush import webpush; from py_vapid import Vapid; v = Vapid(); v.generate_keys(); print('Private:', v.private_pem()); print('Public:', v.public_key)"
```

또는 https://vapidkeys.com 에서 생성 가능합니다.

7. **Settings** → **Networking** → **Generate Domain** 클릭 → `*.railway.app` URL 확인

---

## 3단계: Vercel 프론트엔드 배포

1. https://vercel.com 가입 (GitHub 로그인)
2. **Add New** → **Project** → **Import GitHub repo**
3. **Root Directory**를 `frontend`로 설정
4. **Environment Variables** 추가:

| 변수명 | 값 |
|--------|-----|
| `VITE_API_URL` | `https://너의앱.railway.app/api` |

5. **Deploy** 클릭
6. 배포 완료 후 Vercel URL (예: `motivation-xxx.vercel.app`)을 Railway의 `CORS_ORIGINS`에 추가

---

## 4단계: 휴대폰에서 사용

1. 휴대폰 브라우저에서 Vercel URL 접속
2. **홈 화면에 추가** (PWA 설치) → 앱처럼 사용 가능
3. 알림 허용하면 푸시 알림도 동작

---

## 비용 정리

| 서비스 | 비용 |
|--------|------|
| Vercel Hobby | 무료 |
| Railway ($5 크레딧/월) | 무료 (개인 사용 충분) |
| Railway PostgreSQL | 무료 (크레딧에 포함) |
| **합계** | **$0** |

---

## 코드 변경사항 요약

- `backend/requirements.txt` — asyncpg 추가 (PostgreSQL 드라이버)
- `backend/app/database.py` — SQLite/PostgreSQL 양쪽 지원
- `backend/Dockerfile` — Railway 배포용

---

## Sources

- https://www.koyeb.com/blog/top-postgresql-database-free-tiers-in-2026
- https://www.freetiers.com/blog/supabase-vs-neon-comparison
- https://vela.simplyblock.io/articles/neon-serverless-postgres-pricing-2026/
