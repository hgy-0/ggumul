"""FastAPI 애플리케이션 진입점"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, engine
from app.models import Attempt, Device, Goal, PushSubscription, NotificationSchedule, DailyStat, DeviceStat, Friendship, InviteCode  # noqa: F401 — 테이블 생성을 위해 import
from app.routers import attempts, devices, friends, goals, insights, notifications, revival, stats, streaks
from app.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작/종료 시 실행되는 lifespan 핸들러."""
    # 시작: DB 테이블 생성 + 스케줄러 시작
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("데이터베이스 테이블이 생성되었습니다.")

    start_scheduler()

    yield

    # 종료: 스케줄러 정지
    stop_scheduler()


app = FastAPI(
    title="꾸물 API",
    description="꾸물대지 말고, 지금 시작 — 동기부여 API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def device_id_middleware(request: Request, call_next):
    """
    X-Device-Id 헤더 검증 미들웨어.

    /api 경로에 대해 X-Device-Id 헤더가 필요한 엔드포인트에서는
    의존성(get_device_id)에서 처리하므로, 여기서는 디바이스 자동 등록만 수행한다.
    """
    # 디바이스 자동 등록: X-Device-Id가 있으면 devices 테이블에 upsert
    device_id = request.headers.get("x-device-id")
    if device_id and request.url.path.startswith("/api"):
        try:
            from sqlalchemy import select
            from app.database import async_session
            from app.models.device import Device

            async with async_session() as session:
                result = await session.execute(
                    select(Device).where(Device.device_id == device_id)
                )
                existing = result.scalar_one_or_none()
                if not existing:
                    session.add(Device(device_id=device_id))
                    await session.commit()
        except Exception:
            logger.warning("디바이스 자동 등록 실패 (device_id=%s)", device_id)

    response = await call_next(request)
    return response


# 전역 예외 핸들러 — 500 에러에도 CORS 헤더가 포함되도록
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# 라우터 등록
app.include_router(devices.router)
app.include_router(goals.router)
app.include_router(attempts.router)
app.include_router(streaks.router)
app.include_router(insights.router)
app.include_router(notifications.router)
app.include_router(revival.router)
app.include_router(stats.router)
app.include_router(friends.router)


@app.get("/")
async def root():
    """헬스 체크 엔드포인트."""
    return {"status": "ok", "service": "꾸물"}
