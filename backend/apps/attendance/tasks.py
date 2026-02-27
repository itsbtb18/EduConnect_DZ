"""
Celery tasks for the Attendance app.
Handles absence notifications and attendance alerts.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def notify_parent_of_absence(attendance_record_id: str):
    """
    Send push notification to parent when their child is marked absent.
    Called automatically when a teacher marks attendance.
    """
    from apps.attendance.models import AttendanceRecord
    from apps.notifications.models import Notification
    from apps.notifications.tasks import send_push_notification

    try:
        record = AttendanceRecord.objects.select_related("student", "classroom").get(
            id=attendance_record_id
        )

        if record.status not in ("absent", "late"):
            return {"status": "skipped", "reason": "Student is present"}

        student = record.student
        status_label = "absent" if record.status == "absent" else "late"

        # Find parents of this student
        parents = student.parents.all()  # via ParentProfile.children M2M reverse

        for parent in parents:
            parent_user = (
                parent.parent_profile.user
                if hasattr(parent, "parent_profile")
                else parent
            )

            # Create in-app notification
            Notification.objects.create(
                school=student.school,
                recipient=parent_user,
                title=f"Absence Alert: {student.full_name}",
                body=f"Your child {student.first_name} was marked {status_label} on {record.date.strftime('%d/%m/%Y')}.",
                data={
                    "type": "absence",
                    "student_id": str(student.id),
                    "date": str(record.date),
                },
            )

            # Send push notification
            send_push_notification.delay(
                user_id=str(parent_user.id),
                title=f"🔴 {student.first_name} marked {status_label}",
                body=f"Date: {record.date.strftime('%d/%m/%Y')} — Class: {record.classroom.name}",
                data={"type": "absence", "student_id": str(student.id)},
            )

        logger.info(
            f"Absence notification sent for {student.full_name} on {record.date}"
        )
        return {"status": "sent", "parents_notified": parents.count()}

    except AttendanceRecord.DoesNotExist:
        logger.error(f"AttendanceRecord {attendance_record_id} not found")
        return {"status": "failed", "reason": "Record not found"}


@shared_task
def check_excessive_absences():
    """
    Daily task: check for students with too many absences in the current week.
    Alerts the admin if a student has missed 3+ days in the past 7 days.
    """
    from datetime import timedelta

    from django.db.models import Count
    from django.utils import timezone

    from apps.attendance.models import AttendanceRecord
    from apps.notifications.models import Notification
    from apps.schools.models import School

    week_ago = timezone.now().date() - timedelta(days=7)

    schools = School.objects.filter(is_active=True)

    total_alerts = 0
    for school in schools:
        # Find students with 3+ absences in the past week
        frequent_absences = (
            AttendanceRecord.objects.filter(
                school=school,
                status="absent",
                date__gte=week_ago,
            )
            .values("student", "student__first_name", "student__last_name")
            .annotate(absence_count=Count("id"))
            .filter(absence_count__gte=3)
        )

        for record in frequent_absences:
            # Notify all school admins
            from django.contrib.auth import get_user_model

            User = get_user_model()
            admins = User.objects.filter(school=school, role="admin", is_active=True)

            for admin in admins:
                Notification.objects.create(
                    school=school,
                    recipient=admin,
                    title="⚠️ Excessive Absences Alert",
                    body=(
                        f"{record['student__first_name']} {record['student__last_name']} "
                        f"has been absent {record['absence_count']} times in the past 7 days."
                    ),
                    data={
                        "type": "excessive_absence",
                        "student_id": str(record["student"]),
                        "count": record["absence_count"],
                    },
                )
                total_alerts += 1

    logger.info(f"Excessive absence check complete: {total_alerts} alerts generated")
    return {"status": "complete", "alerts": total_alerts}
