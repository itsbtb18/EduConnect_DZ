from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "attendance"
router = DefaultRouter()
router.register("records", views.AttendanceRecordViewSet, basename="attendance-record")
router.register("excuses", views.AbsenceExcuseViewSet, basename="absence-excuse")
urlpatterns = [path("", include(router.urls))]
