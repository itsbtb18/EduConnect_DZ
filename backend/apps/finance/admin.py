from django.contrib import admin
from .models import FeeStructure, Payment


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ("name", "target_class", "amount", "academic_year", "due_date")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("student", "fee", "amount", "payment_method", "status", "paid_at")
    list_filter = ("status", "payment_method")
