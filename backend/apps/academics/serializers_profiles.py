"""
Full-profile serializers for Student, Teacher, and Parent users.

These read-only serializers aggregate data from multiple models into a single
response so the admin panel can display a complete detail page in one API call.
"""

from decimal import Decimal

from django.db.models import Count, Q, Sum
from rest_framework import serializers

from apps.accounts.models import User
from apps.attendance.models import AttendanceRecord
from apps.chat.models import Conversation, Message
from apps.finance.models import StudentPayment
from apps.grades.models import (
    AnnualAverage,
    GradeAppeal,
    SubjectAverage,
    TrimesterAverage,
)

from .models import (
    LevelSubject,
    ParentProfile,
    ScheduleSlot,
    StudentProfile,
    TeacherAssignment,
)


# ═══════════════════════════════════════════════════════════════════════════
# Tiny nested read-only serializers
# ═══════════════════════════════════════════════════════════════════════════


class _ClassInfoSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    level = serializers.CharField(source="level.name")
    level_code = serializers.CharField(source="level.code")
    stream = serializers.CharField(source="stream.name", default="")
    section = serializers.CharField(source="section.name")
    academic_year = serializers.CharField(source="academic_year.name")


class _LevelSubjectBriefSerializer(serializers.Serializer):
    subject_name = serializers.CharField(source="subject.name")
    subject_code = serializers.CharField(source="subject.code")
    coefficient = serializers.DecimalField(max_digits=4, decimal_places=2)
    weekly_hours = serializers.DecimalField(
        max_digits=4, decimal_places=2, allow_null=True
    )
    is_mandatory = serializers.BooleanField()


class _PaymentBriefSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_date = serializers.DateField()
    payment_type = serializers.CharField()
    payment_method = serializers.CharField()
    receipt_number = serializers.CharField()
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    status = serializers.CharField()


class _TeacherBriefSerializer(serializers.Serializer):
    id = serializers.UUIDField(source="teacher.id")
    full_name = serializers.CharField(source="teacher.full_name")
    subject = serializers.CharField(source="subject.name")
    subject_code = serializers.CharField(source="subject.code")


class _ParentBriefSerializer(serializers.Serializer):
    id = serializers.UUIDField(source="user.id")
    full_name = serializers.CharField(source="user.full_name")
    phone_number = serializers.CharField(source="user.phone_number")
    relationship = serializers.CharField()


class _AbsenceRecordBriefSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    date = serializers.DateField()
    period = serializers.CharField()
    subject_name = serializers.CharField()
    status = serializers.CharField()
    is_justified = serializers.BooleanField()


class _SubjectAverageBriefSerializer(serializers.Serializer):
    subject = serializers.CharField(source="subject.name")
    trimester = serializers.IntegerField()
    average = serializers.SerializerMethodField()
    is_published = serializers.BooleanField()
    academic_year = serializers.CharField(source="academic_year.name")

    def get_average(self, obj):
        val = obj.effective_average
        return str(val) if val is not None else None


class _TrimesterAverageBriefSerializer(serializers.Serializer):
    trimester = serializers.IntegerField()
    average = serializers.SerializerMethodField()
    rank_in_class = serializers.IntegerField()
    appreciation = serializers.CharField()
    is_published = serializers.BooleanField()
    academic_year = serializers.CharField(source="academic_year.name")

    def get_average(self, obj):
        val = obj.effective_average
        return str(val) if val is not None else None


class _AnnualAverageBriefSerializer(serializers.Serializer):
    average = serializers.SerializerMethodField()
    rank_in_class = serializers.IntegerField()
    rank_in_level = serializers.IntegerField()
    appreciation = serializers.CharField()
    is_published = serializers.BooleanField()
    academic_year = serializers.CharField(source="academic_year.name")

    def get_average(self, obj):
        val = obj.effective_average
        return str(val) if val is not None else None


class _AppealBriefSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    appeal_type = serializers.CharField()
    status = serializers.CharField()
    reason = serializers.CharField()
    created_at = serializers.DateTimeField()
    responded_at = serializers.DateTimeField()


class _ScheduleSlotBriefSerializer(serializers.Serializer):
    DAY_NAMES = {
        0: "Dimanche",
        1: "Lundi",
        2: "Mardi",
        3: "Mercredi",
        4: "Jeudi",
    }

    day_of_week = serializers.IntegerField()
    day_name = serializers.SerializerMethodField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    subject = serializers.CharField(source="subject.name")
    classroom = serializers.CharField(source="assigned_class.name")
    room_name = serializers.CharField()

    def get_day_name(self, obj):
        return self.DAY_NAMES.get(obj.day_of_week, "")


