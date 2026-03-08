"""
E-Learning serializers.
"""

from rest_framework import serializers

from .models import (
    DigitalResource,
    ExamBank,
    Quiz,
    QuizQuestion,
    QuizAttempt,
    StudentProgress,
)


# ── Digital Resource ──────────────────────────────────────────────────────────


class DigitalResourceSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(
        source="subject.name", read_only=True, default=""
    )
    level_name = serializers.CharField(source="level.name", read_only=True, default="")
    section_name = serializers.CharField(
        source="section.name", read_only=True, default=""
    )
    created_by_name = serializers.SerializerMethodField()
    is_favourited = serializers.SerializerMethodField()

    class Meta:
        model = DigitalResource
        fields = [
            "id",
            "title",
            "description",
            "resource_type",
            "scope",
            "section",
            "section_name",
            "level",
            "level_name",
            "subject",
            "subject_name",
            "chapter",
            "file",
            "external_url",
            "tags",
            "download_count",
            "view_count",
            "is_favourited",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "download_count",
            "view_count",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return ""

    def get_is_favourited(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.favourited_by.filter(id=request.user.id).exists()
        return False


class DigitalResourceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DigitalResource
        fields = [
            "title",
            "description",
            "resource_type",
            "scope",
            "section",
            "level",
            "subject",
            "chapter",
            "file",
            "external_url",
            "tags",
        ]


# ── Exam Bank ─────────────────────────────────────────────────────────────────


class ExamBankSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(
        source="subject.name", read_only=True, default=""
    )
    level_name = serializers.CharField(source="level.name", read_only=True, default="")

    class Meta:
        model = ExamBank
        fields = [
            "id",
            "title",
            "exam_type",
            "level",
            "level_name",
            "subject",
            "subject_name",
            "year",
            "description",
            "file",
            "solution_file",
            "solution_visible",
            "download_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "download_count", "created_at", "updated_at"]


class ExamBankCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamBank
        fields = [
            "title",
            "exam_type",
            "level",
            "subject",
            "year",
            "description",
            "file",
            "solution_file",
            "solution_visible",
        ]


# ── Quiz ──────────────────────────────────────────────────────────────────────


class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = [
            "id",
            "quiz",
            "order",
            "question_type",
            "text",
            "options",
            "correct_answer",
            "points",
            "explanation",
        ]
        read_only_fields = ["id"]


class QuizQuestionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = [
            "order",
            "question_type",
            "text",
            "options",
            "correct_answer",
            "points",
            "explanation",
        ]


class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)
    subject_name = serializers.CharField(
        source="subject.name", read_only=True, default=""
    )
    level_name = serializers.CharField(source="level.name", read_only=True, default="")
    teacher_name = serializers.SerializerMethodField()
    total_points = serializers.IntegerField(read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    is_closed = serializers.BooleanField(read_only=True)
    assigned_classroom_ids = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "description",
            "subject",
            "subject_name",
            "level",
            "level_name",
            "chapter",
            "duration_minutes",
            "created_by_teacher",
            "teacher_name",
            "assigned_classrooms",
            "assigned_classroom_ids",
            "allow_retake",
            "show_correction_immediately",
            "is_published",
            "closes_at",
            "is_closed",
            "total_points",
            "question_count",
            "questions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by_teacher",
            "total_points",
            "question_count",
            "is_closed",
            "created_at",
            "updated_at",
        ]

    def get_teacher_name(self, obj):
        t = obj.created_by_teacher
        if t:
            return f"{t.first_name} {t.last_name}".strip()
        return ""

    def get_assigned_classroom_ids(self, obj):
        return list(obj.assigned_classrooms.values_list("id", flat=True))


class QuizListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views (no questions included)."""

    subject_name = serializers.CharField(
        source="subject.name", read_only=True, default=""
    )
    level_name = serializers.CharField(source="level.name", read_only=True, default="")
    teacher_name = serializers.SerializerMethodField()
    total_points = serializers.IntegerField(read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    is_closed = serializers.BooleanField(read_only=True)
    attempt_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "description",
            "subject",
            "subject_name",
            "level",
            "level_name",
            "chapter",
            "duration_minutes",
            "teacher_name",
            "allow_retake",
            "show_correction_immediately",
            "is_published",
            "closes_at",
            "is_closed",
            "total_points",
            "question_count",
            "attempt_count",
            "created_at",
        ]

    def get_teacher_name(self, obj):
        t = obj.created_by_teacher
        if t:
            return f"{t.first_name} {t.last_name}".strip()
        return ""

    def get_attempt_count(self, obj):
        return obj.attempts.count()


class QuizCreateSerializer(serializers.ModelSerializer):
    questions = QuizQuestionCreateSerializer(many=True, required=False)
    assigned_classrooms = serializers.PrimaryKeyRelatedField(
        many=True, queryset=None, required=False
    )

    class Meta:
        model = Quiz
        fields = [
            "title",
            "description",
            "subject",
            "level",
            "chapter",
            "duration_minutes",
            "allow_retake",
            "show_correction_immediately",
            "is_published",
            "closes_at",
            "assigned_classrooms",
            "questions",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.academics.models import Class

        self.fields["assigned_classrooms"].child_relation.queryset = Class.objects.all()

    def create(self, validated_data):
        questions_data = validated_data.pop("questions", [])
        classrooms = validated_data.pop("assigned_classrooms", [])
        quiz = Quiz.objects.create(**validated_data)
        quiz.assigned_classrooms.set(classrooms)
        for idx, q_data in enumerate(questions_data):
            QuizQuestion.objects.create(
                quiz=quiz,
                school=quiz.school,
                order=q_data.get("order", idx),
                **{k: v for k, v in q_data.items() if k != "order"},
            )
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop("questions", None)
        classrooms = validated_data.pop("assigned_classrooms", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if classrooms is not None:
            instance.assigned_classrooms.set(classrooms)
        if questions_data is not None:
            instance.questions.all().delete()
            for idx, q_data in enumerate(questions_data):
                QuizQuestion.objects.create(
                    quiz=instance,
                    school=instance.school,
                    order=q_data.get("order", idx),
                    **{k: v for k, v in q_data.items() if k != "order"},
                )
        return instance


# ── Quiz Attempt ──────────────────────────────────────────────────────────────


class QuizAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    quiz_title = serializers.CharField(source="quiz.title", read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            "id",
            "quiz",
            "quiz_title",
            "student",
            "student_name",
            "started_at",
            "finished_at",
            "score",
            "total_points",
            "answers",
            "passed",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "student",
            "started_at",
            "score",
            "total_points",
            "answers",
            "passed",
            "created_at",
        ]

    def get_student_name(self, obj):
        s = obj.student
        return f"{s.first_name} {s.last_name}".strip() if s else ""


class QuizSubmitSerializer(serializers.Serializer):
    """Accepts student answers for auto-grading."""

    answers = serializers.DictField(
        child=serializers.JSONField(),
        help_text='{"question_id": answer_value}',
    )


# ── Student Progress ─────────────────────────────────────────────────────────


class StudentProgressSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    recommended_resource_ids = serializers.SerializerMethodField()

    class Meta:
        model = StudentProgress
        fields = [
            "id",
            "student",
            "student_name",
            "subject",
            "subject_name",
            "completion_percentage",
            "strengths",
            "weaknesses",
            "quiz_average",
            "total_resources_viewed",
            "total_quizzes_taken",
            "recommended_resource_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_student_name(self, obj):
        s = obj.student
        return f"{s.first_name} {s.last_name}".strip() if s else ""

    def get_recommended_resource_ids(self, obj):
        return list(obj.recommended_resources.values_list("id", flat=True))
