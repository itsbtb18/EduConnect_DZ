from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "grades"
router = DefaultRouter()
router.register("exam-types", views.ExamTypeViewSet, basename="exam-type")
router.register("marks", views.GradeViewSet, basename="grade")
router.register("report-cards", views.ReportCardViewSet, basename="report-card")
urlpatterns = [path("", include(router.urls))]
