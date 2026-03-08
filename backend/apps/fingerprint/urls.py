from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AttendanceLogsView,
    DashboardView,
    DeviceDiagnosticsView,
    EnrolledStudentsView,
    EnrollView,
    FingerprintDeviceViewSet,
    FingerprintRecordViewSet,
    ManualFallbackView,
    TardinessReportView,
    VerifyView,
)

router = DefaultRouter()
router.register("devices", FingerprintDeviceViewSet, basename="fingerprint-devices")
router.register("records", FingerprintRecordViewSet, basename="fingerprint-records")

urlpatterns = [
    path("", include(router.urls)),
    path("enroll/", EnrollView.as_view(), name="fingerprint-enroll"),
    path("verify/", VerifyView.as_view(), name="fingerprint-verify"),
    path("manual-fallback/", ManualFallbackView.as_view(), name="fingerprint-manual"),
    path(
        "students/enrolled/",
        EnrolledStudentsView.as_view(),
        name="fingerprint-enrolled",
    ),
    path("dashboard/", DashboardView.as_view(), name="fingerprint-dashboard"),
    path(
        "reports/tardiness/",
        TardinessReportView.as_view(),
        name="fingerprint-tardiness",
    ),
    path(
        "diagnostics/", DeviceDiagnosticsView.as_view(), name="fingerprint-diagnostics"
    ),
    path("logs/", AttendanceLogsView.as_view(), name="fingerprint-logs-list"),
]
