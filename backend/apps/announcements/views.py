from rest_framework import permissions, viewsets
from core.permissions import IsAdminOrTeacher
from .models import Announcement, Event
from .serializers import AnnouncementSerializer, EventSerializer


class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Announcement.objects.filter(
            school=self.request.user.school, is_published=True
        )
        role = self.request.user.role
        if role in ("student", "parent"):
            qs = qs.filter(target_audience__in=["all", f"{role}s"])
        return qs

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school, author=self.request.user)


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
