from django.urls import path

from .views import (
    CanteenStudentDetailView,
    CanteenStudentListCreateView,
    ConsumptionReportView,
    MealAttendanceBulkView,
    MealAttendanceListCreateView,
    MenuDetailView,
    MenuItemDetailView,
    MenuItemListCreateView,
    MenuListCreateView,
    MenuPublishView,
    ParentMenuListView,
)

urlpatterns = [
    # Canteen students
    path("students/", CanteenStudentListCreateView.as_view(), name="canteen-student-list"),
    path("students/<uuid:pk>/", CanteenStudentDetailView.as_view(), name="canteen-student-detail"),
    # Menus
    path("menus/", MenuListCreateView.as_view(), name="canteen-menu-list"),
    path("menus/<uuid:pk>/", MenuDetailView.as_view(), name="canteen-menu-detail"),
    path("menus/<uuid:pk>/publish/", MenuPublishView.as_view(), name="canteen-menu-publish"),
    # Menu items
    path("menus/<uuid:menu_pk>/items/", MenuItemListCreateView.as_view(), name="canteen-menu-item-list"),
    path("menu-items/<uuid:pk>/", MenuItemDetailView.as_view(), name="canteen-menu-item-detail"),
    # Attendance
    path("attendance/", MealAttendanceListCreateView.as_view(), name="canteen-attendance-list"),
    path("attendance/bulk/", MealAttendanceBulkView.as_view(), name="canteen-attendance-bulk"),
    # Parent view (published menus)
    path("parent/menus/", ParentMenuListView.as_view(), name="canteen-parent-menus"),
    # Reports
    path("reports/consumption/", ConsumptionReportView.as_view(), name="canteen-consumption-report"),
]
