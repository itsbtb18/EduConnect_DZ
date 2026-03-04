"""
╔══════════════════════════════════════════════════════════════════════════╗
║  Grades — Audit helper                                                 ║
║                                                                        ║
║  log_grade_action() — single entry-point for all audit events.         ║
║  Extracts IP from request, resolves ContentType, fills context.        ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

import logging

from django.contrib.contenttypes.models import ContentType

from .models import GradeAuditLog

logger = logging.getLogger(__name__)


def _get_client_ip(request):
    """Best-effort IP extraction (handles X-Forwarded-For from nginx)."""
    if request is None:
        return None
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_grade_action(
    *,
    action: str,
    instance,
    performed_by=None,
    request=None,
    student=None,
    old_value=None,
    new_value=None,
    reason: str = "",
    subject_name: str = "",
    exam_name: str = "",
    trimester: int | None = None,
):
    """
    Create a GradeAuditLog entry.

    Parameters
    ----------
    action : str
        One of GradeAuditLog.Action values.
    instance : Model
        The Django model instance being audited (Grade, SubjectAverage, …).
    performed_by : User | None
        The user performing the action.
    request : HttpRequest | None
        Used to extract IP address.
    student : StudentProfile | None
        The student concerned (for easy filtering).
    old_value / new_value : Decimal | None
        Before/after snapshot.
    reason : str
        Why the change was made.
    subject_name / exam_name : str
        Denormalized context for the timeline display.
    trimester : int | None
        Trimester number (1-3).
    """
    try:
        ct = ContentType.objects.get_for_model(instance)
        GradeAuditLog.objects.create(
            action=action,
            performed_by=performed_by,
            content_type=ct,
            object_id=instance.pk,
            student=student,
            old_value=old_value,
            new_value=new_value,
            reason=reason,
            subject_name=subject_name,
            exam_name=exam_name,
            trimester=trimester,
            ip_address=_get_client_ip(request),
        )
    except Exception:
        logger.exception(
            "Failed to write audit log: action=%s instance=%s", action, instance.pk
        )
