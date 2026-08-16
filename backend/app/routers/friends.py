"""친구 API 라우터 — 친구 추가, 삭제, 목록 조회"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_device_id
from app.services.friend_service import FriendService

router = APIRouter(prefix="/api/friends", tags=["friends"])


@router.post("/invite")
async def create_invite_code(
    device_id: str = Depends(get_device_id), db: AsyncSession = Depends(get_db)
):
    """
    초대 코드 생성.

    Returns:
        {
            "code": "MOTI-ABC123",
            "expires_at": "2026-02-09T00:00:00Z",
            "share_url": "https://yourapp.com/invite/MOTI-ABC123"
        }
    """
    result = await FriendService.create_invite_code(device_id, db)
    return result


@router.post("/accept/{code}")
async def accept_invite_code(
    code: str,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """
    초대 코드 수락 및 친구 추가.

    Returns:
        {
            "success": true,
            "friend_device_id": "creator-device-id",
            "message": "친구가 추가되었습니다!"
        }
    """
    result = await FriendService.accept_invite(code, device_id, db)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result


@router.get("")
async def get_friends(
    device_id: str = Depends(get_device_id), db: AsyncSession = Depends(get_db)
):
    """
    내 친구 목록 조회.

    Returns:
        [
            {
                "device_id": "friend-device-123",
                "today_success": true,
                "current_streak": 7,
                "success_rate": 0.85,
                "created_at": "2026-02-01T12:00:00Z"
            },
            ...
        ]
    """
    friends = await FriendService.get_friends(device_id, db)
    return friends


@router.delete("/{friend_device_id}")
async def remove_friend(
    friend_device_id: str,
    device_id: str = Depends(get_device_id),
    db: AsyncSession = Depends(get_db),
):
    """
    친구 삭제.

    Returns:
        {"success": true, "message": "친구가 삭제되었습니다."}
    """
    result = await FriendService.remove_friend(device_id, friend_device_id, db)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result
