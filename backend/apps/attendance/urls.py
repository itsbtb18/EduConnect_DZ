from django.urls import path

from . import views

app_name = "attendance"

urlpatterns = [
    # Teacher: bulk mark attendance
    path("mark/", views.MarkAttendanceView.as_view(), name="mark-attendance"),
    # Admin: filterable attendance list
    path("", views.AttendanceListView.as_view(), name="attendance-list"),
    # Parent/Student: their own attendance
    path("my/", views.StudentAttendanceView.as_view(), name="student-attendance"),
    # Parent: submit excuse
    path("excuses/", views.ExcuseSubmitView.as_view(), name="excuse-submit"),
    # Admin: approve/reject excuse
    path(
        "excuses/<uuid:pk>/review/",
        views.ExcuseReviewView.as_view(),
        name="excuse-review",
    ),
]
