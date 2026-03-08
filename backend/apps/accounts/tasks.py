"""
Celery tasks for the Accounts app.
Handles bulk student import with parent linking and SMS provisioning.
"""

import logging
import secrets
import string
from datetime import datetime

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helper — generate a random temporary password
# ---------------------------------------------------------------------------


def _generate_temp_password(length: int = 10) -> str:
    """Return a random password with letters + digits (no ambiguous chars)."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


# ---------------------------------------------------------------------------
# 1. bulk_import_students  (uses BulkImportJob for progress)
# ---------------------------------------------------------------------------


@shared_task(bind=True, max_retries=2, default_retry_delay=60)
def bulk_import_students(self, job_id: str):
    """
    Process bulk student import from an uploaded Excel file (.xlsx).

    Reads the file path, school and admin user from BulkImportJob.
    Updates the job row-by-row so the admin can poll progress.

    Expected column order (row 1 = header, data starts row 2):
        0: student_first_name
        1: student_last_name
        2: date_of_birth       (date or string YYYY-MM-DD)
        3: class_name           (e.g. '3AP-A')
        4: section_type         (PRIMARY / MIDDLE / HIGH)
        5: parent_phone         (unique identifier for parent)
        6: parent_first_name
        7: parent_last_name
        8: parent_relationship  (FATHER / MOTHER / GUARDIAN, optional)
        9: second_parent_phone  (optional)
        10: second_parent_first_name (optional)
        11: second_parent_last_name  (optional)
        12: second_parent_relationship (optional)

    Returns:
        dict with created_count, linked_count, error_rows.
    """
    from django.db import transaction

    from apps.accounts.models import BulkImportJob, User
    from apps.accounts.services import StudentParentCreationService
    from apps.academics.models import Class, StudentProfile
    from apps.schools.models import AcademicYear, School, Section

    # ------------------------------------------------------------------
    # Load BulkImportJob
    # ------------------------------------------------------------------
    try:
        job = BulkImportJob.objects.get(pk=job_id)
    except BulkImportJob.DoesNotExist:
        logger.error("BulkImportJob %s not found", job_id)
        return {"error": "Job not found"}

    job.status = BulkImportJob.Status.PROCESSING
    job.celery_task_id = self.request.id or ""
    job.save(update_fields=["status", "celery_task_id"])

    school = job.school
    admin_user = job.uploaded_by
    file_path = job.file.path

    # ------------------------------------------------------------------
    # Counters
    # ------------------------------------------------------------------
    created_count = 0
    linked_count = 0
    error_rows: list[dict] = []

    try:
        import openpyxl

        svc = StudentParentCreationService(school=school, created_by=admin_user)

        wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
        ws = wb.active

        # Count total data rows first (for progress bar)
        all_rows = list(ws.iter_rows(min_row=2, values_only=True))
        total_rows = len(all_rows)
        job.total_rows = total_rows
        job.save(update_fields=["total_rows"])

        for row_num, row in enumerate(all_rows, start=2):
            try:
                # ----------------------------------------------------------
                # 1. Parse & validate row
                # ----------------------------------------------------------
                if not row or len(row) < 8:
                    error_rows.append(
                        {
                            "row_number": row_num,
                            "reason": "Row too short (need >= 8 columns)",
                        }
                    )
                    _update_job_progress(job, created_count, linked_count, error_rows)
                    continue

                student_first = str(row[0] or "").strip()
                student_last = str(row[1] or "").strip()
                dob_raw = row[2]
                class_name = str(row[3] or "").strip()
                section_type = str(row[4] or "").strip().upper()
                parent_phone = str(row[5] or "").strip()
                parent_first = str(row[6] or "").strip()
                parent_last = str(row[7] or "").strip()
                parent_relationship = (
                    str(row[8]).strip().upper() if len(row) > 8 and row[8] else ""
                )
                second_parent_phone = (
                    str(row[9]).strip() if len(row) > 9 and row[9] else ""
                )
                second_parent_first = (
                    str(row[10]).strip() if len(row) > 10 and row[10] else ""
                )
                second_parent_last = (
                    str(row[11]).strip() if len(row) > 11 and row[11] else ""
                )
                second_parent_relationship = (
                    str(row[12]).strip().upper() if len(row) > 12 and row[12] else ""
                )

                if not student_first or not student_last:
                    error_rows.append(
                        {"row_number": row_num, "reason": "Missing student name"}
                    )
                    _update_job_progress(job, created_count, linked_count, error_rows)
                    continue
                if not class_name:
                    error_rows.append(
                        {"row_number": row_num, "reason": "Missing class_name"}
                    )
                    _update_job_progress(job, created_count, linked_count, error_rows)
                    continue
                if not section_type or section_type not in (
                    "PRIMARY",
                    "MIDDLE",
                    "HIGH",
                ):
                    error_rows.append(
                        {
                            "row_number": row_num,
                            "reason": f"Invalid section_type: {section_type}",
                        }
                    )
                    _update_job_progress(job, created_count, linked_count, error_rows)
                    continue
                if not parent_phone:
                    error_rows.append(
                        {"row_number": row_num, "reason": "Missing parent_phone"}
                    )
                    _update_job_progress(job, created_count, linked_count, error_rows)
                    continue

                # Parse date_of_birth
                date_of_birth = None
                if dob_raw:
                    if isinstance(dob_raw, datetime):
                        date_of_birth = dob_raw.date()
                    elif isinstance(dob_raw, str):
                        date_of_birth = datetime.strptime(
                            dob_raw.strip(), "%Y-%m-%d"
                        ).date()

                # ----------------------------------------------------------
                # 2. Resolve the Class
                # ----------------------------------------------------------
                section = Section.objects.get(
                    school=school,
                    section_type=section_type,
                    is_deleted=False,
                )
                academic_year = AcademicYear.objects.get(
                    school=school,
                    section=section,
                    is_current=True,
                    is_deleted=False,
                )
                class_obj = Class.objects.get(
                    section=section,
                    academic_year=academic_year,
                    name=class_name,
                    is_deleted=False,
                )

                # ----------------------------------------------------------
                # 3. Create student + parents via service (atomic)
                # ----------------------------------------------------------
                result = svc.create_student_with_parents(
                    first_name=student_first,
                    last_name=student_last,
                    current_class=class_obj,
                    date_of_birth=date_of_birth,
                    parent_phone=parent_phone,
                    parent_first_name=parent_first,
                    parent_last_name=parent_last,
                    parent_relationship=parent_relationship,
                    second_parent_phone=second_parent_phone,
                    second_parent_first_name=second_parent_first,
                    second_parent_last_name=second_parent_last,
                    second_parent_relationship=second_parent_relationship,
                )

                if not result.ok:
                    error_rows.append(
                        {
                            "row_number": row_num,
                            "reason": "; ".join(result.errors),
                        }
                    )
                else:
                    created_count += 1
                    # Count linked parents (existing phone deduplicated)
                    for pr in result.parent_results:
                        if pr.was_existing:
                            linked_count += 1
                    # Queue welcome SMS to parent(s)
                    for pr in result.parent_results:
                        if not pr.was_existing and pr.temp_password:
                            send_welcome_sms.delay(
                                phone=pr.user.phone_number,
                                student_name=f"{student_first} {student_last}",
                                temp_password=pr.temp_password,
                            )

                _update_job_progress(job, created_count, linked_count, error_rows)

            except Exception as exc:
                error_rows.append({"row_number": row_num, "reason": str(exc)})
                logger.warning("Row %d import error: %s", row_num, exc)
                _update_job_progress(job, created_count, linked_count, error_rows)

        wb.close()

    except Exception as exc:
        logger.exception("Bulk import — fatal error")
        job.status = BulkImportJob.Status.FAILED
        job.error_rows = [{"row_number": 0, "reason": f"Fatal: {exc}"}]
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "error_rows", "completed_at"])
        raise self.retry(exc=exc)

    # ------------------------------------------------------------------
    # Mark job as completed
    # ------------------------------------------------------------------
    job.status = BulkImportJob.Status.COMPLETED
    job.created_count = created_count
    job.linked_count = linked_count
    job.error_count = len(error_rows)
    job.error_rows = error_rows
    job.completed_at = timezone.now()
    job.save(
        update_fields=[
            "status",
            "created_count",
            "linked_count",
            "error_count",
            "error_rows",
            "completed_at",
        ]
    )

    # ------------------------------------------------------------------
    # Summary notification for the admin
    # ------------------------------------------------------------------
    _send_admin_summary(
        admin_user_id=str(admin_user.pk) if admin_user else "",
        school_id=str(school.pk),
        created_count=created_count,
        linked_count=linked_count,
        error_rows=error_rows,
    )

    logger.info(
        "Bulk import done — school=%s  created=%d  linked=%d  errors=%d",
        school.pk,
        created_count,
        linked_count,
        len(error_rows),
    )
    return {
        "job_id": str(job.pk),
        "created_count": created_count,
        "linked_count": linked_count,
        "error_count": len(error_rows),
    }


def _update_job_progress(job, created_count, linked_count, error_rows):
    """Increment processed_rows and persist counters (called per row)."""
    job.processed_rows += 1
    job.created_count = created_count
    job.linked_count = linked_count
    job.error_count = len(error_rows)
    job.save(
        update_fields=[
            "processed_rows",
            "created_count",
            "linked_count",
            "error_count",
        ]
    )


# ---------------------------------------------------------------------------
# 2. send_welcome_sms
# ---------------------------------------------------------------------------


@shared_task(max_retries=3, default_retry_delay=15)
def send_welcome_sms(
    phone: str,
    student_name: str,
    temp_password: str,
):
    """
    Send welcome SMS to a parent with the student's temporary credentials.

    TODO: Integrate with Algerian SMS gateway (Twilio, Infobip, local).
    """
    message = (
        f"ILMI — Bienvenue!\n"
        f"Élève: {student_name}\n"
        f"Mot de passe temporaire: {temp_password}\n"
        f"Veuillez changer le mot de passe à la première connexion."
    )

    # TODO: Replace with real SMS gateway call
    logger.info("SMS → %s : %s", phone, message[:80])
    return {"status": "queued", "phone": phone}


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _send_admin_summary(
    *,
    admin_user_id,
    school_id,
    created_count,
    linked_count,
    error_rows,
):
    """Create an in-app Notification for the admin with import results."""
    from apps.notifications.tasks import send_notification

    error_preview = ""
    if error_rows:
        first_five = error_rows[:5]
        lines = [f"  Row {e['row_number']}: {e['reason']}" for e in first_five]
        error_preview = "\n".join(lines)
        if len(error_rows) > 5:
            error_preview += f"\n  … and {len(error_rows) - 5} more"

    body = (
        f"Import terminé.\n"
        f"Créés: {created_count}\n"
        f"Liés à un parent existant: {linked_count}\n"
        f"Erreurs: {len(error_rows)}"
    )
    if error_preview:
        body += f"\n\nDétails:\n{error_preview}"

    send_notification.delay(
        user_id=admin_user_id,
        title="Import élèves terminé",
        body=body,
        notification_type="EVENT",
    )


# ---------------------------------------------------------------------------
# Security tasks
# ---------------------------------------------------------------------------


@shared_task
def check_dormant_accounts():
    """
    Suspend accounts inactive for 6 months.
    Send a warning notification 7 days before suspension.
    """
    from datetime import timedelta

    from apps.accounts.models import User
    from apps.accounts.security import log_audit

    now = timezone.now()
    six_months_ago = now - timedelta(days=180)
    warning_threshold = now - timedelta(days=173)  # 180 - 7

    # 1. Suspend dormant accounts (no login for 6 months)
    dormant_users = User.objects.filter(
        is_active=True,
        last_login__lt=six_months_ago,
    ).exclude(role="SUPER_ADMIN")

    suspended_count = 0
    for user in dormant_users:
        user.is_active = False
        user.save(update_fields=["is_active"])
        suspended_count += 1
        log_audit(
            user=user,
            action="ACCOUNT_SUSPENDED",
            metadata={"reason": "dormant_6_months", "last_login": str(user.last_login)},
        )

    # 2. Warn users approaching dormancy (7 days before)
    warning_users = User.objects.filter(
        is_active=True,
        last_login__lt=warning_threshold,
        last_login__gte=six_months_ago,
    ).exclude(role="SUPER_ADMIN")

    for user in warning_users:
        try:
            from apps.notifications.tasks import send_notification

            send_notification.delay(
                user_id=str(user.pk),
                title="Compte bientôt suspendu",
                body="Votre compte sera suspendu pour inactivité dans 7 jours. Connectez-vous pour éviter la suspension.",
                notification_type="ALERT",
            )
        except Exception:
            pass

    logger.info(
        "Dormant accounts check: suspended=%d, warned=%d",
        suspended_count,
        warning_users.count(),
    )


@shared_task
def cleanup_expired_sessions():
    """Remove expired and revoked sessions from the database."""
    from apps.accounts.models_security import ActiveSession

    now = timezone.now()
    deleted, _ = ActiveSession.objects.filter(
        models_Q(is_revoked=True) | models_Q(expires_at__lt=now)
    ).delete()

    logger.info("Cleaned up %d expired/revoked sessions", deleted)


@shared_task
def cleanup_expired_otps():
    """Remove expired and used OTP records."""
    from apps.accounts.models_security import OTPVerification

    now = timezone.now()
    deleted, _ = OTPVerification.objects.filter(
        models_Q(is_used=True) | models_Q(expires_at__lt=now)
    ).delete()

    logger.info("Cleaned up %d expired/used OTPs", deleted)


@shared_task
def cleanup_old_login_attempts():
    """Remove login attempt records older than 90 days."""
    from apps.accounts.models_security import LoginAttempt

    cutoff = timezone.now() - timezone.timedelta(days=90)
    deleted, _ = LoginAttempt.objects.filter(timestamp__lt=cutoff).delete()
    logger.info("Cleaned up %d old login attempt records", deleted)


def models_Q(**kwargs):
    """Helper to import Q without top-level import."""
    from django.db.models import Q

    return Q(**kwargs)
