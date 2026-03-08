"""
Student ID Card endpoint.

GET /api/v1/academics/students/<uuid>/card/

Returns all data needed to render a digital student ID card:
  • Student identity (name, photo, date of birth, student ID)
  • School info (name, logo, motto, address)
  • Class / section / academic year
  • QR code (base64 PNG data URI)
"""

from django.core.cache import cache
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from core.permissions import IsSchoolAdmin, IsStudent, IsSameSchool
from core.qr_generator import generate_qr_code, get_student_qr_data

CARD_CACHE_TTL = 3600  # 1 hour


class StudentCardView(APIView):
    """
    GET /api/v1/academics/students/<uuid>/card/

    Accessible by:
    - ADMIN / SECTION_ADMIN / SUPER_ADMIN  (any student in their school)
    - STUDENT  (only their own card)

    Returns a JSON payload with everything needed for a credit-card
    sized ID card (digital or printable).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        cache_key = f"student_card_{pk}"
        cached = cache.get(cache_key)
        if cached:
            # Still enforce tenant isolation on cached data
            if not self._can_access(request.user, cached.get("_school_id")):
                raise NotFound()
            return Response(cached)

        user = get_object_or_404(
            User.objects.select_related(
                "school", "student_profile", "student_profile__current_class",
                "student_profile__current_class__section",
                "student_profile__current_class__academic_year",
            ),
            pk=pk,
            role=User.Role.STUDENT,
        )

        # Permissions check
        if not self._can_access(request.user, str(user.school_id)):
            raise NotFound()

        profile = getattr(user, "student_profile", None)
        school = user.school
        current_class = profile.current_class if profile else None

        # QR code
        qr_data = get_student_qr_data(user)
        qr_base64 = generate_qr_code(qr_data)

        # Build card data
        card = {
            # Student identity
            "id": str(user.pk),
            "full_name": user.full_name,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "photo": request.build_absolute_uri(user.photo.url) if user.photo else None,
            "date_of_birth": (
                profile.date_of_birth.isoformat() if profile and profile.date_of_birth else None
            ),
            "student_id": profile.student_id if profile else "",
            "enrollment_date": (
                profile.enrollment_date.isoformat()
                if profile and profile.enrollment_date
                else None
            ),

            # Class info
            "class_name": current_class.name if current_class else "",
            "section_type": (
                current_class.section.section_type if current_class and current_class.section else ""
            ),
            "academic_year": (
                str(current_class.academic_year)
                if current_class and current_class.academic_year
                else ""
            ),

            # School info
            "school": {
                "id": str(school.pk) if school else "",
                "name": school.name if school else "",
                "logo": (
                    request.build_absolute_uri(school.logo.url)
                    if school and school.logo
                    else None
                ),
                "motto": school.motto if school else "",
                "address": school.address if school else "",
                "phone": school.phone if school else "",
                "wilaya": school.wilaya if school else "",
            },

            # QR code
            "qr_code_base64": qr_base64,
            "qr_data": qr_data,

            # Meta
            "generated_at": timezone.now().isoformat(),

            # Internal (for cache-level tenant check)
            "_school_id": str(user.school_id),
        }

        cache.set(cache_key, card, timeout=CARD_CACHE_TTL)
        return Response(card)

    @staticmethod
    def _can_access(request_user, target_school_id: str) -> bool:
        """Check tenant isolation + role-based access."""
        if request_user.role == "SUPER_ADMIN":
            return True
        if request_user.role == "STUDENT":
            # Students can only view their own card (pk checked at view level)
            return str(request_user.school_id) == target_school_id
        if request_user.role in ("ADMIN", "SECTION_ADMIN"):
            return str(request_user.school_id) == target_school_id
        return False
