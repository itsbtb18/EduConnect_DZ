from django.urls import path

from . import views

app_name = "announcements"

urlpatterns = [
    # List + create
    path(
        "",
        views.AnnouncementListCreateView.as_view(),
        name="announcement-list-create",
    ),
    # Detail: retrieve, update, delete
    path(
        "<uuid:pk>/",
        views.AnnouncementDetailView.as_view(),
        name="announcement-detail",
    ),
    # Mark as read
    path(
        "<uuid:pk>/read/",
        views.AnnouncementMarkReadView.as_view(),
        name="announcement-read",
    ),
    # Upload image
    path(
        "<uuid:pk>/upload-image/",
        views.AnnouncementImageUploadView.as_view(),
        name="announcement-upload-image",
    ),
    # Upload file attachment
    path(
        "<uuid:pk>/upload-attachment/",
        views.AnnouncementAttachmentUploadView.as_view(),
        name="announcement-upload-attachment",
    ),
    # Read receipts (who read it)
    path(
        "<uuid:pk>/readers/",
        views.AnnouncementReadReceiptsView.as_view(),
        name="announcement-readers",
    ),
]
