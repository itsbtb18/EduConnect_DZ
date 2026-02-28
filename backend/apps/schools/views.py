from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsSchoolAdmin, IsSuperAdmin

from .models import AcademicYear, School, Section
from .serializers import AcademicYearSerializer, SchoolSerializer, SectionSerializer


class IsSuperOrSchoolAdmin(permissions.BasePermission):
    """Allow SUPER_ADMIN, ADMIN, or SECTION_ADMIN."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN")
        )


class SchoolViewSet(viewsets.ModelViewSet):
    """
    CRUD for schools.
    - SUPER_ADMIN: full CRUD on all schools.
    - ADMIN / SECTION_ADMIN: read-only on their own school.
    """

    serializer_class = SchoolSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "my_school"):
            return [permissions.IsAuthenticated(), IsSuperOrSchoolAdmin()]
        # Create/Update/Delete = superadmin only
        return [permissions.IsAuthenticated(), IsSuperAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs = School.objects.filter(is_deleted=False)

        if user.role == "SUPER_ADMIN":
            search = self.request.query_params.get("search")
            if search:
                from django.db.models import Q

                qs = qs.filter(
                    Q(name__icontains=search) | Q(subdomain__icontains=search)
                )
            return qs

        # School admins only see their own school
        return qs.filter(pk=user.school_id)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="my-school")
    def my_school(self, request):
        """GET /api/v1/schools/my-school/ — return the current user's school."""
        if not request.user.school_id:
            return Response({"detail": "No school assigned."}, status=404)
        school = School.objects.get(pk=request.user.school_id)
        return Response(SchoolSerializer(school).data)


class AcademicYearViewSet(viewsets.ModelViewSet):
    """CRUD for academic years — school admin only."""

    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        return AcademicYear.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class SectionViewSet(viewsets.ModelViewSet):
    """CRUD for sections — school admin only."""

    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        return Section.objects.filter(school=self.request.user.school)
