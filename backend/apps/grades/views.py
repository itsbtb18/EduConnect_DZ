from rest_framework import permissions, viewsets
from core.permissions import IsAdmin, IsAdminOrTeacher
from .models import ExamType, Grade, ReportCard
from .serializers import ExamTypeSerializer, GradeSerializer, ReportCardSerializer


class ExamTypeViewSet(viewsets.ModelViewSet):
    serializer_class = ExamTypeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return ExamType.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class GradeViewSet(viewsets.ModelViewSet):
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrTeacher]

    def get_queryset(self):
        qs = Grade.objects.filter(school=self.request.user.school)
        if self.request.user.role == "teacher":
            qs = qs.filter(teacher=self.request.user)
        elif self.request.user.role == "student":
            qs = qs.filter(student=self.request.user, status="published")
        return qs

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school, teacher=self.request.user)


class ReportCardViewSet(viewsets.ModelViewSet):
    serializer_class = ReportCardSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return ReportCard.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
