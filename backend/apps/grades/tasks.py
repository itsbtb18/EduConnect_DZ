"""
Celery tasks for the Grades app.
- generate_report_card_pdf   — single student bulletin (WeasyPrint → S3/R2)
- generate_class_report_cards — all students in a class → ZIP bundle
"""

import io
import logging
import zipfile

from celery import shared_task

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. generate_report_card_pdf
# ---------------------------------------------------------------------------


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def generate_report_card_pdf(
    self,
    student_id: str,
    trimester: int,
    academic_year_id: str,
) -> str | None:
    """
    Generate a PDF report card for **one** student in a given trimester.

    Steps:
    1. Fetch all PUBLISHED grades for student + trimester.
    2. Calculate per-subject averages, overall average, class rank.
    3. Render an HTML template via Django's template engine.
    4. Convert to PDF with WeasyPrint.
    5. Upload the PDF to default storage (S3 / R2 / local).
    6. Save the URL to a ``ReportCard`` model record.
    7. Return the file URL.

    Report card template includes:
    - School logo, student photo, name, class
    - All subjects with grades and coefficients
    - Trimester average, class average, rank
    - Admin / teacher comment sections
    """
    try:
        from django.core.files.base import ContentFile
        from django.core.files.storage import default_storage
        from django.template.loader import render_to_string

        from apps.academics.models import StudentProfile
        from apps.grades.models import Grade, ReportCard, Subject
        from apps.grades.services import (
            calculate_class_rank,
            calculate_overall_trimester_average,
            calculate_subject_trimester_average,
        )
        from apps.schools.models import AcademicYear

        # ------------------------------------------------------------------
        # 1. Resolve entities
        # ------------------------------------------------------------------
        student = StudentProfile.objects.select_related(
            "user",
            "current_class__section__school",
        ).get(pk=student_id)

        academic_year = AcademicYear.objects.get(pk=academic_year_id)
        class_obj = student.current_class
        if class_obj is None:
            return None

        school = class_obj.section.school

        # ------------------------------------------------------------------
        # 2. Gather subjects & compute averages
        # ------------------------------------------------------------------
        subjects = Subject.objects.filter(
            class_obj=class_obj,
            is_deleted=False,
        ).order_by("name")

        subject_rows: list[dict] = []
        for subj in subjects:
            # Per-subject average
            subj_avg = calculate_subject_trimester_average(
                student,
                subj,
                trimester,
                academic_year,
            )

            # Individual exam scores
            grades_qs = Grade.objects.filter(
                student=student,
                subject=subj,
                trimester=trimester,
                academic_year=academic_year,
                status=Grade.Status.PUBLISHED,
                is_deleted=False,
            ).order_by("exam_type")

            scores = {g.exam_type: g.value for g in grades_qs}

            subject_rows.append(
                {
                    "name": subj.name,
                    "coefficient": subj.coefficient,
                    "continuous": scores.get(Grade.ExamType.CONTINUOUS),
                    "test1": scores.get(Grade.ExamType.TEST_1),
                    "test2": scores.get(Grade.ExamType.TEST_2),
                    "final": scores.get(Grade.ExamType.FINAL),
                    "average": subj_avg,
                }
            )

        overall_avg = calculate_overall_trimester_average(
            student,
            trimester,
            academic_year,
        )
        rank = calculate_class_rank(student, trimester, academic_year)

        # Total students in class
        total_students = StudentProfile.objects.filter(
            current_class=class_obj,
            is_deleted=False,
        ).count()

        # ------------------------------------------------------------------
        # 3. Get or create ReportCard record
        # ------------------------------------------------------------------
        report_card, _ = ReportCard.objects.get_or_create(
            student=student,
            academic_year=academic_year,
            trimester=trimester,
            defaults={
                "class_obj": class_obj,
            },
        )
        report_card.class_obj = class_obj
        report_card.general_average = overall_avg
        report_card.rank = rank
        report_card.total_students = total_students

        # ------------------------------------------------------------------
        # 4. Render HTML → PDF
        # ------------------------------------------------------------------
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
            "total_students": total_students,
            "admin_comment": report_card.admin_comment,
            "teacher_comment": report_card.teacher_comment,
        }

        html_content = render_to_string(
            "grades/report_card.html",
            context,
        )

        from weasyprint import HTML

        pdf_bytes = HTML(string=html_content, base_url="").write_pdf()

        # ------------------------------------------------------------------
        # 5. Upload PDF to storage
        # ------------------------------------------------------------------
        filename = (
            f"report_cards/{school.pk}/"
            f"{academic_year.name}/T{trimester}/"
            f"{student.user.last_name}_{student.user.first_name}_{student.pk}.pdf"
        )
        saved_path = default_storage.save(filename, ContentFile(pdf_bytes))
        pdf_url = default_storage.url(saved_path)

        # ------------------------------------------------------------------
        # 6. Persist URL
        # ------------------------------------------------------------------
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
# 2. generate_class_report_cards
# ---------------------------------------------------------------------------


