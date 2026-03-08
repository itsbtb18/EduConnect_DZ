"""
Models for the Schools app.
All models include soft delete (is_deleted, deleted_at) and audit fields (created_by, created_at, updated_at).
"""

import uuid
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


def validate_school_logo(image):
    """Validate that the school logo is PNG, JPG or JPEG and under 2MB."""
    if image.size > 2 * 1024 * 1024:
        raise ValidationError("Logo must be under 2MB.")
    allowed_extensions = (".png", ".jpg", ".jpeg")
    if not image.name.lower().endswith(allowed_extensions):
        raise ValidationError("Logo must be a PNG, JPG or JPEG file.")


class School(models.Model):
    """Represents a school (tenant) in the multi-tenant system."""

    class SubscriptionPlan(models.TextChoices):
        STARTER = "STARTER", "Starter"
        PRO = "PRO", "Pro"
        PRO_AI = "PRO_AI", "Pro + AI"

    class SchoolCategory(models.TextChoices):
        PRIVATE_SCHOOL = "PRIVATE_SCHOOL", "École Privée"
        TRAINING_CENTER = "TRAINING_CENTER", "Centre de Formation"

    class TrainingType(models.TextChoices):
        SUPPORT_COURSES = "SUPPORT_COURSES", "Cours de Soutien Scolaire"
        LANGUAGES = "LANGUAGES", "École de Langues"
        PROFESSIONAL = "PROFESSIONAL", "Formation Professionnelle"
        EXAM_PREP = "EXAM_PREP", "Préparation aux Examens (BEM/BAC)"
        COMPUTING = "COMPUTING", "Informatique & Bureautique"
        OTHER = "OTHER", "Autre"

    # ── Identity ──
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    logo = models.ImageField(
        upload_to="schools/logos/",
        blank=True,
        null=True,
        validators=[validate_school_logo],
    )
    address = models.TextField(blank=True)
    wilaya = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.CharField(max_length=200, blank=True)
    motto = models.CharField(max_length=300, blank=True)
    subdomain = models.CharField(max_length=63, unique=True)

    # ── School Category ──
    school_category = models.CharField(
        max_length=20,
        choices=SchoolCategory.choices,
        default=SchoolCategory.PRIVATE_SCHOOL,
    )

    # Sections (only for PRIVATE_SCHOOL)
    has_primary = models.BooleanField(default=False)
    has_middle = models.BooleanField(default=False)
    has_high = models.BooleanField(default=False)

    # Lycée streams / filières (only relevant when has_high=True)
    available_streams = models.JSONField(
        default=list,
        blank=True,
        help_text="List of stream codes available at this school, e.g. ['TC_SCI','SE','MATH']",
    )

    # Training type (only for TRAINING_CENTER)
    training_type = models.CharField(
        max_length=30,
        choices=TrainingType.choices,
        blank=True,
        null=True,
    )

    # ── Subscription ──
    subscription_plan = models.CharField(
        max_length=20,
        choices=SubscriptionPlan.choices,
        default=SubscriptionPlan.STARTER,
    )
    subscription_active = models.BooleanField(default=True)
    subscription_start = models.DateField(blank=True, null=True)
    subscription_end = models.DateField(blank=True, null=True)
    max_students = models.IntegerField(default=500)

    # ── Attendance thresholds ──
    absence_alert_threshold = models.PositiveIntegerField(
        default=5,
        help_text="Number of monthly unjustified absences that trigger a chronic-absenteeism alert.",
    )

    # ── Status ──
    is_active = models.BooleanField(default=True)
    setup_completed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    # ── Soft delete ──
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    # ── Audit ──
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_schools",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "schools"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def clean(self):
        """Category-driven validation."""
        if self.school_category == self.SchoolCategory.PRIVATE_SCHOOL:
            if not any([self.has_primary, self.has_middle, self.has_high]):
                raise ValidationError(
                    "A private school must have at least one section enabled "
                    "(Primary, Middle, or High School)."
                )
        if self.school_category == self.SchoolCategory.TRAINING_CENTER:
            # Clear section flags for training centers
            self.has_primary = False
            self.has_middle = False
            self.has_high = False
            if not self.training_type:
                raise ValidationError("Please specify the type of training center.")

    def soft_delete(self):
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])


