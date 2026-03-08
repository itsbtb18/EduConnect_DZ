"""
E-Learning API views.
"""

from django.db.models import Avg, Count, Q, Sum, F
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import require_module

from .models import (
    DigitalResource,
    ExamBank,
    Quiz,
    QuizQuestion,
    QuizAttempt,
    StudentProgress,
)
from .serializers import (
    DigitalResourceSerializer,
    DigitalResourceCreateSerializer,
    ExamBankSerializer,
    ExamBankCreateSerializer,
    QuizSerializer,
    QuizListSerializer,
    QuizCreateSerializer,
    QuizQuestionSerializer,
    QuizQuestionCreateSerializer,
    QuizAttemptSerializer,
    QuizSubmitSerializer,
    StudentProgressSerializer,
)


def _school_qs(model, user, include_deleted=False):
    """Tenant-isolated queryset helper."""
    qs = model.objects.all()
    if not include_deleted:
        qs = qs.filter(is_deleted=False)
    if user.role != "SUPER_ADMIN":
        qs = qs.filter(school=user.school)
    return qs


def _is_admin(user):
    return user.role in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN")


# ── Digital Resources ─────────────────────────────────────────────────────────


@require_module("auto_education")
class ResourceListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _school_qs(DigitalResource, request.user)

        # Also include GLOBAL resources
        if request.user.role != "SUPER_ADMIN":
            qs = DigitalResource.objects.filter(
                Q(school=request.user.school) | Q(scope="GLOBAL"),
                is_deleted=False,
            )

        # Filters
        q = request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(description__icontains=q)
                | Q(tags__icontains=q)
            )
        rtype = request.query_params.get("type")
        if rtype:
            qs = qs.filter(resource_type=rtype)
        section = request.query_params.get("section")
        if section:
            qs = qs.filter(section_id=section)
        level = request.query_params.get("level")
        if level:
            qs = qs.filter(level_id=level)
        subject = request.query_params.get("subject")
        if subject:
            qs = qs.filter(subject_id=subject)
        chapter = request.query_params.get("chapter")
        if chapter:
            qs = qs.filter(chapter__icontains=chapter)

        serializer = DigitalResourceSerializer(
            qs, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request):
        if not _is_admin(request.user) and request.user.role != "TEACHER":
            return Response(
                {"detail": "Non autorisé"}, status=status.HTTP_403_FORBIDDEN
            )
        serializer = DigitalResourceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resource = serializer.save(school=request.user.school, created_by=request.user)
        return Response(
            DigitalResourceSerializer(resource, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


@require_module("auto_education")
class ResourceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_obj(self, pk, user):
        try:
            obj = DigitalResource.objects.get(pk=pk, is_deleted=False)
        except DigitalResource.DoesNotExist:
            return None
        if (
            user.role != "SUPER_ADMIN"
            and obj.school != user.school
            and obj.scope != "GLOBAL"
        ):
            return None
        return obj

    def get(self, request, pk):
        obj = self._get_obj(pk, request.user)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        # Increment view count
        DigitalResource.objects.filter(pk=pk).update(view_count=F("view_count") + 1)
        return Response(
            DigitalResourceSerializer(obj, context={"request": request}).data
        )

    def put(self, request, pk):
        obj = self._get_obj(pk, request.user)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not _is_admin(request.user) and request.user.role != "TEACHER":
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = DigitalResourceCreateSerializer(
            obj, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            DigitalResourceSerializer(obj, context={"request": request}).data
        )

    def delete(self, request, pk):
        obj = self._get_obj(pk, request.user)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@require_module("auto_education")
class ResourceFavouriteView(APIView):
    """POST to toggle favourite status for the current user."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            resource = DigitalResource.objects.get(pk=pk, is_deleted=False)
        except DigitalResource.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if resource.favourited_by.filter(id=request.user.id).exists():
            resource.favourited_by.remove(request.user)
            return Response({"favourited": False})
        resource.favourited_by.add(request.user)
        return Response({"favourited": True})


@require_module("auto_education")
class ResourceDownloadView(APIView):
    """POST to increment download counter."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        updated = DigitalResource.objects.filter(pk=pk, is_deleted=False).update(
            download_count=F("download_count") + 1
        )
        if not updated:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response({"status": "ok"})


# ── Exam Bank ─────────────────────────────────────────────────────────────────


@require_module("auto_education")
class ExamBankListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _school_qs(ExamBank, request.user)
        etype = request.query_params.get("type")
        if etype:
            qs = qs.filter(exam_type=etype)
        level = request.query_params.get("level")
        if level:
            qs = qs.filter(level_id=level)
        subject = request.query_params.get("subject")
        if subject:
            qs = qs.filter(subject_id=subject)
        year = request.query_params.get("year")
        if year:
            qs = qs.filter(year=year)
        q = request.query_params.get("q")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))
        return Response(ExamBankSerializer(qs, many=True).data)

    def post(self, request):
        if not _is_admin(request.user) and request.user.role != "TEACHER":
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = ExamBankCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(school=request.user.school, created_by=request.user)
        return Response(ExamBankSerializer(item).data, status=status.HTTP_201_CREATED)


