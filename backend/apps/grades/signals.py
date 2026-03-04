"""
╔══════════════════════════════════════════════════════════════════════════╗
║  Grades Signals                                                        ║
║                                                                        ║
║  post_save  / post_delete on Grade                                     ║
║     → async_recalculate_cascade (full pipeline via Celery)             ║
║                                                                        ║
║  post_save on GradeAppeal                                              ║
║     → notify_appeal_assigned  (teacher / admin notification)           ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

import logging

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
#  Grade  →  async_recalculate_cascade
# ═══════════════════════════════════════════════════════════════════════════


@receiver(post_save, sender="grades.Grade")
def cascade_on_grade_save(sender, instance, **kwargs):
    """
    When a Grade is created or updated, trigger a full async cascade:
    SubjectAverage → TrimesterAverage → Rankings → AnnualAverage.
    """
    _dispatch_cascade(instance)


@receiver(post_delete, sender="grades.Grade")
def cascade_on_grade_delete(sender, instance, **kwargs):
    """Same as above, but after a Grade is deleted."""
    _dispatch_cascade(instance)


def _dispatch_cascade(grade_instance):
    """
    Extract context from a Grade instance and fire the Celery task.
    All IDs are stringified for JSON serialisation.
    """
    try:
        from apps.grades.tasks import async_recalculate_cascade

        et = grade_instance.exam_type
        if et is None:
            logger.warning(
                "Grade %s has no exam_type — skipping cascade", grade_instance.pk
            )
            return

        async_recalculate_cascade.delay(
            student_id=str(grade_instance.student_id),
            subject_id=str(et.subject_id),
            classroom_id=str(et.classroom_id),
            academic_year_id=str(et.academic_year_id),
            trimester=et.trimester,
        )

        logger.debug(
            "Dispatched async_recalculate_cascade for student=%s subject=%s T%s",
            grade_instance.student_id,
            et.subject_id,
            et.trimester,
        )
    except Exception:
        logger.exception("Error dispatching cascade after Grade save/delete")


# ═══════════════════════════════════════════════════════════════════════════
#  GradeAppeal  →  notify_appeal_assigned
# ═══════════════════════════════════════════════════════════════════════════


@receiver(post_save, sender="grades.GradeAppeal")
def notify_on_appeal_save(sender, instance, created, **kwargs):
    """
    When a GradeAppeal is created or updated to PENDING / UNDER_REVIEW,
    fire notification to the assigned teacher or admin.
    """
    try:
        from apps.grades.tasks import notify_appeal_assigned

        should_notify = created or instance.status in ("PENDING", "UNDER_REVIEW")
        if not should_notify:
            return

        notify_appeal_assigned.delay(appeal_id=str(instance.pk))

        logger.debug(
            "Dispatched notify_appeal_assigned for appeal=%s status=%s",
            instance.pk,
            instance.status,
        )
    except Exception:
        logger.exception("Error dispatching appeal notification for %s", instance.pk)