class _ChildSnapshotSerializer(serializers.Serializer):
    """Snapshot of one child for the parent full-profile."""

    id = serializers.UUIDField(source="user.id")
    full_name = serializers.CharField(source="user.full_name")
    student_id = serializers.CharField()
    class_name = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(source="user.is_active")
    last_average = serializers.SerializerMethodField()
    absences_count = serializers.SerializerMethodField()

    def get_class_name(self, profile):
        return profile.current_class.name if profile.current_class else ""

    def get_last_average(self, profile):
        avg = (
            TrimesterAverage.objects.filter(student=profile)
            .order_by("-academic_year__name", "-trimester")
            .only("calculated_average", "manual_override")
            .first()
        )
        if avg:
            val = avg.effective_average
            return str(val) if val is not None else None
        return None

    def get_absences_count(self, profile):
        return AttendanceRecord.objects.filter(student=profile, status="ABSENT").count()


class _ConversationBriefSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    admin_name = serializers.CharField(source="participant_admin.full_name")
    last_message_at = serializers.DateTimeField()
    is_read_by_admin = serializers.BooleanField()
    unread_count_admin = serializers.IntegerField()


# ═══════════════════════════════════════════════════════════════════════════
# 1. STUDENT FULL PROFILE
# ═══════════════════════════════════════════════════════════════════════════


class StudentFullProfileSerializer(serializers.Serializer):
    """
    Aggregates **all** information about a student into a single response:
    identity, academics, payments, teachers, parents, absences, grades, appeals.

    The serializer receives a ``User`` instance (role=STUDENT) with
    ``student_profile`` already select_related from the view.
    """

    identity = serializers.SerializerMethodField()
    academic_info = serializers.SerializerMethodField()
    payment_info = serializers.SerializerMethodField()
    teachers = serializers.SerializerMethodField()
    parents = serializers.SerializerMethodField()
    absences_summary = serializers.SerializerMethodField()
    grades_history = serializers.SerializerMethodField()
    appeals = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()

    # ── helpers ──────────────────────────────────────────────────────────
    def _photo_url(self, user):
        if not user.photo:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(user.photo.url)
        return user.photo.url

    # ── sections ─────────────────────────────────────────────────────────
    def get_identity(self, user: User) -> dict:
        profile = getattr(user, "student_profile", None)
        return {
            "id": str(user.id),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "email": user.email or "",
            "photo": self._photo_url(user),
            "role": user.role,
            "school_id": str(user.school_id) if user.school_id else None,
            "school_name": user.school.name if user.school else None,
            "is_active": user.is_active,
            "created_at": (user.created_at.isoformat() if user.created_at else None),
            "student_id": profile.student_id if profile else "",
            "date_of_birth": (
                str(profile.date_of_birth)
                if profile and profile.date_of_birth
                else None
            ),
            "enrollment_date": (
                str(profile.enrollment_date)
                if profile and profile.enrollment_date
                else None
            ),
            "qr_code_data": (
                f"ILMI-STU-{profile.student_id}-{user.school.subdomain}"
                if profile and profile.student_id and user.school
                else None
            ),
        }

    def get_academic_info(self, user: User) -> dict:
        profile = getattr(user, "student_profile", None)
        if not profile or not profile.current_class:
            return {"current_class": None, "level_subjects": []}

        cls = profile.current_class
        class_data = _ClassInfoSerializer(cls).data

        # Level subjects — include stream-specific + generic (stream=NULL)
        qs = LevelSubject.objects.filter(level=cls.level).select_related("subject")
        if cls.stream_id:
            qs = qs.filter(Q(stream=cls.stream) | Q(stream__isnull=True))

        return {
            "current_class": class_data,
            "level_subjects": _LevelSubjectBriefSerializer(qs, many=True).data,
        }

    def get_payment_info(self, user: User) -> dict:
        payments = StudentPayment.objects.filter(student=user).order_by("-payment_date")
        agg = payments.aggregate(total_paid=Sum("amount_paid"))
        total_paid = agg["total_paid"] or Decimal("0")

        return {
            "total_paid": str(total_paid),
            "payment_count": payments.count(),
            "recent_payments": _PaymentBriefSerializer(payments[:10], many=True).data,
        }

    def get_teachers(self, user: User) -> list:
        profile = getattr(user, "student_profile", None)
        if not profile or not profile.current_class:
            return []

        assignments = TeacherAssignment.objects.filter(
            assigned_class=profile.current_class,
        ).select_related("teacher", "subject")
        return _TeacherBriefSerializer(assignments, many=True).data

    def get_parents(self, user: User) -> list:
        profile = getattr(user, "student_profile", None)
        if not profile:
            return []

        parent_profiles = ParentProfile.objects.filter(
            children=profile,
        ).select_related("user")
        return _ParentBriefSerializer(parent_profiles, many=True).data

    def get_absences_summary(self, user: User) -> dict:
        profile = getattr(user, "student_profile", None)
        empty = {
            "total_absences": 0,
            "justified": 0,
            "unjustified": 0,
            "late_count": 0,
            "recent_absences": [],
        }
        if not profile:
            return empty

        records = AttendanceRecord.objects.filter(student=profile)
        stats = records.aggregate(
            total_absences=Count("id", filter=Q(status="ABSENT")),
            justified=Count("id", filter=Q(status="ABSENT", is_justified=True)),
            unjustified=Count("id", filter=Q(status="ABSENT", is_justified=False)),
            late_count=Count("id", filter=Q(status="LATE")),
        )

        recent = records.filter(status__in=["ABSENT", "LATE"]).order_by("-date")[:10]

        return {
            **stats,
            "recent_absences": _AbsenceRecordBriefSerializer(recent, many=True).data,
        }

    def get_grades_history(self, user: User) -> dict:
        profile = getattr(user, "student_profile", None)
        empty = {
            "subject_averages": [],
            "trimester_averages": [],
            "annual_average": None,
        }
        if not profile:
            return empty

        subj_avgs = SubjectAverage.objects.filter(
            student=profile,
        ).select_related("subject", "academic_year")

        trim_avgs = TrimesterAverage.objects.filter(
            student=profile,
        ).select_related("academic_year")

        annual = (
            AnnualAverage.objects.filter(student=profile)
            .select_related("academic_year")
            .order_by("-academic_year__name")
            .first()
        )

        return {
            "subject_averages": _SubjectAverageBriefSerializer(
                subj_avgs, many=True
            ).data,
            "trimester_averages": _TrimesterAverageBriefSerializer(
                trim_avgs, many=True
            ).data,
            "annual_average": (
                _AnnualAverageBriefSerializer(annual).data if annual else None
            ),
        }

    def get_appeals(self, user: User) -> list:
        profile = getattr(user, "student_profile", None)
        if not profile:
            return []
        return _AppealBriefSerializer(
            GradeAppeal.objects.filter(student=profile).order_by("-created_at")[:10],
            many=True,
        ).data

    def get_documents(self, user: User) -> list:
        # No Document model exists yet — reserved for future use
        return []


