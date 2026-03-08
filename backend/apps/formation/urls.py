from django.urls import path

from . import views

app_name = "formation"

urlpatterns = [
    # ─── Dashboard ───────────────────────────────────────────
    path(
        "dashboard/",
        views.FormationDashboardView.as_view(),
        name="dashboard",
    ),
    # ─── Terminology ─────────────────────────────────────────
    path(
        "terminology/",
        views.TerminologyView.as_view(),
        name="terminology",
    ),
    # ─── Available modules ───────────────────────────────────
    path(
        "modules/",
        views.AvailableModulesView.as_view(),
        name="available-modules",
    ),
    # ─── Schedule conflict check ─────────────────────────────
    path(
        "schedule-conflicts/",
        views.ScheduleConflictCheckView.as_view(),
        name="schedule-conflicts",
    ),
    # ─── Departments ─────────────────────────────────────────
    path(
        "departments/",
        views.DepartmentListCreateView.as_view(),
        name="department-list",
    ),
    path(
        "departments/<uuid:pk>/",
        views.DepartmentDetailView.as_view(),
        name="department-detail",
    ),
    # ─── Formations ──────────────────────────────────────────
    path(
        "formations/",
        views.FormationListCreateView.as_view(),
        name="formation-list",
    ),
    path(
        "formations/<uuid:pk>/",
        views.FormationDetailView.as_view(),
        name="formation-detail",
    ),
    # ─── Training Groups ─────────────────────────────────────
    path(
        "groups/",
        views.TrainingGroupListCreateView.as_view(),
        name="group-list",
    ),
    path(
        "groups/<uuid:pk>/",
        views.TrainingGroupDetailView.as_view(),
        name="group-detail",
    ),
    # ─── Enrollments ─────────────────────────────────────────
    path(
        "enrollments/",
        views.TrainingEnrollmentListCreateView.as_view(),
        name="enrollment-list",
    ),
    path(
        "enrollments/<uuid:pk>/",
        views.TrainingEnrollmentDetailView.as_view(),
        name="enrollment-detail",
    ),
    # ─── Placement Tests ─────────────────────────────────────
    path(
        "placement-tests/",
        views.PlacementTestListCreateView.as_view(),
        name="placement-test-list",
    ),
    path(
        "placement-tests/<uuid:pk>/",
        views.PlacementTestDetailView.as_view(),
        name="placement-test-detail",
    ),
    path(
        "placement-tests/<uuid:pk>/validate/",
        views.PlacementTestValidateView.as_view(),
        name="placement-test-validate",
    ),
    # ─── Training Sessions ───────────────────────────────────
    path(
        "sessions/",
        views.TrainingSessionListCreateView.as_view(),
        name="session-list",
    ),
    path(
        "sessions/<uuid:pk>/",
        views.TrainingSessionDetailView.as_view(),
        name="session-detail",
    ),
    # ─── Session Attendance ──────────────────────────────────
    path(
        "attendance/",
        views.SessionAttendanceListCreateView.as_view(),
        name="attendance-list",
    ),
    path(
        "attendance/bulk/",
        views.BulkSessionAttendanceView.as_view(),
        name="attendance-bulk",
    ),
    # ─── Level Passages ──────────────────────────────────────
    path(
        "level-passages/",
        views.LevelPassageListCreateView.as_view(),
        name="level-passage-list",
    ),
    path(
        "level-passages/<uuid:pk>/",
        views.LevelPassageDetailView.as_view(),
        name="level-passage-detail",
    ),
    path(
        "level-passages/<uuid:pk>/decide/",
        views.LevelPassageDecideView.as_view(),
        name="level-passage-decide",
    ),
    # ─── Certificates ────────────────────────────────────────
    path(
        "certificates/",
        views.CertificateListCreateView.as_view(),
        name="certificate-list",
    ),
    path(
        "certificates/<uuid:pk>/",
        views.CertificateDetailView.as_view(),
        name="certificate-detail",
    ),
    # ─── Formation Finance ───────────────────────────────────
    path(
        "finance/stats/",
        views.FormationFinanceStatsView.as_view(),
        name="finance-stats",
    ),
    path(
        "finance/fee-structures/",
        views.FormationFeeStructureListCreateView.as_view(),
        name="fee-structure-list",
    ),
    path(
        "finance/fee-structures/<uuid:pk>/",
        views.FormationFeeStructureDetailView.as_view(),
        name="fee-structure-detail",
    ),
    path(
        "finance/payments/",
        views.LearnerPaymentListCreateView.as_view(),
        name="payment-list",
    ),
    path(
        "finance/payments/<uuid:pk>/",
        views.LearnerPaymentDetailView.as_view(),
        name="payment-detail",
    ),
    path(
        "finance/discounts/",
        views.DiscountListCreateView.as_view(),
        name="discount-list",
    ),
    path(
        "finance/discounts/<uuid:pk>/",
        views.DiscountDetailView.as_view(),
        name="discount-detail",
    ),
    path(
        "finance/learner-discounts/",
        views.LearnerDiscountListCreateView.as_view(),
        name="learner-discount-list",
    ),
    # ─── Trainer Payroll ─────────────────────────────────────
    path(
        "payroll/salary-configs/",
        views.TrainerSalaryConfigListCreateView.as_view(),
        name="salary-config-list",
    ),
    path(
        "payroll/salary-configs/<uuid:pk>/",
        views.TrainerSalaryConfigDetailView.as_view(),
        name="salary-config-detail",
    ),
    path(
        "payroll/payslips/",
        views.TrainerPaySlipListView.as_view(),
        name="payslip-list",
    ),
    path(
        "payroll/payslips/<uuid:pk>/",
        views.TrainerPaySlipDetailView.as_view(),
        name="payslip-detail",
    ),
    path(
        "payroll/payslips/generate/",
        views.TrainerPaySlipGenerateView.as_view(),
        name="payslip-generate",
    ),
    # ─── Cross-institution (SUPER_ADMIN) ─────────────────────
    path(
        "cross-profiles/",
        views.CrossInstitutionProfileListView.as_view(),
        name="cross-profile-list",
    ),
    path(
        "cross-profiles/<uuid:pk>/",
        views.CrossInstitutionProfileDetailView.as_view(),
        name="cross-profile-detail",
    ),
]
