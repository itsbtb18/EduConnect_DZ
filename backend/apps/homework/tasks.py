"""
Celery tasks for the Homework app.
Handles homework deadline notifications and reminders.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def send_homework_notification(task_id: str):
    """
    Send push notification to all students in a class when new homework is posted.
    """
    from apps.accounts.models import StudentProfile
    from apps.homework.models import HomeworkTask
    from apps.notifications.tasks import send_push_notification

    try:
        task = HomeworkTask.objects.select_related(
            "classroom", "subject", "teacher"
        ).get(id=task_id)

        students = StudentProfile.objects.filter(
            classroom=task.classroom,
            user__is_active=True,
        ).select_related("user")

        for profile in students:
            send_push_notification.delay(
                user_id=str(profile.user.id),
                title=f"📝 New Homework: {task.subject.name}",
                body=f"{task.title} — Due: {task.due_date.strftime('%d/%m/%Y')}",
                data={"type": "homework", "task_id": str(task.id)},
            )

        logger.info(f"Homework notifications sent for task: {task.title}")
        return {"status": "sent", "count": students.count()}

    except HomeworkTask.DoesNotExist:
        logger.error(f"HomeworkTask {task_id} not found")
        return {"status": "failed", "reason": "Task not found"}


@shared_task
def send_homework_deadline_reminders():
    """
    Send reminders for homework due within the next 24 hours.
    Meant to be run as a daily scheduled Celery Beat task.
    """
    from django.utils import timezone

    from apps.accounts.models import StudentProfile
    from apps.homework.models import HomeworkTask
    from apps.notifications.tasks import send_push_notification

    now = timezone.now()
    deadline = now + timezone.timedelta(hours=24)

    upcoming_tasks = HomeworkTask.objects.filter(
        due_date__range=(now, deadline),
        is_published=True,
    ).select_related("classroom", "subject")

    total_sent = 0
    for task in upcoming_tasks:
        students = StudentProfile.objects.filter(
            classroom=task.classroom,
            user__is_active=True,
        ).select_related("user")

        for profile in students:
            # Check if student has already submitted
            has_submitted = task.submissions.filter(
                student=profile.user,
                status__in=["submitted", "graded"],
            ).exists()

            if not has_submitted:
                send_push_notification.delay(
                    user_id=str(profile.user.id),
                    title=f"⏰ Homework Reminder: {task.subject.name}",
                    body=f'"{task.title}" is due tomorrow!',
                    data={"type": "homework_reminder", "task_id": str(task.id)},
                )
                total_sent += 1

    logger.info(f"Sent {total_sent} homework deadline reminders")
    return {"status": "complete", "reminders_sent": total_sent}
