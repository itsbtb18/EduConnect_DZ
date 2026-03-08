"""
SMS signals — auto-trigger SMS on specific events.

Listens for model signals to dispatch SMS tasks automatically.
"""

import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


# We import tasks lazily inside signal handlers to avoid circular imports
# and to ensure the Celery app is fully loaded.


@receiver(post_save, sender="attendance.Attendance")
def on_absence_recorded(sender, instance, created, **kwargs):
    """Send SMS when an absence is recorded."""
    if not created:
        return
    if getattr(instance, "status", None) != "ABSENT":
        return

    from .tasks import send_absence_sms

    school_id = str(instance.school_id) if hasattr(instance, "school_id") else None
    student_id = str(instance.student_id) if hasattr(instance, "student_id") else None
    date = str(getattr(instance, "date", ""))

    if school_id and student_id:
        # High priority: apply_async with countdown=600 (10 min delay)
        send_absence_sms.apply_async(
            args=[school_id, student_id, date],
            countdown=600,
        )
