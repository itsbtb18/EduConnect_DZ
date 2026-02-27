from rest_framework import permissions, viewsets
from .models import AbsenceExcuse, AttendanceRecord
from .serializers import AbsenceExcuseSerializer, AttendanceRecordSerializer


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AttendanceRecord.objects.filter(school=self.request.user.school)
        if self.request.user.role == "student":
            qs = qs.filter(student=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school, marked_by=self.request.user)


class AbsenceExcuseViewSet(viewsets.ModelViewSet):
    serializer_class = AbsenceExcuseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AbsenceExcuse.objects.filter(school=self.request.user.school)
        if self.request.user.role == "parent":
            qs = qs.filter(submitted_by=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school, submitted_by=self.request.user)
