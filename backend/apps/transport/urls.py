"""
Transport URL patterns — path-based (no DefaultRouter).
"""

from django.urls import path

from .views import (
    BusDriverDetailView,
    BusDriverIDCardView,
    BusDriverListCreateView,
    BusStopDetailView,
    BusStopListCreateView,
    GPSPositionParentView,
    GPSPositionUpdateView,
    ParentTransportInfoView,
    PerformanceReportView,
    StudentTransportDetailView,
    StudentTransportListCreateView,
    TransportLineDetailView,
    TransportLineListCreateView,
    TripLogDetailView,
    TripLogListCreateView,
)

urlpatterns = [
    # Drivers
    path("drivers/", BusDriverListCreateView.as_view(), name="transport-driver-list"),
    path("drivers/<uuid:pk>/", BusDriverDetailView.as_view(), name="transport-driver-detail"),
    path("drivers/<uuid:pk>/id-card/", BusDriverIDCardView.as_view(), name="transport-driver-id-card"),

    # Lines
    path("lines/", TransportLineListCreateView.as_view(), name="transport-line-list"),
    path("lines/<uuid:pk>/", TransportLineDetailView.as_view(), name="transport-line-detail"),

    # Stops
    path("stops/", BusStopListCreateView.as_view(), name="transport-stop-list"),
    path("stops/<uuid:pk>/", BusStopDetailView.as_view(), name="transport-stop-detail"),

    # Student assignments
    path("students/", StudentTransportListCreateView.as_view(), name="transport-student-list"),
    path("students/<uuid:pk>/", StudentTransportDetailView.as_view(), name="transport-student-detail"),

    # GPS
    path("gps/", GPSPositionUpdateView.as_view(), name="transport-gps-update"),
    path("gps/track/", GPSPositionParentView.as_view(), name="transport-gps-parent"),

    # Trip logs
    path("trips/", TripLogListCreateView.as_view(), name="transport-trip-list"),
    path("trips/<uuid:pk>/", TripLogDetailView.as_view(), name="transport-trip-detail"),

    # Reports & parent info
    path("report/", PerformanceReportView.as_view(), name="transport-performance-report"),
    path("parent-info/", ParentTransportInfoView.as_view(), name="transport-parent-info"),
]
