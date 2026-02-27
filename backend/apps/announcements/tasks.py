"""
Celery tasks for the Announcements app.
Handles notification dispatch for new announcements and event reminders.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def send_announcement_notifications(announcement_id: str):
    """
    Send push notifications to all targeted users when a new announcement is published.
    """
    from django.contrib.auth import get_user_model

    from apps.announcements.models import Announcement
    from apps.notifications.tasks import send_push_notification

    User = get_user_model()

    try:
        announcement = Announcement.objects.get(id=announcement_id)

        # Determine target audience
        target_map = {
            "all": None,  # All users in the school
            "teachers": "teacher",
            "parents": "parent",
            "students": "student",
            "staff": None,  # Admin + teachers
        }

        qs = User.objects.filter(school=announcement.school, is_active=True)

        target_role = target_map.get(announcement.target_audience)
        if target_role:
            qs = qs.filter(role=target_role)
        elif announcement.target_audience == "staff":
            qs = qs.filter(role__in=["admin", "teacher"])

        # If specific classrooms are targeted, filter further
        if announcement.target_classrooms.exists():
            from apps.accounts.models import StudentProfile

            student_ids = StudentProfile.objects.filter(
                classroom__in=announcement.target_classrooms.all()
            ).values_list("user_id", flat=True)
            qs = qs.filter(id__in=student_ids)

        count = 0
        for user in qs.iterator():
            send_push_notification.delay(
                user_id=str(user.id),
                title=f"📣 {announcement.title}",
                body=announcement.content[:200],
                data={"type": "announcement", "announcement_id": str(announcement.id)},
            )
            count += 1

        logger.info(f"Announcement '{announcement.title}' notified to {count} users")
        return {"status": "sent", "count": count}

    except Announcement.DoesNotExist:
        logger.error(f"Announcement {announcement_id} not found")
        return {"status": "failed"}


@shared_task
def send_event_reminders():
    """
    Send reminder push notifications 24 hours before events.
    Meant to be run as a daily Celery Beat task.
    """
    from django.utils import timezone

    from apps.announcements.models import Event
    from apps.notifications.tasks import send_push_notification

    now = timezone.now()
    reminder_window = now + timezone.timedelta(hours=24)

    upcoming_events = Event.objects.filter(
        start_date__range=(now, reminder_window),
    ).select_related("school")

    total_sent = 0
    for event in upcoming_events:
        from django.contrib.auth import get_user_model

        User = get_user_model()
        users = User.objects.filter(school=event.school, is_active=True)

        for user in users.iterator():
            send_push_notification.delay(
                user_id=str(user.id),
                title=f"📅 Reminder: {event.title}",
                body=f"Tomorrow at {event.start_date.strftime('%H:%M')} — {event.location or 'School'}",
                data={"type": "event_reminder", "event_id": str(event.id)},
            )
            total_sent += 1

    logger.info(f"Event reminders sent: {total_sent}")
    return {"status": "complete", "reminders_sent": total_sent}
