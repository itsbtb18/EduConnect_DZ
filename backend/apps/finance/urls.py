from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "finance"
router = DefaultRouter()
router.register("fees", views.FeeStructureViewSet, basename="fee-structure")
router.register("payments", views.PaymentViewSet, basename="payment")
urlpatterns = [path("", include(router.urls))]
