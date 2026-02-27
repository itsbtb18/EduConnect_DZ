"""
Celery tasks for sending push notifications.
"""

from celery import shared_task


@shared_task
def send_push_notification(
    user_id: str, title: str, body: str, data: dict | None = None
):
    """
    Send a push notification to a user via FCM.
    Called asynchronously via Celery.

    TODO: Implement FCM integration using pyfcm.
    """
    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
        if not user.fcm_token:
            return {"status": "skipped", "reason": "No FCM token"}

        # TODO: Use pyfcm to send the notification
        # from pyfcm import FCMNotification
        # push_service = FCMNotification(api_key=settings.FCM_SERVER_KEY)
        # result = push_service.notify_single_device(
        #     registration_id=user.fcm_token,
        #     message_title=title,
        #     message_body=body,
        #     data_message=data,
        # )

        return {"status": "sent", "user_id": str(user_id)}
    except User.DoesNotExist:
        return {"status": "failed", "reason": "User not found"}


@shared_task
def send_bulk_notification(
    user_ids: list[str], title: str, body: str, data: dict | None = None
):
    """Send push notification to multiple users."""
    results = []
    for user_id in user_ids:
        result = send_push_notification.delay(user_id, title, body, data)
        results.append(str(result))
    return {"status": "queued", "count": len(user_ids)}
