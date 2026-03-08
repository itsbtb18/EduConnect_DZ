"""
E-Learning URL patterns.
"""

from django.urls import path

from . import views

urlpatterns = [
    # ── Digital Resources ──
    path(
        "resources/",
        views.ResourceListCreateView.as_view(),
        name="elearning-resource-list",
    ),
    path(
        "resources/<uuid:pk>/",
        views.ResourceDetailView.as_view(),
        name="elearning-resource-detail",
    ),
    path(
        "resources/<uuid:pk>/favourite/",
        views.ResourceFavouriteView.as_view(),
        name="elearning-resource-favourite",
    ),
    path(
        "resources/<uuid:pk>/download/",
        views.ResourceDownloadView.as_view(),
        name="elearning-resource-download",
    ),
    # ── Exam Bank ──
    path("exams/", views.ExamBankListCreateView.as_view(), name="elearning-exam-list"),
    path(
        "exams/<uuid:pk>/",
        views.ExamBankDetailView.as_view(),
        name="elearning-exam-detail",
    ),
    path(
        "exams/<uuid:pk>/download/",
        views.ExamBankDownloadView.as_view(),
        name="elearning-exam-download",
    ),
    # ── Quizzes ──
    path("quizzes/", views.QuizListCreateView.as_view(), name="elearning-quiz-list"),
    path(
        "quizzes/<uuid:pk>/",
        views.QuizDetailView.as_view(),
        name="elearning-quiz-detail",
    ),
    path(
        "quizzes/<uuid:pk>/questions/",
        views.QuizQuestionListCreateView.as_view(),
        name="elearning-quiz-questions",
    ),
    path(
        "quizzes/<uuid:pk>/questions/<uuid:question_pk>/",
        views.QuizQuestionDetailView.as_view(),
        name="elearning-quiz-question-detail",
    ),
    path(
        "quizzes/<uuid:pk>/submit/",
        views.QuizSubmitView.as_view(),
        name="elearning-quiz-submit",
    ),
    path(
        "quizzes/<uuid:pk>/attempts/",
        views.QuizAttemptsView.as_view(),
        name="elearning-quiz-attempts",
    ),
    # ── Attempts ──
    path(
        "my-attempts/", views.MyQuizAttemptsView.as_view(), name="elearning-my-attempts"
    ),
    # ── Student Progress ──
    path(
        "progress/",
        views.StudentProgressListView.as_view(),
        name="elearning-progress-list",
    ),
    path(
        "progress/<uuid:pk>/",
        views.StudentProgressDetailView.as_view(),
        name="elearning-progress-detail",
    ),
    # ── Analytics ──
    path(
        "analytics/", views.ElearningAnalyticsView.as_view(), name="elearning-analytics"
    ),
]
