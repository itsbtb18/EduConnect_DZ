"""
Canteen views — school-scoped.
"""

import datetime
import logging

from django.db.models import Count, Q
from django.http import HttpResponse
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsSchoolAdmin, IsParent, require_module

from .models import CanteenStudent, MealAttendance, Menu, MenuItem
from .serializers import (
    CanteenStudentCreateSerializer,
    CanteenStudentSerializer,
    MealAttendanceBulkItemSerializer,
    MealAttendanceCreateSerializer,
    MealAttendanceSerializer,
    MenuCreateSerializer,
    MenuItemCreateSerializer,
    MenuItemSerializer,
    MenuListSerializer,
    MenuSerializer,
)

logger = logging.getLogger(__name__)


# =========================================================================
# CANTEEN STUDENT — Enrollment + nutritional / medical info
# =========================================================================


@require_module("cantine")
class CanteenStudentListCreateView(APIView):
    """List enrolled canteen students / enroll a new student."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        qs = (
            CanteenStudent.objects.filter(school=school, is_deleted=False)
            .select_related("student")
            .order_by("student__last_name")
        )
        # Filters
        q = request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(student__first_name__icontains=q) | Q(student__last_name__icontains=q)
            )
        active = request.query_params.get("active")
        if active is not None:
            qs = qs.filter(is_active=active.lower() == "true")
        restriction = request.query_params.get("dietary_restriction")
        if restriction:
            qs = qs.filter(dietary_restriction=restriction)
        nutritional = request.query_params.get("nutritional_status")
        if nutritional:
            qs = qs.filter(nutritional_status=nutritional)
        serializer = CanteenStudentSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = CanteenStudentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(school=request.user.school)
        return Response(
            CanteenStudentSerializer(obj).data, status=status.HTTP_201_CREATED
        )


@require_module("cantine")
class CanteenStudentDetailView(APIView):
    """Retrieve / update / remove a canteen student."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return CanteenStudent.objects.select_related("student").get(
            pk=pk, school=request.user.school, is_deleted=False
        )

    def get(self, request, pk):
        try:
            obj = self._get(request, pk)
        except CanteenStudent.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(CanteenStudentSerializer(obj).data)

    def patch(self, request, pk):
        try:
            obj = self._get(request, pk)
        except CanteenStudent.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = CanteenStudentCreateSerializer(
            obj, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CanteenStudentSerializer(obj).data)

    def delete(self, request, pk):
        try:
            obj = self._get(request, pk)
        except CanteenStudent.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================================
# MENU — CRUD + publish
# =========================================================================


@require_module("cantine")
class MenuListCreateView(APIView):
    """List / create menus."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        qs = Menu.objects.filter(school=school, is_deleted=False).order_by(
            "-start_date"
        )
        published = request.query_params.get("published")
        if published is not None:
            qs = qs.filter(is_published=published.lower() == "true")
        period = request.query_params.get("period_type")
        if period:
            qs = qs.filter(period_type=period)
        serializer = MenuListSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = MenuCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(school=request.user.school)
        return Response(MenuSerializer(obj).data, status=status.HTTP_201_CREATED)


@require_module("cantine")
class MenuDetailView(APIView):
    """Retrieve / update / delete a menu (with nested items)."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return Menu.objects.prefetch_related("items").get(
            pk=pk, school=request.user.school, is_deleted=False
        )

    def get(self, request, pk):
        try:
            obj = self._get(request, pk)
        except Menu.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(MenuSerializer(obj).data)

    def patch(self, request, pk):
        try:
            obj = self._get(request, pk)
        except Menu.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = MenuCreateSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MenuSerializer(obj).data)

    def delete(self, request, pk):
        try:
            obj = self._get(request, pk)
        except Menu.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@require_module("cantine")
class MenuPublishView(APIView):
    """Publish a menu (makes it visible to parents)."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request, pk):
        try:
            menu = Menu.objects.get(pk=pk, school=request.user.school, is_deleted=False)
        except Menu.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if menu.is_published:
            return Response(
                {"error": "Ce menu est déjà publié."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        menu.is_published = True
        menu.save(update_fields=["is_published", "updated_at"])
        return Response(MenuSerializer(menu).data)


# =========================================================================
# MENU ITEMS — CRUD for individual daily meals
# =========================================================================


@require_module("cantine")
class MenuItemListCreateView(APIView):
    """List items for a menu / add a new daily meal."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request, menu_pk):
        school = request.user.school
        qs = MenuItem.objects.filter(
            menu__pk=menu_pk,
            menu__school=school,
            is_deleted=False,
        ).order_by("date")
        serializer = MenuItemSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request, menu_pk):
        # Verify menu belongs to school
        try:
            menu = Menu.objects.get(
                pk=menu_pk, school=request.user.school, is_deleted=False
            )
        except Menu.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        data = {**request.data, "menu": str(menu.pk)}
        serializer = MenuItemCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(school=request.user.school)
        return Response(MenuItemSerializer(obj).data, status=status.HTTP_201_CREATED)


