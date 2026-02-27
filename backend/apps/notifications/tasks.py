"""
Celery tasks for sending push notifications via Firebase V1 API.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def send_push_notification(
    user_id: str, title: str, body: str, data: dict | None = None
):
    """
    Send a push notification to a single user via Firebase V1 API.
    Called asynchronously via Celery.
    """
    from django.contrib.auth import get_user_model

    from core.firebase import send_push_notification as firebase_send

    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
        if not user.fcm_token:
            return {"status": "skipped", "reason": "No FCM token"}

        result = firebase_send(
            device_token=user.fcm_token,
            title=title,
            body=body,
            data=data,
        )

        if result.get("success"):
            return {
                "status": "sent",
                "user_id": str(user_id),
                "message_id": result["message_id"],
            }

        # If token is unregistered, clear it from the user
        if result.get("error") == "token_unregistered":
            user.fcm_token = None
            user.save(update_fields=["fcm_token"])
            logger.warning("Cleared expired FCM token for user %s", user_id)

        return {
            "status": "failed",
            "user_id": str(user_id),
            "error": result.get("error"),
        }

    except User.DoesNotExist:
        return {"status": "failed", "reason": "User not found"}


@shared_task
def send_bulk_notification(
    user_ids: list[str], title: str, body: str, data: dict | None = None
):
    """
    Send push notification to multiple users.
    Collects FCM tokens and uses Firebase multicast (up to 500 per call).
    """
    from django.contrib.auth import get_user_model

    from core.firebase import send_push_to_multiple

    User = get_user_model()
    tokens = list(
        User.objects.filter(
            id__in=user_ids,
            fcm_token__isnull=False,
        )
        .exclude(fcm_token="")
        .values_list("fcm_token", flat=True)
    )

    if not tokens:
        return {"status": "skipped", "reason": "No valid FCM tokens"}

    result = send_push_to_multiple(
        device_tokens=tokens,
        title=title,
        body=body,
        data=data,
    )
    return {
        "status": "sent",
        "success_count": result["success_count"],
        "failure_count": result["failure_count"],
    }
