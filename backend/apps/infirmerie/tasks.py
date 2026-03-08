"""
Celery tasks for the Infirmerie module.
- Vaccination reminders (J-30 and J-7 before due date)
- Medication low-stock alerts
- Contagious disease follow-up
"""

import datetime
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


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


# ---------------------------------------------------------------------------
# Task 1: Vaccination reminders (daily 07:00)
# ---------------------------------------------------------------------------


@shared_task
def send_vaccination_reminders():
    """
    Daily task: send reminders for vaccinations due in 30 days and 7 days.
    Notifies parents via FCM push notification.
    """
    from apps.notifications.models import Notification
    from apps.schools.models import School

    from .models import Vaccination

    today = datetime.date.today()
    j30 = today + datetime.timedelta(days=30)
    j7 = today + datetime.timedelta(days=7)
    total = 0

    for school in School.objects.filter(is_active=True):
        # J-30 reminders
        vacc_30 = Vaccination.objects.filter(
            medical_record__school=school,
            is_deleted=False,
            status__in=["SCHEDULED", "NOT_DONE"],
            next_due_date=j30,
        ).select_related("medical_record__student")

        for v in vacc_30:
            student = v.medical_record.student
            parent = getattr(student, "parent", None)
            if parent:
                Notification.objects.create(
                    school=school,
                    user=parent,
                    title="Rappel vaccination (J-30)",
                    message=f"Le vaccin {v.vaccine_name} de {student.get_full_name()} est prévu dans 30 jours.",
                    notification_type="VACCINATION_REMINDER",
                    created_by=parent,
                )
                _send_fcm_for_user(
                    parent, "Rappel vaccination", f"{v.vaccine_name} - dans 30 jours"
                )
                total += 1

        # J-7 reminders
        vacc_7 = Vaccination.objects.filter(
            medical_record__school=school,
            is_deleted=False,
            status__in=["SCHEDULED", "NOT_DONE"],
            next_due_date=j7,
        ).select_related("medical_record__student")

        for v in vacc_7:
            student = v.medical_record.student
            parent = getattr(student, "parent", None)
            if parent:
                Notification.objects.create(
                    school=school,
                    user=parent,
                    title="Rappel vaccination URGENT (J-7)",
                    message=f"Le vaccin {v.vaccine_name} de {student.get_full_name()} est prévu dans 7 jours.",
                    notification_type="VACCINATION_REMINDER",
                    created_by=parent,
                )
                _send_fcm_for_user(
                    parent, "⚠️ Vaccination dans 7 jours", f"{v.vaccine_name}"
                )
                total += 1

    logger.info("Vaccination reminders sent: %d", total)
    return f"{total} vaccination reminders sent"


# ---------------------------------------------------------------------------
# Task 2: Medication stock alerts (daily 08:00)
# ---------------------------------------------------------------------------


@shared_task
def check_medication_stock():
    """
    Daily task: alert admins about medications with low stock.
    """
    from django.db.models import F

    from apps.accounts.models import User
    from apps.notifications.models import Notification
    from apps.schools.models import School

    from .models import Medication

    today = datetime.date.today()
    total = 0

    for school in School.objects.filter(is_active=True):
        low_stock = Medication.objects.filter(
            medical_record__school=school,
            is_deleted=False,
            is_active=True,
        ).filter(stock_quantity__lte=F("stock_alert_threshold"))

        if not low_stock.exists():
            continue

        admins = User.objects.filter(
            school=school,
            role__in=["ADMIN", "SECTION_ADMIN"],
            is_active=True,
        )

        med_names = ", ".join(low_stock.values_list("dci_name", flat=True)[:5])
        for admin_user in admins:
            Notification.objects.create(
                school=school,
                user=admin_user,
                title="⚠️ Stock médicaments bas",
                message=f"{low_stock.count()} médicament(s) en stock bas: {med_names}",
                notification_type="MEDICATION_STOCK",
                created_by=admin_user,
            )
            _send_fcm_for_user(
                admin_user, "Stock médicaments", f"{low_stock.count()} en stock bas"
            )
            total += 1

    logger.info("Medication stock alerts sent: %d", total)
    return f"{total} stock alerts sent"


# ---------------------------------------------------------------------------
# Task 3: Contagious disease follow-up (daily 09:00)
# ---------------------------------------------------------------------------


@shared_task
def check_contagious_disease_returns():
    """
    Daily task: check contagious diseases where authorized_return_date is today.
    Notify admin that student can return.
    """
    from apps.accounts.models import User
    from apps.notifications.models import Notification
    from apps.schools.models import School

    from .models import ContagiousDisease

    today = datetime.date.today()
    total = 0

    for school in School.objects.filter(is_active=True):
        returning = ContagiousDisease.objects.filter(
            school=school,
            is_deleted=False,
            status="EVICTION",
            authorized_return_date=today,
        ).select_related("student")

        for case in returning:
            admins = User.objects.filter(
                school=school,
                role__in=["ADMIN", "SECTION_ADMIN"],
                is_active=True,
            )
            for admin_user in admins:
                Notification.objects.create(
                    school=school,
                    user=admin_user,
                    title="Retour après éviction",
                    message=f"{case.student.get_full_name()} peut retourner en classe ({case.disease_name}).",
                    notification_type="CONTAGIOUS_RETURN",
                    created_by=admin_user,
                )
                total += 1

            # Update status
            case.status = "CLEARED"
            case.save(update_fields=["status"])

    logger.info("Contagious return alerts: %d", total)
    return f"{total} return alerts sent"


# ---------------------------------------------------------------------------
# Task 4: Mark overdue vaccinations (daily 06:00)
# ---------------------------------------------------------------------------


@shared_task
def mark_overdue_vaccinations():
    """
    Daily task: mark SCHEDULED or NOT_DONE vaccinations as OVERDUE
    if next_due_date < today.
    """
    from .models import Vaccination

    today = datetime.date.today()
    updated = Vaccination.objects.filter(
        is_deleted=False,
        status__in=["SCHEDULED", "NOT_DONE"],
        next_due_date__lt=today,
    ).update(status="OVERDUE")

    logger.info("Marked %d vaccinations as overdue", updated)
    return f"{updated} vaccinations marked overdue"
