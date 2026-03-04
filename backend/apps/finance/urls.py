from django.urls import path
from . import views

app_name = "finance"

urlpatterns = [
    # Fee Structures
    path(
        "fee-structures/", views.FeeStructureListCreateView.as_view(), name="fee-list"
    ),
    path(
        "fee-structures/<uuid:pk>/",
        views.FeeStructureDetailView.as_view(),
        name="fee-detail",
    ),
    # Payments — special endpoints BEFORE <uuid:pk>
    path("payments/stats/", views.PaymentStatsView.as_view(), name="payment-stats"),
    path(
        "payments/expiring-soon/",
        views.PaymentExpiringSoonView.as_view(),
        name="payment-expiring",
    ),
    path(
        "payments/bulk-reminder/",
        views.PaymentBulkReminderView.as_view(),
        name="payment-bulk-reminder",
    ),
    path("payments/report/", views.PaymentReportView.as_view(), name="payment-report"),
    # Payments CRUD
    path("payments/", views.PaymentListCreateView.as_view(), name="payment-list"),
    path(
        "payments/<uuid:pk>/", views.PaymentDetailView.as_view(), name="payment-detail"
    ),
    path(
        "payments/<uuid:pk>/send-reminder/",
        views.PaymentSendReminderView.as_view(),
        name="payment-reminder",
    ),
]
