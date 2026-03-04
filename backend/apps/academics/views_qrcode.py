"""
QR code API views — on-the-fly generation with Redis caching.

    GET /api/v1/academics/students/<uuid>/qr-code/
    GET /api/v1/academics/teachers/<uuid>/qr-code/

Each response contains the base64 QR image, the raw data string, and a
timestamp.  Results are cached in Redis for 1 hour.
"""

from django.core.cache import cache
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from core.permissions import IsSchoolAdmin
from core.qr_generator import (
    generate_qr_code,
    get_student_qr_data,
    get_teacher_qr_data,
)

QR_CACHE_TTL = 3600  # 1 hour


class _TenantCheck:
    @staticmethod
    def enforce_tenant(request_user, target_user):
        if request_user.role == "SUPER_ADMIN":
            return
        if target_user.school_id != request_user.school_id:
            raise NotFound()


class StudentQRCodeView(_TenantCheck, APIView):
    """GET  /students/<uuid>/qr-code/"""

    permission_classes = [IsSchoolAdmin]

    def get(self, request, pk):
        cache_key = f"qr_code_student_{pk}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        user = get_object_or_404(
            User.objects.select_related("school", "student_profile"),
            pk=pk,
            role=User.Role.STUDENT,
        )
        self.enforce_tenant(request.user, user)

        qr_data = get_student_qr_data(user)
        result = {
            "qr_code_base64": generate_qr_code(qr_data),
            "qr_data": qr_data,
            "generated_at": timezone.now().isoformat(),
        }

        cache.set(cache_key, result, timeout=QR_CACHE_TTL)
        return Response(result)


class TeacherQRCodeView(_TenantCheck, APIView):
    """GET  /teachers/<uuid>/qr-code/"""

    permission_classes = [IsSchoolAdmin]

    def get(self, request, pk):
        cache_key = f"qr_code_teacher_{pk}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        user = get_object_or_404(
            User.objects.select_related("school", "teacher_profile"),
            pk=pk,
            role=User.Role.TEACHER,
        )
        self.enforce_tenant(request.user, user)

        qr_data = get_teacher_qr_data(user)
        result = {
            "qr_code_base64": generate_qr_code(qr_data),
            "qr_data": qr_data,
            "generated_at": timezone.now().isoformat(),
        }

        cache.set(cache_key, result, timeout=QR_CACHE_TTL)
        return Response(result)
