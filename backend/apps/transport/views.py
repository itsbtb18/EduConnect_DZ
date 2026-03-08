"""
Transport views — school-scoped, APIView-based.

Endpoints:
  Admin:  CRUD drivers, lines, stops, student assignments, trip logs, GPS push
  Parent: read transport info for own children, live GPS tracking
  Report: performance (on-time %, utilization, delays)
"""

import datetime
import logging

from django.db.models import Avg, Count, Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsParent, IsSchoolAdmin, require_module

from .models import (
    BusDriver,
    BusStop,
    GPSPosition,
    StudentTransport,
    TransportLine,
    TripLog,
)
from .serializers import (
    BusDriverCreateSerializer,
    BusDriverSerializer,
    BusStopCreateSerializer,
    BusStopSerializer,
    GPSPositionCreateSerializer,
    GPSPositionSerializer,
    StudentTransportCreateSerializer,
    StudentTransportSerializer,
    TransportLineCreateSerializer,
    TransportLineListSerializer,
    TransportLineSerializer,
    TripLogCreateSerializer,
    TripLogSerializer,
)

logger = logging.getLogger(__name__)


# =====================================================================
# BUS DRIVER — CRUD
# =====================================================================


@require_module("transport")
class BusDriverListCreateView(APIView):
    """List / create bus drivers."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        qs = BusDriver.objects.filter(school=school, is_deleted=False)
        q = request.query_params.get("q")
        if q:
            qs = qs.filter(Q(first_name__icontains=q) | Q(last_name__icontains=q))
        active = request.query_params.get("active")
        if active is not None:
            qs = qs.filter(is_active=active.lower() == "true")
        serializer = BusDriverSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = BusDriverCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        driver = serializer.save(
            school=request.user.school,
            created_by=request.user,
        )
        return Response(
            BusDriverSerializer(driver).data,
            status=status.HTTP_201_CREATED,
        )


@require_module("transport")
class BusDriverDetailView(APIView):
    """Retrieve / update / delete a bus driver."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        try:
            return BusDriver.objects.get(
                pk=pk,
                school=request.user.school,
                is_deleted=False,
            )
        except BusDriver.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(BusDriverSerializer(obj).data)

    def patch(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = BusDriverCreateSerializer(
            obj,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(BusDriverSerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@require_module("transport")
class BusDriverIDCardView(APIView):
    """Return driver ID-card data (JSON) for printing or display."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request, pk):
        try:
            driver = BusDriver.objects.get(
                pk=pk,
                school=request.user.school,
                is_deleted=False,
            )
        except BusDriver.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        card = {
            "id": str(driver.id),
            "school": driver.school.name if driver.school else "",
            "full_name": driver.full_name,
            "photo_url": driver.photo_url,
            "national_id": driver.national_id,
            "date_of_birth": str(driver.date_of_birth) if driver.date_of_birth else "",
            "blood_type": driver.blood_type,
            "phone": driver.phone,
            "license_number": driver.license_number,
            "license_type": driver.license_type,
            "license_expiry": str(driver.license_expiry)
            if driver.license_expiry
            else "",
            "license_valid": driver.license_valid,
            "emergency_contact_name": driver.emergency_contact_name,
            "emergency_contact_phone": driver.emergency_contact_phone,
            "hire_date": str(driver.hire_date) if driver.hire_date else "",
        }
        return Response(card)


# =====================================================================
# TRANSPORT LINE — CRUD
# =====================================================================


@require_module("transport")
class TransportLineListCreateView(APIView):
    """List / create transport lines."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        qs = TransportLine.objects.filter(school=school, is_deleted=False)
        q = request.query_params.get("q")
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(neighborhood__icontains=q))
        active = request.query_params.get("active")
        if active is not None:
            qs = qs.filter(is_active=active.lower() == "true")
        neighborhood = request.query_params.get("neighborhood")
        if neighborhood:
            qs = qs.filter(neighborhood__icontains=neighborhood)
        serializer = TransportLineListSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = TransportLineCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        line = serializer.save(
            school=request.user.school,
            created_by=request.user,
        )
        return Response(
            TransportLineSerializer(line).data,
            status=status.HTTP_201_CREATED,
        )


@require_module("transport")
class TransportLineDetailView(APIView):
    """Retrieve / update / delete a transport line (includes nested stops)."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        try:
            return TransportLine.objects.get(
                pk=pk,
                school=request.user.school,
                is_deleted=False,
            )
        except TransportLine.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(TransportLineSerializer(obj).data)

    def patch(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = TransportLineCreateSerializer(
            obj,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TransportLineSerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================================
# BUS STOP — CRUD
# =====================================================================


@require_module("transport")
class BusStopListCreateView(APIView):
    """List / create stops for a given line."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        qs = BusStop.objects.filter(school=school, is_deleted=False)
        line_id = request.query_params.get("line")
        if line_id:
            qs = qs.filter(line_id=line_id)
        serializer = BusStopSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = BusStopCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        stop = serializer.save(
            school=request.user.school,
            created_by=request.user,
        )
        return Response(
            BusStopSerializer(stop).data,
            status=status.HTTP_201_CREATED,
        )


@require_module("transport")
class BusStopDetailView(APIView):
    """Retrieve / update / delete a bus stop."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        try:
            return BusStop.objects.get(
                pk=pk,
                school=request.user.school,
                is_deleted=False,
            )
        except BusStop.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(BusStopSerializer(obj).data)

    def patch(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = BusStopCreateSerializer(
            obj,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(BusStopSerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================================
# STUDENT TRANSPORT — assignment CRUD
# =====================================================================


@require_module("transport")
class StudentTransportListCreateView(APIView):
    """List / assign students to transport lines."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        qs = StudentTransport.objects.filter(
            school=school,
            is_deleted=False,
        ).select_related("student", "line", "pickup_stop", "dropoff_stop")
        line_id = request.query_params.get("line")
        if line_id:
            qs = qs.filter(line_id=line_id)
        active = request.query_params.get("active")
        if active is not None:
            qs = qs.filter(is_active=active.lower() == "true")
        q = request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(student__first_name__icontains=q) | Q(student__last_name__icontains=q)
            )
        serializer = StudentTransportSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = StudentTransportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save(
            school=request.user.school,
            created_by=request.user,
        )
        return Response(
            StudentTransportSerializer(assignment).data,
            status=status.HTTP_201_CREATED,
        )


