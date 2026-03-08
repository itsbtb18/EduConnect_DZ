"""
Celery tasks for the Transport app.

- Daily morning: remind parents of bus departure time
- Daily afternoon: remind parents of bus return time
"""

import datetime
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers — FCM push
# ---------------------------------------------------------------------------


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
# Task: Send daily departure reminder (every school day at 06:30)
# ---------------------------------------------------------------------------


@shared_task
def send_transport_departure_reminder():
    """
    For each active transport line, send a push notification to parents
    of assigned students reminding them of the morning departure time.
    Runs Sun-Thu (Algerian school week).
    """
    from apps.accounts.models import User
    from apps.transport.models import StudentTransport, TransportLine

    today = datetime.date.today()
    # Algerian school week: Sunday (6) to Thursday (3)
    # Python weekday: Mon=0 … Sun=6
    day = today.weekday()
    if day not in (6, 0, 1, 2, 3):  # Sun=6, Mon=0, Tue=1, Wed=2, Thu=3
        logger.info("Not a school day (%s) — skipping transport reminder.", day)
        return

    lines = TransportLine.objects.filter(is_active=True, is_deleted=False)
    total_sent = 0

    for line in lines:
        if not line.departure_time:
            continue

        student_ids = list(
            StudentTransport.objects.filter(
                line=line, is_active=True, is_deleted=False,
            ).values_list("student_id", flat=True)
        )
        if not student_ids:
            continue

        # Find parents of these students
        parents = User.objects.filter(
            role="PARENT",
            parent_profile__children__user__in=student_ids,
        ).distinct()

        if not parents.exists():
            continue

        dep_str = line.departure_time.strftime("%H:%M")
        title = "🚌 Rappel transport scolaire"
        body = (
            f"Le bus « {line.name} » part à {dep_str} ce matin. "
            f"Préparez votre enfant !"
        )
        _send_fcm_for_users(
            parents,
            title,
            body,
            {"type": "transport_departure", "line_id": str(line.id)},
        )
        total_sent += parents.count()

    logger.info(
        "Transport departure reminders sent to %d parents across %d lines.",
        total_sent,
        lines.count(),
    )


# ---------------------------------------------------------------------------
# Task: Send daily return reminder (every school day at 14:00)
# ---------------------------------------------------------------------------


@shared_task
def send_transport_return_reminder():
    """
    For each active transport line, send a push notification to parents
    reminding them of the afternoon return time.
    """
    from apps.accounts.models import User
    from apps.transport.models import StudentTransport, TransportLine

    today = datetime.date.today()
    day = today.weekday()
    if day not in (6, 0, 1, 2, 3):
        logger.info("Not a school day (%s) — skipping return reminder.", day)
        return

    lines = TransportLine.objects.filter(is_active=True, is_deleted=False)
    total_sent = 0

    for line in lines:
        if not line.return_time:
            continue

        student_ids = list(
            StudentTransport.objects.filter(
                line=line, is_active=True, is_deleted=False,
            ).values_list("student_id", flat=True)
        )
        if not student_ids:
            continue

        parents = User.objects.filter(
            role="PARENT",
            parent_profile__children__user__in=student_ids,
        ).distinct()

        if not parents.exists():
            continue

        ret_str = line.return_time.strftime("%H:%M")
        title = "🚌 Retour transport scolaire"
        body = (
            f"Le bus « {line.name} » quitte l'école à {ret_str}. "
            f"Votre enfant sera bientôt à l'arrêt."
        )
        _send_fcm_for_users(
            parents,
            title,
            body,
            {"type": "transport_return", "line_id": str(line.id)},
        )
        total_sent += parents.count()

    logger.info(
        "Transport return reminders sent to %d parents across %d lines.",
        total_sent,
        lines.count(),
    )
