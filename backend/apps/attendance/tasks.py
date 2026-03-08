"""
Celery tasks for the Attendance app.
Handles absence notifications, chronic-absenteeism detection,
daily summary, teacher reminders, and threshold alerts.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. notify_parent_of_absence — fired when a teacher marks ABSENT/LATE
# ---------------------------------------------------------------------------


@shared_task
def notify_parent_of_absence(attendance_record_id: str):
    """
    Send push notification to parent when their child is marked absent.
    Called automatically when a teacher marks attendance.
    """
    from apps.attendance.models import AttendanceRecord
    from apps.notifications.models import Notification

    try:
        record = AttendanceRecord.objects.select_related(
            "student__user", "class_obj"
        ).get(id=attendance_record_id)

        if record.status not in (
            AttendanceRecord.Status.ABSENT,
            AttendanceRecord.Status.LATE,
        ):
            return {"status": "skipped", "reason": "Student is present"}

        student_profile = record.student
        student_user = student_profile.user
        status_label = "absent" if record.status == AttendanceRecord.Status.ABSENT else "en retard"

        # Find parents linked to this student
        parent_profiles = student_profile.parents.select_related("user").all()

        notified = 0
        for parent_profile in parent_profiles:
            parent_user = parent_profile.user

            # Create in-app notification
            Notification.objects.create(
                user=parent_user,
                school=record.school,
                title=f"Alerte d'absence : {student_user.full_name}",
                body=(
                    f"Votre enfant {student_user.first_name} a été marqué "
                    f"{status_label} le {record.date.strftime('%d/%m/%Y')}."
                ),
                notification_type=Notification.NotificationType.ATTENDANCE,
                related_object_id=record.pk,
                related_object_type="AttendanceRecord",
            )

            # Send FCM push via device tokens
            _send_fcm_for_user(
                parent_user,
                title=f"🔴 {student_user.first_name} — {status_label}",
                body=f"Date : {record.date.strftime('%d/%m/%Y')} — Classe : {record.class_obj.name}",
                data={"type": "absence", "student_id": str(student_profile.pk)},
            )
            notified += 1

        logger.info(
            "Absence notification sent for %s on %s — %d parents",
            student_user.full_name,
            record.date,
            notified,
        )
        return {"status": "sent", "parents_notified": notified}

    except AttendanceRecord.DoesNotExist:
        logger.error("AttendanceRecord %s not found", attendance_record_id)
        return {"status": "failed", "reason": "Record not found"}


# ---------------------------------------------------------------------------
# 2. detect_chronic_absenteeism — daily Celery Beat task
# ---------------------------------------------------------------------------


@shared_task
def detect_chronic_absenteeism():
    """
    Daily task: for each active school, find students whose **unjustified**
    absences in the **current calendar month** exceed the school's
    configurable ``absence_alert_threshold`` (default 5).

    Generates in-app Notification + FCM push for:
      • Every admin of the school
      • Every parent linked to the flagged student

    Also broadcasts via the WebSocket `notifications_<user_id>` channel
    so that connected clients receive the alert in real time.
    """
    from datetime import date

    from django.db.models import Count
    from django.utils import timezone

    from apps.academics.models import StudentProfile
    from apps.attendance.models import AttendanceRecord
    from apps.notifications.models import Notification
    from apps.schools.models import School

    today = timezone.now().date()
    month_start = date(today.year, today.month, 1)

    schools = School.objects.filter(is_active=True, is_deleted=False)
    total_alerts = 0

    for school in schools:
        threshold = school.absence_alert_threshold or 5

        # Students with unjustified absences >= threshold this month
        flagged = (
            AttendanceRecord.objects.filter(
                school=school,
                status=AttendanceRecord.Status.ABSENT,
                is_justified=False,
                date__gte=month_start,
                date__lte=today,
            )
            .values("student")
            .annotate(absence_count=Count("id"))
            .filter(absence_count__gte=threshold)
        )

        if not flagged:
            continue

        # Resolve student profiles
        student_ids = [f["student"] for f in flagged]
        counts_map = {f["student"]: f["absence_count"] for f in flagged}
        students = StudentProfile.objects.filter(pk__in=student_ids).select_related(
            "user"
        )

        # Collect all admin users for this school
        from apps.accounts.models import User

        admins = list(
            User.objects.filter(
                school=school,
                role__in=[User.Role.ADMIN, User.Role.SECTION_ADMIN, User.Role.SUPER_ADMIN],
                is_active=True,
            )
        )

        for student in students:
            count = counts_map[student.pk]
            student_name = student.user.full_name

            alert_title = "⚠️ Absentéisme chronique"
            alert_body = (
                f"{student_name} cumule {count} absence(s) non justifiée(s) "
                f"en {today.strftime('%B %Y')} (seuil : {threshold})."
            )

            # ── Notify admins ──────────────────────────────────
            for admin in admins:
                Notification.objects.create(
                    user=admin,
                    school=school,
                    title=alert_title,
                    body=alert_body,
                    notification_type=Notification.NotificationType.ATTENDANCE,
                    related_object_id=student.pk,
                    related_object_type="StudentProfile",
                )
                _push_ws_notification(admin, alert_title, alert_body)
                total_alerts += 1

            # ── Notify parents ─────────────────────────────────
            parent_profiles = student.parents.select_related("user").all()
            for pp in parent_profiles:
                parent_user = pp.user
                parent_body = (
                    f"Votre enfant {student_name} cumule {count} absence(s) "
                    f"non justifiée(s) ce mois-ci (seuil : {threshold})."
                )
                Notification.objects.create(
                    user=parent_user,
                    school=school,
                    title=alert_title,
                    body=parent_body,
                    notification_type=Notification.NotificationType.ATTENDANCE,
                    related_object_id=student.pk,
                    related_object_type="StudentProfile",
                )
                _send_fcm_for_user(
                    parent_user,
                    title=alert_title,
                    body=parent_body,
                    data={
                        "type": "chronic_absence",
                        "student_id": str(student.pk),
                        "count": str(count),
                    },
                )
                _push_ws_notification(parent_user, alert_title, parent_body)
                total_alerts += 1

            # ── FCM push for admins (batch) ────────────────────
            _send_fcm_for_users(
                admins,
                title=alert_title,
                body=alert_body,
                data={
                    "type": "chronic_absence",
                    "student_id": str(student.pk),
                    "count": str(count),
                },
            )

    logger.info("Chronic-absenteeism check complete: %d alerts generated", total_alerts)
    return {"status": "complete", "alerts": total_alerts}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _send_fcm_for_user(user, title: str, body: str, data: dict | None = None):
    """Send FCM push to all device tokens registered for *user*."""
    from apps.notifications.models import DeviceToken
    from core.firebase import send_push_notification

    tokens = list(
        DeviceToken.objects.filter(user=user).values_list("token", flat=True)
    )
    for token in tokens:
        try:
            send_push_notification(device_token=token, title=title, body=body, data=data)
        except Exception as exc:
            logger.warning("FCM push failed for user %s: %s", user.pk, exc)


def _send_fcm_for_users(users, title: str, body: str, data: dict | None = None):
    """Batch FCM push for a list of users."""
    from apps.notifications.models import DeviceToken
    from core.firebase import send_push_to_multiple

    tokens = list(
        DeviceToken.objects.filter(user__in=users).values_list("token", flat=True)
    )
    if tokens:
        try:
            send_push_to_multiple(device_tokens=tokens, title=title, body=body, data=data)
        except Exception as exc:
            logger.warning("FCM multicast push failed: %s", exc)


def _push_ws_notification(user, title: str, body: str):
    """Push an absence_notification event via WebSocket channel layer."""
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_{user.id}",
            {
                "type": "absence_notification",
                "message": f"{title} — {body}",
            },
        )
    except Exception:
        pass  # Best-effort: user may not be connected


# ---------------------------------------------------------------------------
# 3. daily_absence_summary — sends 8h summary to admins
# ---------------------------------------------------------------------------


@shared_task
def daily_absence_summary():
    """
    Daily task (scheduled at 8:00 PM): sends a summary of today's absences
    to all admins of each active school.
    """
    from django.db.models import Count
    from django.utils import timezone

    from apps.accounts.models import User
    from apps.attendance.models import AttendanceRecord
    from apps.notifications.models import Notification
    from apps.schools.models import School

    today = timezone.now().date()
    schools = School.objects.filter(is_active=True, is_deleted=False)
    total_summaries = 0

    for school in schools:
        absent_count = AttendanceRecord.objects.filter(
            school=school,
            date=today,
            status=AttendanceRecord.Status.ABSENT,
        ).count()

        late_count = AttendanceRecord.objects.filter(
            school=school,
            date=today,
            status=AttendanceRecord.Status.LATE,
        ).count()

        total_marked = AttendanceRecord.objects.filter(
            school=school,
            date=today,
        ).count()

        if total_marked == 0:
            continue

        admins = User.objects.filter(
            school=school,
            role__in=[User.Role.ADMIN, User.Role.SECTION_ADMIN],
            is_active=True,
        )

        summary_body = (
            f"Résumé du {today.strftime('%d/%m/%Y')} :\n"
            f"• {total_marked} élèves marqués\n"
            f"• {absent_count} absent(s)\n"
            f"• {late_count} retard(s)\n"
            f"• {total_marked - absent_count - late_count} présent(s)"
        )

        for admin in admins:
            Notification.objects.create(
                user=admin,
                school=school,
                title="📊 Résumé quotidien des absences",
                body=summary_body,
                notification_type=Notification.NotificationType.ATTENDANCE,
            )
            _push_ws_notification(admin, "Résumé quotidien", summary_body)
            total_summaries += 1

    logger.info("Daily absence summary sent: %d summaries", total_summaries)
    return {"status": "complete", "summaries": total_summaries}


# ---------------------------------------------------------------------------
# 4. teacher_attendance_reminder — 10h reminder for unmarked teachers
# ---------------------------------------------------------------------------


@shared_task
def teacher_attendance_reminder():
    """
    Daily task (scheduled at 10:00 AM): reminds teachers who haven't
    marked attendance for today.
    """
    from django.utils import timezone

    from apps.accounts.models import User
    from apps.attendance.models import AttendanceRecord
    from apps.notifications.models import Notification
    from apps.schools.models import School

    today = timezone.now().date()
    schools = School.objects.filter(is_active=True, is_deleted=False)
    reminders_sent = 0

    for school in schools:
        all_teachers = set(
            User.objects.filter(
                school=school,
                role=User.Role.TEACHER,
                is_active=True,
            ).values_list("id", flat=True)
        )

        marked_teachers = set(
            AttendanceRecord.objects.filter(
                school=school,
                date=today,
            ).values_list("marked_by_id", flat=True).distinct()
        )

        unmarked = all_teachers - marked_teachers
        if not unmarked:
            continue

        unmarked_users = User.objects.filter(id__in=unmarked)
        for teacher in unmarked_users:
            Notification.objects.create(
                user=teacher,
                school=school,
                title="⏰ Rappel : Présences non marquées",
                body=(
                    f"Il est 10h et vous n'avez pas encore marqué "
                    f"les présences pour aujourd'hui ({today.strftime('%d/%m/%Y')})."
                ),
                notification_type=Notification.NotificationType.ATTENDANCE,
            )
            _send_fcm_for_user(
                teacher,
                title="⏰ Rappel de présences",
                body="Vous n'avez pas encore marqué les présences pour aujourd'hui.",
                data={"type": "attendance_reminder"},
            )
            reminders_sent += 1

    logger.info("Teacher attendance reminders sent: %d", reminders_sent)
    return {"status": "complete", "reminders": reminders_sent}
