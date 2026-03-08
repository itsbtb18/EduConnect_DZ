from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "grades"

router = DefaultRouter()
router.register("exam-types", views.ExamTypeViewSet, basename="exam-type")

urlpatterns = [
    # ── ExamType CRUD (via router) ──────────────────────────────────────
    path("", include(router.urls)),
    # ── Grades ──────────────────────────────────────────────────────────
    path("bulk-enter/", views.GradeBulkEnterView.as_view(), name="grade-bulk-enter"),
    path("list/", views.GradeListView.as_view(), name="grade-list"),
    path("publish/", views.GradePublishView.as_view(), name="grade-publish"),
    path("submit/", views.GradeSubmitView.as_view(), name="grade-submit"),
    path("return/", views.GradeReturnView.as_view(), name="grade-return"),
    path(
        "workflow-status/",
        views.GradeWorkflowStatusView.as_view(),
        name="grade-workflow-status",
    ),
    path("<uuid:pk>/correct/", views.GradeCorrectView.as_view(), name="grade-correct"),
    # ── Student Averages ────────────────────────────────────────────────
    path(
        "students/<uuid:student_id>/averages/",
        views.StudentAveragesView.as_view(),
        name="student-averages",
    ),
    # ── Subject Averages ────────────────────────────────────────────────
    path(
        "subject-averages/",
        views.SubjectAverageListView.as_view(),
        name="subject-average-list",
    ),
    path(
        "subject-averages/recalculate/",
        views.SubjectAverageRecalculateView.as_view(),
        name="subject-average-recalculate",
    ),
    path(
        "subject-averages/override/",
        views.SubjectAverageOverrideView.as_view(),
        name="subject-average-override",
    ),
    path(
        "subject-averages/publish/",
        views.SubjectAveragePublishView.as_view(),
        name="subject-average-publish",
    ),
    # ── Trimester Averages ──────────────────────────────────────────────
    path(
        "trimester-averages/",
        views.TrimesterAverageListView.as_view(),
        name="trimester-average-list",
    ),
    path(
        "trimester-averages/recalculate/",
        views.TrimesterRecalculateView.as_view(),
        name="trimester-average-recalculate",
    ),
    path(
        "trimester-averages/override/",
        views.TrimesterOverrideView.as_view(),
        name="trimester-average-override",
    ),
    path(
        "trimester-averages/publish/",
        views.TrimesterPublishView.as_view(),
        name="trimester-average-publish",
    ),
    path(
        "trimester-averages/lock/",
        views.TrimesterLockView.as_view(),
        name="trimester-average-lock",
    ),
    path(
        "trimester-averages/unlock/",
        views.TrimesterUnlockView.as_view(),
        name="trimester-average-unlock",
    ),
    # ── Trimester Config ────────────────────────────────────────────────
    path(
        "trimester-config/",
        views.TrimesterConfigView.as_view(),
        name="trimester-config",
    ),
    # ── CSV Import ──────────────────────────────────────────────────────
    path(
        "csv-import/preview/",
        views.CSVImportPreviewView.as_view(),
        name="csv-import-preview",
    ),
    path(
        "csv-import/confirm/",
        views.CSVImportConfirmView.as_view(),
        name="csv-import-confirm",
    ),
    # ── Grade Appeals ───────────────────────────────────────────────────
    path("appeals/", views.GradeAppealCreateView.as_view(), name="appeal-create"),
    path("appeals/list/", views.GradeAppealListView.as_view(), name="appeal-list"),
    path(
        "appeals/pending-count/",
        views.GradeAppealPendingCountView.as_view(),
        name="appeal-pending-count",
    ),
    path(
        "appeals/<uuid:pk>/respond/",
        views.GradeAppealRespondView.as_view(),
        name="appeal-respond",
    ),
    # ── Audit Log ───────────────────────────────────────────────────────
    path("audit-log/", views.GradeAuditLogView.as_view(), name="audit-log"),
    # ── Report Card Templates ──────────────────────────────────────────
    path(
        "report-card-templates/",
        views.ReportCardTemplateListCreateView.as_view(),
        name="report-card-template-list",
    ),
    path(
        "report-card-templates/<uuid:pk>/",
        views.ReportCardTemplateDetailView.as_view(),
        name="report-card-template-detail",
    ),
    # ── Report Card Generation ─────────────────────────────────────────
    path(
        "report-cards/generate-class/",
        views.GenerateClassReportCardsView.as_view(),
        name="report-cards-generate-class",
    ),
    path(
        "report-cards/generate-school/",
        views.GenerateSchoolReportCardsView.as_view(),
        name="report-cards-generate-school",
    ),
    path(
        "report-cards/progress/<str:task_id>/",
        views.ReportCardProgressView.as_view(),
        name="report-cards-progress",
    ),
    # ── Grade Analytics ────────────────────────────────────────────────
    path(
        "analytics/",
        views.GradeAnalyticsView.as_view(),
        name="grade-analytics",
    ),
    # ── MEN Official Export ────────────────────────────────────────────
    path(
        "men-export/",
        views.MENExportView.as_view(),
        name="men-export",
    ),
]
