"""
Custom validators for EduConnect.
"""

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from .utils import (
    ALLOWED_DOCUMENT_EXTENSIONS,
    ALLOWED_IMAGE_EXTENSIONS,
    ALLOWED_VIDEO_EXTENSIONS,
    get_file_extension,
)


def validate_file_size(value, max_size_mb=10):
    """Validate that uploaded file does not exceed max size."""
    max_size = max_size_mb * 1024 * 1024
    if value.size > max_size:
        raise ValidationError(
            _(
                "File size must not exceed %(max_size)d MB. Current size: %(current_size).1f MB."
            ),
            params={
                "max_size": max_size_mb,
                "current_size": value.size / (1024 * 1024),
            },
        )


def validate_document_file(value):
    """Validate uploaded document file type and size."""
    ext = get_file_extension(value.name)
    if ext not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise ValidationError(
            _("Unsupported file type: .%(ext)s. Allowed: %(allowed)s"),
            params={
                "ext": ext,
                "allowed": ", ".join(ALLOWED_DOCUMENT_EXTENSIONS),
            },
        )
    validate_file_size(value, max_size_mb=25)


def validate_image_file(value):
    """Validate uploaded image file type and size."""
    ext = get_file_extension(value.name)
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            _("Unsupported image type: .%(ext)s. Allowed: %(allowed)s"),
            params={
                "ext": ext,
                "allowed": ", ".join(ALLOWED_IMAGE_EXTENSIONS),
            },
        )
    validate_file_size(value, max_size_mb=5)


def validate_homework_file(value):
    """Validate homework attachment — allows documents and images."""
    ext = get_file_extension(value.name)
    allowed = ALLOWED_DOCUMENT_EXTENSIONS + ALLOWED_IMAGE_EXTENSIONS
    if ext not in allowed:
        raise ValidationError(
            _("Unsupported file type: .%(ext)s. Allowed: %(allowed)s"),
            params={
                "ext": ext,
                "allowed": ", ".join(allowed),
            },
        )
    validate_file_size(value, max_size_mb=50)


def validate_resource_file(value):
    """Validate educational resource file — allows documents, images, and videos."""
    ext = get_file_extension(value.name)
    allowed = (
        ALLOWED_DOCUMENT_EXTENSIONS
        + ALLOWED_IMAGE_EXTENSIONS
        + ALLOWED_VIDEO_EXTENSIONS
    )
    if ext not in allowed:
        raise ValidationError(
            _("Unsupported file type: .%(ext)s. Allowed: %(allowed)s"),
            params={
                "ext": ext,
                "allowed": ", ".join(allowed),
            },
        )
    validate_file_size(value, max_size_mb=100)


def validate_excel_file(value):
    """Validate that uploaded file is an Excel file (for bulk import)."""
    ext = get_file_extension(value.name)
    if ext not in ("xls", "xlsx"):
        raise ValidationError(
            _("Only Excel files (.xls, .xlsx) are accepted for bulk import.")
        )
    validate_file_size(value, max_size_mb=10)


def validate_phone_number(value):
    """Validate Algerian phone number format."""
    import re

    # Algerian phone numbers: 0(5|6|7)XXXXXXXX or +213(5|6|7)XXXXXXXX
    pattern = r"^(\+213|0)(5|6|7)\d{8}$"
    if not re.match(pattern, value):
        raise ValidationError(
            _(
                "Invalid Algerian phone number. Expected format: 05XXXXXXXX or +2135XXXXXXXX"
            )
        )


def validate_grade_score(value, max_score=20):
    """Validate that a grade score is within valid range."""
    if value < 0:
        raise ValidationError(_("Score cannot be negative."))
    if value > max_score:
        raise ValidationError(
            _("Score cannot exceed %(max_score)s."),
            params={"max_score": max_score},
        )


def validate_coefficient(value):
    """Validate subject coefficient."""
    if value <= 0:
        raise ValidationError(_("Coefficient must be a positive number."))
    if value > 10:
        raise ValidationError(_("Coefficient cannot exceed 10."))
