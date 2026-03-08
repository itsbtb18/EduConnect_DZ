"""
ILMI — Infirmerie Views
===========================
All endpoints decorated with @require_module('infirmerie').
Role-based access:
- NURSE / ADMIN / SECTION_ADMIN: full access
- TEACHER: only accommodations (disabilities)
- PARENT: summary of own children + vaccinations + messaging
"""

from datetime import timedelta

from django.db.models import Count, F, Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import (
    IsAdminOrTeacher,
    IsParent,
    IsSchoolAdmin,
    require_module,
)

from .models import (
    AbsenceJustification,
    Allergy,
    Consultation,
    ContagiousDisease,
    Disability,
    EmergencyEvent,
    EmergencyProtocol,
    EpidemicAlert,
    InfirmeryMessage,
    MedicalHistory,
    MedicalRecord,
    Medication,
    PsychologicalRecord,
    Vaccination,
)
from .serializers import (
    AbsenceJustificationSerializer,
    AllergySerializer,
    ConsultationCreateSerializer,
    ConsultationSerializer,
    ContagiousDiseaseSerializer,
    DisabilitySerializer,
    EmergencyEventCreateSerializer,
    EmergencyEventSerializer,
    EmergencyProtocolSerializer,
    EpidemicAlertSerializer,
    InfirmeryMessageSerializer,
    MedicalHistorySerializer,
    MedicalRecordCreateSerializer,
    MedicalRecordListSerializer,
    MedicalRecordSerializer,
    MedicationSerializer,
    ParentMedicalSummarySerializer,
    PsychologicalRecordSerializer,
    StudentAccommodationsSerializer,
    VaccinationSerializer,
)


# ═══════════════════════════════════════════════════════════════════════════
# Helper
# ═══════════════════════════════════════════════════════════════════════════


def _school_filter(user):
    return {"school": user.school, "is_deleted": False}


# ═══════════════════════════════════════════════════════════════════════════
# Medical Record CRUD
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class MedicalRecordListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = MedicalRecord.objects.filter(
            **_school_filter(request.user)
        ).select_related("student")
        q = request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(student__first_name__icontains=q) | Q(student__last_name__icontains=q)
            )
        serializer = MedicalRecordListSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = MedicalRecordCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(school=request.user.school, created_by=request.user)
        return Response(
            MedicalRecordSerializer(obj).data, status=status.HTTP_201_CREATED
        )


@require_module("infirmerie")
class MedicalRecordDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return (
            MedicalRecord.objects.select_related("student")
            .prefetch_related(
                "history_entries",
                "allergies",
                "medications",
                "vaccinations",
                "disabilities",
            )
            .get(pk=pk, **_school_filter(request.user))
        )

    def get(self, request, pk):
        obj = self._get(request, pk)
        return Response(MedicalRecordSerializer(obj).data)

    def patch(self, request, pk):
        obj = self._get(request, pk)
        serializer = MedicalRecordCreateSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MedicalRecordSerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════
