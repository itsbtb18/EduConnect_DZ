"""
Formation views — CRUD for training center management.

Includes:
- Department, Formation, Group, Enrollment, Session CRUD
- PlacementTest, LevelPassage, Certificate management
- Schedule conflict detection for trainers
- Formation finance (fees, payments, discounts, trainer payroll)
- Terminology endpoint
- Cross-institution profiles (SUPER_ADMIN only)
"""

from datetime import timedelta
from decimal import Decimal

from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsSchoolAdmin, IsSuperAdmin

from .models import (
    Certificate,
    CrossInstitutionProfile,
    Department,
    Discount,
    Formation,
    FormationFeeStructure,
    LearnerDiscount,
    LearnerPayment,
    LevelPassage,
    PlacementTest,
    SessionAttendance,
    TrainerPaySlip,
    TrainerSalaryConfig,
    TrainingEnrollment,
    TrainingGroup,
    TrainingSession,
)
from .serializers import (
    CertificateSerializer,
    CrossInstitutionProfileSerializer,
    DepartmentSerializer,
    DiscountSerializer,
    FormationFeeStructureSerializer,
    FormationListSerializer,
    FormationSerializer,
    LearnerDiscountSerializer,
    LearnerPaymentSerializer,
    LevelPassageSerializer,
    PlacementTestSerializer,
    SessionAttendanceSerializer,
    TrainerPaySlipSerializer,
    TrainerSalaryConfigSerializer,
    TrainingEnrollmentSerializer,
    TrainingGroupSerializer,
    TrainingSessionSerializer,
)
from .serializers import SCHOOL_TO_TRAINING_TERMS


# =====================================================================
# Helpers
# =====================================================================


def _ensure_training_center(user):
    """Raise if the user's school is not a training center."""
    school = getattr(user, "school", None)
    if not school:
        raise PermissionDenied("Utilisateur non associé à un établissement.")
    if school.school_category != "TRAINING_CENTER":
        raise PermissionDenied(
            "Cette fonctionnalité est réservée aux centres de formation."
        )
    return school


class TrainingCenterMixin:
    """
    Mixin that restricts viewset to training-center users
    and scopes queryset to the user's school.
    """

    def get_queryset(self):
        qs = super().get_queryset().filter(is_deleted=False)
        user = self.request.user
        if user.role == "SUPER_ADMIN":
            return qs
        _ensure_training_center(user)
        return qs.filter(school=user.school)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != "SUPER_ADMIN":
            _ensure_training_center(user)
        super().perform_create(serializer)


# =====================================================================
# Department CRUD
# =====================================================================


