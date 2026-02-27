from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "academics"

router = DefaultRouter()
router.register("levels", views.LevelViewSet, basename="level")
router.register("classrooms", views.ClassroomViewSet, basename="classroom")
router.register("subjects", views.SubjectViewSet, basename="subject")
router.register(
    "assignments", views.TeacherAssignmentViewSet, basename="teacher-assignment"
)
router.register("schedule", views.ScheduleSlotViewSet, basename="schedule-slot")
router.register("lessons", views.LessonViewSet, basename="lesson")
router.register("resources", views.ResourceViewSet, basename="resource")

urlpatterns = [path("", include(router.urls))]