class Section(models.Model):
    """Represents a section (Primary / Middle / High) within a school."""

    class SectionType(models.TextChoices):
        PRIMARY = "PRIMARY", "Primary"
        MIDDLE = "MIDDLE", "Middle"
        HIGH = "HIGH", "High"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name="sections"
    )
    section_type = models.CharField(max_length=10, choices=SectionType.choices)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    # Audit
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_sections",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sections"
        unique_together = ["school", "section_type"]
        ordering = ["school", "section_type"]

    def __str__(self):
        return f"{self.school.name} — {self.name}"

    def soft_delete(self):
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])


# ── Module name constants ──
MODULE_FIELDS = [
    "module_pedagogique",
    "module_empreintes",
    "module_finance",
    "module_cantine",
    "module_transport",
    "module_auto_education",
    "module_sms",
    "module_bibliotheque",
    "module_infirmerie",
    "module_mobile_apps",
    "module_ai_chatbot",
]

# Map from module slug (used in URLs/decorator) to field name
MODULE_SLUG_TO_FIELD = {
    "pedagogique": "module_pedagogique",
    "empreintes": "module_empreintes",
    "finance": "module_finance",
    "cantine": "module_cantine",
    "transport": "module_transport",
    "auto_education": "module_auto_education",
    "sms": "module_sms",
    "bibliotheque": "module_bibliotheque",
    "infirmerie": "module_infirmerie",
    "mobile_apps": "module_mobile_apps",
    "ai_chatbot": "module_ai_chatbot",
}

# Map from Django app label to module slug
APP_TO_MODULE = {
    "canteen": "cantine",
    "transport": "transport",
    "library": "bibliotheque",
    "fingerprint": "empreintes",
    "finance": "finance",
    "ai_chatbot": "ai_chatbot",
    "discipline": "pedagogique",  # discipline is part of core pedagogy
}