# ═══════════════════════════════════════════════════════════════════════════
# 2. TEACHER FULL PROFILE
# ═══════════════════════════════════════════════════════════════════════════


class TeacherFullProfileSerializer(serializers.Serializer):
    """
    Aggregates all information about a teacher: identity, subjects,
    classrooms, teaching statistics, and weekly schedule.

    Receives a ``User`` instance (role=TEACHER) with ``teacher_profile``
    already select_related from the view.
    """

    identity = serializers.SerializerMethodField()
    subjects = serializers.SerializerMethodField()
    classrooms = serializers.SerializerMethodField()
    teaching_stats = serializers.SerializerMethodField()
    current_week_schedule = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()

    # ── helpers ──────────────────────────────────────────────────────────
    def _photo_url(self, user):
        if not user.photo:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(user.photo.url)
        return user.photo.url

    # ── sections ─────────────────────────────────────────────────────────
    def get_identity(self, user: User) -> dict:
        profile = getattr(user, "teacher_profile", None)
        return {
            "id": str(user.id),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "email": user.email or "",
            "photo": self._photo_url(user),
            "role": user.role,
            "school_id": str(user.school_id) if user.school_id else None,
            "school_name": user.school.name if user.school else None,
            "is_active": user.is_active,
            "created_at": (user.created_at.isoformat() if user.created_at else None),
            "specialization": profile.specialization if profile else "",
            "section_id": (
                str(profile.section_id) if profile and profile.section_id else None
            ),
            "section_name": (
                profile.section.name if profile and profile.section else None
            ),
        }

    def get_subjects(self, user: User) -> list:
        rows = (
            TeacherAssignment.objects.filter(teacher=user)
            .select_related("subject")
            .values_list("subject__id", "subject__name", "subject__code")
            .distinct()
        )
        return [
            {"id": str(sid), "name": sname, "code": scode} for sid, sname, scode in rows
        ]

    def get_classrooms(self, user: User) -> list:
        assignments = TeacherAssignment.objects.filter(
            teacher=user,
        ).select_related(
            "assigned_class",
            "assigned_class__level",
            "assigned_class__stream",
        )

        seen: set = set()
        result: list = []
        for a in assignments:
            cls = a.assigned_class
            if cls.id in seen:
                continue
            seen.add(cls.id)
            result.append(
                {
                    "id": str(cls.id),
                    "name": cls.name,
                    "level": cls.level.name,
                    "stream": cls.stream.name if cls.stream else "",
                    "student_count": cls.students.count(),
                }
            )
        return result

    def get_teaching_stats(self, user: User) -> dict:
        assignments = TeacherAssignment.objects.filter(teacher=user)
        class_ids = set(assignments.values_list("assigned_class_id", flat=True))
        subject_ids = set(assignments.values_list("subject_id", flat=True))

        total_students = StudentProfile.objects.filter(
            current_class_id__in=class_ids,
        ).count()

        # Compute weekly hours from schedule slots
        slots = ScheduleSlot.objects.filter(teacher=user)
        total_minutes = 0
        for slot in slots:
            delta = (slot.end_time.hour * 60 + slot.end_time.minute) - (
                slot.start_time.hour * 60 + slot.start_time.minute
            )
            total_minutes += max(delta, 0)

        return {
            "total_classes": len(class_ids),
            "total_students": total_students,
            "total_subjects": len(subject_ids),
            "total_weekly_hours": round(total_minutes / 60, 1),
        }

    def get_current_week_schedule(self, user: User) -> list:
        slots = (
            ScheduleSlot.objects.filter(teacher=user)
            .select_related("subject", "assigned_class")
            .order_by("day_of_week", "start_time")
        )
        return _ScheduleSlotBriefSerializer(slots, many=True).data

    def get_documents(self, user: User) -> list:
        return []


