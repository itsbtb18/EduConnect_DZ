from rest_framework import permissions, viewsets
from core.permissions import IsAdminOrTeacher, IsStudent
from .models import HomeworkSubmission, HomeworkTask
from .serializers import HomeworkSubmissionSerializer, HomeworkTaskSerializer


class HomeworkTaskViewSet(viewsets.ModelViewSet):
    serializer_class = HomeworkTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = HomeworkTask.objects.filter(school=self.request.user.school)
        if self.request.user.role == "teacher":
            qs = qs.filter(teacher=self.request.user)
        elif self.request.user.role == "student":
            profile = getattr(self.request.user, "student_profile", None)
            if profile and profile.classroom:
                qs = qs.filter(classroom=profile.classroom, is_published=True)
            else:
                qs = qs.none()
        return qs

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school, teacher=self.request.user)


class HomeworkSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = HomeworkSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = HomeworkSubmission.objects.filter(school=self.request.user.school)
        if self.request.user.role == "student":
            qs = qs.filter(student=self.request.user)
        elif self.request.user.role == "teacher":
            qs = qs.filter(task__teacher=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school, student=self.request.user)
