"""친구 서비스 — 친구 관계 및 초대 코드 관리 비즈니스 로직"""

import random
import string
from datetime import datetime, timedelta

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Device, Friendship, Goal, InviteCode
from app.services.stats_service import StatsService


class FriendService:
    @staticmethod
    def _generate_invite_code() -> str:
        """초대 코드 생성 (MOTI-XXXXXX 형식)"""
        random_part = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=6)
        )
        return f"MOTI-{random_part}"

    @staticmethod
    async def create_invite_code(device_id: str, db: AsyncSession) -> dict:
        """
        새 초대 코드 생성 (7일간 유효).

        Returns:
            {
                "code": "MOTI-ABC123",
                "expires_at": "2026-02-09T00:00:00Z",
                "share_url": "https://yourapp.com/invite/MOTI-ABC123"
            }
        """
        code = FriendService._generate_invite_code()
        expires_at = datetime.utcnow() + timedelta(days=7)

        invite = InviteCode(
            code=code, creator_device_id=device_id, expires_at=expires_at
        )
        db.add(invite)
        await db.commit()
        await db.refresh(invite)

        return {
            "code": invite.code,
            "expires_at": invite.expires_at.isoformat() + "Z",
            "share_url": f"https://yourapp.com/invite/{invite.code}",  # TODO: 실제 URL로 변경
        }

    @staticmethod
    async def accept_invite(
        code: str, accepter_device_id: str, db: AsyncSession
    ) -> dict:
        """
        초대 코드 수락 및 친구 관계 생성.

        Returns:
            {
                "success": true,
                "friend_device_id": "creator-device-id",
                "message": "친구가 추가되었습니다!"
            }
        """
        # 1. 초대 코드 조회
        result = await db.execute(select(InviteCode).where(InviteCode.code == code))
        invite = result.scalar_one_or_none()

        if not invite:
            return {"success": False, "message": "유효하지 않은 초대 코드입니다."}

        if invite.expires_at < datetime.utcnow():
            return {"success": False, "message": "만료된 초대 코드입니다."}

        if invite.used_by_device_id:
            return {"success": False, "message": "이미 사용된 초대 코드입니다."}

        creator_device_id = invite.creator_device_id

        # 자기 자신 초대 방지
        if creator_device_id == accepter_device_id:
            return {"success": False, "message": "자기 자신을 친구로 추가할 수 없습니다."}

        # 2. 이미 친구인지 확인
        existing = await FriendService._check_friendship_exists(
            creator_device_id, accepter_device_id, db
        )
        if existing:
            return {"success": False, "message": "이미 친구입니다."}

        # 3. 친구 관계 생성 (device_id_1 < device_id_2 보장)
        device_id_1, device_id_2 = sorted([creator_device_id, accepter_device_id])
        friendship = Friendship(
            device_id_1=device_id_1, device_id_2=device_id_2, status="active"
        )
        db.add(friendship)

        # 4. 초대 코드 사용 처리
        invite.used_by_device_id = accepter_device_id

        await db.commit()

        return {
            "success": True,
            "friend_device_id": creator_device_id,
            "message": "친구가 추가되었습니다!",
        }

    @staticmethod
    async def _check_friendship_exists(
        device_id_1: str, device_id_2: str, db: AsyncSession
    ) -> bool:
        """두 디바이스 간 친구 관계 존재 여부 확인"""
        sorted_ids = sorted([device_id_1, device_id_2])
        result = await db.execute(
            select(Friendship).where(
                Friendship.device_id_1 == sorted_ids[0],
                Friendship.device_id_2 == sorted_ids[1],
                Friendship.status == "active",
            )
        )
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def get_friends(device_id: str, db: AsyncSession) -> list[dict]:
        """
        내 친구 목록 조회 (오늘 성공 여부, 연속 기록, 성공률 포함).

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
        # 친구 관계 조회
        result = await db.execute(
            select(Friendship).where(
                or_(
                    Friendship.device_id_1 == device_id,
                    Friendship.device_id_2 == device_id,
                ),
                Friendship.status == "active",
            )
        )
        friendships = result.scalars().all()

        friends = []
        for fs in friendships:
            try:
                # 친구의 device_id 추출
                friend_device_id = (
                    fs.device_id_2 if fs.device_id_1 == device_id else fs.device_id_1
                )

                # 친구의 닉네임 조회
                device_result = await db.execute(
                    select(Device).where(Device.device_id == friend_device_id)
                )
                device = device_result.scalar_one_or_none()
                nickname = device.nickname if device and device.nickname else None

                # 친구의 오늘 성공 여부 확인
                today_success = await FriendService._get_today_success(friend_device_id, db)

                # 친구의 연속 기록 조회 (TODO: streaks 테이블이 있으면 연동)
                current_streak = 0  # 나중에 구현

                # 친구의 성공률 조회 (최근 7일)
                try:
                    friend_stats = await StatsService.get_device_stats(friend_device_id, db, days=7)
                    success_rate = friend_stats.get("success_rate", 0.0)
                except Exception as e:
                    print(f"Failed to get stats for {friend_device_id}: {e}")
                    success_rate = 0.0

                friends.append(
                    {
                        "device_id": friend_device_id,
                        "nickname": nickname,
                        "today_success": today_success,
                        "current_streak": current_streak,
                        "success_rate": success_rate,
                        "created_at": fs.created_at.isoformat() + "Z",
                    }
                )
            except Exception as e:
                print(f"Failed to process friend {fs.id}: {e}")
                continue

        return friends

    @staticmethod
    async def _get_today_success(device_id: str, db: AsyncSession) -> bool:
        """오늘 해당 디바이스가 성공한 목표가 있는지 확인"""
        from datetime import date
        from app.models import Attempt

        today = date.today()

        # 오늘 성공한 시도가 있는지 확인
        result = await db.execute(
            select(Attempt)
            .join(Goal, Attempt.goal_id == Goal.id)
            .where(Goal.device_id == device_id)
            .where(Attempt.attempted_date == today)
            .where(Attempt.success == True)  # noqa: E712
        )
        attempts = result.scalars().all()
        return len(attempts) > 0

    @staticmethod
    async def remove_friend(
        device_id: str, friend_device_id: str, db: AsyncSession
    ) -> dict:
        """
        친구 삭제 (status를 'blocked'로 변경하거나 레코드 삭제).

        Returns:
            {"success": true, "message": "친구가 삭제되었습니다."}
        """
        sorted_ids = sorted([device_id, friend_device_id])
        result = await db.execute(
            select(Friendship).where(
                Friendship.device_id_1 == sorted_ids[0],
                Friendship.device_id_2 == sorted_ids[1],
            )
        )
        friendship = result.scalar_one_or_none()

        if not friendship:
            return {"success": False, "message": "친구 관계를 찾을 수 없습니다."}

        # 레코드 삭제 방식 (또는 status='blocked'로 변경 가능)
        await db.delete(friendship)
        await db.commit()

        return {"success": True, "message": "친구가 삭제되었습니다."}
