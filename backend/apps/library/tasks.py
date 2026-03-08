"""
Library Celery tasks — overdue detection and due-date reminders.
"""

import datetime
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


def _send_fcm_for_users(users, title, body, data=None):
    """Helper — send FCM push to a list of users."""
    try:
        from apps.notifications.models import DeviceToken
        from core.firebase import send_push_to_multiple
    except ImportError:
        logger.warning("FCM modules not available — skipping push.")
        return

    tokens = list(
        DeviceToken.objects.filter(user__in=users, is_active=True)
        .values_list("token", flat=True)
    )
    if tokens:
        send_push_to_multiple(tokens, title, body, data or {})


@shared_task(name="apps.library.tasks.check_overdue_loans")
def check_overdue_loans():
    """
    Daily — mark ACTIVE loans past due_date as OVERDUE and notify
    borrowers (+ parents for student borrowers).
    """
    from apps.accounts.models import User
    from apps.library.models import Loan

    today = datetime.date.today()
    overdue_qs = Loan.objects.filter(
        status=Loan.Status.ACTIVE,
        due_date__lt=today,
        is_deleted=False,
    )

    count = 0
    for loan in overdue_qs:
        loan.status = Loan.Status.OVERDUE
        loan.save(update_fields=["status", "updated_at"])
        count += 1

        borrower = loan.borrower
        title = "📚 Livre en retard"
        body = (
            f"Le livre « {loan.book_copy.book.title} » "
            f"devait être retourné le {loan.due_date}."
        )
        _send_fcm_for_users([borrower], title, body, {"loan_id": str(loan.id)})

        # Notify parents of student borrowers
        if borrower.role == "STUDENT":
            parent_ids = list(
                User.objects.filter(
                    role="PARENT",
                    parent_profile__children__user=borrower,
                ).values_list("id", flat=True)
            )
            parents = list(User.objects.filter(id__in=parent_ids))
            if parents:
                body_parent = (
                    f"Le livre « {loan.book_copy.book.title} » emprunté par "
                    f"{borrower.full_name} devait être retourné le {loan.due_date}."
                )
                _send_fcm_for_users(parents, title, body_parent, {"loan_id": str(loan.id)})

    logger.info("check_overdue_loans: marked %d loans as OVERDUE", count)
    return count


@shared_task(name="apps.library.tasks.send_due_date_reminders")
def send_due_date_reminders():
    """
    Daily — send reminders for loans due tomorrow.
    """
    from apps.accounts.models import User
    from apps.library.models import Loan

    tomorrow = datetime.date.today() + datetime.timedelta(days=1)
    loans_qs = Loan.objects.filter(
        status=Loan.Status.ACTIVE,
        due_date=tomorrow,
        is_deleted=False,
    )

    count = 0
    for loan in loans_qs:
        borrower = loan.borrower
        title = "📖 Rappel de retour"
        body = (
            f"Le livre « {loan.book_copy.book.title} » "
            f"doit être retourné demain ({loan.due_date})."
        )
        _send_fcm_for_users([borrower], title, body, {"loan_id": str(loan.id)})
        count += 1

        if borrower.role == "STUDENT":
            parent_ids = list(
                User.objects.filter(
                    role="PARENT",
                    parent_profile__children__user=borrower,
                ).values_list("id", flat=True)
            )
            parents = list(User.objects.filter(id__in=parent_ids))
            if parents:
                body_parent = (
                    f"Le livre « {loan.book_copy.book.title} » emprunté par "
                    f"{borrower.full_name} doit être retourné demain ({loan.due_date})."
                )
                _send_fcm_for_users(parents, title, body_parent, {"loan_id": str(loan.id)})

    logger.info("send_due_date_reminders: sent %d reminders", count)
    return count