@require_module("transport")
class StudentTransportDetailView(APIView):
    """Retrieve / update / delete a student transport assignment."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        try:
            return StudentTransport.objects.get(
                pk=pk,
                school=request.user.school,
                is_deleted=False,
            )
        except StudentTransport.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(StudentTransportSerializer(obj).data)

    def patch(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = StudentTransportCreateSerializer(
            obj,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(StudentTransportSerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================================
# GPS POSITION — push new positions / parent live-tracking
# =====================================================================


@require_module("transport")
class GPSPositionUpdateView(APIView):
    """
    POST a new GPS position for a line (called by driver device or backend service).
    Admin-only.
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request):
        serializer = GPSPositionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        gps = serializer.save(
            school=request.user.school,
            created_by=request.user,
        )
        return Response(
            GPSPositionSerializer(gps).data,
            status=status.HTTP_201_CREATED,
        )


@require_module("transport")
class GPSPositionParentView(APIView):
    """
    Parent endpoint: get the latest GPS position for each transport line
    their children are assigned to.
    """

    permission_classes = [permissions.IsAuthenticated, IsParent]

    def get(self, request):
        parent = request.user
        # Get children via parent profile
        try:
            pp = parent.parent_profile
            children_ids = list(pp.children.values_list("user_id", flat=True))
        except Exception:
            children_ids = []

        if not children_ids:
            return Response({"results": []})

        # Find transport line IDs for these children
        assignments = StudentTransport.objects.filter(
            student_id__in=children_ids,
            is_active=True,
            is_deleted=False,
        ).select_related("line", "student")

        results = []
        for a in assignments:
            # Latest GPS for this line
            gps = (
                GPSPosition.objects.filter(
                    line=a.line,
                    is_deleted=False,
                )
                .order_by("-recorded_at")
                .first()
            )
            results.append(
                {
                    "child_id": str(a.student_id),
                    "child_name": a.student.full_name,
                    "line_id": str(a.line_id),
                    "line_name": a.line.name,
                    "gps": GPSPositionSerializer(gps).data if gps else None,
                }
            )

        return Response({"results": results})


# =====================================================================
# TRIP LOG — CRUD + performance report
# =====================================================================