@require_module("auto_education")
class ExamBankDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_obj(self, pk, user):
        try:
            obj = ExamBank.objects.get(pk=pk, is_deleted=False)
        except ExamBank.DoesNotExist:
            return None
        if user.role != "SUPER_ADMIN" and obj.school != user.school:
            return None
        return obj

    def get(self, request, pk):
        obj = self._get_obj(pk, request.user)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(ExamBankSerializer(obj).data)

    def put(self, request, pk):
        obj = self._get_obj(pk, request.user)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not _is_admin(request.user) and request.user.role != "TEACHER":
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = ExamBankCreateSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ExamBankSerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get_obj(pk, request.user)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@require_module("auto_education")
class ExamBankDownloadView(APIView):
    """Increment download counter."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        updated = ExamBank.objects.filter(pk=pk, is_deleted=False).update(
            download_count=F("download_count") + 1
        )
        if not updated:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response({"status": "ok"})


# ── Quizzes ───────────────────────────────────────────────────────────────────


@require_module("auto_education")
class QuizListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _school_qs(Quiz, request.user)

        # Students see only published quizzes assigned to their class
        if request.user.role == "STUDENT":
            qs = qs.filter(is_published=True)
            student_classroom = getattr(request.user, "classroom", None)
            if student_classroom:
                qs = qs.filter(assigned_classrooms=student_classroom)

        subject = request.query_params.get("subject")
        if subject:
            qs = qs.filter(subject_id=subject)
        level = request.query_params.get("level")
        if level:
            qs = qs.filter(level_id=level)
        published = request.query_params.get("published")
        if published is not None:
            qs = qs.filter(is_published=published.lower() == "true")

        return Response(QuizListSerializer(qs.distinct(), many=True).data)

    def post(self, request):
        if not _is_admin(request.user) and request.user.role != "TEACHER":
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = QuizCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quiz = serializer.save(
            school=request.user.school,
            created_by=request.user,
            created_by_teacher=request.user if request.user.role == "TEACHER" else None,
        )
        return Response(QuizSerializer(quiz).data, status=status.HTTP_201_CREATED)


@require_module("auto_education")
class QuizDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_obj(self, pk, user):
        try:
            obj = Quiz.objects.get(pk=pk, is_deleted=False)
        except Quiz.DoesNotExist:
            return None
        if user.role != "SUPER_ADMIN" and obj.school != user.school:
            return None
        return obj

    def get(self, request, pk):
        obj = self._get_obj(pk, request.user)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        # Students should not see correct answers before attempt (if correction not immediate)
        ser = QuizSerializer(obj)
        data = ser.data
        if request.user.role == "STUDENT" and not obj.show_correction_immediately:
            has_attempt = obj.attempts.filter(student=request.user).exists()
            if not has_attempt or (not obj.is_closed):
                for q in data.get("questions", []):
                    q.pop("correct_answer", None)
                    q.pop("explanation", None)
        return Response(data)

    def put(self, request, pk):
        obj = self._get_obj(pk, request.user)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not _is_admin(request.user) and request.user != obj.created_by_teacher:
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = QuizCreateSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(QuizSerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get_obj(pk, request.user)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not _is_admin(request.user) and request.user != obj.created_by_teacher:
            return Response(status=status.HTTP_403_FORBIDDEN)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Quiz Questions (standalone CRUD) ──────────────────────────────────────────


@require_module("auto_education")
class QuizQuestionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        quiz = Quiz.objects.filter(pk=pk, is_deleted=False).first()
        if not quiz:
            return Response(status=status.HTTP_404_NOT_FOUND)
        qs = quiz.questions.filter(is_deleted=False).order_by("order")
        return Response(QuizQuestionSerializer(qs, many=True).data)

    def post(self, request, pk):
        quiz = Quiz.objects.filter(pk=pk, is_deleted=False).first()
        if not quiz:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not _is_admin(request.user) and request.user != quiz.created_by_teacher:
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = QuizQuestionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = serializer.save(quiz=quiz, school=quiz.school)
        return Response(
            QuizQuestionSerializer(question).data, status=status.HTTP_201_CREATED
        )


@require_module("auto_education")
class QuizQuestionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk, question_pk):
        try:
            question = QuizQuestion.objects.get(
                pk=question_pk, quiz_id=pk, is_deleted=False
            )
        except QuizQuestion.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if (
            not _is_admin(request.user)
            and request.user != question.quiz.created_by_teacher
        ):
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = QuizQuestionCreateSerializer(
            question, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(QuizQuestionSerializer(question).data)

    def delete(self, request, pk, question_pk):
        try:
            question = QuizQuestion.objects.get(
                pk=question_pk, quiz_id=pk, is_deleted=False
            )
        except QuizQuestion.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if (
            not _is_admin(request.user)
            and request.user != question.quiz.created_by_teacher
        ):
            return Response(status=status.HTTP_403_FORBIDDEN)
        question.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Quiz Submission & Attempts ────────────────────────────────────────────────


@require_module("auto_education")
class QuizSubmitView(APIView):
    """Student submits answers for auto-grading."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != "STUDENT":
            return Response(
                {"detail": "Seuls les élèves peuvent passer les quiz."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            quiz = Quiz.objects.get(pk=pk, is_deleted=False, is_published=True)
        except Quiz.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if quiz.is_closed:
            return Response(
                {"detail": "Ce quiz est clôturé."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Check retake
        existing_attempts = quiz.attempts.filter(student=request.user)
        if existing_attempts.exists() and not quiz.allow_retake:
            return Response(
                {
                    "detail": "Vous avez déjà passé ce quiz et le repassage n'est pas autorisé."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = QuizSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student_answers = serializer.validated_data["answers"]

        # Auto-grade
        questions = quiz.questions.filter(is_deleted=False)
        graded_answers = {}
        total_score = 0
        total_points = 0

        for question in questions:
            q_id = str(question.id)
            total_points += question.points
            student_answer = student_answers.get(q_id)

            is_correct = False
            if student_answer is not None:
                if question.question_type == "MCQ":
                    is_correct = student_answer == question.correct_answer
                elif question.question_type == "TRUE_FALSE":
                    is_correct = (
                        str(student_answer).lower()
                        == str(question.correct_answer).lower()
                    )
                elif question.question_type == "FREE_TEXT":
                    # For free text, mark as needs_review
                    is_correct = False  # Teacher grades manually

            points_earned = question.points if is_correct else 0
            total_score += points_earned
            graded_answers[q_id] = {
                "answer": student_answer,
                "is_correct": is_correct,
                "points_earned": points_earned,
            }

        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            student=request.user,
            school=request.user.school,
            score=total_score,
            total_points=total_points,
            answers=graded_answers,
            passed=total_score >= (total_points * 0.5),
            finished_at=timezone.now(),
        )

        # Update student progress
        if quiz.subject:
            progress, _ = StudentProgress.objects.get_or_create(
                student=request.user,
                subject=quiz.subject,
                school=request.user.school,
            )
            subject_attempts = QuizAttempt.objects.filter(
                student=request.user,
                quiz__subject=quiz.subject,
                school=request.user.school,
            )
            avg = subject_attempts.aggregate(a=Avg("score"))["a"] or 0
            progress.quiz_average = avg
            progress.total_quizzes_taken = subject_attempts.count()
            progress.save(
                update_fields=["quiz_average", "total_quizzes_taken", "updated_at"]
            )

        return Response(
            QuizAttemptSerializer(attempt).data, status=status.HTTP_201_CREATED
        )


@require_module("auto_education")
class QuizAttemptsView(APIView):
    """List attempts for a quiz."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            quiz = Quiz.objects.get(pk=pk, is_deleted=False)
        except Quiz.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        qs = quiz.attempts.all()
        if request.user.role == "STUDENT":
            qs = qs.filter(student=request.user)

        return Response(QuizAttemptSerializer(qs, many=True).data)


@require_module("auto_education")
class MyQuizAttemptsView(APIView):
    """Student's own attempts across all quizzes."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = QuizAttempt.objects.filter(
            student=request.user, is_deleted=False
        ).select_related("quiz")
        return Response(QuizAttemptSerializer(qs, many=True).data)


# ── Student Progress ──────────────────────────────────────────────────────────


@require_module("auto_education")
class StudentProgressListView(APIView):
    """Get progress records. Teachers/admins see all, students see own."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _school_qs(StudentProgress, request.user)

        if request.user.role == "STUDENT":
            qs = qs.filter(student=request.user)
        elif request.user.role == "PARENT":
            student_id = request.query_params.get("student")
            if student_id:
                qs = qs.filter(student_id=student_id)
            else:
                return Response([])

        student = request.query_params.get("student")
        if student and request.user.role not in ("STUDENT", "PARENT"):
            qs = qs.filter(student_id=student)
        subject = request.query_params.get("subject")
        if subject:
            qs = qs.filter(subject_id=subject)

        return Response(StudentProgressSerializer(qs, many=True).data)


@require_module("auto_education")
class StudentProgressDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            obj = StudentProgress.objects.get(pk=pk, is_deleted=False)
        except StudentProgress.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if request.user.role == "STUDENT" and obj.student != request.user:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(StudentProgressSerializer(obj).data)


# ── Analytics ─────────────────────────────────────────────────────────────────


@require_module("auto_education")
class ElearningAnalyticsView(APIView):
    """
    Analytics dashboard data:
    - Quiz success rates per question
    - Class averages
    - Resource usage stats
    - Correlation hints
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user) and request.user.role != "TEACHER":
            return Response(status=status.HTTP_403_FORBIDDEN)

        school = request.user.school

        # Overall stats
        total_resources = DigitalResource.objects.filter(
            school=school, is_deleted=False
        ).count()
        total_exams = ExamBank.objects.filter(school=school, is_deleted=False).count()
        total_quizzes = Quiz.objects.filter(school=school, is_deleted=False).count()
        total_attempts = QuizAttempt.objects.filter(
            school=school, is_deleted=False
        ).count()

        # Most popular resources
        popular_resources = list(
            DigitalResource.objects.filter(school=school, is_deleted=False)
            .order_by("-view_count")[:10]
            .values("id", "title", "resource_type", "view_count", "download_count")
        )

        # Quiz pass rates
        quiz_stats = list(
            Quiz.objects.filter(school=school, is_deleted=False, is_published=True)
            .annotate(
                attempt_count=Count("attempts"),
                pass_count=Count("attempts", filter=Q(attempts__passed=True)),
                avg_score=Avg("attempts__score"),
            )
            .values("id", "title", "attempt_count", "pass_count", "avg_score")[:20]
        )

        # Per-question difficulty (across all quizzes)
        quiz_id = request.query_params.get("quiz")
        question_stats = []
        if quiz_id:
            questions = QuizQuestion.objects.filter(
                quiz_id=quiz_id, is_deleted=False
            ).order_by("order")
            for q in questions:
                attempts_with_q = QuizAttempt.objects.filter(
                    quiz_id=quiz_id
                ).values_list("answers", flat=True)
                total = 0
                correct = 0
                q_id = str(q.id)
                for answers in attempts_with_q:
                    if q_id in answers:
                        total += 1
                        if answers[q_id].get("is_correct"):
                            correct += 1
                question_stats.append(
                    {
                        "question_id": str(q.id),
                        "order": q.order,
                        "text": q.text[:100],
                        "total_answers": total,
                        "correct_answers": correct,
                        "success_rate": round(correct / total * 100, 1)
                        if total > 0
                        else 0,
                    }
                )

        # Class averages
        class_averages = list(
            QuizAttempt.objects.filter(school=school, is_deleted=False)
            .values("quiz__title", "quiz__id")
            .annotate(avg=Avg("score"), count=Count("id"))
            .order_by("-avg")[:20]
        )

        # Top resource usage by subject
        resource_by_subject = list(
            DigitalResource.objects.filter(
                school=school, is_deleted=False, subject__isnull=False
            )
            .values("subject__name")
            .annotate(
                total_views=Sum("view_count"),
                total_downloads=Sum("download_count"),
                count=Count("id"),
            )
            .order_by("-total_views")
        )

        return Response(
            {
                "total_resources": total_resources,
                "total_exams": total_exams,
                "total_quizzes": total_quizzes,
                "total_attempts": total_attempts,
                "popular_resources": popular_resources,
                "quiz_stats": quiz_stats,
                "question_stats": question_stats,
                "class_averages": class_averages,
                "resource_by_subject": resource_by_subject,
            }
        )
