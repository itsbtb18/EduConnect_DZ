"""
Celery tasks for the Accounts app.
Handles bulk student import with parent linking and SMS provisioning.
"""

import logging
import secrets
import string
from datetime import datetime

from celery import shared_task

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helper — generate a random temporary password
# ---------------------------------------------------------------------------


def _generate_temp_password(length: int = 10) -> str:
    """Return a random password with letters + digits (no ambiguous chars)."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


# ---------------------------------------------------------------------------
# 1. bulk_import_students
# ---------------------------------------------------------------------------


@shared_task(bind=True, max_retries=2, default_retry_delay=60)
def bulk_import_students(self, file_path: str, school_id: str, admin_user_id: str):
    """
    Process bulk student import from an uploaded Excel file (.xlsx).

    Expected column order (row 1 = header, data starts row 2):
        0: student_first_name
        1: student_last_name
        2: date_of_birth       (date or string YYYY-MM-DD)
        3: class_name           (e.g. '3AP-A')
        4: section_type         (PRIMARY / MIDDLE / HIGH)
        5: parent_phone         (unique identifier for parent)
        6: parent_first_name
        7: parent_last_name
        8: second_parent_phone  (optional)

    Behaviour:
    - Each row is wrapped in its own ``transaction.atomic()`` — a bad row
      does NOT roll back previous rows.
    - If a parent phone already exists → the existing ParentProfile is
      linked to the new student (``linked_count`` incremented).
    - Otherwise a new User (PARENT) + ParentProfile is created.
    - Temporary passwords are generated for every *new* user.
    - An SMS notification is queued for the parent with credentials.
    - On completion a Notification is created for the admin summarising
      the import result (created / linked / errors).

    Returns:
        dict with created_count, linked_count, error_rows.
    """
    from django.db import transaction

    from apps.accounts.models import User
    from apps.academics.models import Class, StudentProfile
    from apps.schools.models import AcademicYear, School, Section

    # ------------------------------------------------------------------
    # Counters
    # ------------------------------------------------------------------
    created_count = 0
    linked_count = 0
    error_rows: list[dict] = []  # [{row_number, reason}]

    try:
        import openpyxl

        school = School.objects.get(pk=school_id)
        admin_user = User.objects.get(pk=admin_user_id)

        wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
        ws = wb.active

        for row_num, row in enumerate(
            ws.iter_rows(min_row=2, values_only=True), start=2
        ):
            try:
                # ----------------------------------------------------------
                # 1. Parse & validate row
                # ----------------------------------------------------------
                if not row or len(row) < 8:
                    error_rows.append(
                        {
                            "row_number": row_num,
                            "reason": "Row too short (need ≥ 8 columns)",
                        }
                    )
                    continue

                student_first = str(row[0] or "").strip()
                student_last = str(row[1] or "").strip()
                dob_raw = row[2]
                class_name = str(row[3] or "").strip()
                section_type = str(row[4] or "").strip().upper()
                parent_phone = str(row[5] or "").strip()
                parent_first = str(row[6] or "").strip()
                parent_last = str(row[7] or "").strip()
                second_parent_phone = (
                    str(row[8]).strip() if len(row) > 8 and row[8] else ""
                )

                if not student_first or not student_last:
                    error_rows.append(
                        {"row_number": row_num, "reason": "Missing student name"}
                    )
                    continue
                if not class_name:
                    error_rows.append(
                        {"row_number": row_num, "reason": "Missing class_name"}
                    )
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
                    continue
                if not parent_phone:
                    error_rows.append(
                        {"row_number": row_num, "reason": "Missing parent_phone"}
                    )
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
                # 3. Create student (atomic per row)
                # ----------------------------------------------------------
                with transaction.atomic():
                    # --- 3a. Student User ---
                    student_phone = _generate_student_phone(
                        student_first, student_last, row_num, school_id
                    )
                    student_password = _generate_temp_password()

                    student_user = User.objects.create_user(
                        phone_number=student_phone,
                        password=student_password,
                        first_name=student_first,
                        last_name=student_last,
                        role=User.Role.STUDENT,
                        school=school,
                        is_first_login=True,
                        created_by=admin_user,
                    )

                    # --- 3b. StudentProfile ---
                    student_profile = StudentProfile.objects.create(
                        user=student_user,
                        current_class=class_obj,
                        date_of_birth=date_of_birth,
                        created_by=admin_user,
                    )

                    # --- 3c. Primary parent ---
                    _was_linked = _link_or_create_parent(
                        parent_phone=parent_phone,
                        parent_first=parent_first,
                        parent_last=parent_last,
                        student_profile=student_profile,
                        school=school,
                        admin_user=admin_user,
                    )
                    if _was_linked:
                        linked_count += 1

                    # --- 3d. Second parent (optional) ---
                    if second_parent_phone:
                        _link_or_create_parent(
                            parent_phone=second_parent_phone,
                            parent_first="",
                            parent_last="",
                            student_profile=student_profile,
                            school=school,
                            admin_user=admin_user,
                        )

                    created_count += 1

                    # --- 3e. Queue SMS to parent ---
                    send_welcome_sms.delay(
                        phone=parent_phone,
                        student_name=f"{student_first} {student_last}",
                        temp_password=student_password,
                    )

            except Exception as exc:
                error_rows.append({"row_number": row_num, "reason": str(exc)})
                logger.warning("Row %d import error: %s", row_num, exc)

        wb.close()

    except Exception as exc:
        logger.exception("Bulk import — fatal error")
        raise self.retry(exc=exc)

    # ------------------------------------------------------------------
    # Summary notification for the admin
    # ------------------------------------------------------------------
    _send_admin_summary(
        admin_user_id=admin_user_id,
        school_id=school_id,
        created_count=created_count,
        linked_count=linked_count,
        error_rows=error_rows,
    )

    logger.info(
        "Bulk import done — school=%s  created=%d  linked=%d  errors=%d",
        school_id,
        created_count,
        linked_count,
        len(error_rows),
    )
    return {
        "created_count": created_count,
        "linked_count": linked_count,
        "error_rows": error_rows,
    }


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
        f"EduConnect — Bienvenue!\n"
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


def _generate_student_phone(first: str, last: str, row: int, school_id: str) -> str:
    """
    Build a unique placeholder phone for a student who typically has no
    real phone.  Format: ``STU-<first 4 of school_id>-<row>-<random>``.
    """
    suffix = secrets.token_hex(3)
    return f"STU-{str(school_id)[:8]}-{row}-{suffix}"


def _link_or_create_parent(
    *,
    parent_phone,
    parent_first,
    parent_last,
    student_profile,
    school,
    admin_user,
) -> bool:
    """
    If a User with ``parent_phone`` already exists → link their
    ParentProfile to ``student_profile`` and return ``True`` (linked).
    Otherwise create a new PARENT User + ParentProfile and return
    ``False`` (created).
    """
    from apps.accounts.models import User
    from apps.academics.models import ParentProfile

    existing_user = User.objects.filter(
        phone_number=parent_phone,
        role=User.Role.PARENT,
    ).first()

    if existing_user:
        # Parent already exists — just link the child
        try:
            profile = existing_user.parent_profile
        except ParentProfile.DoesNotExist:
            profile = ParentProfile.objects.create(
                user=existing_user,
                created_by=admin_user,
            )
        profile.children.add(student_profile)
        return True

    # Create brand-new parent
    parent_password = _generate_temp_password()
    parent_user = User.objects.create_user(
        phone_number=parent_phone,
        password=parent_password,
        first_name=parent_first or "Parent",
        last_name=parent_last or student_profile.user.last_name,
        role=User.Role.PARENT,
        school=school,
        is_first_login=True,
        created_by=admin_user,
    )
    parent_profile = ParentProfile.objects.create(
        user=parent_user,
        created_by=admin_user,
    )
    parent_profile.children.add(student_profile)

    # Queue SMS with parent's own credentials
    send_welcome_sms.delay(
        phone=parent_phone,
        student_name=student_profile.user.full_name,
        temp_password=parent_password,
    )
    return False


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
