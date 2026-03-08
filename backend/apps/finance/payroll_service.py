"""
Payroll service — payslip computation & PDF generation via WeasyPrint.
"""

import datetime
import logging
from decimal import Decimal

from django.db.models import Sum
from django.template.loader import render_to_string
from django.utils import timezone
from weasyprint import HTML

logger = logging.getLogger(__name__)

# Working days per month (Algeria standard)
WORKING_DAYS_PER_MONTH = 22


def compute_payslip(config, month, year, school):
    """
    Compute and create a PaySlip for the given teacher config, month, year.

    Steps:
    1. Start from base_salary.
    2. Sum approved overtime hours → overtime_amount.
    3. Count approved unpaid leave days → leave_deduction.
    4. gross = base + overtime - leave_deduction
    5. Apply all active deductions on gross.
    6. net = gross - total_deductions
    """
    from .models import Deduction, LeaveRecord, OvertimeRecord, PaySlip

    teacher = config.teacher
    base_salary = config.base_salary

    # ── Overtime ─────────────────────────────────────────────────────────
    overtime_agg = OvertimeRecord.objects.filter(
        teacher=teacher,
        school=school,
        date__year=year,
        date__month=month,
        approved=True,
        is_deleted=False,
    ).aggregate(total_hours=Sum("hours"))
    overtime_hours = overtime_agg["total_hours"] or Decimal("0")
    overtime_amount = overtime_hours * config.hourly_rate

    # ── Leave (unpaid only) ──────────────────────────────────────────────
    unpaid_leaves = LeaveRecord.objects.filter(
        teacher=teacher,
        school=school,
        leave_type=LeaveRecord.LeaveType.UNPAID,
        status=LeaveRecord.LeaveStatus.APPROVED,
        start_date__year=year,
        start_date__month=month,
        is_deleted=False,
    )
    leave_days_unpaid = 0
    for leave in unpaid_leaves:
        # Count only days that fall within this month
        month_start = datetime.date(year, month, 1)
        if month == 12:
            month_end = datetime.date(year + 1, 1, 1) - datetime.timedelta(days=1)
        else:
            month_end = datetime.date(year, month + 1, 1) - datetime.timedelta(days=1)
        effective_start = max(leave.start_date, month_start)
        effective_end = min(leave.end_date, month_end)
        days = (effective_end - effective_start).days + 1
        if days > 0:
            leave_days_unpaid += days

    daily_rate = base_salary / Decimal(str(WORKING_DAYS_PER_MONTH))
    leave_deduction = round(daily_rate * Decimal(str(leave_days_unpaid)), 2)

    # ── Gross ────────────────────────────────────────────────────────────
    gross_salary = round(base_salary + overtime_amount - leave_deduction, 2)

    # ── Deductions ───────────────────────────────────────────────────────
    active_deductions = Deduction.objects.filter(
        school=school, is_active=True, is_deleted=False
    )
    deductions_detail = []
    total_deductions = Decimal("0")
    for d in active_deductions:
        amount = d.compute(gross_salary)
        deductions_detail.append({"name": d.name, "amount": str(amount)})
        total_deductions += amount

    # ── Salary Advance Deduction ──────────────────────────────────────────
    from .models import SalaryAdvance

    active_advances = SalaryAdvance.objects.filter(
        teacher=teacher,
        school=school,
        status=SalaryAdvance.AdvanceStatus.APPROVED,
        remaining__gt=0,
        is_deleted=False,
    )
    advance_total = Decimal("0")
    for adv in active_advances:
        deduct = min(adv.monthly_deduction, adv.remaining)
        if deduct > 0:
            advance_total += deduct
            adv.remaining -= deduct
            if adv.remaining <= 0:
                adv.remaining = 0
                adv.status = SalaryAdvance.AdvanceStatus.REPAID
            adv.save(update_fields=["remaining", "status", "updated_at"])

    if advance_total > 0:
        deductions_detail.append(
            {
                "name": "Avance sur salaire",
                "amount": str(advance_total),
            }
        )
        total_deductions += advance_total

    # ── Net ───────────────────────────────────────────────────────────────
    net_salary = round(gross_salary - total_deductions, 2)

    # ── Create PaySlip ────────────────────────────────────────────────────
    payslip = PaySlip.objects.create(
        school=school,
        teacher=teacher,
        month=month,
        year=year,
        base_salary=base_salary,
        overtime_hours=overtime_hours,
        overtime_amount=overtime_amount,
        leave_days_unpaid=leave_days_unpaid,
        leave_deduction=leave_deduction,
        gross_salary=gross_salary,
        deductions_detail=deductions_detail,
        total_deductions=total_deductions,
        net_salary=net_salary,
    )
    return payslip


def generate_payslip_pdf(payslip) -> bytes:
    """
    Render the payslip HTML template and convert to PDF bytes
    using WeasyPrint.
    """
    MONTHS_FR = {
        1: "Janvier",
        2: "Février",
        3: "Mars",
        4: "Avril",
        5: "Mai",
        6: "Juin",
        7: "Juillet",
        8: "Août",
        9: "Septembre",
        10: "Octobre",
        11: "Novembre",
        12: "Décembre",
    }

    teacher = payslip.teacher
    school = payslip.school
    config = getattr(teacher, "salary_config", None)

    context = {
        "payslip": payslip,
        "teacher": teacher,
        "school": school,
        "config": config,
        "period": f"{MONTHS_FR.get(payslip.month, '')} {payslip.year}",
        "generated_at": timezone.now(),
    }

    html_string = render_to_string("finance/payslip.html", context)
    pdf_bytes = HTML(string=html_string).write_pdf()
    return pdf_bytes