@require_module("transport")
class TripLogListCreateView(APIView):
    """List / create trip log entries."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        qs = TripLog.objects.filter(school=school, is_deleted=False)
        line_id = request.query_params.get("line")
        if line_id:
            qs = qs.filter(line_id=line_id)
        trip_type = request.query_params.get("trip_type")
        if trip_type:
            qs = qs.filter(trip_type=trip_type.upper())
        date_from = request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(date__gte=date_from)
        date_to = request.query_params.get("date_to")
        if date_to:
            qs = qs.filter(date__lte=date_to)
        serializer = TripLogSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = TripLogCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        trip = serializer.save(
            school=request.user.school,
            created_by=request.user,
        )
        return Response(
            TripLogSerializer(trip).data,
            status=status.HTTP_201_CREATED,
        )


@require_module("transport")
class TripLogDetailView(APIView):
    """Retrieve / update / delete a trip log entry."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        try:
            return TripLog.objects.get(
                pk=pk,
                school=request.user.school,
                is_deleted=False,
            )
        except TripLog.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(TripLogSerializer(obj).data)

    def patch(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = TripLogCreateSerializer(
            obj,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TripLogSerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================================
# PERFORMANCE REPORT
# =====================================================================


@require_module("transport")
class PerformanceReportView(APIView):
    """
    Transport performance report for admin.
    Query params: ?line=<id>&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    Returns on-time rate, average delay, utilization, per-line breakdown.
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        qs = TripLog.objects.filter(school=school, is_deleted=False)

        line_id = request.query_params.get("line")
        if line_id:
            qs = qs.filter(line_id=line_id)
        date_from = request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(date__gte=date_from)
        date_to = request.query_params.get("date_to")
        if date_to:
            qs = qs.filter(date__lte=date_to)

        total = qs.count()
        if total == 0:
            return Response(
                {
                    "total_trips": 0,
                    "on_time_count": 0,
                    "delayed_count": 0,
                    "cancelled_count": 0,
                    "on_time_rate": 0,
                    "avg_delay_minutes": 0,
                    "avg_passengers": 0,
                    "lines": [],
                }
            )

        on_time = qs.filter(status="ON_TIME").count()
        delayed = qs.filter(status="DELAYED").count()
        cancelled = qs.filter(status="CANCELLED").count()

        # Compute averages with simple loop for SQLite compatibility
        total_delay = 0
        total_passengers = 0
        for t in qs.only("delay_minutes", "passengers_count"):
            total_delay += t.delay_minutes
            total_passengers += t.passengers_count
        avg_delay = round(total_delay / total, 1) if total else 0
        avg_passengers = round(total_passengers / total, 1) if total else 0

        # Per-line breakdown
        line_ids = set(qs.values_list("line_id", flat=True))
        lines_data = []
        for lid in line_ids:
            line_qs = qs.filter(line_id=lid)
            lcount = line_qs.count()
            l_on_time = line_qs.filter(status="ON_TIME").count()
            try:
                lname = TransportLine.objects.get(pk=lid).name
            except TransportLine.DoesNotExist:
                lname = str(lid)
            lines_data.append(
                {
                    "line_id": str(lid),
                    "line_name": lname,
                    "total_trips": lcount,
                    "on_time_count": l_on_time,
                    "on_time_rate": round(l_on_time / lcount * 100, 1) if lcount else 0,
                }
            )

        return Response(
            {
                "total_trips": total,
                "on_time_count": on_time,
                "delayed_count": delayed,
                "cancelled_count": cancelled,
                "on_time_rate": round(on_time / total * 100, 1),
                "avg_delay_minutes": avg_delay,
                "avg_passengers": avg_passengers,
                "lines": lines_data,
            }
        )


# =====================================================================
# PARENT TRANSPORT INFO
# =====================================================================


@require_module("transport")
class ParentTransportInfoView(APIView):
    """
    Parent endpoint: view transport details for own children
    (line, stops, schedule, driver info).
    """

    permission_classes = [permissions.IsAuthenticated, IsParent]

    def get(self, request):
        parent = request.user
        try:
            pp = parent.parent_profile
            children_ids = list(pp.children.values_list("user_id", flat=True))
        except Exception:
            children_ids = []

        if not children_ids:
            return Response({"results": []})

        assignments = StudentTransport.objects.filter(
            student_id__in=children_ids,
            is_active=True,
            is_deleted=False,
        ).select_related(
            "student",
            "line",
            "line__driver",
            "pickup_stop",
            "dropoff_stop",
        )

        results = []
        for a in assignments:
            line = a.line
            stops = BusStop.objects.filter(
                line=line,
                is_deleted=False,
            ).order_by("order")
            results.append(
                {
                    "child_id": str(a.student_id),
                    "child_name": a.student.full_name,
                    "line": {
                        "id": str(line.id),
                        "name": line.name,
                        "neighborhood": line.neighborhood,
                        "departure_time": str(line.departure_time)
                        if line.departure_time
                        else None,
                        "return_time": str(line.return_time)
                        if line.return_time
                        else None,
                        "vehicle_plate": line.vehicle_plate,
                        "vehicle_model": line.vehicle_model,
                        "vehicle_color": line.vehicle_color,
                    },
                    "driver": {
                        "name": line.driver.full_name if line.driver else None,
                        "phone": line.driver.phone if line.driver else None,
                    }
                    if line.driver
                    else None,
                    "pickup_stop": a.pickup_stop.name if a.pickup_stop else None,
                    "dropoff_stop": a.dropoff_stop.name if a.dropoff_stop else None,
                    "stops": [
                        {
                            "name": s.name,
                            "order": s.order,
                            "estimated_time": str(s.estimated_time)
                            if s.estimated_time
                            else None,
                        }
                        for s in stops
                    ],
                }
            )

        return Response({"results": results})