# Medical History (nested under medical record)
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class MedicalHistoryListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request, record_pk):
        qs = MedicalHistory.objects.filter(
            medical_record_id=record_pk,
            medical_record__school=request.user.school,
            is_deleted=False,
        )
        return Response({"results": MedicalHistorySerializer(qs, many=True).data})

    def post(self, request, record_pk):
        data = request.data.copy()
        data["medical_record"] = record_pk
        serializer = MedicalHistorySerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(school=request.user.school, created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@require_module("infirmerie")
class MedicalHistoryDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return MedicalHistory.objects.get(
            pk=pk, medical_record__school=request.user.school, is_deleted=False
        )

    def patch(self, request, pk):
        obj = self._get(request, pk)
        serializer = MedicalHistorySerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════
# Allergy CRUD (nested)
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class AllergyListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request, record_pk):
        qs = Allergy.objects.filter(
            medical_record_id=record_pk,
            medical_record__school=request.user.school,
            is_deleted=False,
        )
        return Response({"results": AllergySerializer(qs, many=True).data})

    def post(self, request, record_pk):
        data = request.data.copy()
        data["medical_record"] = record_pk
        serializer = AllergySerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(school=request.user.school, created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@require_module("infirmerie")
class AllergyDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return Allergy.objects.get(
            pk=pk, medical_record__school=request.user.school, is_deleted=False
        )

    def patch(self, request, pk):
        obj = self._get(request, pk)
        serializer = AllergySerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════
# Medication CRUD (nested)
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class MedicationListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request, record_pk):
        qs = Medication.objects.filter(
            medical_record_id=record_pk,
            medical_record__school=request.user.school,
            is_deleted=False,
        )
        active = request.query_params.get("active")
        if active is not None:
            qs = qs.filter(is_active=active.lower() in ("true", "1"))
        return Response({"results": MedicationSerializer(qs, many=True).data})

    def post(self, request, record_pk):
        data = request.data.copy()
        data["medical_record"] = record_pk
        serializer = MedicationSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(school=request.user.school, created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@require_module("infirmerie")
class MedicationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return Medication.objects.get(
            pk=pk, medical_record__school=request.user.school, is_deleted=False
        )

    def patch(self, request, pk):
        obj = self._get(request, pk)
        serializer = MedicationSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════
# Vaccination CRUD (nested)
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class VaccinationListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request, record_pk):
        qs = Vaccination.objects.filter(
            medical_record_id=record_pk,
            medical_record__school=request.user.school,
            is_deleted=False,
        )
        s = request.query_params.get("status")
        if s:
            qs = qs.filter(status=s)
        return Response({"results": VaccinationSerializer(qs, many=True).data})

    def post(self, request, record_pk):
        data = request.data.copy()
        data["medical_record"] = record_pk
        serializer = VaccinationSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(school=request.user.school, created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@require_module("infirmerie")
class VaccinationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return Vaccination.objects.get(
            pk=pk, medical_record__school=request.user.school, is_deleted=False
        )

    def patch(self, request, pk):
        obj = self._get(request, pk)
        serializer = VaccinationSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════
# Disability CRUD (nested)
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class DisabilityListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request, record_pk):
        qs = Disability.objects.filter(
            medical_record_id=record_pk,
            medical_record__school=request.user.school,
            is_deleted=False,
        )
        return Response({"results": DisabilitySerializer(qs, many=True).data})

    def post(self, request, record_pk):
        data = request.data.copy()
        data["medical_record"] = record_pk
        serializer = DisabilitySerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(school=request.user.school, created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@require_module("infirmerie")
class DisabilityDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return Disability.objects.get(
            pk=pk, medical_record__school=request.user.school, is_deleted=False
        )

    def patch(self, request, pk):
        obj = self._get(request, pk)
        serializer = DisabilitySerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════
# Psychological Records (NURSE + ADMIN only)
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class PsychologicalRecordListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request, record_pk):
        qs = PsychologicalRecord.objects.filter(
            medical_record_id=record_pk,
            medical_record__school=request.user.school,
            is_deleted=False,
        )
        return Response({"results": PsychologicalRecordSerializer(qs, many=True).data})

    def post(self, request, record_pk):
        data = request.data.copy()
        data["medical_record"] = record_pk
        serializer = PsychologicalRecordSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(school=request.user.school, created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@require_module("infirmerie")
class PsychologicalRecordDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return PsychologicalRecord.objects.get(
            pk=pk, medical_record__school=request.user.school, is_deleted=False
        )

    def patch(self, request, pk):
        obj = self._get(request, pk)
        serializer = PsychologicalRecordSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════
# Consultation CRUD
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class ConsultationListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = Consultation.objects.filter(**_school_filter(request.user)).select_related(
            "student", "nurse"
        )
        # Filters
        student_id = request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)
        reason = request.query_params.get("reason")
        if reason:
            qs = qs.filter(reason=reason)
        date_from = request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(consultation_datetime__date__gte=date_from)
        date_to = request.query_params.get("date_to")
        if date_to:
            qs = qs.filter(consultation_datetime__date__lte=date_to)
        today = request.query_params.get("today")
        if today and today.lower() in ("true", "1"):
            qs = qs.filter(consultation_datetime__date=timezone.now().date())

        serializer = ConsultationSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = ConsultationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(
            school=request.user.school,
            nurse=request.user,
            created_by=request.user,
        )

        # Auto-notifications based on outcome
        if obj.outcome in ("CONTACT_PARENT", "SENT_HOME", "EMERGENCY"):
            obj.parent_contacted = True
            obj.parent_contacted_at = timezone.now()
            obj.save(update_fields=["parent_contacted", "parent_contacted_at"])

        return Response(
            ConsultationSerializer(obj).data, status=status.HTTP_201_CREATED
        )


