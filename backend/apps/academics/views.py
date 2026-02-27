from rest_framework import permissions, viewsets

from core.permissions import IsSchoolAdmin, IsAdminOrTeacher

from .models import (
    Class,
    Lesson,
    Resource,
    ScheduleSlot,
    Subject,
    TeacherAssignment,
)
from .serializers import (
    ClassSerializer,
    LessonSerializer,
    ResourceSerializer,
    ScheduleSlotSerializer,
    SubjectSerializer,
    TeacherAssignmentSerializer,
)


class ClassViewSet(viewsets.ModelViewSet):
    serializer_class = ClassSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        return Class.objects.filter(section__school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save()


class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        return Subject.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class TeacherAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        return TeacherAssignment.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class ScheduleSlotViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleSlotSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        return ScheduleSlot.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrTeacher]

    def get_queryset(self):
        return Lesson.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school, teacher=self.request.user)


class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrTeacher]

    def get_queryset(self):
        return Resource.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school, teacher=self.request.user)
