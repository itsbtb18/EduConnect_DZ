"""
Full-profile API views — one-call endpoints for admin detail pages.

    GET /api/v1/academics/students/<uuid>/full-profile/
    GET /api/v1/academics/teachers/<uuid>/full-profile/
    GET /api/v1/academics/parents/<uuid>/full-profile/

Each view performs a single heavily-prefetched query on the ``User`` model,
delegates aggregation to the matching serializer, and returns the complete
profile payload in one response.
"""

from django.shortcuts import get_object_or_404
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from core.permissions import IsSchoolAdmin

from .serializers_profiles import (
    ParentFullProfileSerializer,
    StudentFullProfileSerializer,
    TeacherFullProfileSerializer,
)


class _TenantIsolationMixin:
    """Raises 404 when the target user belongs to a different school."""

    @staticmethod
    def enforce_tenant(request_user: User, target_user: User):
        if request_user.role == "SUPER_ADMIN":
            return
        if target_user.school_id != request_user.school_id:
            raise NotFound()


# ═══════════════════════════════════════════════════════════════════════════


class StudentFullProfileView(_TenantIsolationMixin, APIView):
    """GET  /students/<uuid>/full-profile/"""

    permission_classes = [IsSchoolAdmin]

    def get(self, request, pk):
        user = get_object_or_404(
            User.objects.select_related(
                "school",
                "student_profile",
                "student_profile__current_class",
                "student_profile__current_class__level",
                "student_profile__current_class__stream",
                "student_profile__current_class__section",
                "student_profile__current_class__academic_year",
            ),
            pk=pk,
            role=User.Role.STUDENT,
        )
        self.enforce_tenant(request.user, user)
        serializer = StudentFullProfileSerializer(user, context={"request": request})
        return Response(serializer.data)


# ═══════════════════════════════════════════════════════════════════════════


class TeacherFullProfileView(_TenantIsolationMixin, APIView):
    """GET  /teachers/<uuid>/full-profile/"""

    permission_classes = [IsSchoolAdmin]

    def get(self, request, pk):
        user = get_object_or_404(
            User.objects.select_related(
                "school",
                "teacher_profile",
                "teacher_profile__section",
            ),
            pk=pk,
            role=User.Role.TEACHER,
        )
        self.enforce_tenant(request.user, user)
        serializer = TeacherFullProfileSerializer(user, context={"request": request})
        return Response(serializer.data)


# ═══════════════════════════════════════════════════════════════════════════


class ParentFullProfileView(_TenantIsolationMixin, APIView):
    """GET  /parents/<uuid>/full-profile/"""

    permission_classes = [IsSchoolAdmin]

    def get(self, request, pk):
        user = get_object_or_404(
            User.objects.select_related(
                "school",
                "parent_profile",
            ).prefetch_related(
                "parent_profile__children",
                "parent_profile__children__user",
                "parent_profile__children__current_class",
            ),
            pk=pk,
            role=User.Role.PARENT,
        )
        self.enforce_tenant(request.user, user)
        serializer = ParentFullProfileSerializer(user, context={"request": request})
        return Response(serializer.data)
