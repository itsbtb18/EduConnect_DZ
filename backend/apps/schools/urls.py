from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "schools"

router = DefaultRouter()
router.register("", views.SchoolViewSet, basename="school")
router.register("academic-years", views.AcademicYearViewSet, basename="academic-year")
router.register("sections", views.SectionViewSet, basename="section")

urlpatterns = [
    path("", include(router.urls)),
]
