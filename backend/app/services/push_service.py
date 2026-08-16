"""푸시 알림 서비스 — Web Push 발송"""

from __future__ import annotations

import enum
import json
import logging

from pywebpush import webpush, WebPushException

from app.config import settings

logger = logging.getLogger(__name__)


class PushResult(enum.Enum):
    """푸시 발송 결과"""
    SUCCESS = "success"
    FAILED = "failed"
    GONE = "gone"


def send_push(subscription_info: dict, title: str, body: str) -> PushResult:
    """
    Web Push 알림을 발송한다.

    Returns:
        PushResult.SUCCESS: 발송 성공
        PushResult.FAILED: 발송 실패 (재시도 가능)
        PushResult.GONE: 구독 만료/해지됨 (삭제 필요)
    """
    vapid_key = settings.VAPID_PRIVATE_KEY.strip()
    if not vapid_key:
        logger.warning("VAPID_PRIVATE_KEY가 설정되지 않아 푸시 알림을 발송할 수 없습니다.")
        return PushResult.FAILED

    payload = json.dumps({
        "title": title,
        "body": body,
        "icon": "/pwa-192x192.png",
    })

    try:
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=vapid_key,
            vapid_claims={"sub": settings.VAPID_CLAIMS_EMAIL},
        )
        logger.info(f"푸시 알림 발송 성공: {title}")
        return PushResult.SUCCESS
    except WebPushException as e:
        # 410 Gone / 404 Not Found = 구독 만료
        if e.response is not None and e.response.status_code in (404, 410):
            logger.warning(f"푸시 구독 만료 (endpoint: {subscription_info.get('endpoint', '')[:50]})")
            return PushResult.GONE
        logger.error(f"푸시 알림 발송 실패: {e}")
        return PushResult.FAILED
