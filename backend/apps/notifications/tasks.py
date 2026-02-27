"""
Celery tasks for sending push notifications via Firebase V1 API.
"""

import logging

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


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
