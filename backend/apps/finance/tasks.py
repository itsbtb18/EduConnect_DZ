"""
Celery tasks for the Finance (Payments) app.
- Daily: check for newly expired payments and notify school admins.
- Weekly: send payment reminders to parents.
- Daily: refresh enrollment statuses.
"""

import datetime
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers — FCM push
# ---------------------------------------------------------------------------


def _send_fcm_for_user(user, title, body, data=None):
    """Send FCM push to all of a user's DeviceTokens."""
    try:
        from apps.notifications.models import DeviceToken
        from core.firebase import send_push_notification

        tokens = DeviceToken.objects.filter(user=user).values_list("token", flat=True)
        for token in tokens:
            send_push_notification(token, title, body, data)
    except Exception as exc:
        logger.warning("FCM send failed for user %s: %s", user.id, exc)


def _send_fcm_for_users(users, title, body, data=None):
    """Batch FCM push to multiple users."""
    try:
        from apps.notifications.models import DeviceToken
        from core.firebase import send_push_to_multiple

        tokens = list(
            DeviceToken.objects.filter(user__in=users).values_list("token", flat=True)
        )
        if tokens:
            send_push_to_multiple(tokens, title, body, data)
    except Exception as exc:
        logger.warning("FCM batch send failed: %s", exc)


# ---------------------------------------------------------------------------
# Task 1: Check expired payments (daily 08:00)
# ---------------------------------------------------------------------------


@shared_task
def check_expired_payments():
    """
    Daily task (8:00 AM): refresh statuses and notify school admins
    of any payments that just expired.
    """
    from apps.accounts.models import User
    from apps.finance.models import StudentPayment
    from apps.notifications.models import Notification
    from apps.schools.models import School

    today = datetime.date.today()
    total_notifications = 0

    for school in School.objects.filter(is_active=True):
        # Refresh statuses: mark expired
        newly_expired = StudentPayment.objects.filter(
            school=school,
            is_deleted=False,
            period_end__lt=today,
            status=StudentPayment.Status.ACTIF,
        )
        count = newly_expired.count()
        if count == 0:
            continue

        # Collect student names
        names = list(
            newly_expired.select_related("student").values_list(
                "student__first_name", "student__last_name"
            )[:5]
        )
        name_list = ", ".join(f"{fn} {ln}" for fn, ln in names)
        if count > 5:
            name_list += f" et {count - 5} autres"

        # Update statuses
        newly_expired.update(
            status=StudentPayment.Status.EXPIRE,
        )

        # Notify school admins
        admins = User.objects.filter(
            school=school, role__in=["ADMIN", "SECTION_ADMIN"], is_active=True
        )
        title = "Paiements expirés"
        body = (
            f"{count} élève(s) ont un paiement expiré aujourd'hui — {name_list}"
        )
        for admin_user in admins:
            Notification.objects.create(
                user=admin_user,
                school=school,
                title=title,
                body=body,
                notification_type="PAYMENT",
                related_object_type="payment_expired",
            )
            total_notifications += 1

        # FCM push to admins
        _send_fcm_for_users(admins, title, body, {"type": "PAYMENT"})

    logger.info(f"check_expired_payments: {total_notifications} notifications created")
    return {"status": "complete", "notifications": total_notifications}


# ---------------------------------------------------------------------------
# Task 2: Send payment reminders (weekly, Sunday 09:00)
# ---------------------------------------------------------------------------


@shared_task
def send_payment_reminders():
    """
    Weekly: send reminders to parents whose children have payments
    expiring within 7 days.
    """
    from apps.academics.models import ParentProfile
    from apps.finance.models import StudentPayment
    from apps.notifications.models import Notification
    from apps.schools.models import School

    today = datetime.date.today()
    cutoff = today + datetime.timedelta(days=7)
    total = 0

    for school in School.objects.filter(is_active=True):
        expiring = StudentPayment.objects.filter(
            school=school,
            is_deleted=False,
            status="actif",
            period_end__gte=today,
            period_end__lte=cutoff,
        ).select_related("student", "student__student_profile")

        for payment in expiring:
            student = payment.student
            sp = getattr(student, "student_profile", None)
            if not sp:
                continue
            parents = ParentProfile.objects.filter(children=sp).select_related("user")
            for pp in parents:
                title = "Rappel de paiement"
                body = (
                    f"Le paiement de {student.full_name} expire "
                    f"le {payment.period_end.strftime('%d/%m/%Y')}. "
                    f"Montant: {payment.amount_paid} DA."
                )
                Notification.objects.create(
                    user=pp.user,
                    school=school,
                    title=title,
                    body=body,
                    notification_type="PAYMENT",
                    related_object_id=payment.id,
                    related_object_type="StudentPayment",
                )
                _send_fcm_for_user(pp.user, title, body, {"type": "PAYMENT"})
                total += 1

    logger.info(f"send_payment_reminders: {total} reminders sent")
    return {"status": "complete", "reminders_sent": total}


# ---------------------------------------------------------------------------
# Task 3: Refresh enrollment statuses (daily 08:30)
# ---------------------------------------------------------------------------


@shared_task
def refresh_enrollment_statuses():
    """
    Daily task: refresh all enrollment totals and statuses.
    This catches cases where due_date has passed and status
    should switch to LATE.
    """
    from apps.finance.models import StudentFeeEnrollment
    from apps.schools.models import School

    total_updated = 0
    for school in School.objects.filter(is_active=True):
        enrollments = StudentFeeEnrollment.objects.filter(
            school=school, is_deleted=False
        ).exclude(status="PAID")
        for enrollment in enrollments:
            old_status = enrollment.status
            enrollment.refresh_totals(commit=True)
            if enrollment.status != old_status:
                total_updated += 1

    logger.info(f"refresh_enrollment_statuses: {total_updated} statuses updated")
    return {"status": "complete", "updated": total_updated}


# ---------------------------------------------------------------------------
# Task 4: Auto-generate monthly payslips (1st of each month at 06:00)
# ---------------------------------------------------------------------------


@shared_task
def generate_monthly_payslips():
    """
    Runs on the 1st of each month.
    Generates DRAFT payslips for last month for every teacher with a
    SalaryConfig who doesn't already have a payslip for that period.
    """
    from apps.finance.models import PaySlip, SalaryConfig
    from apps.finance.payroll_service import compute_payslip

    today = datetime.date.today()
    # Target = previous month
    first_of_this_month = today.replace(day=1)
    last_month_date = first_of_this_month - datetime.timedelta(days=1)
    month = last_month_date.month
    year = last_month_date.year

    created = 0
    skipped = 0
    errors = 0

    for config in SalaryConfig.objects.select_related("teacher", "school").filter(
        school__is_active=True
    ):
        if PaySlip.objects.filter(
            teacher=config.teacher, month=month, year=year
        ).exists():
            skipped += 1
            continue
        try:
            compute_payslip(config, month, year, config.school)
            created += 1
        except Exception as exc:
            errors += 1
            logger.error(
                "Payslip generation failed for teacher %s (%s/%s): %s",
                config.teacher_id,
                month,
                year,
                exc,
            )

    logger.info(
        "generate_monthly_payslips: created=%d, skipped=%d, errors=%d",
        created,
        skipped,
        errors,
    )
    return {"created": created, "skipped": skipped, "errors": errors}

