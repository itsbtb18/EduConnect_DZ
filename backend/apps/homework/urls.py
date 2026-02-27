from django.urls import path

from . import views

app_name = "homework"

urlpatterns = [
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
