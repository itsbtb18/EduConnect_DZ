from django.urls import path

from . import views

app_name = "attendance"

urlpatterns = [
    # Teacher: bulk mark attendance
    path("mark/", views.MarkAttendanceView.as_view(), name="mark-attendance"),
    # Admin: filterable attendance list (with pagination)
    path("", views.AttendanceListView.as_view(), name="attendance-list"),
    # Admin: dashboard stats
    path("stats/", views.AbsenceStatsView.as_view(), name="absence-stats"),
    # Admin: export report (CSV)
    path("report/", views.AbsenceReportView.as_view(), name="absence-report"),
    # Admin: justify an absence
    path(
        "<uuid:pk>/justify/",
        views.JustifyAbsenceView.as_view(),
        name="absence-justify",
    ),
    # Admin: cancel/delete attendance record
    path(
        "<uuid:pk>/cancel/",
        views.CancelAbsenceView.as_view(),
        name="absence-cancel",
    ),
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
