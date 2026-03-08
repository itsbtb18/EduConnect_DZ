"""
Library URL patterns — path-based (no router).
"""

from django.urls import path

from . import views

urlpatterns = [
    # ── Books catalogue ──
    path("books/", views.BookListCreateView.as_view(), name="library-book-list"),
    path("books/<uuid:pk>/", views.BookDetailView.as_view(), name="library-book-detail"),

    # ── Book copies ──
    path("copies/", views.BookCopyListCreateView.as_view(), name="library-copy-list"),
    path("copies/<uuid:pk>/", views.BookCopyDetailView.as_view(), name="library-copy-detail"),

    # ── Loans ──
    path("loans/", views.LoanListCreateView.as_view(), name="library-loan-list"),
    path("loans/<uuid:pk>/", views.LoanDetailView.as_view(), name="library-loan-detail"),
    path("loans/<uuid:pk>/return/", views.LoanReturnView.as_view(), name="library-loan-return"),
    path("loans/<uuid:pk>/renew/", views.LoanRenewView.as_view(), name="library-loan-renew"),
    path("my-loans/", views.MyLoansView.as_view(), name="library-my-loans"),

    # ── Reservations ──
    path("reservations/", views.ReservationListCreateView.as_view(), name="library-reservation-list"),
    path("reservations/<uuid:pk>/cancel/", views.ReservationCancelView.as_view(), name="library-reservation-cancel"),

    # ── Special requests ──
    path("requests/", views.LibraryRequestListCreateView.as_view(), name="library-request-list"),
    path("requests/<uuid:pk>/", views.LibraryRequestDetailView.as_view(), name="library-request-detail"),
    path("requests/<uuid:pk>/resolve/", views.LibraryRequestResolveView.as_view(), name="library-request-resolve"),

    # ── Reports ──
    path("usage-report/", views.UsageReportView.as_view(), name="library-usage-report"),
]
