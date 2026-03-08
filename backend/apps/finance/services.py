"""
Finance services — PDF receipt generation via WeasyPrint.
"""

import logging

from django.template.loader import render_to_string
from django.utils import timezone
from weasyprint import HTML

logger = logging.getLogger(__name__)


def generate_receipt_pdf(payment) -> bytes:
    """
    Render the receipt HTML template and convert to PDF bytes
    using WeasyPrint.

    Args:
        payment: StudentPayment instance (prefetch student, fee_structure).

    Returns:
        PDF content as bytes.
    """
    student = payment.student
    fee = payment.fee_structure
    school = payment.school

    # Derive class name from student profile
    sp = getattr(student, "student_profile", None)
    class_name = sp.current_class.name if (sp and sp.current_class) else None

    context = {
        "payment": payment,
        "student": student,
        "fee": fee,
        "school": school,
        "class_name": class_name,
        "generated_at": timezone.now(),
    }

    html_string = render_to_string("finance/receipt.html", context)
    pdf_bytes = HTML(string=html_string).write_pdf()

    logger.info(
        "Generated receipt PDF for payment %s (%s)",
        payment.receipt_number,
        student.full_name,
    )
    return pdf_bytes
