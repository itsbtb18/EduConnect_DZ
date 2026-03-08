"""
Celery tasks for the schools app.

Includes:
- archive_completed_academic_years  (already referenced in beat schedule)
- check_subscription_renewals       (subscription lifecycle management)
"""

import logging
from datetime import date, timedelta

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name="apps.schools.tasks.archive_completed_academic_years")
def archive_completed_academic_years():
    """Archive academic years whose end_date has passed."""
    from apps.schools.models import AcademicYear

    today = date.today()
    expired = AcademicYear.objects.filter(end_date__lt=today, is_current=True)
    count = expired.update(is_current=False)
    logger.info("Archived %d completed academic years.", count)
    return count


@shared_task(name="apps.schools.tasks.check_subscription_renewals")
def check_subscription_renewals():
    """
    Daily check for schools whose subscriptions are expiring soon.

    Actions:
      J-30  → info notification to school admin
      J-15  → warning notification
      J-7   → urgent notification
      J-0   → suspend school (is_active = False)
      J+7   → deactivate all optional modules
    """
    from apps.schools.models import School, SchoolSubscription

    today = date.today()
    results = {
        "notified_30": 0,
        "notified_15": 0,
        "notified_7": 0,
        "suspended": 0,
        "modules_disabled": 0,
    }

    subscriptions = SchoolSubscription.objects.filter(
        is_active=True, subscription_end__isnull=False
    ).select_related("school")

    for sub in subscriptions:
        remaining = (sub.subscription_end - today).days

        if remaining == 30:
            _notify_renewal(sub.school, days=30, level="info")
            results["notified_30"] += 1

        elif remaining == 15:
            _notify_renewal(sub.school, days=15, level="warning")
            results["notified_15"] += 1

        elif remaining == 7:
            _notify_renewal(sub.school, days=7, level="urgent")
            results["notified_7"] += 1

        elif remaining == 0:
            # Suspend school
            sub.is_active = False
            sub.suspension_reason = "Abonnement expiré — renouvellement requis."
            sub.save(update_fields=["is_active", "suspension_reason", "updated_at"])
            sub.school.subscription_active = False
            sub.school.save(update_fields=["subscription_active", "updated_at"])
            _notify_renewal(sub.school, days=0, level="suspend")
            results["suspended"] += 1

        elif remaining == -7:
            # Deactivate all optional modules
            optional_fields = [
                "module_empreintes",
                "module_finance",
                "module_cantine",
                "module_transport",
                "module_auto_education",
                "module_sms",
                "module_bibliotheque",
                "module_infirmerie",
                "module_mobile_apps",
                "module_ai_chatbot",
            ]
            for field in optional_fields:
                setattr(sub, field, False)
            sub.save()
            results["modules_disabled"] += 1
            logger.info(
                "Disabled optional modules for school %s (expired +7 days).",
                sub.school.name,
            )

    logger.info("Subscription renewal check complete: %s", results)
    return results


def _notify_renewal(school, days, level):
    """
    Send renewal notification to school admin(s).
    """
    from apps.accounts.models import User

    admins = User.objects.filter(school=school, role=User.Role.ADMIN, is_active=True)

    if days > 0:
        message = (
            f"Votre abonnement ILMI expire dans {days} jours. "
            f"Veuillez contacter le support pour le renouvellement."
        )
    elif days == 0:
        message = (
            "Votre abonnement ILMI a expiré aujourd'hui. "
            "L'accès à la plateforme est suspendu."
        )
    else:
        message = (
            "Votre abonnement ILMI est expiré. "
            "Les modules optionnels ont été désactivés."
        )

    try:
        from apps.notifications.models import Notification

        for admin in admins:
            Notification.objects.create(
                recipient=admin,
                title="Renouvellement d'abonnement"
                if days > 0
                else "Abonnement expiré",
                message=message,
                notification_type="system",
                priority=level if level != "suspend" else "urgent",
            )
    except Exception:
        logger.warning(
            "Could not send renewal notification for school %s (days=%d).",
            school.name,
            days,
        )