class SchoolSubscription(models.Model):
    """
    Represents a school's subscription — which modules are activated,
    billing dates, and student limits.

    module_pedagogique is always True (core module, cannot be deactivated).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.OneToOneField(
        School, on_delete=models.CASCADE, related_name="subscription"
    )

    # ── Subscription status ──
    is_active = models.BooleanField(default=True)
    plan_name = models.CharField(max_length=50, default="STARTER")
    subscription_start = models.DateField(default=timezone.now)
    subscription_end = models.DateField(blank=True, null=True)
    max_students = models.IntegerField(default=500)
    suspension_reason = models.TextField(blank=True)

    # ── Module flags ──
    module_pedagogique = models.BooleanField(
        default=True, help_text="Core module — always active"
    )
    module_empreintes = models.BooleanField(default=False)
    module_finance = models.BooleanField(default=False)
    module_cantine = models.BooleanField(default=False)
    module_transport = models.BooleanField(default=False)
    module_auto_education = models.BooleanField(default=False)
    module_sms = models.BooleanField(default=False)
    module_bibliotheque = models.BooleanField(default=False)
    module_infirmerie = models.BooleanField(default=False)
    module_mobile_apps = models.BooleanField(default=False)
    module_ai_chatbot = models.BooleanField(default=False)

    # ── Pricing (DA/month per module) ──
    monthly_total = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )

    # ── Activation log ──
    activation_log = models.JSONField(
        default=list,
        blank=True,
        help_text="History of module activations/deactivations",
    )

    # ── Audit ──
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "school_subscriptions"

    def __str__(self):
        return f"{self.school.name} — {self.plan_name}"

    # Modules unavailable for training centers
    TRAINING_CENTER_EXCLUDED_MODULES = {
        "cantine",
        "transport",
        "bibliotheque",
        "infirmerie",
    }

    def save(self, *args, **kwargs):
        # module_pedagogique is always True
        self.module_pedagogique = True

        # Training centers cannot have excluded modules
        if self.school.school_category == "TRAINING_CENTER":
            for slug in self.TRAINING_CENTER_EXCLUDED_MODULES:
                field = MODULE_SLUG_TO_FIELD.get(slug)
                if field:
                    setattr(self, field, False)

        super().save(*args, **kwargs)

    def is_module_active(self, module_slug: str) -> bool:
        """Check if a module is active by its slug."""
        # Training centers cannot access excluded modules
        if (
            self.school.school_category == "TRAINING_CENTER"
            and module_slug in self.TRAINING_CENTER_EXCLUDED_MODULES
        ):
            return False

        field_name = MODULE_SLUG_TO_FIELD.get(module_slug)
        if not field_name:
            return False
        return bool(getattr(self, field_name, False))

    def get_active_modules(self) -> list[str]:
        """Return a list of active module slugs."""
        excluded = (
            self.TRAINING_CENTER_EXCLUDED_MODULES
            if self.school.school_category == "TRAINING_CENTER"
            else set()
        )
        return [
            slug
            for slug, field in MODULE_SLUG_TO_FIELD.items()
            if getattr(self, field, False) and slug not in excluded
        ]


class ModuleActivationLog(models.Model):
    """Log each module activation/deactivation event."""

    class Action(models.TextChoices):
        ACTIVATED = "ACTIVATED", "Activated"
        DEACTIVATED = "DEACTIVATED", "Deactivated"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name="module_logs"
    )
    module_name = models.CharField(max_length=50)
    action = models.CharField(max_length=15, choices=Action.choices)
    activated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="module_activation_logs",
    )
    reason = models.TextField(blank=True)
    prorata_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "module_activation_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.school.name} — {self.module_name} — {self.action}"


class SubscriptionInvoice(models.Model):
    """Invoice generated for a school's subscription."""

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Brouillon"
        SENT = "SENT", "Envoyée"
        PAID = "PAID", "Payée"
        OVERDUE = "OVERDUE", "En retard"
        CANCELLED = "CANCELLED", "Annulée"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name="invoices"
    )
    invoice_number = models.CharField(max_length=50, unique=True)
    period_start = models.DateField()
    period_end = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.DRAFT
    )
    line_items = models.JSONField(
        default=list, help_text="Breakdown of charges per module"
    )
    notes = models.TextField(blank=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    pdf_file = models.FileField(upload_to="invoices/", blank=True, null=True)
    generated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generated_invoices",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "subscription_invoices"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Facture {self.invoice_number} — {self.school.name}"


class SuperAdminImpersonationLog(models.Model):
    """Log when a super admin impersonates a school admin."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    super_admin = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="impersonation_logs",
    )
    target_school = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name="impersonation_logs"
    )
    target_user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="impersonated_logs",
    )
    action = models.CharField(max_length=50)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "super_admin_impersonation_logs"
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.super_admin} → {self.target_school.name}"


class ContentResource(models.Model):
    """Educational content resources managed by Super Admin (BEP/BEM/BAC exams, textbooks)."""

    class Category(models.TextChoices):
        BEP = "BEP", "BEP"
        BEM = "BEM", "BEM"
        BAC = "BAC", "BAC"
        TEXTBOOK = "TEXTBOOK", "Manuel scolaire"
        GUIDE = "GUIDE", "Guide pédagogique"
        OTHER = "OTHER", "Autre"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=Category.choices)
    subject = models.CharField(max_length=100, blank=True)
    level = models.CharField(
        max_length=50,
        blank=True,
        help_text="e.g. 1AS, 2AS, 3AS, 4AM, 5AP",
    )
    year = models.CharField(max_length=10, blank=True, help_text="e.g. 2024, 2023")
    file = models.FileField(upload_to="content/resources/", blank=True, null=True)
    file_url = models.URLField(blank=True, help_text="External URL if no file uploaded")
    thumbnail = models.ImageField(
        upload_to="content/thumbnails/", blank=True, null=True
    )
    is_published = models.BooleanField(default=True)
    download_count = models.PositiveIntegerField(default=0)

    uploaded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_content",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "content_resources"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.category} — {self.title}"


class AcademicYear(models.Model):
    """Represents an academic year for a school section."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name="academic_years"
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        related_name="academic_years",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=20, help_text="e.g. 2025-2026")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=True)

    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    # Audit
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_academic_years",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "academic_years"
        ordering = ["-start_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "section", "name"],
                name="unique_school_section_year",
                condition=models.Q(section__isnull=False),
            ),
            models.UniqueConstraint(
                fields=["school", "name"],
                name="unique_school_year_no_section",
                condition=models.Q(section__isnull=True),
            ),
        ]

    def __str__(self):
        section_name = self.section.name if self.section else "Global"
        return f"{self.school.name} — {section_name} — {self.name}"

    def soft_delete(self):
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])
