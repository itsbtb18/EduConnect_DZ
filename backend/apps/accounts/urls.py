"""
URL patterns for the Accounts app.
"""

from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    # Authentication
    path("login/", views.LoginView.as_view(), name="login"),
    path("login/pin/", views.PhonePinLoginView.as_view(), name="login-pin"),
    path("refresh/", views.TokenRefreshAPIView.as_view(), name="token-refresh"),
    # User management (admin)
    path("users/", views.UserListCreateView.as_view(), name="user-list-create"),
    path("users/<uuid:pk>/", views.UserDetailView.as_view(), name="user-detail"),
    # Self-service
    path("me/", views.MeView.as_view(), name="me"),
    path(
        "change-password/", views.ChangePasswordView.as_view(), name="change-password"
    ),
    path("fcm-token/", views.UpdateFCMTokenView.as_view(), name="update-fcm-token"),
]
