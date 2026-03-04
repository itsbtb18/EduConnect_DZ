"""
Celery tasks for the Finance (Payments) app.
- Daily: check for newly expired payments and notify school admins.
- Weekly: send payment reminders to parents.
"""

import datetime
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


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
        for admin_user in admins:
            Notification.objects.create(
                user=admin_user,
                school=school,
                title="Paiements expirés",
                body=(
                    f"{count} élève(s) ont un paiement expiré aujourd'hui — {name_list}"
                ),
                notification_type="PAYMENT",
                related_object_type="payment_expired",
            )
            total_notifications += 1

    logger.info(f"check_expired_payments: {total_notifications} notifications created")
    return {"status": "complete", "notifications": total_notifications}


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
                Notification.objects.create(
                    user=pp.user,
                    school=school,
                    title="Rappel de paiement",
                    body=(
                        f"Le paiement de {student.full_name} expire "
                        f"le {payment.period_end.strftime('%d/%m/%Y')}. "
                        f"Montant: {payment.amount_paid} DA."
                    ),
                    notification_type="PAYMENT",
                    related_object_id=payment.id,
                    related_object_type="StudentPayment",
                )
                total += 1

    logger.info(f"send_payment_reminders: {total} reminders sent")
    return {"status": "complete", "reminders_sent": total}