@shared_task(bind=True, max_retries=2, default_retry_delay=60)
def generate_class_report_cards(
    self,
    class_id: str,
    trimester: int,
    academic_year_id: str,
) -> str | None:
    """
    Generate report card PDFs for **every** student in a class, bundle them
    into a single ZIP archive, upload the ZIP to storage, and notify the
    requesting admin with the download link.

    Returns:
        The URL of the uploaded ZIP file, or ``None`` on failure.
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
            logger.warning("No students in class %s — nothing to generate", class_id)
            return None

        # ------------------------------------------------------------------
        # Generate individual PDFs (synchronous calls — already in worker)
        # ------------------------------------------------------------------
        pdf_buffers: list[tuple[str, str | None]] = []  # (label, url_or_None)

        for student in students:
            label = f"{student.user.last_name}_{student.user.first_name}"
            try:
                url = generate_report_card_pdf(
                    str(student.pk),
                    trimester,
                    academic_year_id,
                )
                pdf_buffers.append((label, url))
            except Exception:
                logger.exception(
                    "PDF generation failed for student %s in class %s",
                    student.pk,
                    class_id,
                )
                pdf_buffers.append((label, None))

        # ------------------------------------------------------------------
        # Bundle into ZIP
        # ------------------------------------------------------------------
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for label, pdf_url in pdf_buffers:
                if pdf_url is None:
                    continue
                # Read back the PDF from storage
                # The URL is relative or absolute, we need the storage path
                # Derive path from convention used in generate_report_card_pdf
                # Attempt to read by searching for the student's report card
                try:
                    from apps.grades.models import ReportCard

                    student_profile = StudentProfile.objects.get(
                        user__last_name=label.split("_")[0],
                        user__first_name="_".join(label.split("_")[1:]),
                        current_class=class_obj,
                    )
                except (StudentProfile.DoesNotExist, IndexError):
                    student_profile = None

                if student_profile:
                    try:
                        ReportCard.objects.get(
                            student=student_profile,
                            academic_year=academic_year,
                            trimester=trimester,
                        )
                        # Re-derive the storage path
                        storage_path = (
                            f"report_cards/{school.pk}/"
                            f"{academic_year.name}/T{trimester}/"
                            f"{student_profile.user.last_name}_"
                            f"{student_profile.user.first_name}_"
                            f"{student_profile.pk}.pdf"
                        )
                        if default_storage.exists(storage_path):
                            with default_storage.open(storage_path, "rb") as f:
                                zf.writestr(f"{label}.pdf", f.read())
                        else:
                            logger.warning("PDF not found at %s", storage_path)
                    except Exception:
                        logger.exception("Could not add %s to ZIP", label)

        zip_buffer.seek(0)

        # ------------------------------------------------------------------
        # Upload ZIP
        # ------------------------------------------------------------------
        zip_filename = (
            f"report_cards/{school.pk}/"
            f"{academic_year.name}/T{trimester}/"
            f"class_{class_obj.name}_T{trimester}.zip"
        )
        saved_zip = default_storage.save(zip_filename, ContentFile(zip_buffer.read()))
        zip_url = default_storage.url(saved_zip)

        # ------------------------------------------------------------------
        # Notify admin(s)
        # ------------------------------------------------------------------
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
                    f"T{trimester} ({academic_year.name}) sont disponibles.\n"
                    f"Télécharger: {zip_url}"
                ),
                notification_type="REPORT_CARD",
                related_object_id=str(class_obj.pk),
                related_object_type="Class",
            )

        logger.info(
            "Class report cards ZIP uploaded — class=%s trimester=%d url=%s",
            class_id,
            trimester,
            zip_url,
        )
        return zip_url

    except Exception as exc:
        logger.exception(
            "Class report cards generation failed — class=%s",
            class_id,
        )
        raise self.retry(exc=exc)
