from django.urls import path

from . import views

app_name = "grades"

urlpatterns = [
    # Teacher: bulk submit grades
    path("submit/", views.GradeSubmitView.as_view(), name="grade-submit"),
    # Teacher: advance to submitted
    path(
        "<uuid:pk>/submit-to-admin/",
        views.GradeSubmitToAdminView.as_view(),
        name="grade-submit-to-admin",
    ),
    # Admin: publish
    path(
        "<uuid:pk>/publish/",
        views.GradePublishView.as_view(),
        name="grade-publish",
    ),
    # Admin: return with comment
    path(
        "<uuid:pk>/return/",
        views.GradeReturnView.as_view(),
        name="grade-return",
    ),
]
