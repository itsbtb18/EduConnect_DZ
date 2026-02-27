from rest_framework import permissions, viewsets

from core.permissions import IsSchoolAdmin, IsSuperAdmin

from .models import AcademicYear, School, Section
from .serializers import AcademicYearSerializer, SchoolSerializer, SectionSerializer


class SchoolViewSet(viewsets.ModelViewSet):
    """CRUD for schools — superadmin only."""

    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    queryset = School.objects.all()


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
