from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BadgeAdminViewSet, GamificationViewSet

router = DefaultRouter()
router.register("", GamificationViewSet, basename="gamification")
router.register("admin/badges", BadgeAdminViewSet, basename="gamification-admin")

urlpatterns = [
    path("", include(router.urls)),
]
