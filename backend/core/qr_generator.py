"""
QR code generator for ILMI.

Generates QR codes on-the-fly as base64-encoded PNG data URIs.
Used for student and teacher identification cards.

Format examples:
  Student  : ILMI-STU-{student_id}-{school_subdomain}
  Teacher  : ILMI-TCH-{user_uuid_short}-{school_subdomain}
"""

import base64
from io import BytesIO

import qrcode
import qrcode.constants


def generate_qr_code(data: str, size: int = 10) -> str:
    """
    Generate a QR code and return a base64 PNG data URI.

    Args:
        data: Unique string to encode.
        size: Box size in pixels for each QR module.

    Returns:
        ``"data:image/png;base64,iVBORw0..."`` — usable directly as ``<img src>``.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=size,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"


def get_student_qr_data(user) -> str:
    """
    Build the unique QR payload for a student.

    Args:
        user: ``User`` instance (role=STUDENT) with ``student_profile``
              and ``school`` already loaded.

    Returns:
        ``"ILMI-STU-{student_id}-{subdomain}"``
    """
    profile = getattr(user, "student_profile", None)
    sid = profile.student_id if profile and profile.student_id else str(user.id)[:8]
    school_code = user.school.subdomain if user.school else "ILMI"
    return f"ILMI-STU-{sid}-{school_code}"


def get_teacher_qr_data(user) -> str:
    """
    Build the unique QR payload for a teacher.

    Args:
        user: ``User`` instance (role=TEACHER) with ``school`` already loaded.

    Returns:
        ``"ILMI-TCH-{uuid_short}-{subdomain}"``
    """
    uid_short = str(user.id)[:8]
    school_code = user.school.subdomain if user.school else "ILMI"
    return f"ILMI-TCH-{uid_short}-{school_code}"
