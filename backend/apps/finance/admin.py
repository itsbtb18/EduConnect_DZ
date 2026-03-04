from django.contrib import admin
from .models import FeeStructure, StudentPayment


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "academic_year",
        "amount_monthly",
        "amount_trimester",
        "amount_annual",
    )
    list_filter = ("academic_year",)


@admin.register(StudentPayment)
class StudentPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "fee_structure",
        "amount_paid",
        "payment_method",
        "status",
        "payment_date",
        "receipt_number",
    )
    list_filter = ("status", "payment_method", "payment_type")
    search_fields = ("student__first_name", "student__last_name", "receipt_number")