@require_module("cantine")
class MenuItemDetailView(APIView):
    """Retrieve / update / delete a menu item."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return MenuItem.objects.get(
            pk=pk, menu__school=request.user.school, is_deleted=False
        )

    def get(self, request, pk):
        try:
            obj = self._get(request, pk)
        except MenuItem.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(MenuItemSerializer(obj).data)

    def patch(self, request, pk):
        try:
            obj = self._get(request, pk)
        except MenuItem.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = MenuItemCreateSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MenuItemSerializer(obj).data)

    def delete(self, request, pk):
        try:
            obj = self._get(request, pk)
        except MenuItem.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================================
# MEAL ATTENDANCE — daily check-in (single + bulk)
# =========================================================================


@require_module("cantine")
class MealAttendanceListCreateView(APIView):
    """List meal attendances for a date / record one."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        qs = (
            MealAttendance.objects.filter(school=school, is_deleted=False)
            .select_related("student")
            .order_by("-date")
        )
        date = request.query_params.get("date")
        if date:
            qs = qs.filter(date=date)
        student_id = request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)
        serializer = MealAttendanceSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = MealAttendanceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(school=request.user.school)
        return Response(
            MealAttendanceSerializer(obj).data, status=status.HTTP_201_CREATED
        )


@require_module("cantine")
class MealAttendanceBulkView(APIView):
    """
    Bulk mark attendance for a date.
    POST { "date": "2026-03-05", "entries": [{"student": UUID, "present": true}, ...] }
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request):
        date_str = request.data.get("date")
        entries = request.data.get("entries", [])
        if not date_str or not entries:
            return Response(
                {"error": "date and entries are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        school = request.user.school
        created = 0
        updated = 0
        for entry_data in entries:
            ser = MealAttendanceBulkItemSerializer(data=entry_data)
            if not ser.is_valid():
                continue
            student_id = ser.validated_data["student"]
            present = ser.validated_data["present"]
            notes = ser.validated_data.get("notes", "")
            obj, was_created = MealAttendance.objects.update_or_create(
                school=school,
                student_id=student_id,
                date=date_str,
                defaults={"present": present, "notes": notes, "is_deleted": False},
            )
            if was_created:
                created += 1
            else:
                updated += 1
        return Response(
            {"created": created, "updated": updated},
            status=status.HTTP_201_CREATED,
        )


# =========================================================================
# PARENT — published menus (read-only)
# =========================================================================


@require_module("cantine")
class ParentMenuListView(APIView):
    """Parents see published menus for the school."""

    permission_classes = [permissions.IsAuthenticated, IsParent]

    def get(self, request):
        school = request.user.school
        qs = (
            Menu.objects.filter(school=school, is_published=True, is_deleted=False)
            .prefetch_related("items")
            .order_by("-start_date")
        )
        serializer = MenuSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})


# =========================================================================
# REPORTS — Consumption stats
# =========================================================================


@require_module("cantine")
class ConsumptionReportView(APIView):
    """
    Consumption statistics for a date range.
    GET ?start=2026-01-01&end=2026-01-31
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        if not start or not end:
            today = datetime.date.today()
            start = today.replace(day=1).isoformat()
            end = today.isoformat()

        qs = MealAttendance.objects.filter(
            school=school,
            date__gte=start,
            date__lte=end,
            is_deleted=False,
        )
        total_records = qs.count()
        total_present = qs.filter(present=True).count()
        total_absent = qs.filter(present=False).count()

        # Enrolled students count
        enrolled = CanteenStudent.objects.filter(
            school=school, is_active=True, is_deleted=False
        ).count()

        # By dietary restriction
        restriction_stats = (
            CanteenStudent.objects.filter(
                school=school, is_active=True, is_deleted=False
            )
            .values("dietary_restriction")
            .annotate(count=Count("id"))
            .order_by("dietary_restriction")
        )

        # Daily breakdown
        dates = qs.values_list("date", flat=True).distinct().order_by("date")
        daily = []
        for d in dates:
            day_qs = qs.filter(date=d)
            daily.append(
                {
                    "date": d,
                    "present": day_qs.filter(present=True).count(),
                    "absent": day_qs.filter(present=False).count(),
                }
            )

        return Response(
            {
                "start": start,
                "end": end,
                "enrolled_students": enrolled,
                "total_records": total_records,
                "total_present": total_present,
                "total_absent": total_absent,
                "attendance_rate": (
                    round(total_present / total_records * 100, 1)
                    if total_records
                    else 0
                ),
                "dietary_restrictions": list(restriction_stats),
                "daily_breakdown": daily,
            }
        )
