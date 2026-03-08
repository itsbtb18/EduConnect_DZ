"""
Celery tasks for the Canteen app.
- Weekly: send next-week published menus to parents of enrolled students.
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
# Task: Send weekly menu to parents (every Saturday at 18:00)
# ---------------------------------------------------------------------------


@shared_task
def send_weekly_menu_to_parents():
    """
    For each school that has a published menu covering next week,
    send an FCM push to parents of all active canteen students.
    """
    from apps.accounts.models import User
    from apps.canteen.models import CanteenStudent, Menu

    today = datetime.date.today()
    # Next week: Monday → Sunday (or Sun → Thu for Algerian week — doesn't matter for range)
    next_monday = today + datetime.timedelta(days=(7 - today.weekday()) % 7 or 7)
    next_sunday = next_monday + datetime.timedelta(days=6)

    menus = Menu.objects.filter(
        is_published=True,
        is_deleted=False,
        start_date__lte=next_sunday,
        end_date__gte=next_monday,
    ).select_related("school")

    total_notified = 0
    for menu in menus:
        school = menu.school
        # Active canteen-enrolled student ids
        student_ids = CanteenStudent.objects.filter(
            school=school,
            is_active=True,
            is_deleted=False,
        ).values_list("student_id", flat=True)

        if not student_ids:
            continue

        # Parents linked to these students (via ParentProfile.children M2M → StudentProfile)
        parents = User.objects.filter(
            role="PARENT",
            school=school,
            is_active=True,
            parent_profile__children__user__in=student_ids,
        ).distinct()

        if not parents.exists():
            continue

        title = "🍽️ Menu de la semaine prochaine"
        body = f"{menu.title} ({menu.start_date} → {menu.end_date})"
        _send_fcm_for_users(list(parents), title, body, {"menu_id": str(menu.pk)})
        total_notified += parents.count()
        logger.info(
            "Notified %d parents for menu '%s' (school %s)",
            parents.count(),
            menu.title,
            school.pk,
        )

    return {"menus_processed": menus.count(), "parents_notified": total_notified}
