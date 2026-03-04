from django.urls import path

from . import views

app_name = "homework"

urlpatterns = [
    # Stats (must be before <uuid:pk>)
    path("stats/", views.HomeworkStatsView.as_view(), name="homework-stats"),
    # Calendar
    path("calendar/", views.HomeworkCalendarView.as_view(), name="homework-calendar"),
    # Overload detection
    path("overload/", views.HomeworkOverloadView.as_view(), name="homework-overload"),
    # List + create
    path("", views.HomeworkListCreateView.as_view(), name="homework-list-create"),
    # Detail: retrieve, update, delete
    path("<uuid:pk>/", views.HomeworkDetailView.as_view(), name="homework-detail"),
    # Teacher: mark as corrected
    path(
        "<uuid:pk>/corrected/",
        views.HomeworkMarkCorrectedView.as_view(),
        name="homework-corrected",
    ),
]