# ═══════════════════════════════════════════════════════════════════════════
# 3. PARENT FULL PROFILE
# ═══════════════════════════════════════════════════════════════════════════


class ParentFullProfileSerializer(serializers.Serializer):
    """
    Aggregates all information about a parent: identity, children
    snapshots, payment summary, and communication history.

    Receives a ``User`` instance (role=PARENT) with ``parent_profile``
    already select_related / prefetch_related from the view.
    """

    identity = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    payment_summary = serializers.SerializerMethodField()
    communication_history = serializers.SerializerMethodField()

    # ── helpers ──────────────────────────────────────────────────────────
    def _photo_url(self, user):
        if not user.photo:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(user.photo.url)
        return user.photo.url

    # ── sections ─────────────────────────────────────────────────────────
    def get_identity(self, user: User) -> dict:
        profile = getattr(user, "parent_profile", None)
        return {
            "id": str(user.id),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "email": user.email or "",
            "photo": self._photo_url(user),
            "role": user.role,
            "school_id": str(user.school_id) if user.school_id else None,
            "school_name": user.school.name if user.school else None,
            "is_active": user.is_active,
            "created_at": (user.created_at.isoformat() if user.created_at else None),
            "relationship": profile.relationship if profile else "",
        }

    def get_children(self, user: User) -> list:
        profile = getattr(user, "parent_profile", None)
        if not profile:
            return []

        children = profile.children.select_related("user", "current_class").all()
        return _ChildSnapshotSerializer(children, many=True).data

    def get_payment_summary(self, user: User) -> dict:
        profile = getattr(user, "parent_profile", None)
        if not profile:
            return {"total_paid": "0", "children_payments": []}

        child_user_ids = list(profile.children.values_list("user_id", flat=True))
        payments = StudentPayment.objects.filter(student_id__in=child_user_ids)
        total = payments.aggregate(t=Sum("amount_paid"))["t"] or Decimal("0")

        children_payments = []
        for child in profile.children.select_related("user").all():
            child_payments = payments.filter(student=child.user)
            child_agg = child_payments.aggregate(t=Sum("amount_paid"))
            children_payments.append(
                {
                    "child_id": str(child.user.id),
                    "child_name": child.user.full_name,
                    "total_paid": str(child_agg["t"] or Decimal("0")),
                    "payment_count": child_payments.count(),
                }
            )

        return {
            "total_paid": str(total),
            "children_payments": children_payments,
        }

    def get_communication_history(self, user: User) -> dict:
        conversations = (
            Conversation.objects.filter(participant_other=user)
            .select_related("participant_admin")
            .order_by("-last_message_at")
        )

        total_messages = Message.objects.filter(
            conversation__participant_other=user,
        ).count()

        unread = (
            Message.objects.filter(
                conversation__participant_other=user,
                is_read=False,
            )
            .exclude(sender=user)
            .count()
        )

        return {
            "total_messages": total_messages,
            "unread_count": unread,
            "recent_conversations": _ConversationBriefSerializer(
                conversations[:10], many=True
            ).data,
        }
