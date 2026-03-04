from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

import logging

from core.permissions import IsSchoolAdmin, IsSuperAdmin

from .models import AcademicYear, School, Section
from .serializers import (
    AcademicYearSerializer,
    SchoolCreateSerializer,
    SchoolSerializer,
    SchoolUpdateSerializer,
    SectionSerializer,
)

logger = logging.getLogger(__name__)


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

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action == "create":
            return SchoolCreateSerializer
        if self.action in ("update", "partial_update"):
            return SchoolUpdateSerializer
        return SchoolSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "my_school", "profile"):
            return [permissions.IsAuthenticated(), IsSuperOrSchoolAdmin()]
        if self.action in ("update_profile", "complete_setup", "upload_logo"):
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

    def _resolve_school(self, request):
        """Resolve school for current user — supports SUPER_ADMIN fallback."""
        if request.user.school_id:
            return School.objects.get(pk=request.user.school_id)
        # SUPER_ADMIN: fallback to the only school if there is exactly one
        schools = School.objects.filter(is_deleted=False)
        if schools.count() == 1:
            return schools.first()
        return None

    @action(detail=False, methods=["get"], url_path="my-school")
    def my_school(self, request):
        """GET /api/v1/schools/my-school/ — return the current user's school."""
        school = self._resolve_school(request)
        if not school:
            return Response({"detail": "No school assigned."}, status=404)
        return Response(SchoolSerializer(school, context={"request": request}).data)

    @action(detail=False, methods=["get"], url_path="profile")
    def profile(self, request):
        """GET /api/v1/schools/profile/ — school admin gets own school profile (includes logo URL)."""
        school = self._resolve_school(request)
        if not school:
            return Response({"detail": "No school assigned."}, status=404)
        return Response(SchoolSerializer(school, context={"request": request}).data)

    @action(detail=False, methods=["patch"], url_path="update-profile")
    def update_profile(self, request):
        """PATCH /api/v1/schools/update-profile/ — school admin updates own school profile."""
        school = self._resolve_school(request)
        if not school:
            return Response({"detail": "No school assigned."}, status=404)
        serializer = SchoolUpdateSerializer(
            school, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="complete-setup")
    def complete_setup(self, request):
        """POST /api/v1/schools/complete-setup/ — mark first-time wizard as done."""
        school = self._resolve_school(request)
        if not school:
            return Response({"detail": "No school assigned."}, status=404)
        school.setup_completed = True
        school.save(update_fields=["setup_completed", "updated_at"])
        return Response({"detail": "Setup completed.", "setup_completed": True})

    @action(detail=True, methods=["post"], url_path="logo")
    def upload_logo(self, request, pk=None):
        """POST /api/v1/schools/{id}/logo/ — upload/replace school logo."""
        school = self.get_object()
        logo = request.FILES.get("logo")
        if not logo:
            return Response(
                {"detail": "No logo file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Validate
        from .models import validate_school_logo

        try:
            validate_school_logo(logo)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Delete old logo if exists
        if school.logo:
            school.logo.delete(save=False)
        school.logo = logo
        school.save(update_fields=["logo", "updated_at"])
        return Response(
            SchoolSerializer(school, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class AcademicYearViewSet(viewsets.ModelViewSet):
    """CRUD for academic years — school admin or superadmin."""

    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get_school(self):
        """Resolve school for the current user (supports SUPER_ADMIN)."""
        user = self.request.user
        if user.school_id:
            return user.school
        school_id = self.request.query_params.get("school") or self.request.data.get("school")
        if school_id:
            return School.objects.filter(pk=school_id, is_deleted=False).first()
        schools = School.objects.filter(is_deleted=False)
        if schools.count() == 1:
            return schools.first()
        return None

    def get_queryset(self):
        school = self._get_school()
        if school:
            return AcademicYear.objects.filter(school=school)
        return AcademicYear.objects.none()

    def perform_create(self, serializer):
        school = self._get_school()
        if not school:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"school": "Impossible de déterminer l'école."})
        # Auto-assign the first section if none provided
        section = serializer.validated_data.get("section")
        if not section:
            section = Section.objects.filter(school=school).first()
        serializer.save(
            school=school,
            section=section,
            created_by=self.request.user,
        )

    def create(self, request, *args, **kwargs):
        """
        Override create to handle duplicate academic year gracefully.
        If an academic year with the same (school, name) already exists,
        return the existing one instead of raising a 500 IntegrityError.
        """
        from django.db import IntegrityError

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except IntegrityError:
            # The academic year already exists — return it
            name = serializer.validated_data.get("name")
            school = self._get_school()
            existing = AcademicYear.objects.filter(
                school=school, name=name
            ).first()
            if existing:
                return Response(
                    AcademicYearSerializer(existing).data,
                    status=status.HTTP_200_OK,
                )
            return Response(
                {
                    "detail": f"Une année académique '{name}' existe déjà pour cette école."
                },
                status=status.HTTP_409_CONFLICT,
            )
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


class SectionViewSet(viewsets.ModelViewSet):
    """CRUD for sections — school admin or superadmin."""

    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get_school(self):
        """Resolve school for the current user (supports SUPER_ADMIN)."""
        user = self.request.user
        if user.school_id:
            return user.school
        # SUPER_ADMIN: try to get school from query param or use the only school
        school_id = self.request.query_params.get("school") or self.request.data.get("school")
        if school_id:
            return School.objects.filter(pk=school_id, is_deleted=False).first()
        # Fallback: if there's only one school, use it
        schools = School.objects.filter(is_deleted=False)
        if schools.count() == 1:
            return schools.first()
        return None

    def get_queryset(self):
        school = self._get_school()
        if school:
            return Section.objects.filter(school=school)
        return Section.objects.none()

    def perform_create(self, serializer):
        school = self._get_school()
        if not school:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"school": "Impossible de déterminer l'école."})
        serializer.save(
            school=school,
            created_by=self.request.user,
        )

    def create(self, request, *args, **kwargs):
        """
        Override create with idempotence:
        If section already exists for this school + section_type → return existing (200).
        Otherwise create new (201).
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        school = self._get_school()
        section_type = serializer.validated_data.get("section_type")

        if school and section_type:
            existing = Section.objects.filter(
                school=school, section_type=section_type
            ).first()
            if existing:
                logger.info(
                    "Section %s already exists for school %s — returning existing.",
                    section_type, school.id,
                )
                return Response(
                    SectionSerializer(existing).data,
                    status=status.HTTP_200_OK,
                )

        try:
            self.perform_create(serializer)
        except Exception as e:
            logger.error(
                "Error creating section: school=%s, data=%s, error=%s",
                school.id if school else None,
                request.data,
                str(e),
                exc_info=True,
            )
            return Response(
                {"detail": f"Erreur lors de la création de la section: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )
