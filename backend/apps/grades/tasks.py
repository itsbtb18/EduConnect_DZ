"""
╔══════════════════════════════════════════════════════════════════════════╗
║  Celery tasks for the Grades app                                       ║
║                                                                        ║
║  Tasks:                                                                ║
║    1. async_recalculate_cascade     — atomic recalc on grade change    ║
║    2. async_calculate_all_rankings  — re-rank a whole class            ║
║    3. notify_appeal_assigned        — SMS + in-app to teacher/admin    ║
║    4. generate_report_card_pdf      — single student PDF bulletin      ║
║    5. generate_class_report_cards   — all students → ZIP bundle        ║
║    6. recalculate_classroom_task    — full pipeline (bulk)             ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

import io
import logging
import zipfile

from celery import shared_task

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. async_recalculate_cascade — called by Grade post_save signal
# ---------------------------------------------------------------------------


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=10,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def async_recalculate_cascade(
    self,
    student_id: str,
    subject_id: str,
    classroom_id: str,
    academic_year_id: str,
    trimester: int,
) -> dict:
    """
    Appeler recalculate_cascade en arrière-plan.
    Retry automatique en cas d'erreur (max_retries=3, backoff exponentiel).
    """
    try:
        from apps.grades.services import recalculate_cascade

        result = recalculate_cascade(
            student_id=student_id,
            subject_id=subject_id,
            classroom_id=classroom_id,
            academic_year_id=academic_year_id,
            trimester=trimester,
        )
        logger.info(
            "async_recalculate_cascade OK — student=%s subject=%s T%s → %s",
            student_id,
            subject_id,
            trimester,
            result,
        )
        return result
    except Exception as exc:
        logger.exception(
            "async_recalculate_cascade FAILED — student=%s subject=%s T%s",
            student_id,
            subject_id,
            trimester,
        )
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 2. async_calculate_all_rankings — re-rank entire class
# ---------------------------------------------------------------------------


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=15,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def async_calculate_all_rankings(
    self,
    classroom_id: str,
    academic_year_id: str,
    trimester: int,
) -> dict:
    """
    Recalculer les classements (4 niveaux) de toute la classe en arrière-plan.
    """
    try:
        from apps.grades.services import calculate_rankings

        calculate_rankings(
            classroom_id=classroom_id,
            academic_year_id=academic_year_id,
            trimester=trimester,
        )
        logger.info(
            "async_calculate_all_rankings OK — classroom=%s T%s",
            classroom_id,
            trimester,
        )
        return {
            "status": "success",
            "classroom_id": classroom_id,
            "trimester": trimester,
        }
    except Exception as exc:
        logger.exception(
            "async_calculate_all_rankings FAILED — classroom=%s T%s",
            classroom_id,
            trimester,
        )
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 3. notify_appeal_assigned — in-app + push to teacher/admin
# ---------------------------------------------------------------------------


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=10,
)
def notify_appeal_assigned(self, appeal_id: str) -> dict:
    """
    Envoyer notification (in-app + push) à l'enseignant ou admin assigné
    lors de la création ou mise à jour d'un recours (GradeAppeal).
    """
    try:
        from apps.grades.models import GradeAppeal
        from apps.notifications.tasks import send_notification

        appeal = GradeAppeal.objects.select_related(
            "student__user",
            "assigned_to_teacher__user",
        ).get(pk=appeal_id)

        student_name = appeal.student.user.get_full_name()
        appeal_type_label = appeal.get_appeal_type_display()

        # ── Notify the assigned teacher (if set) ────────────────────────
        if appeal.assigned_to_teacher and appeal.assigned_to_teacher.user_id:
            send_notification.delay(
                user_id=str(appeal.assigned_to_teacher.user_id),
                title="Nouveau recours à traiter",
                body=(
                    f"{student_name} a déposé un recours sur : "
                    f"{appeal_type_label}.\nMotif : {appeal.reason[:100]}"
                ),
                notification_type="GRADE_APPEAL",
                related_object_id=str(appeal.pk),
                related_object_type="GradeAppeal",
            )
            logger.info(
                "Appeal notification sent to teacher %s for appeal %s",
                appeal.assigned_to_teacher.user_id,
                appeal_id,
            )

        # ── Notify school admins (if assigned_to_admin or always for awareness)
        if appeal.assigned_to_admin:
            from apps.accounts.models import User

            # Get the school via the student's class
            school = None
            if appeal.student.current_class:
                school = appeal.student.current_class.school

            if school:
                admins = User.objects.filter(
                    school=school,
                    role__in=[User.Role.ADMIN, User.Role.SECTION_ADMIN],
                    is_active=True,
                )
                for admin_user in admins:
                    send_notification.delay(
                        user_id=str(admin_user.pk),
                        title="Recours en attente",
                        body=(
                            f"{student_name} a déposé un recours ({appeal_type_label}). "
                            f"Motif : {appeal.reason[:100]}"
                        ),
                        notification_type="GRADE_APPEAL",
                        related_object_id=str(appeal.pk),
                        related_object_type="GradeAppeal",
                    )
                logger.info(
                    "Appeal notification sent to %d admin(s) for appeal %s",
                    admins.count(),
                    appeal_id,
                )

        return {"status": "notified", "appeal_id": appeal_id}

    except GradeAppeal.DoesNotExist:
        logger.error("GradeAppeal %s not found — can't notify", appeal_id)
        return {"status": "failed", "reason": "Appeal not found"}
    except Exception as exc:
        logger.exception("notify_appeal_assigned FAILED — appeal=%s", appeal_id)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 4. generate_report_card_pdf — single student bulletin
# ---------------------------------------------------------------------------


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def generate_report_card_pdf(
    self,
    student_id: str,
    trimester: int,
    academic_year_id: str,
) -> str | None:
    """
    Generate a PDF report card for one student in a given trimester.

    Steps:
    1. Fetch SubjectAverages + TrimesterAverage for the student.
    2. Render an HTML template.
    3. Convert to PDF with WeasyPrint.
    4. Upload to storage.
    5. Save URL to ReportCard record.
    """
    try:
        from django.core.files.base import ContentFile
        from django.core.files.storage import default_storage
        from django.template.loader import render_to_string

        from apps.academics.models import LevelSubject, StudentProfile
        from apps.grades.models import ReportCard, SubjectAverage, TrimesterAverage
        from apps.schools.models import AcademicYear

        # Resolve entities
        student = StudentProfile.objects.select_related(
            "user",
            "current_class__section__school",
            "current_class__level",
        ).get(pk=student_id)

        academic_year = AcademicYear.objects.get(pk=academic_year_id)
        class_obj = student.current_class
        if class_obj is None:
            return None

        school = class_obj.section.school

        # Gather subject averages
        subject_avgs = (
            SubjectAverage.objects.filter(
                student=student,
                classroom=class_obj,
                academic_year=academic_year,
                trimester=trimester,
            )
            .select_related("subject")
            .order_by("subject__name")
        )

        subject_rows = []
        for sa in subject_avgs:
            try:
                ls = LevelSubject.objects.get(
                    level=class_obj.level,
                    stream=class_obj.stream,
                    subject=sa.subject,
                )
                coeff = ls.coefficient
            except LevelSubject.DoesNotExist:
                coeff = 1

            subject_rows.append(
                {
                    "name": sa.subject.name,
                    "coefficient": coeff,
                    "average": sa.effective_average,
                }
            )

        # Get trimester average
        try:
            trim_avg = TrimesterAverage.objects.get(
                student=student,
                classroom=class_obj,
                academic_year=academic_year,
                trimester=trimester,
            )
            overall_avg = trim_avg.effective_average
            rank = trim_avg.rank_in_class
            appreciation = trim_avg.appreciation
        except TrimesterAverage.DoesNotExist:
            overall_avg = None
            rank = None
            appreciation = ""

        total_students = StudentProfile.objects.filter(
            current_class=class_obj,
            is_deleted=False,
        ).count()

        # Get or create ReportCard
        report_card, _ = ReportCard.objects.get_or_create(
            student=student,
            academic_year=academic_year,
            trimester=trimester,
            defaults={"class_obj": class_obj},
        )
        report_card.class_obj = class_obj
        report_card.general_average = overall_avg
        report_card.rank = rank
        report_card.total_students = total_students

        # Render HTML → PDF
        context = {
            "school": school,
            "student": student,
            "student_user": student.user,
            "class_obj": class_obj,
            "academic_year": academic_year,
            "trimester": trimester,
            "subject_rows": subject_rows,
            "overall_average": overall_avg,
            "rank": rank,
            "appreciation": appreciation,
            "total_students": total_students,
            "admin_comment": report_card.admin_comment,
            "teacher_comment": report_card.teacher_comment,
        }

        html_content = render_to_string("grades/report_card.html", context)

        from weasyprint import HTML

        pdf_bytes = HTML(string=html_content, base_url="").write_pdf()

        # Upload PDF
        filename = (
            f"report_cards/{school.pk}/"
            f"{academic_year.name}/T{trimester}/"
            f"{student.user.last_name}_{student.user.first_name}_{student.pk}.pdf"
        )
        saved_path = default_storage.save(filename, ContentFile(pdf_bytes))
        pdf_url = default_storage.url(saved_path)

        report_card.pdf_url = pdf_url
        report_card.save()

        logger.info(
            "Report card PDF generated — student=%s trimester=%d url=%s",
            student_id,
            trimester,
            pdf_url,
        )
        return pdf_url

    except Exception as exc:
        logger.exception("Report card generation failed for student %s", student_id)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 5. generate_class_report_cards — all students → ZIP
# ---------------------------------------------------------------------------


@shared_task(bind=True, max_retries=2, default_retry_delay=60)
def generate_class_report_cards(
    self,
    class_id: str,
    trimester: int,
    academic_year_id: str,
) -> str | None:
    """
    Generate report card PDFs for every student in a class, bundle into ZIP.
    """
    try:
        from django.core.files.base import ContentFile
        from django.core.files.storage import default_storage

        from apps.academics.models import Class, StudentProfile
        from apps.schools.models import AcademicYear

        class_obj = Class.objects.select_related(
            "section__school",
            "academic_year",
        ).get(pk=class_id)

        academic_year = AcademicYear.objects.get(pk=academic_year_id)
        school = class_obj.section.school

        students = (
            StudentProfile.objects.filter(
                current_class=class_obj,
                is_deleted=False,
            )
            .select_related("user")
            .order_by("user__last_name", "user__first_name")
        )

        if not students.exists():
            logger.warning("No students in class %s", class_id)
            return None

        # Generate individual PDFs
        for student in students:
            try:
                generate_report_card_pdf(
                    str(student.pk),
                    trimester,
                    academic_year_id,
                )
            except Exception:
                logger.exception(
                    "PDF generation failed for student %s in class %s",
                    student.pk,
                    class_id,
                )

        # Bundle into ZIP
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for student in students:
                storage_path = (
                    f"report_cards/{school.pk}/"
                    f"{academic_year.name}/T{trimester}/"
                    f"{student.user.last_name}_{student.user.first_name}_{student.pk}.pdf"
                )
                if default_storage.exists(storage_path):
                    with default_storage.open(storage_path, "rb") as f:
                        label = f"{student.user.last_name}_{student.user.first_name}"
                        zf.writestr(f"{label}.pdf", f.read())

        zip_buffer.seek(0)
        zip_filename = (
            f"report_cards/{school.pk}/"
            f"{academic_year.name}/T{trimester}/"
            f"class_{class_obj.name}_T{trimester}.zip"
        )
        saved_zip = default_storage.save(zip_filename, ContentFile(zip_buffer.read()))
        zip_url = default_storage.url(saved_zip)

        # Notify admins
        from apps.accounts.models import User
        from apps.notifications.tasks import send_notification

        admins = User.objects.filter(
            school=school,
            role__in=[User.Role.ADMIN, User.Role.SECTION_ADMIN],
            is_active=True,
        )
        for admin_user in admins:
            send_notification.delay(
                user_id=str(admin_user.pk),
                title="Bulletins prêts",
                body=(
                    f"Les bulletins de la classe {class_obj.name} — "
                    f"T{trimester} ({academic_year.name}) sont disponibles."
                ),
                notification_type="REPORT_CARD",
                related_object_id=str(class_obj.pk),
                related_object_type="Class",
            )

        logger.info(
            "Class report cards ZIP — class=%s trimester=%d url=%s",
            class_id,
            trimester,
            zip_url,
        )
        return zip_url

    except Exception as exc:
        logger.exception("Class report cards failed — class=%s", class_id)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 6. recalculate_classroom_task — bulk async full pipeline
# ---------------------------------------------------------------------------


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def recalculate_classroom_task(
    self,
    classroom_id: str,
    academic_year_id: str,
    trimester: int,
) -> dict:
    """
    Async full recalculation for a classroom/trimester.
    Wraps services.recalculate_classroom_trimester().
    """
    try:
        from apps.grades.services import recalculate_classroom_trimester

        return recalculate_classroom_trimester(
            classroom_id,
            academic_year_id,
            trimester,
        )
    except Exception as exc:
        logger.exception("Recalculation task failed — classroom=%s", classroom_id)
        raise self.retry(exc=exc)