class DepartmentListCreateView(TrainingCenterMixin, generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_create(self, serializer):
        user = self.request.user
        school = (
            _ensure_training_center(user) if user.role != "SUPER_ADMIN" else user.school
        )
        serializer.save(school=school, created_by=user)


class DepartmentDetailView(TrainingCenterMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_destroy(self, instance):
        instance.soft_delete()


# =====================================================================
# Formation CRUD
# =====================================================================


class FormationListCreateView(TrainingCenterMixin, generics.ListCreateAPIView):
    queryset = Formation.objects.select_related("department").all()
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return FormationListSerializer
        return FormationSerializer

    def perform_create(self, serializer):
        user = self.request.user
        school = (
            _ensure_training_center(user) if user.role != "SUPER_ADMIN" else user.school
        )
        serializer.save(school=school, created_by=user)


class FormationDetailView(TrainingCenterMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Formation.objects.select_related("department").all()
    serializer_class = FormationSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_destroy(self, instance):
        instance.soft_delete()


# =====================================================================
# TrainingGroup CRUD
# =====================================================================


class TrainingGroupListCreateView(TrainingCenterMixin, generics.ListCreateAPIView):
    queryset = TrainingGroup.objects.select_related(
        "formation", "trainer", "room"
    ).all()
    serializer_class = TrainingGroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        formation_id = self.request.query_params.get("formation")
        if formation_id:
            qs = qs.filter(formation_id=formation_id)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        trainer_id = self.request.query_params.get("trainer")
        if trainer_id:
            qs = qs.filter(trainer_id=trainer_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        school = (
            _ensure_training_center(user) if user.role != "SUPER_ADMIN" else user.school
        )
        serializer.save(school=school, created_by=user)


class TrainingGroupDetailView(
    TrainingCenterMixin, generics.RetrieveUpdateDestroyAPIView
):
    queryset = TrainingGroup.objects.select_related(
        "formation", "trainer", "room"
    ).all()
    serializer_class = TrainingGroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_destroy(self, instance):
        instance.soft_delete()


# =====================================================================
# TrainingEnrollment CRUD
# =====================================================================


class TrainingEnrollmentListCreateView(TrainingCenterMixin, generics.ListCreateAPIView):
    queryset = TrainingEnrollment.objects.select_related(
        "learner", "group__formation"
    ).all()
    serializer_class = TrainingEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        group_id = self.request.query_params.get("group")
        if group_id:
            qs = qs.filter(group_id=group_id)
        learner_id = self.request.query_params.get("learner")
        if learner_id:
            qs = qs.filter(learner_id=learner_id)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        school = (
            _ensure_training_center(user) if user.role != "SUPER_ADMIN" else user.school
        )

        group = serializer.validated_data.get("group")
        if group and group.is_full:
            serializer.save(
                school=school,
                created_by=user,
                status=TrainingEnrollment.EnrollmentStatus.WAITLIST,
            )
        else:
            serializer.save(school=school, created_by=user)


class TrainingEnrollmentDetailView(
    TrainingCenterMixin, generics.RetrieveUpdateDestroyAPIView
):
    queryset = TrainingEnrollment.objects.select_related(
        "learner", "group__formation"
    ).all()
    serializer_class = TrainingEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_destroy(self, instance):
        instance.soft_delete()


# =====================================================================
# PlacementTest CRUD
# =====================================================================


class PlacementTestListCreateView(TrainingCenterMixin, generics.ListCreateAPIView):
    queryset = PlacementTest.objects.select_related(
        "learner", "formation", "validated_by"
    ).all()
    serializer_class = PlacementTestSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_create(self, serializer):
        user = self.request.user
        school = (
            _ensure_training_center(user) if user.role != "SUPER_ADMIN" else user.school
        )
        serializer.save(school=school, created_by=user)


class PlacementTestDetailView(
    TrainingCenterMixin, generics.RetrieveUpdateDestroyAPIView
):
    queryset = PlacementTest.objects.select_related(
        "learner", "formation", "validated_by"
    ).all()
    serializer_class = PlacementTestSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_destroy(self, instance):
        instance.soft_delete()


class PlacementTestValidateView(TrainingCenterMixin, APIView):
    """Validate a placement test result."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request, pk):
        _ensure_training_center(request.user)
        try:
            test = PlacementTest.objects.get(
                pk=pk, school=request.user.school, is_deleted=False
            )
        except PlacementTest.DoesNotExist:
            return Response(
                {"detail": "Test non trouvé."}, status=status.HTTP_404_NOT_FOUND
            )

        test.is_validated = True
        test.validated_by = request.user
        test.save(update_fields=["is_validated", "validated_by", "updated_at"])
        return Response(
            PlacementTestSerializer(test, context={"request": request}).data
        )


# =====================================================================
# TrainingSession CRUD
# =====================================================================


class TrainingSessionListCreateView(TrainingCenterMixin, generics.ListCreateAPIView):
    queryset = TrainingSession.objects.select_related(
        "group__formation", "room", "trainer"
    ).all()
    serializer_class = TrainingSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        group_id = self.request.query_params.get("group")
        if group_id:
            qs = qs.filter(group_id=group_id)
        date_from = self.request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(date__gte=date_from)
        date_to = self.request.query_params.get("date_to")
        if date_to:
            qs = qs.filter(date__lte=date_to)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        school = (
            _ensure_training_center(user) if user.role != "SUPER_ADMIN" else user.school
        )
        session = serializer.save(school=school, created_by=user)
        # Check for trainer schedule conflicts
        conflicts = _check_trainer_conflicts(session)
        if conflicts:
            # Save anyway but warn
            serializer._conflicts = conflicts


class TrainingSessionDetailView(
    TrainingCenterMixin, generics.RetrieveUpdateDestroyAPIView
):
    queryset = TrainingSession.objects.select_related(
        "group__formation", "room", "trainer"
    ).all()
    serializer_class = TrainingSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_destroy(self, instance):
        instance.soft_delete()


# =====================================================================
# SessionAttendance
# =====================================================================


class SessionAttendanceListCreateView(TrainingCenterMixin, generics.ListCreateAPIView):
    queryset = SessionAttendance.objects.select_related("learner", "session").all()
    serializer_class = SessionAttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        session_id = self.request.query_params.get("session")
        if session_id:
            qs = qs.filter(session_id=session_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        school = (
            _ensure_training_center(user) if user.role != "SUPER_ADMIN" else user.school
        )
        serializer.save(school=school, created_by=user)


class BulkSessionAttendanceView(TrainingCenterMixin, APIView):
    """Bulk mark attendance for a session."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request):
        school = _ensure_training_center(request.user)
        session_id = request.data.get("session")
        attendances = request.data.get("attendances", [])

        if not session_id or not attendances:
            return Response(
                {"detail": "session et attendances requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            session = TrainingSession.objects.get(
                pk=session_id, school=school, is_deleted=False
            )
        except TrainingSession.DoesNotExist:
            return Response(
                {"detail": "Session non trouvée."},
                status=status.HTTP_404_NOT_FOUND,
            )

        created = []
        for att in attendances:
            obj, _ = SessionAttendance.objects.update_or_create(
                session=session,
                learner_id=att.get("learner"),
                defaults={
                    "status": att.get("status", "PRESENT"),
                    "note": att.get("note", ""),
                    "school": school,
                    "created_by": request.user,
                },
            )
            created.append(obj)

        return Response(
            SessionAttendanceSerializer(
                created, many=True, context={"request": request}
            ).data,
            status=status.HTTP_200_OK,
        )


# =====================================================================
# LevelPassage
# =====================================================================


class LevelPassageListCreateView(TrainingCenterMixin, generics.ListCreateAPIView):
    queryset = LevelPassage.objects.select_related(
        "learner", "formation", "decided_by"
    ).all()
    serializer_class = LevelPassageSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_create(self, serializer):
        user = self.request.user
        school = (
            _ensure_training_center(user) if user.role != "SUPER_ADMIN" else user.school
        )
        serializer.save(school=school, created_by=user)


class LevelPassageDetailView(
    TrainingCenterMixin, generics.RetrieveUpdateDestroyAPIView
):
    queryset = LevelPassage.objects.select_related(
        "learner", "formation", "decided_by"
    ).all()
    serializer_class = LevelPassageSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_destroy(self, instance):
        instance.soft_delete()


class LevelPassageDecideView(TrainingCenterMixin, APIView):
    """Record a decision for a level passage."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request, pk):
        school = _ensure_training_center(request.user)
        try:
            passage = LevelPassage.objects.get(pk=pk, school=school, is_deleted=False)
        except LevelPassage.DoesNotExist:
            return Response(
                {"detail": "Passage non trouvé."},
                status=status.HTTP_404_NOT_FOUND,
            )

        decision = request.data.get("decision")
        if decision not in ("PROMOTED", "MAINTAINED"):
            return Response(
                {"detail": "decision doit être PROMOTED ou MAINTAINED."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        passage.decision = decision
        passage.decided_by = request.user
        passage.decision_date = timezone.now().date()
        passage.save(
            update_fields=["decision", "decided_by", "decision_date", "updated_at"]
        )
        return Response(
            LevelPassageSerializer(passage, context={"request": request}).data
        )


# =====================================================================
# Certificate
# =====================================================================


class CertificateListCreateView(TrainingCenterMixin, generics.ListCreateAPIView):
    queryset = Certificate.objects.select_related("learner", "formation").all()
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        cert_type = self.request.query_params.get("type")
        if cert_type:
            qs = qs.filter(certificate_type=cert_type)
        formation_id = self.request.query_params.get("formation")
        if formation_id:
            qs = qs.filter(formation_id=formation_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        school = (
            _ensure_training_center(user) if user.role != "SUPER_ADMIN" else user.school
        )
        serializer.save(school=school, created_by=user, issued_by=user)


class CertificateDetailView(TrainingCenterMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Certificate.objects.select_related("learner", "formation").all()
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_destroy(self, instance):
        instance.soft_delete()


# =====================================================================
# Schedule conflict detection
# =====================================================================


def _check_trainer_conflicts(session):
    """
    Check if the trainer for a session has conflicting sessions
    across all institutions on the same date/time.
    Returns a list of conflict details.
    """
    trainer = session.trainer or (session.group.trainer if session.group else None)
    if not trainer:
        return []

    conflicts = (
        TrainingSession.objects.filter(
            Q(trainer=trainer) | Q(group__trainer=trainer),
            date=session.date,
            status__in=("SCHEDULED", "MAKEUP"),
            is_deleted=False,
        )
        .exclude(pk=session.pk)
        .filter(
            start_time__lt=session.end_time,
            end_time__gt=session.start_time,
        )
    )

    return [
        {
            "session_id": str(c.pk),
            "group": c.group.name,
            "school": c.school.name,
            "date": str(c.date),
            "start_time": str(c.start_time),
            "end_time": str(c.end_time),
        }
        for c in conflicts.select_related("group", "school")
    ]


class ScheduleConflictCheckView(APIView):
    """
    Check for trainer schedule conflicts across institutions.
    POST: { trainer: uuid, date: "YYYY-MM-DD", start_time: "HH:MM", end_time: "HH:MM" }
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request):
        trainer_id = request.data.get("trainer")
        date = request.data.get("date")
        start_time = request.data.get("start_time")
        end_time = request.data.get("end_time")

        if not all([trainer_id, date, start_time, end_time]):
            return Response(
                {"detail": "trainer, date, start_time, end_time requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        conflicts = TrainingSession.objects.filter(
            Q(trainer_id=trainer_id) | Q(group__trainer_id=trainer_id),
            date=date,
            status__in=("SCHEDULED", "MAKEUP"),
            is_deleted=False,
        ).filter(
            start_time__lt=end_time,
            end_time__gt=start_time,
        )

        # Also check school schedule slots (ScheduleSlot from academics)
        from apps.academics.models import ScheduleSlot

        # Map date to day_of_week (0=Sunday in ScheduleSlot)
        from datetime import datetime as dt

        try:
            parsed_date = dt.strptime(date, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return Response(
                {"detail": "Format de date invalide. Utilisez YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Python weekday: 0=Mon, 6=Sun. ScheduleSlot: 0=Sun, 1=Mon, ...
        py_weekday = parsed_date.weekday()
        slot_day = (py_weekday + 1) % 7

        school_conflicts = ScheduleSlot.objects.filter(
            teacher_id=trainer_id,
            day_of_week=slot_day,
            start_time__lt=end_time,
            end_time__gt=start_time,
            is_deleted=False,
        ).select_related("assigned_class__school")

        results = []
        for c in conflicts.select_related("group", "school"):
            results.append(
                {
                    "type": "training_session",
                    "session_id": str(c.pk),
                    "group": c.group.name,
                    "school": c.school.name,
                    "date": str(c.date),
                    "start_time": str(c.start_time),
                    "end_time": str(c.end_time),
                }
            )

        for s in school_conflicts:
            school_name = ""
            if hasattr(s, "assigned_class") and s.assigned_class:
                school_name = (
                    s.assigned_class.school.name
                    if hasattr(s.assigned_class, "school")
                    else ""
                )
            results.append(
                {
                    "type": "school_schedule",
                    "slot_id": str(s.pk),
                    "class": getattr(s.assigned_class, "name", ""),
                    "school": school_name,
                    "day": s.day_of_week,
                    "start_time": str(s.start_time),
                    "end_time": str(s.end_time),
                }
            )

        return Response(
            {
                "has_conflicts": len(results) > 0,
                "conflicts": results,
            }
        )


# =====================================================================
# Module filtering for training centers
# =====================================================================

# Training centers do NOT have access to these modules
TRAINING_CENTER_EXCLUDED_MODULES = {
    "cantine",
    "transport",
    "bibliotheque",
    "infirmerie",
}


class AvailableModulesView(APIView):
    """
    Return list of available modules for the user's institution,
    filtering out modules that don't apply to training centers.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        school = getattr(request.user, "school", None)
        if not school:
            return Response({"modules": []})

        try:
            subscription = school.subscription
        except Exception:
            return Response({"modules": []})

        active_modules = subscription.get_active_modules()

        if school.school_category == "TRAINING_CENTER":
            active_modules = [
                m for m in active_modules if m not in TRAINING_CENTER_EXCLUDED_MODULES
            ]

        return Response(
            {
                "institution_type": school.school_category,
                "modules": active_modules,
            }
        )


# =====================================================================
# Formation Finance views
# =====================================================================


class FormationFeeStructureListCreateView(
    TrainingCenterMixin, generics.ListCreateAPIView
):
    queryset = FormationFeeStructure.objects.select_related("formation").all()
    serializer_class = FormationFeeStructureSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        formation_id = self.request.query_params.get("formation")
        if formation_id:
            qs = qs.filter(formation_id=formation_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        school = (
            _ensure_training_center(user) if user.role != "SUPER_ADMIN" else user.school
        )
        serializer.save(school=school, created_by=user)


class FormationFeeStructureDetailView(
    TrainingCenterMixin, generics.RetrieveUpdateDestroyAPIView
):
    queryset = FormationFeeStructure.objects.select_related("formation").all()
    serializer_class = FormationFeeStructureSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_destroy(self, instance):
        instance.soft_delete()


class LearnerPaymentListCreateView(TrainingCenterMixin, generics.ListCreateAPIView):
    queryset = LearnerPayment.objects.select_related(
        "learner", "fee_structure", "group"
    ).all()
    serializer_class = LearnerPaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        learner_id = self.request.query_params.get("learner")
        if learner_id:
            qs = qs.filter(learner_id=learner_id)
        group_id = self.request.query_params.get("group")
        if group_id:
            qs = qs.filter(group_id=group_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        school = (
            _ensure_training_center(user) if user.role != "SUPER_ADMIN" else user.school
        )
        serializer.save(school=school, created_by=user, recorded_by=user)


class LearnerPaymentDetailView(
    TrainingCenterMixin, generics.RetrieveUpdateDestroyAPIView
):
    queryset = LearnerPayment.objects.select_related(
        "learner", "fee_structure", "group"
    ).all()
    serializer_class = LearnerPaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_destroy(self, instance):
        instance.soft_delete()


class DiscountListCreateView(TrainingCenterMixin, generics.ListCreateAPIView):
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_create(self, serializer):
        user = self.request.user
        school = (
            _ensure_training_center(user) if user.role != "SUPER_ADMIN" else user.school
        )
        serializer.save(school=school, created_by=user)


class DiscountDetailView(TrainingCenterMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_destroy(self, instance):
        instance.soft_delete()


class LearnerDiscountListCreateView(TrainingCenterMixin, generics.ListCreateAPIView):
    queryset = LearnerDiscount.objects.select_related(
        "learner", "discount", "group"
    ).all()
    serializer_class = LearnerDiscountSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_create(self, serializer):
        user = self.request.user
        school = (
            _ensure_training_center(user) if user.role != "SUPER_ADMIN" else user.school
        )
        serializer.save(school=school, created_by=user)


# =====================================================================
# Trainer Payroll
# =====================================================================


class TrainerSalaryConfigListCreateView(
    TrainingCenterMixin, generics.ListCreateAPIView
):
    queryset = TrainerSalaryConfig.objects.select_related("trainer").all()
    serializer_class = TrainerSalaryConfigSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_create(self, serializer):
        user = self.request.user
        school = (
            _ensure_training_center(user) if user.role != "SUPER_ADMIN" else user.school
        )
        serializer.save(school=school, created_by=user)


class TrainerSalaryConfigDetailView(
    TrainingCenterMixin, generics.RetrieveUpdateDestroyAPIView
):
    queryset = TrainerSalaryConfig.objects.select_related("trainer").all()
    serializer_class = TrainerSalaryConfigSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_destroy(self, instance):
        instance.soft_delete()


class TrainerPaySlipListView(TrainingCenterMixin, generics.ListAPIView):
    queryset = TrainerPaySlip.objects.select_related("trainer").all()
    serializer_class = TrainerPaySlipSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        trainer_id = self.request.query_params.get("trainer")
        if trainer_id:
            qs = qs.filter(trainer_id=trainer_id)
        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")
        if month:
            qs = qs.filter(month=int(month))
        if year:
            qs = qs.filter(year=int(year))
        return qs


class TrainerPaySlipDetailView(TrainingCenterMixin, generics.RetrieveUpdateAPIView):
    queryset = TrainerPaySlip.objects.select_related("trainer").all()
    serializer_class = TrainerPaySlipSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]


class TrainerPaySlipGenerateView(TrainingCenterMixin, APIView):
    """
    Generate a pay slip for a trainer based on actual hours taught.
    POST: { trainer: uuid, month: int, year: int }
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request):
        school = _ensure_training_center(request.user)
        trainer_id = request.data.get("trainer")
        month = request.data.get("month")
        year = request.data.get("year")

        if not all([trainer_id, month, year]):
            return Response(
                {"detail": "trainer, month, year requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        month = int(month)
        year = int(year)

        # Get salary config
        try:
            config = TrainerSalaryConfig.objects.get(
                trainer_id=trainer_id, school=school, is_deleted=False
            )
        except TrainerSalaryConfig.DoesNotExist:
            return Response(
                {"detail": "Configuration salariale non trouvée pour ce formateur."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if already exists
        if TrainerPaySlip.objects.filter(
            trainer_id=trainer_id,
            month=month,
            year=year,
            school=school,
            is_deleted=False,
        ).exists():
            return Response(
                {"detail": "Une fiche de paie existe déjà pour cette période."},
                status=status.HTTP_409_CONFLICT,
            )

        # Compute total hours from completed sessions
        from datetime import date

        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)

        completed_sessions = TrainingSession.objects.filter(
            Q(trainer_id=trainer_id) | Q(group__trainer_id=trainer_id),
            school=school,
            date__gte=first_day,
            date__lte=last_day,
            status=TrainingSession.SessionStatus.COMPLETED,
            is_deleted=False,
        )

        total_hours = Decimal("0.00")
        for s in completed_sessions:
            delta = timezone.datetime.combine(
                s.date, s.end_time
            ) - timezone.datetime.combine(s.date, s.start_time)
            total_hours += Decimal(str(delta.total_seconds() / 3600)).quantize(
                Decimal("0.01")
            )

        hourly_rate = config.hourly_rate
        hours_amount = total_hours * hourly_rate
        base_salary = (
            config.base_salary
            if config.contract_type != "VACATAIRE"
            else Decimal("0.00")
        )
        gross_salary = base_salary + hours_amount

        # Apply deductions from the school's deduction table
        from apps.finance.models import Deduction

        deductions = Deduction.objects.filter(
            school=school, is_active=True, is_deleted=False
        )
        deductions_detail = []
        total_deductions = Decimal("0.00")
        for d in deductions:
            amount = d.compute(gross_salary)
            deductions_detail.append({"name": d.name, "amount": float(amount)})
            total_deductions += amount

        net_salary = gross_salary - total_deductions

        payslip = TrainerPaySlip.objects.create(
            trainer_id=trainer_id,
            school=school,
            created_by=request.user,
            month=month,
            year=year,
            total_hours=total_hours,
            hourly_rate=hourly_rate,
            hours_amount=hours_amount,
            base_salary=base_salary,
            gross_salary=gross_salary,
            deductions_detail=deductions_detail,
            total_deductions=total_deductions,
            net_salary=net_salary,
        )

        return Response(
            TrainerPaySlipSerializer(payslip, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


# =====================================================================
# Formation Stats
# =====================================================================


class FormationDashboardView(APIView):
    """Dashboard stats for a training center."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = _ensure_training_center(request.user)

        departments = Department.objects.filter(school=school, is_deleted=False).count()
        formations = Formation.objects.filter(school=school, is_deleted=False).count()
        active_groups = TrainingGroup.objects.filter(
            school=school,
            is_deleted=False,
            status__in=("OPEN", "IN_PROGRESS"),
        ).count()
        total_enrollments = TrainingEnrollment.objects.filter(
            group__school=school,
            status=TrainingEnrollment.EnrollmentStatus.ACTIVE,
            is_deleted=False,
        ).count()

        # Revenue this month
        now = timezone.now()
        monthly_revenue = LearnerPayment.objects.filter(
            school=school,
            payment_date__year=now.year,
            payment_date__month=now.month,
            is_deleted=False,
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        # Upcoming sessions
        upcoming_sessions = TrainingSession.objects.filter(
            school=school,
            date__gte=now.date(),
            status=TrainingSession.SessionStatus.SCHEDULED,
            is_deleted=False,
        ).count()

        return Response(
            {
                "departments": departments,
                "formations": formations,
                "active_groups": active_groups,
                "active_learners": total_enrollments,
                "monthly_revenue": float(monthly_revenue),
                "upcoming_sessions": upcoming_sessions,
            }
        )


class FormationFinanceStatsView(APIView):
    """Financial stats for a training center."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = _ensure_training_center(request.user)
        now = timezone.now()

        # Revenue by month (last 6 months)
        revenue_by_month = []
        for i in range(5, -1, -1):
            target = now - timedelta(days=30 * i)
            month_rev = (
                LearnerPayment.objects.filter(
                    school=school,
                    payment_date__year=target.year,
                    payment_date__month=target.month,
                    is_deleted=False,
                ).aggregate(total=Sum("amount"))["total"]
                or 0
            )
            revenue_by_month.append(
                {
                    "month": target.strftime("%Y-%m"),
                    "revenue": float(month_rev),
                }
            )

        # Total payroll cost this month
        payroll_cost = (
            TrainerPaySlip.objects.filter(
                school=school,
                month=now.month,
                year=now.year,
                is_deleted=False,
            ).aggregate(total=Sum("net_salary"))["total"]
            or 0
        )

        # Revenue by formation
        revenue_by_formation = (
            LearnerPayment.objects.filter(
                school=school,
                is_deleted=False,
                group__isnull=False,
            )
            .values("group__formation__name")
            .annotate(total=Sum("amount"))
            .order_by("-total")[:10]
        )

        # Pending payments
        pending_enrollments = TrainingEnrollment.objects.filter(
            group__school=school,
            status=TrainingEnrollment.EnrollmentStatus.PENDING_PAYMENT,
            is_deleted=False,
        ).count()

        return Response(
            {
                "revenue_by_month": revenue_by_month,
                "payroll_cost_this_month": float(payroll_cost),
                "revenue_by_formation": list(revenue_by_formation),
                "pending_payment_enrollments": pending_enrollments,
            }
        )


# =====================================================================
# Terminology endpoint
# =====================================================================


class TerminologyView(APIView):
    """
    Return the terminology mapping for the authenticated user's institution.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        school = getattr(request.user, "school", None)
        if school and school.school_category == "TRAINING_CENTER":
            return Response(
                {
                    "institution_type": "TRAINING_CENTER",
                    "terms": SCHOOL_TO_TRAINING_TERMS,
                }
            )
        return Response(
            {
                "institution_type": "PRIVATE_SCHOOL",
                "terms": {},  # No mapping needed — default terms are school terms
            }
        )


# =====================================================================
# Cross-institution (SUPER_ADMIN only)
# =====================================================================


class CrossInstitutionProfileListView(generics.ListAPIView):
    """List all cross-institution profiles. SUPER_ADMIN only."""

    queryset = CrossInstitutionProfile.objects.prefetch_related(
        "memberships__school"
    ).all()
    serializer_class = CrossInstitutionProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]


class CrossInstitutionProfileDetailView(generics.RetrieveAPIView):
    """Detail of a cross-institution profile. SUPER_ADMIN only."""

    queryset = CrossInstitutionProfile.objects.prefetch_related(
        "memberships__school"
    ).all()
    serializer_class = CrossInstitutionProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
