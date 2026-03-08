"""
Auto-sync biometric attendance logs → AttendanceRecord.
"""

import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import BiometricAttendanceLog

logger = logging.getLogger(__name__)


@receiver(post_save, sender=BiometricAttendanceLog)
def sync_to_attendance(sender, instance, created, **kwargs):
    """Create / update an AttendanceRecord when a CHECK_IN log is saved."""
    if not created:
        return
    if instance.event_type != BiometricAttendanceLog.EventType.CHECK_IN:
        return
    if instance.synced_to_attendance:
        return
    if not instance.student:
        return

    from apps.attendance.models import AttendanceRecord

    att_status = "LATE" if instance.is_late else "PRESENT"
    record, _ = AttendanceRecord.objects.update_or_create(
        student=instance.student,
        date=instance.timestamp.date(),
        school=instance.school,
        defaults={
            "status": att_status,
            "marked_by": None,
            "is_justified": False,
        },
    )

    BiometricAttendanceLog.objects.filter(pk=instance.pk).update(
        synced_to_attendance=True,
        attendance_record=record,
    )
    logger.info(
        "Synced biometric log %s → AttendanceRecord %s (%s)",
        instance.pk,
        record.pk,
        att_status,
    )
