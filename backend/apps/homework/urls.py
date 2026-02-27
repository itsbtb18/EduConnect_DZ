from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "homework"
router = DefaultRouter()
router.register("tasks", views.HomeworkTaskViewSet, basename="homework-task")
router.register(
    "submissions", views.HomeworkSubmissionViewSet, basename="homework-submission"
)
urlpatterns = [path("", include(router.urls))]
