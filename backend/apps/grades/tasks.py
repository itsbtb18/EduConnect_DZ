"""
Celery tasks for the Grades app.
Handles report card generation and bulk grade publishing.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def generate_report_card_pdf(self, report_card_id: str):
    """
    Generate a PDF report card for a single student using WeasyPrint.

    The PDF includes:
    - Student info, photo, class
    - All subjects with grades and coefficients
    - Trimester average, yearly average, class rank
    - Teacher comments, director signature field
    - Customizable school logo, colors, footer
    """
    try:
        from django.template.loader import render_to_string

        from apps.grades.models import ReportCard
        from apps.grades.services import (
            calculate_class_rankings,
            calculate_subject_trimester_average,
            calculate_trimester_overall_average,
        )

        report_card = ReportCard.objects.select_related(
            "student", "classroom", "semester", "classroom__level"
        ).get(id=report_card_id)

        student = report_card.student
        classroom = report_card.classroom
        semester = report_card.semester
        school = student.school

        # Compute averages
        overall_avg = calculate_trimester_overall_average(student, semester)
        rankings = calculate_class_rankings(classroom, semester)

        # Find student's rank
        student_rank = None
        total_students = len(rankings)
        for entry in rankings:
            if entry["student"].id == student.id:
                student_rank = entry["rank"]
                break

        # Compute per-subject averages
        from apps.academics.models import Subject

        subjects = Subject.objects.filter(
            school=school, levels=classroom.level
        ).order_by("name")

        subject_grades = []
        for subject in subjects:
            avg = calculate_subject_trimester_average(student, subject, semester)
            subject_grades.append(
                {
                    "name": subject.name,
                    "coefficient": subject.coefficient,
                    "average": avg,
                }
            )

        # Update report card with computed values
        report_card.general_average = overall_avg
        report_card.rank = student_rank

        # Render HTML template
        context = {
            "school": school,
            "student": student,
            "classroom": classroom,
            "semester": semester,
            "subject_grades": subject_grades,
            "overall_average": overall_avg,
            "rank": student_rank,
            "total_students": total_students,
            "teacher_comment": report_card.teacher_comment,
            "admin_comment": report_card.admin_comment,
        }

        html_content = render_to_string("report_cards/report_card.html", context)

        # Generate PDF with WeasyPrint
        try:
            from weasyprint import HTML

            pdf_bytes = HTML(string=html_content).write_pdf()

            # Save PDF to report card
            from django.core.files.base import ContentFile

            filename = f"report_card_{student.last_name}_{student.first_name}_{semester.name}.pdf"
            report_card.pdf_file.save(filename, ContentFile(pdf_bytes))
        except ImportError:
            logger.warning("WeasyPrint not installed. Skipping PDF generation.")

        report_card.save()

        logger.info(f"Report card generated for {student.full_name} — {semester.name}")
        return {"status": "success", "report_card_id": str(report_card.id)}

    except Exception as exc:
        logger.error(f"Report card generation failed: {exc}")
        raise self.retry(exc=exc, countdown=30)


@shared_task
def generate_class_report_cards(classroom_id: str, semester_id: str):
    """
    Generate report cards for all students in a classroom.
    Creates ReportCard objects and queues individual PDF generation tasks.
    """
    from apps.academics.models import Classroom
    from apps.accounts.models import StudentProfile
    from apps.grades.models import ReportCard
    from apps.schools.models import Semester

    classroom = Classroom.objects.get(id=classroom_id)
    semester = Semester.objects.get(id=semester_id)

    students = StudentProfile.objects.filter(
        classroom=classroom,
        user__is_active=True,
    ).select_related("user")

    created_count = 0
    for profile in students:
        report_card, created = ReportCard.objects.get_or_create(
            school=classroom.school,
            student=profile.user,
            classroom=classroom,
            semester=semester,
        )
        # Queue PDF generation
        generate_report_card_pdf.delay(str(report_card.id))
        created_count += 1

    logger.info(f"Queued {created_count} report card PDFs for {classroom}")
    return {"status": "queued", "count": created_count}


@shared_task
def bulk_publish_grades(school_id: str, semester_id: str):
    """
    Bulk publish all submitted (pending review) grades for a semester.
    Used by admins to publish all grades for a trimester at once.
    """
    from django.utils import timezone

    from apps.grades.models import Grade

    updated = Grade.objects.filter(
        school_id=school_id,
        semester_id=semester_id,
        status="submitted",
    ).update(status="published", reviewed_at=timezone.now())

    logger.info(f"Bulk published {updated} grades for semester {semester_id}")
    return {"status": "success", "published_count": updated}
