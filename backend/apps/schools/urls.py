from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "schools"

router = DefaultRouter()
router.register("academic-years", views.AcademicYearViewSet, basename="academic-year")
router.register("sections", views.SectionViewSet, basename="section")
router.register("", views.SchoolViewSet, basename="school")

# Content resources uses its own router to keep URLs clean
content_router = DefaultRouter()
content_router.register("", views.ContentResourceViewSet, basename="content-resource")

urlpatterns = [
    # Super Admin — Subscription management
    path(
        "super/<uuid:school_id>/subscription/",
        views.SubscriptionDetailView.as_view(),
        name="subscription-detail",
    ),
    path(
        "super/<uuid:school_id>/modules/<str:module>/activate/",
        views.ModuleActivateView.as_view(),
        name="module-activate",
    ),
    path(
        "super/<uuid:school_id>/modules/<str:module>/deactivate/",
        views.ModuleDeactivateView.as_view(),
        name="module-deactivate",
    ),
    path(
        "super/<uuid:school_id>/suspend/",
        views.SchoolSuspendView.as_view(),
        name="school-suspend",
    ),
    path(
        "super/<uuid:school_id>/invoices/",
        views.InvoiceListView.as_view(),
        name="invoice-list",
    ),
    path(
        "super/<uuid:school_id>/invoices/generate/",
        views.InvoiceGenerateView.as_view(),
        name="invoice-generate",
    ),
    path(
        "super/<uuid:school_id>/invoices/<uuid:invoice_id>/mark-paid/",
        views.InvoiceMarkPaidView.as_view(),
        name="invoice-mark-paid",
    ),
    path(
        "super/<uuid:school_id>/module-logs/",
        views.ModuleActivationLogListView.as_view(),
        name="module-logs",
    ),
    path(
        "super/invoices/",
        views.AllInvoicesListView.as_view(),
        name="all-invoices",
    ),
    # Super Admin — Analytics
    path(
        "super/analytics/overview/",
        views.AnalyticsOverviewView.as_view(),
        name="analytics-overview",
    ),
    path(
        "super/analytics/revenue/",
        views.AnalyticsRevenueView.as_view(),
        name="analytics-revenue",
    ),
    path(
        "super/analytics/modules-usage/",
        views.AnalyticsModulesUsageView.as_view(),
        name="analytics-modules-usage",
    ),
    path(
        "super/analytics/schools-map/",
        views.AnalyticsSchoolsMapView.as_view(),
        name="analytics-schools-map",
    ),
    path(
        "super/analytics/churn/",
        views.AnalyticsChurnView.as_view(),
        name="analytics-churn",
    ),
    path(
        "super/analytics/performance/",
        views.PerformanceView.as_view(),
        name="analytics-performance",
    ),
    # Super Admin — Impersonation
    path(
        "super/<uuid:school_id>/impersonate/",
        views.ImpersonateStartView.as_view(),
        name="impersonate-start",
    ),
    path(
        "super/impersonate/end/",
        views.ImpersonateEndView.as_view(),
        name="impersonate-end",
    ),
    path(
        "super/impersonation-logs/",
        views.ImpersonationLogsView.as_view(),
        name="impersonation-logs",
    ),
    # Super Admin — Broadcast
    path(
        "super/broadcast/",
        views.BroadcastView.as_view(),
        name="broadcast",
    ),
    # Super Admin — Content Management
    path("super/content/resources/", include(content_router.urls)),
    # Router URLs
    path("", include(router.urls)),
]
