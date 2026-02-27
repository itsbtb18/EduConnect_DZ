from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "announcements"
router = DefaultRouter()
router.register("posts", views.AnnouncementViewSet, basename="announcement")
router.register("events", views.EventViewSet, basename="event")
urlpatterns = [path("", include(router.urls))]
