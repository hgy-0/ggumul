"""디바이스 관련 API 라우터"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_device_id
from app.models import Device

router = APIRouter(prefix="/api/devices", tags=["devices"])


class NicknameUpdate(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=50, description="닉네임 (1-50자)")


class DeviceInfo(BaseModel):
    device_id: str
    nickname: str | None


@router.get("/me", response_model=DeviceInfo)
async def get_my_device_info(
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """내 디바이스 정보 조회"""
    result = await db.execute(
        select(Device).where(Device.device_id == device_id)
    )
    device = result.scalar_one_or_none()

    if not device:
        # 디바이스가 없으면 생성
        device = Device(device_id=device_id)
        db.add(device)
        await db.commit()
        await db.refresh(device)

    return DeviceInfo(
        device_id=device.device_id,
        nickname=device.nickname,
    )


@router.put("/me/nickname")
async def update_my_nickname(
    data: NicknameUpdate,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """내 닉네임 설정/수정"""
    result = await db.execute(
        select(Device).where(Device.device_id == device_id)
    )
    device = result.scalar_one_or_none()

    if not device:
        # 디바이스가 없으면 생성
        device = Device(device_id=device_id, nickname=data.nickname)
        db.add(device)
    else:
        device.nickname = data.nickname

    await db.commit()
    await db.refresh(device)

    return {
        "success": True,
        "nickname": device.nickname,
        "message": "닉네임이 설정되었습니다.",
    }
