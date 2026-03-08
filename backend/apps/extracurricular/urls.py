from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ActivityViewSet, EnrollmentViewSet, SessionViewSet

router = DefaultRouter()
router.register("activities", ActivityViewSet, basename="extracurricular-activities")
router.register("enrollments", EnrollmentViewSet, basename="extracurricular-enrollments")
router.register("sessions", SessionViewSet, basename="extracurricular-sessions")

urlpatterns = [
    path("", include(router.urls)),
]
