"""
Celery tasks for the Finance app.
Handles payment reminders and receipt generation.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def send_payment_reminders():
    """
    Send payment reminders to parents whose children have unpaid fees.
    Meant to be run as a weekly Celery Beat task.
    """
    from django.db.models import Q, Sum
    from django.utils import timezone

    from apps.accounts.models import StudentProfile
    from apps.finance.models import FeeStructure, Payment
    from apps.notifications.tasks import send_push_notification
    from apps.schools.models import School

    schools = School.objects.filter(is_active=True)
    total_reminders = 0

    for school in schools:
        # Get current academic year fees
        from apps.schools.models import AcademicYear

        current_year = AcademicYear.objects.filter(
            school=school, is_current=True
        ).first()

        if not current_year:
            continue

        fees = FeeStructure.objects.filter(school=school, academic_year=current_year)

        for fee in fees:
            # Find students with incomplete payments
            students = StudentProfile.objects.filter(
                user__school=school,
                user__is_active=True,
                classroom__level=fee.level,
            ).select_related("user")

            for profile in students:
                paid = (
                    Payment.objects.filter(
                        student=profile.user,
                        fee=fee,
                        status="completed",
                    ).aggregate(total=Sum("amount"))["total"]
                    or 0
                )

                remaining = fee.amount - paid
                if remaining > 0:
                    # Notify parents
                    parents = profile.user.parents.all()
                    for parent_user in parents:
                        send_push_notification.delay(
                            user_id=str(parent_user.id),
                            title="💰 Payment Reminder",
                            body=(
                                f"{fee.name} for {profile.user.first_name}: "
                                f"{remaining:,.0f} DZD remaining"
                            ),
                            data={
                                "type": "payment_reminder",
                                "student_id": str(profile.user.id),
                                "fee_id": str(fee.id),
                                "amount_remaining": str(remaining),
                            },
                        )
                        total_reminders += 1

    logger.info(f"Payment reminders sent: {total_reminders}")
    return {"status": "complete", "reminders_sent": total_reminders}


@shared_task
def generate_payment_receipt(payment_id: str):
    """
    Generate a PDF receipt for a completed payment.
    """
    from apps.finance.models import Payment

    try:
        payment = Payment.objects.select_related(
            "student", "fee", "fee__academic_year"
        ).get(id=payment_id)

        if payment.status != "completed":
            return {"status": "skipped", "reason": "Payment not completed"}

        # Generate receipt using WeasyPrint
        try:
            from django.core.files.base import ContentFile
            from django.template.loader import render_to_string
            from weasyprint import HTML

            context = {
                "payment": payment,
                "student": payment.student,
                "school": payment.student.school,
                "fee": payment.fee,
            }

            html = render_to_string("finance/receipt.html", context)
            pdf_bytes = HTML(string=html).write_pdf()

            filename = f"receipt_{payment.reference_number or payment.id}.pdf"
            payment.receipt_file.save(filename, ContentFile(pdf_bytes))
            payment.save(update_fields=["receipt_file"])

            logger.info(f"Receipt generated for payment {payment.id}")
            return {"status": "success", "payment_id": str(payment.id)}

        except ImportError:
            logger.warning("WeasyPrint not installed. Skipping receipt generation.")
            return {"status": "skipped", "reason": "WeasyPrint not available"}

    except Payment.DoesNotExist:
        logger.error(f"Payment {payment_id} not found")
        return {"status": "failed", "reason": "Payment not found"}
