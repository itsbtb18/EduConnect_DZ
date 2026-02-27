"""
Celery tasks for push and in-app notifications.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. send_push_notification — sends FCM push to all of user's device tokens
# ---------------------------------------------------------------------------


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_push_notification(
    self, user_id: str, title: str, body: str, data: dict | None = None
):
    """
    Send an FCM push notification to every registered device token
    belonging to the given user.
    """
    from apps.notifications.models import DeviceToken

    tokens = list(
        DeviceToken.objects.filter(user_id=user_id).values_list("token", flat=True)
    )
    if not tokens:
        return {"status": "skipped", "reason": "No device tokens"}

    try:
        from pyfcm import FCMNotification
        from django.conf import settings

        push_service = FCMNotification(
            service_account_file=getattr(settings, "FCM_SERVICE_ACCOUNT_FILE", None),
            project_id=getattr(settings, "FCM_PROJECT_ID", None),
        )
        push_service.notify(
            fcm_tokens=tokens,
            notification_title=title,
            notification_body=body,
            data_payload=data,
        )
        return {"status": "sent", "user_id": user_id, "tokens": len(tokens)}
    except Exception as exc:
        logger.exception("FCM push failed for user %s", user_id)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 2. send_notification — create in-app Notification + push
# ---------------------------------------------------------------------------


@shared_task
def send_notification(
    user_id: str,
    title: str,
    body: str,
    notification_type: str = "ANNOUNCEMENT",
    related_object_id: str | None = None,
    related_object_type: str | None = None,
):
    """
    Create an in-app Notification record and fire a push notification.
    This is the primary callable used by other apps.
    """
    from apps.accounts.models import User
    from apps.notifications.models import Notification

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return {"status": "failed", "reason": "User not found"}

    Notification.objects.create(
        user=user,
        school=user.school,
        title=title,
        body=body,
        notification_type=notification_type,
        related_object_id=related_object_id,
        related_object_type=related_object_type,
    )

    # Fire push (async chained task)
    send_push_notification.delay(user_id, title, body)
    return {"status": "created", "user_id": user_id}


# ---------------------------------------------------------------------------
# 3. notify_parents_of_absence
# ---------------------------------------------------------------------------


@shared_task
def notify_parents_of_absence(student_profile_id: str, date_str: str):
    """
    Create Notification + push for all parents linked to a student
    who was marked absent on the given date.
    """
    from apps.academics.models import StudentProfile

    try:
        student = StudentProfile.objects.select_related("user").get(
            pk=student_profile_id
        )
    except StudentProfile.DoesNotExist:
        return {"status": "failed", "reason": "Student not found"}

    for parent_profile in student.parents.select_related("user").all():
        send_notification.delay(
            user_id=str(parent_profile.user_id),
            title="Absence Alert",
            body=(f"{student.user.full_name} was marked absent on {date_str}."),
            notification_type="ATTENDANCE",
            related_object_id=str(student.pk),
            related_object_type="StudentProfile",
        )

    return {"status": "notified", "student": str(student_profile_id)}


# ---------------------------------------------------------------------------
# 4. notify_grade_published
# ---------------------------------------------------------------------------


@shared_task
def notify_grade_published(grade_id: str):
    """
    Create Notification + push for student and all linked parents
    when a grade is published.
    """
    from apps.grades.models import Grade

    try:
        grade = Grade.objects.select_related("student__user", "subject").get(
            pk=grade_id
        )
    except Grade.DoesNotExist:
        return {"status": "failed", "reason": "Grade not found"}

    title = "New grade published"
    body = (
        f"{grade.subject.name} T{grade.trimester} "
        f"{grade.exam_type}: {grade.value}/{grade.max_value}"
    )

    # Notify student
    send_notification.delay(
        user_id=str(grade.student.user_id),
        title=title,
        body=f"Your {body}",
        notification_type="GRADE",
        related_object_id=str(grade.pk),
        related_object_type="Grade",
    )

    # Notify parents
    for parent_profile in grade.student.parents.select_related("user").all():
        send_notification.delay(
            user_id=str(parent_profile.user_id),
            title="Grade published",
            body=f"{grade.student.user.full_name}'s {body}",
            notification_type="GRADE",
            related_object_id=str(grade.pk),
            related_object_type="Grade",
        )

    return {"status": "notified", "grade": grade_id}


# ---------------------------------------------------------------------------
# 5. notify_admin_grade_submitted — in-app only
# ---------------------------------------------------------------------------


@shared_task
def notify_admin_grade_submitted(grade_id: str):
    """
    Create an in-app-only Notification for all school admins
    when a teacher submits a grade for review.
    """
    from apps.accounts.models import User
    from apps.grades.models import Grade
    from apps.notifications.models import Notification

    try:
        grade = Grade.objects.select_related("submitted_by", "subject__school").get(
            pk=grade_id
        )
    except Grade.DoesNotExist:
        return {"status": "failed", "reason": "Grade not found"}

    admins = User.objects.filter(
        school=grade.subject.school,
        role__in=["ADMIN", "SECTION_ADMIN"],
        is_active=True,
    )

    notifications = []
    for admin in admins:
        notifications.append(
            Notification(
                user=admin,
                school=grade.subject.school,
                title="Grade submitted for review",
                body=(
                    f"{grade.submitted_by.full_name} submitted "
                    f"{grade.subject.name} grades for review."
                ),
                notification_type="GRADE",
                related_object_id=grade.pk,
                related_object_type="Grade",
            )
        )
    Notification.objects.bulk_create(notifications)

    return {"status": "notified", "admin_count": len(notifications)}