@require_module("infirmerie")
class ConsultationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return Consultation.objects.select_related("student", "nurse").get(
            pk=pk, **_school_filter(request.user)
        )

    def get(self, request, pk):
        return Response(ConsultationSerializer(self._get(request, pk)).data)

    def patch(self, request, pk):
        obj = self._get(request, pk)
        serializer = ConsultationCreateSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ConsultationSerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════
# Emergency Protocol CRUD
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class EmergencyProtocolListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = EmergencyProtocol.objects.filter(**_school_filter(request.user))
        etype = request.query_params.get("type")
        if etype:
            qs = qs.filter(emergency_type=etype)
        return Response({"results": EmergencyProtocolSerializer(qs, many=True).data})

    def post(self, request):
        serializer = EmergencyProtocolSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(school=request.user.school, created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@require_module("infirmerie")
class EmergencyProtocolDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return EmergencyProtocol.objects.get(pk=pk, **_school_filter(request.user))

    def get(self, request, pk):
        return Response(EmergencyProtocolSerializer(self._get(request, pk)).data)

    def patch(self, request, pk):
        obj = self._get(request, pk)
        serializer = EmergencyProtocolSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════
# Emergency Events (trigger, close, report)
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class EmergencyEventListCreateView(APIView):
    """List all events or trigger a new emergency."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = EmergencyEvent.objects.filter(
            **_school_filter(request.user)
        ).select_related("student", "protocol")
        s = request.query_params.get("status")
        if s:
            qs = qs.filter(status=s)
        return Response({"results": EmergencyEventSerializer(qs, many=True).data})

    def post(self, request):
        serializer = EmergencyEventCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(school=request.user.school, created_by=request.user)
        return Response(
            EmergencyEventSerializer(obj).data, status=status.HTTP_201_CREATED
        )


@require_module("infirmerie")
class EmergencyEventDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return EmergencyEvent.objects.select_related("student", "protocol").get(
            pk=pk, **_school_filter(request.user)
        )

    def get(self, request, pk):
        return Response(EmergencyEventSerializer(self._get(request, pk)).data)

    def patch(self, request, pk):
        obj = self._get(request, pk)
        serializer = EmergencyEventSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EmergencyEventSerializer(obj).data)


@require_module("infirmerie")
class EmergencyEventCloseView(APIView):
    """Close an emergency event."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request, pk):
        obj = EmergencyEvent.objects.get(pk=pk, **_school_filter(request.user))
        obj.status = EmergencyEvent.EventStatus.RESOLVED
        obj.ended_at = timezone.now()
        obj.post_emergency_report = request.data.get("post_emergency_report", "")
        obj.save(update_fields=["status", "ended_at", "post_emergency_report"])
        return Response(EmergencyEventSerializer(obj).data)


# ═══════════════════════════════════════════════════════════════════════════
# Infirmery Messaging
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class InfirmeryMessageListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role in ("ADMIN", "SECTION_ADMIN"):
            qs = InfirmeryMessage.objects.filter(**_school_filter(user))
        elif user.role == "PARENT":
            qs = InfirmeryMessage.objects.filter(
                Q(sender=user) | Q(recipient=user), is_deleted=False
            )
        else:
            return Response({"results": []})
        student_id = request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)
        return Response({"results": InfirmeryMessageSerializer(qs, many=True).data})

    def post(self, request):
        serializer = InfirmeryMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            sender=request.user,
            school=request.user.school,
            created_by=request.user,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@require_module("infirmerie")
class InfirmeryMessageMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        msg = InfirmeryMessage.objects.get(
            pk=pk, recipient=request.user, is_deleted=False
        )
        msg.is_read = True
        msg.read_at = timezone.now()
        msg.save(update_fields=["is_read", "read_at"])
        return Response(InfirmeryMessageSerializer(msg).data)


# ═══════════════════════════════════════════════════════════════════════════
# Absence Justification
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class AbsenceJustificationListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = AbsenceJustification.objects.filter(
            **_school_filter(request.user)
        ).select_related("student", "submitted_by")
        s = request.query_params.get("status")
        if s:
            qs = qs.filter(status=s)
        return Response({"results": AbsenceJustificationSerializer(qs, many=True).data})

    def post(self, request):
        serializer = AbsenceJustificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            submitted_by=request.user,
            school=request.user.school,
            created_by=request.user,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@require_module("infirmerie")
class AbsenceJustificationValidateView(APIView):
    """Admin validates or rejects a justification."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request, pk):
        obj = AbsenceJustification.objects.get(pk=pk, **_school_filter(request.user))
        action = request.data.get("action")  # "validate" or "reject"
        if action == "validate":
            obj.status = AbsenceJustification.JustificationStatus.VALIDATED
        elif action == "reject":
            obj.status = AbsenceJustification.JustificationStatus.REJECTED
            obj.rejection_reason = request.data.get("rejection_reason", "")
        else:
            return Response(
                {"error": "action must be 'validate' or 'reject'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        obj.validated_by = request.user
        obj.validated_at = timezone.now()
        obj.save(
            update_fields=["status", "validated_by", "validated_at", "rejection_reason"]
        )
        return Response(AbsenceJustificationSerializer(obj).data)


# ═══════════════════════════════════════════════════════════════════════════
# Epidemic Alerts & Contagious Diseases
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class EpidemicAlertListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = EpidemicAlert.objects.filter(**_school_filter(request.user))
        active = request.query_params.get("active")
        if active and active.lower() in ("true", "1"):
            qs = qs.filter(is_resolved=False)
        return Response({"results": EpidemicAlertSerializer(qs, many=True).data})

    def post(self, request):
        serializer = EpidemicAlertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(school=request.user.school, created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@require_module("infirmerie")
class EpidemicAlertDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return EpidemicAlert.objects.get(pk=pk, **_school_filter(request.user))

    def get(self, request, pk):
        return Response(EpidemicAlertSerializer(self._get(request, pk)).data)

    def patch(self, request, pk):
        obj = self._get(request, pk)
        serializer = EpidemicAlertSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@require_module("infirmerie")
class ContagiousDiseaseListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = ContagiousDisease.objects.filter(
            **_school_filter(request.user)
        ).select_related("student")
        s = request.query_params.get("status")
        if s:
            qs = qs.filter(status=s)
        return Response({"results": ContagiousDiseaseSerializer(qs, many=True).data})

    def post(self, request):
        serializer = ContagiousDiseaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(school=request.user.school, created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@require_module("infirmerie")
class ContagiousDiseaseDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return ContagiousDisease.objects.get(pk=pk, **_school_filter(request.user))

    def patch(self, request, pk):
        obj = self._get(request, pk)
        serializer = ContagiousDiseaseSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ═══════════════════════════════════════════════════════════════════════════
# Teacher: Accommodations only
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class TeacherAccommodationsView(APIView):
    """Teachers can only see disability accommodations for their students."""

    permission_classes = [permissions.IsAuthenticated, IsAdminOrTeacher]

    def get(self, request, student_id):
        try:
            record = MedicalRecord.objects.prefetch_related("disabilities").get(
                student_id=student_id,
                school=request.user.school,
                is_deleted=False,
            )
        except MedicalRecord.DoesNotExist:
            return Response({"disabilities": []})
        return Response(StudentAccommodationsSerializer(record).data)


# ═══════════════════════════════════════════════════════════════════════════
# Parent endpoints
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class ParentMedicalSummaryView(APIView):
    """Parent views a read-only medical summary of their child."""

    permission_classes = [permissions.IsAuthenticated, IsParent]

    def get(self, request, student_id):
        # Verify parent-child relationship
        from apps.accounts.models import User

        student = User.objects.get(pk=student_id, role="STUDENT")
        if (
            not hasattr(student, "parent_link")
            and student.school_id != request.user.school_id
        ):
            return Response(
                {"error": "Accès non autorisé"}, status=status.HTTP_403_FORBIDDEN
            )
        try:
            record = MedicalRecord.objects.prefetch_related(
                "allergies", "medications", "vaccinations", "disabilities"
            ).get(student_id=student_id, is_deleted=False)
        except MedicalRecord.DoesNotExist:
            return Response(
                {"error": "Pas de dossier médical"}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(ParentMedicalSummarySerializer(record).data)


@require_module("infirmerie")
class ParentVaccinationsView(APIView):
    """Parent views vaccinations of their child."""

    permission_classes = [permissions.IsAuthenticated, IsParent]

    def get(self, request, student_id):
        try:
            record = MedicalRecord.objects.get(student_id=student_id, is_deleted=False)
        except MedicalRecord.DoesNotExist:
            return Response({"results": []})
        qs = Vaccination.objects.filter(medical_record=record, is_deleted=False)
        return Response({"results": VaccinationSerializer(qs, many=True).data})


@require_module("infirmerie")
class ParentInfirmeryMessagesView(APIView):
    """Parent views/sends infirmerie messages about their child."""

    permission_classes = [permissions.IsAuthenticated, IsParent]

    def get(self, request, student_id):
        qs = InfirmeryMessage.objects.filter(
            Q(sender=request.user) | Q(recipient=request.user),
            student_id=student_id,
            is_deleted=False,
        )
        return Response({"results": InfirmeryMessageSerializer(qs, many=True).data})

    def post(self, request, student_id):
        data = request.data.copy()
        data["student"] = student_id
        serializer = InfirmeryMessageSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            sender=request.user,
            school=request.user.school,
            created_by=request.user,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@require_module("infirmerie")
class ParentMedicalUpdateRequestView(APIView):
    """Parent submits a medical update request (e.g. new allergy, updated info)."""

    permission_classes = [permissions.IsAuthenticated, IsParent]

    def post(self, request, student_id):
        # Create an infirmerie message with the update request
        data = {
            "student": student_id,
            "recipient": None,  # Will be set to school nurse/admin
            "template": InfirmeryMessage.MessageTemplate.CUSTOM,
            "subject": request.data.get("subject", "Mise à jour médicale"),
            "body": request.data.get("body", ""),
        }
        # Try to find a nurse/admin at the school to send to
        from apps.accounts.models import User

        admin = User.objects.filter(
            school=request.user.school,
            role__in=["ADMIN", "SECTION_ADMIN"],
            is_active=True,
        ).first()
        if not admin:
            return Response(
                {"error": "Aucun administrateur trouvé"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        data["recipient"] = admin.pk
        serializer = InfirmeryMessageSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            sender=request.user,
            school=request.user.school,
            created_by=request.user,
        )
        return Response(
            {"message": "Demande de mise à jour envoyée"},
            status=status.HTTP_201_CREATED,
        )


# ═══════════════════════════════════════════════════════════════════════════
# Dashboard / Reports
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class InfirmerieDashboardView(APIView):
    """Dashboard KPIs for the infirmary."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        today = timezone.now().date()
        f = {"school": school, "is_deleted": False}

        # Today's consultations
        today_consultations = Consultation.objects.filter(
            **f, consultation_datetime__date=today
        ).count()

        # Active emergencies
        active_emergencies = EmergencyEvent.objects.filter(
            **f, status="IN_PROGRESS"
        ).count()

        # Low stock medications
        low_stock_meds = (
            Medication.objects.filter(**f, is_active=True)
            .filter(stock_quantity__lte=F("stock_alert_threshold"))
            .count()
        )

        # Anaphylactic allergies
        anaphylactic_count = Allergy.objects.filter(
            medical_record__school=school, is_deleted=False, severity="ANAPHYLACTIC"
        ).count()

        # Active epidemic alerts
        active_epidemics = EpidemicAlert.objects.filter(**f, is_resolved=False).count()

        # Pending justifications
        pending_justifications = AbsenceJustification.objects.filter(
            **f, status="SUBMITTED"
        ).count()

        # Contagious diseases in eviction
        evictions = ContagiousDisease.objects.filter(**f, status="EVICTION").count()

        # Unread messages
        unread_messages = InfirmeryMessage.objects.filter(
            school=school,
            is_deleted=False,
            is_read=False,
            recipient__role__in=["ADMIN", "SECTION_ADMIN"],
        ).count()

        # Total records
        total_records = MedicalRecord.objects.filter(**f).count()

        # Vaccination coverage
        total_vaccinations = Vaccination.objects.filter(
            medical_record__school=school, is_deleted=False
        ).count()
        done_vaccinations = Vaccination.objects.filter(
            medical_record__school=school, is_deleted=False, status="DONE"
        ).count()
        vaccination_coverage = (
            round(done_vaccinations / total_vaccinations * 100, 1)
            if total_vaccinations > 0
            else 0
        )

        # Consultations last 7 days by reason
        week_ago = today - timedelta(days=7)
        recent_consultations = (
            Consultation.objects.filter(**f, consultation_datetime__date__gte=week_ago)
            .values("reason")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        return Response(
            {
                "today_consultations": today_consultations,
                "active_emergencies": active_emergencies,
                "low_stock_medications": low_stock_meds,
                "anaphylactic_allergies": anaphylactic_count,
                "active_epidemics": active_epidemics,
                "pending_justifications": pending_justifications,
                "evictions": evictions,
                "unread_messages": unread_messages,
                "total_medical_records": total_records,
                "vaccination_coverage": vaccination_coverage,
                "consultations_by_reason": list(recent_consultations),
            }
        )


@require_module("infirmerie")
class InfirmerieReportsView(APIView):
    """Generate infirmerie reports."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        report_type = request.query_params.get("type", "monthly")
        today = timezone.now().date()

        if report_type == "monthly":
            start = today.replace(day=1)
        elif report_type == "annual":
            start = today.replace(month=1, day=1)
        else:
            start = today - timedelta(days=30)

        f = {"school": school, "is_deleted": False}

        consultations = Consultation.objects.filter(
            **f, consultation_datetime__date__gte=start
        )

        # By reason
        by_reason = list(
            consultations.values("reason")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        # By outcome
        by_outcome = list(
            consultations.values("outcome")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        # Allergy summary
        allergy_summary = list(
            Allergy.objects.filter(medical_record__school=school, is_deleted=False)
            .values("allergy_type", "severity")
            .annotate(count=Count("id"))
        )

        # Vaccination coverage
        total_vacc = Vaccination.objects.filter(
            medical_record__school=school, is_deleted=False
        ).count()
        done_vacc = Vaccination.objects.filter(
            medical_record__school=school, is_deleted=False, status="DONE"
        ).count()

        # Epidemic summary
        epidemic_summary = list(
            EpidemicAlert.objects.filter(**f, detection_date__gte=start).values(
                "disease_name", "alert_level", "case_count", "is_resolved"
            )
        )

        return Response(
            {
                "period_start": start.isoformat(),
                "period_end": today.isoformat(),
                "total_consultations": consultations.count(),
                "consultations_by_reason": by_reason,
                "consultations_by_outcome": by_outcome,
                "allergy_summary": allergy_summary,
                "vaccination_total": total_vacc,
                "vaccination_done": done_vacc,
                "vaccination_coverage": round(done_vacc / total_vacc * 100, 1)
                if total_vacc > 0
                else 0,
                "epidemic_summary": epidemic_summary,
            }
        )


# ═══════════════════════════════════════════════════════════════════════════
# All low-stock medications (for dashboard)
# ═══════════════════════════════════════════════════════════════════════════


@require_module("infirmerie")
class LowStockMedicationsView(APIView):
    """List all medications with stock below alert threshold."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = (
            Medication.objects.filter(
                medical_record__school=request.user.school,
                is_deleted=False,
                is_active=True,
            )
            .filter(stock_quantity__lte=F("stock_alert_threshold"))
            .select_related("medical_record__student")
        )
        return Response({"results": MedicationSerializer(qs, many=True).data})
