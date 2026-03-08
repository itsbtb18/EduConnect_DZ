from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BehaviorReportViewSet,
    ClassComparisonView,
    DisciplineStatsView,
    IncidentViewSet,
    IncidentWorkflowView,
    SanctionViewSet,
    WarningCounterView,
    WarningThresholdViewSet,
)

router = DefaultRouter()
router.register("incidents", IncidentViewSet, basename="discipline-incidents")
router.register("sanctions", SanctionViewSet, basename="discipline-sanctions")
router.register(
    "behavior-reports", BehaviorReportViewSet, basename="discipline-behavior-reports"
)
router.register(
    "warning-thresholds",
    WarningThresholdViewSet,
    basename="discipline-warning-thresholds",
)

urlpatterns = [
    path("", include(router.urls)),
    path(
        "incidents/<uuid:pk>/workflow/",
        IncidentWorkflowView.as_view(),
        name="discipline-incident-workflow",
    ),
    path("stats/", DisciplineStatsView.as_view(), name="discipline-stats"),
    path("warnings/", WarningCounterView.as_view(), name="discipline-warnings"),
    path(
        "class-comparison/",
        ClassComparisonView.as_view(),
        name="discipline-class-comparison",
    ),
]
