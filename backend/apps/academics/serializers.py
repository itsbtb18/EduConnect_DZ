from rest_framework import serializers

from apps.accounts.models import User

from .models import (
    Class,
    Lesson,
    Level,
    LevelSubject,
    Resource,
    ScheduleSlot,
    Stream,
    StudentProfile,
    Subject,
    TeacherAssignment,
    TeacherProfile,
    Timetable,
)


# ═══════════════════════════════════════════════════════════════════════════
# Hierarchy serializers
# ═══════════════════════════════════════════════════════════════════════════


class LevelSerializer(serializers.ModelSerializer):
    section_name = serializers.CharField(source="section.name", read_only=True)
    section_type = serializers.CharField(source="section.section_type", read_only=True)
    stream_count = serializers.SerializerMethodField()

    class Meta:
        model = Level
        fields = [
            "id",
            "school",
            "section",
            "section_name",
            "section_type",
            "name",
            "code",
            "order",
            "max_grade",
            "passing_grade",
            "has_streams",
            "stream_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]

    def get_stream_count(self, obj) -> int:
        return obj.streams.count()


class StreamSerializer(serializers.ModelSerializer):
    level_code = serializers.CharField(source="level.code", read_only=True)

    class Meta:
        model = Stream
        fields = [
            "id",
            "school",
            "level",
            "level_code",
            "name",
            "code",
            "short_name",
            "is_tronc_commun",
            "is_custom",
            "color",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


# ═══════════════════════════════════════════════════════════════════════════
# Subject serializers
# ═══════════════════════════════════════════════════════════════════════════


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = [
            "id",
            "school",
            "name",
            "arabic_name",
            "code",
            "color",
            "icon",
            "is_custom",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class LevelSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    level_code = serializers.CharField(source="level.code", read_only=True)
    stream_name = serializers.CharField(
        source="stream.name", read_only=True, default=""
    )

    class Meta:
        model = LevelSubject
        fields = [
            "id",
            "school",
            "level",
            "level_code",
            "stream",
            "stream_name",
            "subject",
            "subject_name",
            "coefficient",
            "is_mandatory",
            "weekly_hours",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


# ═══════════════════════════════════════════════════════════════════════════
# Bulk Subject + LevelSubject sync (setup wizard batch save)
# ═══════════════════════════════════════════════════════════════════════════


class _BulkLevelSubjectItemSerializer(serializers.Serializer):
    """One level-subject assignment inside a bulk payload."""
    level = serializers.UUIDField()
    stream = serializers.UUIDField(required=False, allow_null=True)
    subject_code = serializers.CharField(max_length=20)
    coefficient = serializers.DecimalField(max_digits=4, decimal_places=2, default=1)
    is_mandatory = serializers.BooleanField(default=True)
    weekly_hours = serializers.DecimalField(
        max_digits=4, decimal_places=2, required=False, allow_null=True,
    )


class _BulkSubjectItemSerializer(serializers.Serializer):
    """One subject catalog entry inside a bulk payload."""
    name = serializers.CharField(max_length=100)
    arabic_name = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)
    code = serializers.CharField(max_length=20)
    color = serializers.CharField(max_length=7, default="#2196F3")
    icon = serializers.CharField(max_length=50, required=False, default="", allow_blank=True)
    is_custom = serializers.BooleanField(default=False, required=False)


class BulkSubjectSyncSerializer(serializers.Serializer):
    """Accepts entire subject catalog + level-subject configs in one shot."""
    subjects = _BulkSubjectItemSerializer(many=True)
    level_subjects = _BulkLevelSubjectItemSerializer(many=True)


# ═══════════════════════════════════════════════════════════════════════════
# Classroom serializer
# ═══════════════════════════════════════════════════════════════════════════


class ClassSerializer(serializers.ModelSerializer):
    section_name = serializers.CharField(source="section.name", read_only=True)
    level_code = serializers.CharField(source="level.code", read_only=True)
    level_name = serializers.CharField(source="level.name", read_only=True)
    stream_name = serializers.CharField(
        source="stream.name", read_only=True, default=""
    )
    homeroom_teacher_name = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = [
            "id",
            "school",
            "section",
            "section_name",
            "academic_year",
            "level",
            "level_code",
            "level_name",
            "stream",
            "stream_name",
            "name",
            "homeroom_teacher",
            "homeroom_teacher_name",
            "capacity",
            "student_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]
        extra_kwargs = {
            "section": {"required": False, "allow_null": True},
            "academic_year": {"required": False, "allow_null": True},
        }

    def get_homeroom_teacher_name(self, obj) -> str:
        if obj.homeroom_teacher:
            return obj.homeroom_teacher.full_name
        return ""

    def get_student_count(self, obj) -> int:
        return obj.students.count()


class TeacherAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    class_name = serializers.CharField(source="assigned_class.name", read_only=True)

    class Meta:
        model = TeacherAssignment
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class ScheduleSlotSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)

    class Meta:
        model = ScheduleSlot
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]


# ---------------------------------------------------------------------------
# Student / Teacher  (flat view: User + Profile)
# ---------------------------------------------------------------------------


class StudentSerializer(serializers.Serializer):
    """Flat serializer combining User + StudentProfile for the admin panel."""

    # Read-only (returned by list/get)
    id = serializers.UUIDField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    class_name = serializers.SerializerMethodField()

    # Writable
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(
        max_length=20, required=False, allow_blank=True
    )
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    parent_phone = serializers.CharField(
        max_length=20, required=False, allow_blank=True
    )
    student_id = serializers.CharField(max_length=50, required=False, allow_blank=True)
    current_class = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        required=False,
        allow_null=True,
    )

    def get_class_name(self, obj) -> str:
        """obj is a User instance."""
        profile = getattr(obj, "student_profile", None)
        if profile and profile.current_class:
            return profile.current_class.name
        return ""

    def to_representation(self, instance):
        """Flatten User + StudentProfile into one dict."""
        data = super().to_representation(instance)
        profile = getattr(instance, "student_profile", None)
        data["date_of_birth"] = (
            str(profile.date_of_birth) if profile and profile.date_of_birth else None
        )
        data["student_id"] = profile.student_id if profile else ""
        data["parent_phone"] = ""  # stored on ParentProfile; placeholder
        data["enrollment_date"] = (
            str(profile.enrollment_date)
            if profile and profile.enrollment_date
            else None
        )
        return data

    def create(self, validated_data):
        """Create User(role=STUDENT) + StudentProfile."""
        school = self.context["school"]
        created_by = self.context["request"].user

        profile_fields = {}
        for f in ("date_of_birth", "student_id", "current_class"):
            if f in validated_data:
                profile_fields[f] = validated_data.pop(f)
        validated_data.pop("parent_phone", None)

        phone = validated_data.get("phone_number") or ""
        if not phone:
            # generate a placeholder to satisfy unique constraint
            import uuid

            phone = f"STU-{uuid.uuid4().hex[:8]}"
            validated_data["phone_number"] = phone

        user = User.objects.create_user(
            phone_number=validated_data["phone_number"],
            password="changeme123",
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            email=validated_data.get("email") or "",
            role=User.Role.STUDENT,
            school=school,
            created_by=created_by,
        )

        StudentProfile.objects.create(user=user, **profile_fields)
        return user

    def update(self, instance, validated_data):
        """Update User fields + StudentProfile fields."""
        profile_fields = {}
        for f in ("date_of_birth", "student_id", "current_class"):
            if f in validated_data:
                profile_fields[f] = validated_data.pop(f)
        validated_data.pop("parent_phone", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if profile_fields:
            profile, _ = StudentProfile.objects.get_or_create(user=instance)
            for attr, value in profile_fields.items():
                setattr(profile, attr, value)
            profile.save()

        return instance


class TeacherSerializer(serializers.Serializer):
    """Flat serializer combining User + TeacherProfile for the admin panel."""

    # Read-only
    id = serializers.UUIDField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    last_login = serializers.DateTimeField(read_only=True)
    classes_assigned = serializers.SerializerMethodField()

    # Writable
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    subject = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def get_classes_assigned(self, obj) -> list[str]:
        """Return class names this teacher is assigned to."""
        return list(
            TeacherAssignment.objects.filter(teacher=obj)
            .values_list("assigned_class__name", flat=True)
            .distinct()
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        profile = getattr(instance, "teacher_profile", None)
        data["subject"] = profile.specialization if profile else ""
        return data

    def create(self, validated_data):
        """Create User(role=TEACHER) + TeacherProfile."""
        school = self.context["school"]
        created_by = self.context["request"].user
        specialization = validated_data.pop("subject", "")

        user = User.objects.create_user(
            phone_number=validated_data["phone_number"],
            password="changeme123",
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            email=validated_data.get("email") or "",
            role=User.Role.TEACHER,
            school=school,
            created_by=created_by,
        )

        TeacherProfile.objects.create(user=user, specialization=specialization)
        return user

    def update(self, instance, validated_data):
        specialization = validated_data.pop("subject", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if specialization is not None:
            profile, _ = TeacherProfile.objects.get_or_create(user=instance)
            profile.specialization = specialization
            profile.save()

        return instance


# ---------------------------------------------------------------------------
# Teacher Bulk Setup (Wizard step 6)
# ---------------------------------------------------------------------------


class _BulkTeacherItemSerializer(serializers.Serializer):
    """One teacher entry from the setup wizard."""

    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    password = serializers.CharField(min_length=8)
    section_types = serializers.ListField(
        child=serializers.ChoiceField(choices=["PRIMARY", "MIDDLE", "HIGH"]),
        required=False,
        default=list,
    )
    subject_codes = serializers.ListField(
        child=serializers.CharField(max_length=30),
        required=False,
        default=list,
    )
    class_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list,
    )


class BulkTeacherSetupSerializer(serializers.Serializer):
    """Accepts an array of teachers for the wizard bulk-setup."""

    teachers = _BulkTeacherItemSerializer(many=True)


# ---------------------------------------------------------------------------
# Timetable
# ---------------------------------------------------------------------------


class TimetableSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source="class_group.name", read_only=True)
    academic_year_name = serializers.CharField(
        source="academic_year.name", read_only=True
    )
    uploaded_by_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Timetable
        fields = [
            "id",
            "class_group",
            "class_name",
            "academic_year",
            "academic_year_name",
            "title",
            "image",
            "image_url",
            "uploaded_by",
            "uploaded_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "uploaded_by",
            "created_at",
            "updated_at",
        ]

    def get_uploaded_by_name(self, obj) -> str:
        if obj.uploaded_by:
            return obj.uploaded_by.full_name
        return ""

    def get_image_url(self, obj) -> str:
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        if obj.image:
            return obj.image.url
        return ""

    def validate_image(self, value):
        # Max 10 MB
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("La taille du fichier dépasse 10 Mo.")
        # Allowed extensions
        ext = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if ext not in ("png", "jpg", "jpeg", "pdf"):
            raise serializers.ValidationError(
                "Format non supporté. Utilisez PNG, JPG, JPEG ou PDF."
            )
        return value
