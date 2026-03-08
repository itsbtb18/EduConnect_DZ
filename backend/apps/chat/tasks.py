"""
Celery tasks for chat — offline FCM push notifications.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def send_offline_fcm_push(self, user_id, title, body, data=None):
    """
    Send FCM push notification to a user who is offline.
    Called when a message is sent and the recipient is not connected via WebSocket.
    """
    try:
        from apps.notifications.models import DeviceToken
        from core.firebase import send_push_notification

        tokens = list(
            DeviceToken.objects.filter(user_id=user_id).values_list("token", flat=True)
        )
        if not tokens:
            logger.info("No FCM tokens for user %s", user_id)
            return

        for token in tokens:
            try:
                send_push_notification(token, title, body, data or {})
            except Exception as exc:
                logger.warning("FCM push to token failed: %s", exc)

        logger.info("FCM push sent to %d tokens for user %s", len(tokens), user_id)
    except Exception as exc:
        logger.exception("send_offline_fcm_push failed for user %s", user_id)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def send_offline_fcm_push_batch(self, user_ids, title, body, data=None):
    """
    Batch FCM push notification to multiple offline users.
    Used for group/broadcast room messages.
    """
    try:
        from apps.notifications.models import DeviceToken
        from core.firebase import send_push_to_multiple

        tokens = list(
            DeviceToken.objects.filter(user_id__in=user_ids).values_list(
                "token", flat=True
            )
        )
        if not tokens:
            logger.info("No FCM tokens for users %s", user_ids)
            return

        send_push_to_multiple(tokens, title, body, data or {})
        logger.info("Batch FCM push sent to %d tokens", len(tokens))
    except Exception as exc:
        logger.exception("send_offline_fcm_push_batch failed")
        raise self.retry(exc=exc)


@shared_task
def send_announcement_notification(announcement_id):
    """
    Send FCM push for a new announcement to its target audience.
    """
    try:
        from apps.accounts.models import User
        from apps.announcements.models import Announcement
        from apps.notifications.models import DeviceToken
        from core.firebase import send_push_to_multiple

        announcement = Announcement.objects.select_related("school").get(
            pk=announcement_id
        )
        school = announcement.school

        # Build user queryset based on target audience
        users = User.objects.filter(school=school, is_active=True)

        if announcement.target_audience == "ALL":
            pass
        elif announcement.target_audience == "PARENTS":
            users = users.filter(role=User.Role.PARENT)
        elif announcement.target_audience == "STUDENTS":
            users = users.filter(role=User.Role.STUDENT)
        elif announcement.target_audience == "TEACHERS":
            users = users.filter(role=User.Role.TEACHER)
        elif announcement.target_audience == "SPECIFIC_SECTION":
            if announcement.target_section_id:
                from apps.academics.models import StudentProfile
                student_ids = StudentProfile.objects.filter(
                    current_class__section_id=announcement.target_section_id
                ).values_list("user_id", flat=True)
                users = users.filter(id__in=student_ids)
        elif announcement.target_audience == "SPECIFIC_CLASS":
            if announcement.target_class_id:
                from apps.academics.models import StudentProfile
                student_ids = StudentProfile.objects.filter(
                    current_class_id=announcement.target_class_id
                ).values_list("user_id", flat=True)
                users = users.filter(id__in=student_ids)

        user_ids = list(users.values_list("id", flat=True))
        tokens = list(
            DeviceToken.objects.filter(user_id__in=user_ids).values_list(
                "token", flat=True
            )
        )

        if tokens:
            prefix = "🔴 URGENT: " if announcement.is_urgent else ""
            send_push_to_multiple(
                tokens,
                f"{prefix}{announcement.title}",
                announcement.body[:200],
                {"announcement_id": str(announcement.id)},
            )
            logger.info(
                "Announcement FCM sent to %d tokens for announcement %s",
                len(tokens),
                announcement_id,
            )
    except Exception:
        logger.exception(
            "send_announcement_notification failed for announcement %s",
            announcement_id,
        )


@shared_task
def publish_scheduled_announcements():
    """
    Publish announcements whose publish_at <= now and published_at is null.
    Should be run via Celery Beat every minute.
    """
    from django.utils import timezone

    from apps.announcements.models import Announcement

    now = timezone.now()
    pending = Announcement.objects.filter(
        publish_at__lte=now,
        published_at__isnull=True,
        is_deleted=False,
    )
    count = 0
    for announcement in pending:
        announcement.published_at = now
        announcement.save(update_fields=["published_at"])
        send_announcement_notification.delay(str(announcement.id))
        count += 1

    if count:
        logger.info("Published %d scheduled announcements", count)
