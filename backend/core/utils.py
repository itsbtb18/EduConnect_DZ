"""
Shared utility functions for EduConnect.
"""

import uuid

from django.utils import timezone


def generate_unique_code(prefix: str = "", length: int = 8) -> str:
    """Generate a unique code with optional prefix."""
    code = uuid.uuid4().hex[:length].upper()
    return f"{prefix}{code}" if prefix else code


def get_current_academic_year() -> str:
    """Return the current academic year string (e.g., '2025-2026')."""
    now = timezone.now()
    if now.month >= 9:  # Academic year starts in September
        return f"{now.year}-{now.year + 1}"
    return f"{now.year - 1}-{now.year}"


def get_file_extension(filename: str) -> str:
    """Extract file extension from filename."""
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def validate_file_type(filename: str, allowed_extensions: list[str]) -> bool:
    """Check if file extension is in allowed list."""
    ext = get_file_extension(filename)
    return ext in allowed_extensions


ALLOWED_DOCUMENT_EXTENSIONS = [
    "pdf",
    "doc",
    "docx",
    "ppt",
    "pptx",
    "xls",
    "xlsx",
    "txt",
]
ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"]
ALLOWED_VIDEO_EXTENSIONS = ["mp4", "avi", "mov", "mkv"]
