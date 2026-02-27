from rest_framework import permissions, viewsets

from core.permissions import IsAdmin, IsSuperAdmin

from .models import AcademicYear, School, Semester
from .serializers import AcademicYearSerializer, SchoolSerializer, SemesterSerializer


class SchoolViewSet(viewsets.ModelViewSet):
    """CRUD for schools — superadmin only."""

    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    queryset = School.objects.all()


class AcademicYearViewSet(viewsets.ModelViewSet):
    """CRUD for academic years — school admin only."""

    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return AcademicYear.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class SemesterViewSet(viewsets.ModelViewSet):
    """CRUD for semesters — school admin only."""

    serializer_class = SemesterSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return Semester.objects.filter(academic_year__school=self.request.user.school)
