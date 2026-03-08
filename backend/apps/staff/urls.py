from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    StaffAttendanceViewSet,
    StaffDocumentViewSet,
    StaffLeaveApprovalView,
    StaffLeaveViewSet,
    StaffMemberViewSet,
    StaffStatsView,
)

router = DefaultRouter()
router.register("members", StaffMemberViewSet, basename="staff-members")
router.register("documents", StaffDocumentViewSet, basename="staff-documents")
router.register("attendance", StaffAttendanceViewSet, basename="staff-attendance")
router.register("leaves", StaffLeaveViewSet, basename="staff-leaves")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "leaves/<uuid:pk>/<str:action>/",
        StaffLeaveApprovalView.as_view(),
        name="staff-leave-approval",
    ),
    path("stats/", StaffStatsView.as_view(), name="staff-stats"),
]
