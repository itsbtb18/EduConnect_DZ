from django.urls import path

from . import views

app_name = "notifications"

urlpatterns = [
    # List notifications
    path("", views.NotificationListView.as_view(), name="notification-list"),
    # Mark single as read
    path(
        "<uuid:pk>/read/",
        views.NotificationMarkReadView.as_view(),
        name="notification-read",
    ),
    # Mark all as read
    path(
        "read-all/",
        views.NotificationMarkAllReadView.as_view(),
        name="notification-read-all",
    ),
    # Unread count
    path(
        "unread-count/",
        views.UnreadCountView.as_view(),
        name="notification-unread-count",
    ),
    # Device token registration
    path(
        "devices/",
        views.DeviceTokenView.as_view(),
        name="device-token",
    ),
]
