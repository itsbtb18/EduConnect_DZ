"""
URL patterns for the Accounts app.
"""

from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    # Authentication
    path("login/", views.LoginView.as_view(), name="login"),
    path("login/pin/", views.PINLoginView.as_view(), name="login-pin"),
    path("refresh/", views.TokenRefreshAPIView.as_view(), name="token-refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
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
