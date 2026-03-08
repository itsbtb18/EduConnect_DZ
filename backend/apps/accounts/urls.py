"""
URL patterns for the Accounts app.
"""

from django.urls import path

from . import views
from .views_bulk_import import (
    BulkImportProgressView,
    BulkImportTemplateView,
    BulkImportUploadView,
)

app_name = "accounts"

urlpatterns = [
    # Authentication
    path("login/", views.LoginView.as_view(), name="login"),
    path("login/pin/", views.PINLoginView.as_view(), name="login-pin"),
    path("refresh/", views.TokenRefreshAPIView.as_view(), name="token-refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    # OTP / TOTP verification
    path("verify-otp/", views.VerifyOTPView.as_view(), name="verify-otp"),
    path("verify-totp/", views.VerifyTOTPView.as_view(), name="verify-totp"),
    path("totp/setup/", views.TOTPSetupView.as_view(), name="totp-setup"),
    # Device & session management
    path("devices/", views.DeviceListView.as_view(), name="device-list"),
    path(
        "devices/<uuid:pk>/revoke/",
        views.DeviceRevokeView.as_view(),
        name="device-revoke",
    ),
    path("sessions/", views.SessionListView.as_view(), name="session-list"),
    path(
        "sessions/<uuid:pk>/revoke/",
        views.SessionRevokeView.as_view(),
        name="session-revoke",
    ),
    path(
        "sessions/revoke-all/",
        views.RevokeAllSessionsView.as_view(),
        name="session-revoke-all",
    ),
    # Audit logs
    path("audit-logs/", views.AuditLogListView.as_view(), name="audit-logs"),
    # User management (admin / superadmin)
    path("users/", views.UserListCreateView.as_view(), name="user-list-create"),
    path("users/<uuid:pk>/", views.UserDetailView.as_view(), name="user-detail"),
    path(
        "users/<uuid:pk>/reset-password/",
        views.ResetUserPasswordView.as_view(),
        name="user-reset-password",
    ),
    # Self-service
    path("me/", views.MeView.as_view(), name="me"),
    path(
        "change-password/", views.ChangePasswordView.as_view(), name="change-password"
    ),
    # Bulk student import
    path(
        "students/bulk-import/",
        BulkImportUploadView.as_view(),
        name="bulk-import-upload",
    ),
    path(
        "students/bulk-import/template/",
        BulkImportTemplateView.as_view(),
        name="bulk-import-template",
    ),
    path(
        "students/bulk-import/<uuid:job_id>/progress/",
        BulkImportProgressView.as_view(),
        name="bulk-import-progress",
    ),
    # Platform stats (super admin only)
    path(
        "platform-stats/",
        views.PlatformStatsView.as_view(),
        name="platform-stats",
    ),
    # Platform settings (super admin only)
    path(
        "platform-settings/",
        views.PlatformSettingsView.as_view(),
        name="platform-settings",
    ),
    # Activity logs (super admin only)
    path(
        "activity-logs/",
        views.ActivityLogListView.as_view(),
        name="activity-logs",
    ),
    # System health (super admin only)
    path(
        "system-health/",
        views.SystemHealthView.as_view(),
        name="system-health",
    ),
]
