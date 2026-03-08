from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views
from .views_card import StudentCardView
from .views_profiles import (
    ParentFullProfileView,
    StudentFullProfileView,
    TeacherFullProfileView,
)
from .views_qrcode import StudentQRCodeView, TeacherQRCodeView

app_name = "academics"

router = DefaultRouter()
# Hierarchy
router.register("levels", views.LevelViewSet, basename="level")
router.register("streams", views.StreamViewSet, basename="stream")
# Subjects
router.register("subjects", views.SubjectViewSet, basename="subject")
router.register("level-subjects", views.LevelSubjectViewSet, basename="level-subject")
# Classrooms
router.register("classes", views.ClassViewSet, basename="class")
# Teachers / Students
router.register(
    "assignments", views.TeacherAssignmentViewSet, basename="teacher-assignment"
)
router.register("schedule", views.ScheduleSlotViewSet, basename="schedule-slot")
router.register("lessons", views.LessonViewSet, basename="lesson")
router.register("resources", views.ResourceViewSet, basename="resource")
router.register("students", views.StudentViewSet, basename="student")
router.register("teachers", views.TeacherViewSet, basename="teacher")
router.register("timetables", views.TimetableViewSet, basename="timetable")
# Rooms
router.register("rooms", views.RoomViewSet, basename="room")
# Teacher availability
router.register(
    "teacher-availability",
    views.TeacherAvailabilityViewSet,
    basename="teacher-availability",
)
# Time slot configuration
router.register(
    "time-slots",
    views.TimeSlotConfigViewSet,
    basename="time-slot-config",
)

# Full-profile detail endpoints
urlpatterns = [
    path("", include(router.urls)),
    path(
        "students/<uuid:pk>/full-profile/",
        StudentFullProfileView.as_view(),
        name="student-full-profile",
    ),
    path(
        "teachers/<uuid:pk>/full-profile/",
        TeacherFullProfileView.as_view(),
        name="teacher-full-profile",
    ),
    path(
        "parents/<uuid:pk>/full-profile/",
        ParentFullProfileView.as_view(),
        name="parent-full-profile",
    ),
    # QR code endpoints
    path(
        "students/<uuid:pk>/qr-code/",
        StudentQRCodeView.as_view(),
        name="student-qr-code",
    ),
    path(
        "teachers/<uuid:pk>/qr-code/",
        TeacherQRCodeView.as_view(),
        name="teacher-qr-code",
    ),
    # Student ID card endpoint
    path(
        "students/<uuid:pk>/card/",
        StudentCardView.as_view(),
        name="student-card",
    ),
]
