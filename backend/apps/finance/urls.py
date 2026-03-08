from django.urls import path
from . import views

app_name = "finance"

urlpatterns = [
    # Fee Structures
    path(
        "fee-structures/", views.FeeStructureListCreateView.as_view(), name="fee-list"
    ),
    path(
        "fee-structures/<uuid:pk>/",
        views.FeeStructureDetailView.as_view(),
        name="fee-detail",
    ),
    # Fee Discounts
    path(
        "discounts/",
        views.FeeDiscountListCreateView.as_view(),
        name="discount-list",
    ),
    path(
        "discounts/<uuid:pk>/",
        views.FeeDiscountDetailView.as_view(),
        name="discount-detail",
    ),
    # Late Penalties
    path(
        "penalties/",
        views.LatePenaltyListCreateView.as_view(),
        name="penalty-list",
    ),
    path(
        "penalties/<uuid:pk>/",
        views.LatePenaltyDetailView.as_view(),
        name="penalty-detail",
    ),
    # Registration Deposits
    path(
        "deposits/",
        views.RegistrationDepositListCreateView.as_view(),
        name="deposit-list",
    ),
    path(
        "deposits/<uuid:pk>/",
        views.RegistrationDepositDetailView.as_view(),
        name="deposit-detail",
    ),
    # Extra Fees
    path(
        "extra-fees/",
        views.ExtraFeeListCreateView.as_view(),
        name="extra-fee-list",
    ),
    path(
        "extra-fees/<uuid:pk>/",
        views.ExtraFeeDetailView.as_view(),
        name="extra-fee-detail",
    ),
    # Payments — special endpoints BEFORE <uuid:pk>
    path("payments/stats/", views.PaymentStatsView.as_view(), name="payment-stats"),
    path(
        "payments/expiring-soon/",
        views.PaymentExpiringSoonView.as_view(),
        name="payment-expiring",
    ),
    path(
        "payments/bulk-reminder/",
        views.PaymentBulkReminderView.as_view(),
        name="payment-bulk-reminder",
    ),
    path("payments/report/", views.PaymentReportView.as_view(), name="payment-report"),
    # Payments CRUD
    path("payments/", views.PaymentListCreateView.as_view(), name="payment-list"),
    path(
        "payments/<uuid:pk>/", views.PaymentDetailView.as_view(), name="payment-detail"
    ),
    path(
        "payments/<uuid:pk>/send-reminder/",
        views.PaymentSendReminderView.as_view(),
        name="payment-reminder",
    ),
    path(
        "payments/<uuid:pk>/receipt/",
        views.PaymentReceiptView.as_view(),
        name="payment-receipt",
    ),
    # Student Fee Enrollments
    path(
        "enrollments/stats/",
        views.FeeEnrollmentStatsView.as_view(),
        name="enrollment-stats",
    ),
    path(
        "enrollments/",
        views.FeeEnrollmentListCreateView.as_view(),
        name="enrollment-list",
    ),
    path(
        "enrollments/<uuid:pk>/",
        views.FeeEnrollmentDetailView.as_view(),
        name="enrollment-detail",
    ),
    # ─── Expense Categories ──────────────────────────────────
    path(
        "expense-categories/",
        views.ExpenseCategoryListCreateView.as_view(),
        name="expense-category-list",
    ),
    path(
        "expense-categories/<uuid:pk>/",
        views.ExpenseCategoryDetailView.as_view(),
        name="expense-category-detail",
    ),
    # ─── Expenses ────────────────────────────────────────────
    path("expenses/", views.ExpenseListCreateView.as_view(), name="expense-list"),
    path(
        "expenses/<uuid:pk>/",
        views.ExpenseDetailView.as_view(),
        name="expense-detail",
    ),
    path(
        "expenses/<uuid:pk>/approve/",
        views.ExpenseApproveView.as_view(),
        name="expense-approve",
    ),
    # ─── Annual Budgets ──────────────────────────────────────
    path(
        "budgets/",
        views.AnnualBudgetListCreateView.as_view(),
        name="budget-list",
    ),
    path(
        "budgets/<uuid:pk>/",
        views.AnnualBudgetDetailView.as_view(),
        name="budget-detail",
    ),
    # ─── Payroll: Salary Configs ─────────────────────────────
    path(
        "salary-configs/",
        views.SalaryConfigListCreateView.as_view(),
        name="salary-config-list",
    ),
    path(
        "salary-configs/<uuid:pk>/",
        views.SalaryConfigDetailView.as_view(),
        name="salary-config-detail",
    ),
    # ─── Payroll: Deductions ─────────────────────────────────
    path("deductions/", views.DeductionListCreateView.as_view(), name="deduction-list"),
    path(
        "deductions/<uuid:pk>/",
        views.DeductionDetailView.as_view(),
        name="deduction-detail",
    ),
    # ─── Payroll: Leave Records ──────────────────────────────
    path("leaves/", views.LeaveRecordListCreateView.as_view(), name="leave-list"),
    path(
        "leaves/<uuid:pk>/",
        views.LeaveRecordDetailView.as_view(),
        name="leave-detail",
    ),
    path(
        "leaves/<uuid:pk>/approve/",
        views.LeaveApproveView.as_view(),
        name="leave-approve",
    ),
    # ─── Payroll: Overtime ───────────────────────────────────
    path("overtime/", views.OvertimeRecordListCreateView.as_view(), name="overtime-list"),
    path(
        "overtime/<uuid:pk>/approve/",
        views.OvertimeApproveView.as_view(),
        name="overtime-approve",
    ),
    # ─── Salary Advances ─────────────────────────────────────
    path(
        "advances/",
        views.SalaryAdvanceListCreateView.as_view(),
        name="advance-list",
    ),
    path(
        "advances/<uuid:pk>/approve/",
        views.SalaryAdvanceApproveView.as_view(),
        name="advance-approve",
    ),
    # ─── Payroll: PaySlips ───────────────────────────────────
    path(
        "payslips/generate/",
        views.PaySlipGenerateView.as_view(),
        name="payslip-generate",
    ),
    path(
        "payslips/bulk-generate/",
        views.PaySlipBulkGenerateView.as_view(),
        name="payslip-bulk-generate",
    ),
    path("payslips/stats/", views.PayrollStatsView.as_view(), name="payroll-stats"),
    path("payslips/my/", views.TeacherOwnPaySlipsView.as_view(), name="payslip-my"),
    path("payslips/", views.PaySlipListView.as_view(), name="payslip-list"),
    path(
        "payslips/<uuid:pk>/",
        views.PaySlipDetailView.as_view(),
        name="payslip-detail",
    ),
    path(
        "payslips/<uuid:pk>/pdf/",
        views.PaySlipPDFView.as_view(),
        name="payslip-pdf",
    ),
    # ─── Financial Reports ───────────────────────────────────
    path(
        "reports/",
        views.FinancialReportView.as_view(),
        name="financial-reports",
    ),
]
]
