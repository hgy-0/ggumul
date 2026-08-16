"""애플리케이션 설정 모듈"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """환경 변수 기반 설정 클래스"""

    # 데이터베이스
    DATABASE_URL: str = "sqlite+aiosqlite:///./motivation.db"

    # CORS 허용 오리진 (콤마 구분)
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # VAPID 키 (Web Push 알림용)
    VAPID_PRIVATE_KEY: str = ""
    VAPID_PUBLIC_KEY: str = ""
    VAPID_CLAIMS_EMAIL: str = "mailto:admin@example.com"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
