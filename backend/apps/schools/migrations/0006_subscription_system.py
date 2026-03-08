"""
Migration: Add subscription system models.

Creates:
  - school_subscriptions table (SchoolSubscription)
  - module_activation_logs table (ModuleActivationLog)
  - subscription_invoices table (SubscriptionInvoice)
  - super_admin_impersonation_logs table (SuperAdminImpersonationLog)
  - Creates a default SchoolSubscription for every existing School
    with all modules enabled and is_active=True.
"""

import uuid
from decimal import Decimal

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


def create_default_subscriptions(apps, schema_editor):
    """Create a SchoolSubscription for every existing School."""
    School = apps.get_model("schools", "School")
    SchoolSubscription = apps.get_model("schools", "SchoolSubscription")

    for school in School.objects.filter(is_deleted=False):
        if not SchoolSubscription.objects.filter(school=school).exists():
            SchoolSubscription.objects.create(
                id=uuid.uuid4(),
                school=school,
                is_active=school.subscription_active,
                plan_name=school.subscription_plan or "STARTER",
                subscription_start=school.subscription_start
                or django.utils.timezone.now().date(),
                subscription_end=school.subscription_end,
                max_students=school.max_students or 500,
                module_pedagogique=True,
                module_empreintes=True,
                module_finance=True,
                module_cantine=True,
                module_transport=True,
                module_auto_education=True,
                module_sms=True,
                module_bibliotheque=True,
                module_infirmerie=True,
                module_mobile_apps=True,
                module_ai_chatbot=True,
                monthly_total=Decimal("0.00"),
                activation_log=[],
            )


def reverse_subscriptions(apps, schema_editor):
    SchoolSubscription = apps.get_model("schools", "SchoolSubscription")
    SchoolSubscription.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("schools", "0005_add_absence_alert_threshold"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── SchoolSubscription ──
        migrations.CreateModel(
            name="SchoolSubscription",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("plan_name", models.CharField(default="STARTER", max_length=50)),
                (
                    "subscription_start",
                    models.DateField(default=django.utils.timezone.now),
                ),
                ("subscription_end", models.DateField(blank=True, null=True)),
                ("max_students", models.IntegerField(default=500)),
                ("suspension_reason", models.TextField(blank=True)),
                (
                    "module_pedagogique",
                    models.BooleanField(
                        default=True, help_text="Core module — always active"
                    ),
                ),
                ("module_empreintes", models.BooleanField(default=False)),
                ("module_finance", models.BooleanField(default=False)),
                ("module_cantine", models.BooleanField(default=False)),
                ("module_transport", models.BooleanField(default=False)),
                ("module_auto_education", models.BooleanField(default=False)),
                ("module_sms", models.BooleanField(default=False)),
                ("module_bibliotheque", models.BooleanField(default=False)),
                ("module_infirmerie", models.BooleanField(default=False)),
                ("module_mobile_apps", models.BooleanField(default=False)),
                ("module_ai_chatbot", models.BooleanField(default=False)),
                (
                    "monthly_total",
                    models.DecimalField(
                        decimal_places=2, default=Decimal("0.00"), max_digits=10
                    ),
                ),
                (
                    "activation_log",
                    models.JSONField(
                        blank=True,
                        default=list,
                        help_text="History of module activations/deactivations",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "school",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="subscription",
                        to="schools.school",
                    ),
                ),
            ],
            options={
                "db_table": "school_subscriptions",
            },
        ),
        # ── ModuleActivationLog ──
        migrations.CreateModel(
            name="ModuleActivationLog",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("module_name", models.CharField(max_length=50)),
                (
                    "action",
                    models.CharField(
                        choices=[
                            ("ACTIVATED", "Activated"),
                            ("DEACTIVATED", "Deactivated"),
                        ],
                        max_length=15,
                    ),
                ),
                ("reason", models.TextField(blank=True)),
                (
                    "prorata_amount",
                    models.DecimalField(
                        decimal_places=2, default=Decimal("0.00"), max_digits=10
                    ),
                ),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="module_logs",
                        to="schools.school",
                    ),
                ),
                (
                    "activated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="module_activation_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "module_activation_logs",
                "ordering": ["-created_at"],
            },
        ),
        # ── SubscriptionInvoice ──
        migrations.CreateModel(
            name="SubscriptionInvoice",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("invoice_number", models.CharField(max_length=50, unique=True)),
                ("period_start", models.DateField()),
                ("period_end", models.DateField()),
                ("amount", models.DecimalField(decimal_places=2, max_digits=10)),
                (
                    "tax_amount",
                    models.DecimalField(
                        decimal_places=2, default=Decimal("0.00"), max_digits=10
                    ),
                ),
                ("total_amount", models.DecimalField(decimal_places=2, max_digits=10)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("DRAFT", "Brouillon"),
                            ("SENT", "Envoyée"),
                            ("PAID", "Payée"),
                            ("OVERDUE", "En retard"),
                            ("CANCELLED", "Annulée"),
                        ],
                        default="DRAFT",
                        max_length=15,
                    ),
                ),
                (
                    "line_items",
                    models.JSONField(
                        default=list, help_text="Breakdown of charges per module"
                    ),
                ),
                ("notes", models.TextField(blank=True)),
                ("paid_at", models.DateTimeField(blank=True, null=True)),
                ("due_date", models.DateField(blank=True, null=True)),
                (
                    "pdf_file",
                    models.FileField(blank=True, null=True, upload_to="invoices/"),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="invoices",
                        to="schools.school",
                    ),
                ),
                (
                    "generated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="generated_invoices",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "subscription_invoices",
                "ordering": ["-created_at"],
            },
        ),
        # ── SuperAdminImpersonationLog ──
        migrations.CreateModel(
            name="SuperAdminImpersonationLog",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("action", models.CharField(max_length=50)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.TextField(blank=True)),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                (
                    "super_admin",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="impersonation_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "target_school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="impersonation_logs",
                        to="schools.school",
                    ),
                ),
                (
                    "target_user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="impersonated_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "super_admin_impersonation_logs",
                "ordering": ["-started_at"],
            },
        ),
        # ── Data migration: create default subscriptions ──
        migrations.RunPython(
            create_default_subscriptions,
            reverse_subscriptions,
        ),
    ]
