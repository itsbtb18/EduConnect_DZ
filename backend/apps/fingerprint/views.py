"""
Fingerprint module views — enroll, verify, dashboard, reports.
"""

import base64
import logging
from datetime import date, datetime, time, timedelta

from django.db.models import Avg, Count, Max, Q, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import require_module
from core.viewsets import TenantAwareViewSet

from .models import (
    BiometricAttendanceLog,
    FingerprintDevice,
    FingerprintRecord,
    FingerprintTemplate,
)
from .readers import get_reader
from .serializers import (
    BiometricAttendanceLogSerializer,
    DeviceDiagnosticSerializer,
    EnrollSerializer,
    FingerprintDeviceSerializer,
    FingerprintRecordSerializer,
    FingerprintTemplateSerializer,
    ManualFallbackSerializer,
    StudentEnrollmentStatusSerializer,
    VerifySerializer,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _school_qs(model, user, include_deleted=False):
    qs = model.objects.all()
    if not include_deleted:
        qs = qs.filter(is_deleted=False)
    if user.role != "SUPER_ADMIN":
        qs = qs.filter(school=user.school)
    return qs


def _is_admin(user):
    return user.role in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN")


# ---------------------------------------------------------------------------
# CRUD ViewSets (backward compat)
# ---------------------------------------------------------------------------


@require_module("empreintes")
class FingerprintDeviceViewSet(TenantAwareViewSet):
    queryset = FingerprintDevice.objects.all()
    serializer_class = FingerprintDeviceSerializer


@require_module("empreintes")
class FingerprintRecordViewSet(TenantAwareViewSet):
    queryset = FingerprintRecord.objects.all()
    serializer_class = FingerprintRecordSerializer


# ---------------------------------------------------------------------------
# Enrollment
# ---------------------------------------------------------------------------


@require_module("empreintes")
class EnrollView(APIView):
    """POST — enroll fingerprint templates for a student."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        ser = EnrollSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        from apps.academics.models import StudentProfile

        try:
            student = StudentProfile.objects.get(pk=ser.validated_data["student_id"])
        except StudentProfile.DoesNotExist:
            return Response({"detail": "Élève introuvable"}, status=404)

        finger_index = ser.validated_data["finger_index"]
        captures = ser.validated_data["captures"]
        quality_scores = ser.validated_data.get("quality_scores", [0] * len(captures))

        created = []
        for i, b64 in enumerate(captures, start=1):
            raw = base64.b64decode(b64)
            tpl, _ = FingerprintTemplate.objects.update_or_create(
                student=student,
                finger_index=finger_index,
                capture_number=i,
                school=request.user.school,
                defaults={
                    "quality_score": quality_scores[i - 1]
                    if i <= len(quality_scores)
                    else 0,
                    "status": FingerprintTemplate.Status.ENROLLED,
                },
            )
            tpl.set_template_data(raw)
            tpl.save(update_fields=["encrypted_data"])
            created.append(tpl)

        return Response(
            FingerprintTemplateSerializer(created, many=True).data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------


@require_module("empreintes")
class VerifyView(APIView):
    """POST — verify a live scan against stored templates."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = VerifySerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        device = None
        device_id = ser.validated_data.get("device_id")
        if device_id:
            device = (
                _school_qs(FingerprintDevice, request.user).filter(pk=device_id).first()
            )

        if device:
            reader = get_reader(device)
            raw = base64.b64decode(ser.validated_data["template"])
            result = reader.verify(raw)
            return Response(
                {
                    "matched": result.matched,
                    "confidence": result.confidence,
                    "error": result.error,
                }
            )

        return Response(
            {
                "detail": "Vérification côté lecteur non disponible — aucun appareil spécifié"
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


# ---------------------------------------------------------------------------
# Manual fallback
# ---------------------------------------------------------------------------


@require_module("empreintes")
class ManualFallbackView(APIView):
    """POST — manually mark attendance when reader is offline."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        ser = ManualFallbackSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        from apps.academics.models import StudentProfile

        try:
            student = StudentProfile.objects.get(pk=ser.validated_data["student_id"])
        except StudentProfile.DoesNotExist:
            return Response({"detail": "Élève introuvable"}, status=404)

        log = BiometricAttendanceLog.objects.create(
            student=student,
            school=request.user.school,
            timestamp=ser.validated_data.get("timestamp", timezone.now()),
            event_type=ser.validated_data["event_type"],
            verified=False,
            confidence_score=0,
            is_manual_fallback=True,
        )
        return Response(BiometricAttendanceLogSerializer(log).data, status=201)


# ---------------------------------------------------------------------------
# Enrolled students list
# ---------------------------------------------------------------------------


@require_module("empreintes")
class EnrolledStudentsView(APIView):
    """GET — list students with their enrollment status."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        from apps.academics.models import StudentProfile

        students = StudentProfile.objects.filter(school=request.user.school)

        search = request.query_params.get("search", "")
        if search:
            students = students.filter(
                Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
            )

        status_filter = request.query_params.get("status", "")

        results = []
        for s in students.select_related("user", "current_class"):
            templates = FingerprintTemplate.objects.filter(
                student=s, school=request.user.school
            )
            fingers = templates.values("finger_index").distinct().count()
            total = templates.count()
            last = templates.aggregate(last=Max("enrolled_at"))["last"]

            if fingers >= 2:
                st = "enrolled"
            elif fingers >= 1:
                st = "partial"
            else:
                st = "not_enrolled"

            if status_filter and st != status_filter:
                continue

            results.append(
                {
                    "student_id": s.pk,
                    "student_name": f"{s.user.last_name} {s.user.first_name}",
                    "student_photo": s.photo.url if s.photo else "",
                    "class_name": s.current_class.name if s.current_class else "",
                    "fingers_enrolled": fingers,
                    "total_captures": total,
                    "status": st,
                    "last_enrolled": last,
                }
            )

        return Response(StudentEnrollmentStatusSerializer(results, many=True).data)


# ---------------------------------------------------------------------------
# Dashboard stats
# ---------------------------------------------------------------------------


@require_module("empreintes")
class DashboardView(APIView):
    """GET — overall fingerprint dashboard statistics."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        school = request.user.school
        today = date.today()
        now = timezone.now()

        # Devices
        devices = FingerprintDevice.objects.filter(school=school, is_deleted=False)
        total_devices = devices.count()
        online_devices = sum(1 for d in devices if d.is_online)

        # Enrolled students
        from apps.academics.models import StudentProfile

        total_students = StudentProfile.objects.filter(school=school).count()
        enrolled_students = (
            FingerprintTemplate.objects.filter(school=school, is_deleted=False)
            .values("student")
            .annotate(fingers=Count("finger_index", distinct=True))
            .filter(fingers__gte=2)
            .count()
        )

        # Today's logs
        today_start = timezone.make_aware(datetime.combine(today, time.min))
        today_logs = BiometricAttendanceLog.objects.filter(
            school=school, is_deleted=False, timestamp__gte=today_start
        )
        today_scans = today_logs.count()
        today_late = today_logs.filter(is_late=True).count()
        avg_confidence = today_logs.aggregate(avg=Avg("confidence_score"))["avg"] or 0

        # Hourly breakdown (for chart)
        hourly = []
        for h in range(6, 19):
            h_start = timezone.make_aware(datetime.combine(today, time(h, 0)))
            h_end = timezone.make_aware(datetime.combine(today, time(h, 59, 59)))
            cnt = today_logs.filter(
                timestamp__gte=h_start, timestamp__lte=h_end
            ).count()
            hourly.append({"hour": f"{h:02d}:00", "count": cnt})

        # Recent check-ins
        recent = BiometricAttendanceLogSerializer(
            today_logs.select_related("student__user", "device")[:10], many=True
        ).data

        return Response(
            {
                "total_devices": total_devices,
                "online_devices": online_devices,
                "total_students": total_students,
                "enrolled_students": enrolled_students,
                "today_scans": today_scans,
                "today_late": today_late,
                "avg_confidence": round(avg_confidence, 1),
                "hourly_chart": hourly,
                "recent_logs": recent,
            }
        )


# ---------------------------------------------------------------------------
# Tardiness report
# ---------------------------------------------------------------------------


@require_module("empreintes")
class TardinessReportView(APIView):
    """GET — tardiness analytics for a date range."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        school = request.user.school
        start = request.query_params.get("start")
        end = request.query_params.get("end")

        qs = BiometricAttendanceLog.objects.filter(
            school=school,
            is_deleted=False,
            event_type=BiometricAttendanceLog.EventType.CHECK_IN,
        )

        if start:
            qs = qs.filter(timestamp__date__gte=start)
        if end:
            qs = qs.filter(timestamp__date__lte=end)

        total = qs.count()
        late = qs.filter(is_late=True)
        late_count = late.count()
        avg_late_min = late.aggregate(avg=Avg("late_minutes"))["avg"] or 0

        # Top late students
        top = (
            late.values(
                "student__user__last_name", "student__user__first_name", "student__pk"
            )
            .annotate(
                count=Count("id"),
                total_min=Sum("late_minutes"),
            )
            .order_by("-count")[:10]
        )
        top_students = [
            {
                "student_id": t["student__pk"],
                "name": f"{t['student__user__last_name']} {t['student__user__first_name']}",
                "late_count": t["count"],
                "total_minutes": t["total_min"],
            }
            for t in top
        ]

        # Daily tardiness trend
        from django.db.models.functions import TruncDate

        daily = (
            qs.annotate(day=TruncDate("timestamp"))
            .values("day")
            .annotate(total=Count("id"), late_total=Count("id", filter=Q(is_late=True)))
            .order_by("day")
        )
        daily_trend = [
            {
                "date": str(d["day"]),
                "total": d["total"],
                "late": d["late_total"],
            }
            for d in daily
        ]

        return Response(
            {
                "total_checkins": total,
                "late_count": late_count,
                "late_rate": round(late_count / total * 100, 1) if total else 0,
                "avg_late_minutes": round(avg_late_min, 1),
                "top_late_students": top_students,
                "daily_trend": daily_trend,
            }
        )


# ---------------------------------------------------------------------------
# Device diagnostics
# ---------------------------------------------------------------------------


@require_module("empreintes")
class DeviceDiagnosticsView(APIView):
    """GET — run health check on all devices."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        devices = _school_qs(FingerprintDevice, request.user).filter(is_active=True)
        results = []
        for d in devices:
            try:
                reader = get_reader(d)
                rs = reader.get_status()
                results.append(
                    {
                        "device_id": d.pk,
                        "name": d.name,
                        "online": rs.online,
                        "firmware": rs.firmware,
                        "sensor_quality": rs.sensor_quality,
                        "serial": rs.serial,
                        "error": rs.error,
                    }
                )
                if rs.online:
                    d.status = FingerprintDevice.DeviceStatus.ONLINE
                    d.last_heartbeat = timezone.now()
                else:
                    d.status = FingerprintDevice.DeviceStatus.OFFLINE
                d.save(update_fields=["status", "last_heartbeat"])
            except Exception as exc:
                logger.exception("Diagnostic failed for device %s", d.pk)
                results.append(
                    {
                        "device_id": d.pk,
                        "name": d.name,
                        "online": False,
                        "firmware": "",
                        "sensor_quality": 0,
                        "serial": "",
                        "error": str(exc),
                    }
                )
        return Response(DeviceDiagnosticSerializer(results, many=True).data)


# ---------------------------------------------------------------------------
# Attendance logs list
# ---------------------------------------------------------------------------


@require_module("empreintes")
class AttendanceLogsView(APIView):
    """GET — paginated biometric attendance logs."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        qs = _school_qs(BiometricAttendanceLog, request.user).select_related(
            "student__user", "device"
        )

        # Filters
        day = request.query_params.get("date")
        if day:
            qs = qs.filter(timestamp__date=day)

        event = request.query_params.get("event_type")
        if event:
            qs = qs.filter(event_type=event)

        student_id = request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)

        late_only = request.query_params.get("late_only")
        if late_only == "true":
            qs = qs.filter(is_late=True)

        return Response(BiometricAttendanceLogSerializer(qs[:200], many=True).data)
