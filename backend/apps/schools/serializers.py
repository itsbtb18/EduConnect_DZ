import secrets
import string

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import (
    AcademicYear,
    ContentResource,
    ModuleActivationLog,
    School,
    SchoolSubscription,
    Section,
    SubscriptionInvoice,
    validate_school_logo,
    MODULE_SLUG_TO_FIELD,
)


class SchoolSerializer(serializers.ModelSerializer):
    """Read serializer — returns all school fields including logo URL."""

    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class SchoolCreateSerializer(serializers.ModelSerializer):
    """
    Create a school with all fields + optional initial admin account.
    Accepts multipart/form-data for logo upload.
    """

    # Admin account fields (write-only, optional)
    admin_first_name = serializers.CharField(write_only=True, required=False)
    admin_last_name = serializers.CharField(write_only=True, required=False)
    admin_phone = serializers.CharField(write_only=True, required=False)
    admin_email = serializers.EmailField(
        write_only=True, required=False, allow_blank=True
    )
    admin_password = serializers.CharField(write_only=True, required=False)

    # Read-only response fields
    logo_url = serializers.SerializerMethodField()
    admin_credentials = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = [
            # Identity
            "id",
            "name",
            "logo",
            "logo_url",
            "address",
            "wilaya",
            "phone",
            "email",
            "website",
            "motto",
            "subdomain",
            # Category
            "school_category",
            "has_primary",
            "has_middle",
            "has_high",
            "available_streams",
            "training_type",
            # Subscription
            "subscription_plan",
            "subscription_active",
            "subscription_start",
            "subscription_end",
            "max_students",
            # Status
            "is_active",
            "notes",
            # Admin
            "admin_first_name",
            "admin_last_name",
            "admin_phone",
            "admin_email",
            "admin_password",
            "admin_credentials",
            # Audit
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None

    def get_admin_credentials(self, obj):
        """Return admin credentials if they were just created."""
        return getattr(obj, "_admin_credentials", None)

    def validate_logo(self, value):
        if value:
            validate_school_logo(value)
        return value

    def validate(self, attrs):
        category = attrs.get("school_category", "PRIVATE_SCHOOL")

        if category == "PRIVATE_SCHOOL":
            has_any = any(
                [
                    attrs.get("has_primary", False),
                    attrs.get("has_middle", False),
                    attrs.get("has_high", False),
                ]
            )
            if not has_any:
                raise serializers.ValidationError(
                    {
                        "has_primary": "A private school must have at least one section enabled."
                    }
                )
            # Parse available_streams if sent as JSON string (FormData)
            streams = attrs.get("available_streams", [])
            if isinstance(streams, str):
                import json

                try:
                    attrs["available_streams"] = json.loads(streams)
                except (json.JSONDecodeError, TypeError):
                    attrs["available_streams"] = []
            # Clear training type
            attrs["training_type"] = None

        if category == "TRAINING_CENTER":
            if not attrs.get("training_type"):
                raise serializers.ValidationError(
                    {"training_type": "Please specify the type of training center."}
                )
            # Clear section flags
            attrs["has_primary"] = False
            attrs["has_middle"] = False
            attrs["has_high"] = False

        return attrs

    def create(self, validated_data):
        # Extract admin fields
        admin_first = validated_data.pop("admin_first_name", None)
        admin_last = validated_data.pop("admin_last_name", None)
        admin_phone = validated_data.pop("admin_phone", None)
        admin_email = validated_data.pop("admin_email", None)
        admin_password = validated_data.pop("admin_password", None)

        # Create school
        school = School.objects.create(**validated_data)

        # Auto-create sections for private schools
        if school.school_category == "PRIVATE_SCHOOL":
            section_map = {
                "has_primary": ("PRIMARY", "École Primaire"),
                "has_middle": ("MIDDLE", "CEM"),
                "has_high": ("HIGH", "Lycée"),
            }
            for flag, (stype, sname) in section_map.items():
                if getattr(school, flag):
                    Section.objects.create(
                        school=school,
                        section_type=stype,
                        name=sname,
                        created_by=validated_data.get("created_by"),
                    )

        # Create admin user if provided
        if admin_first and admin_last and admin_phone:
            from apps.accounts.models import User

            password = admin_password or self._generate_password()
            user = User.objects.create_user(
                phone_number=admin_phone,
                password=password,
                first_name=admin_first,
                last_name=admin_last,
                email=admin_email or "",
                role="ADMIN",
                school=school,
                is_first_login=True,
            )
            school._admin_credentials = {
                "user_id": str(user.id),
                "phone_number": user.phone_number,
                "password": password,
                "first_name": user.first_name,
                "last_name": user.last_name,
            }

        return school

    @staticmethod
    def _generate_password(length=10):
        chars = string.ascii_letters + string.digits
        return "".join(secrets.choice(chars) for _ in range(length))


class SchoolUpdateSerializer(serializers.ModelSerializer):
    """Update serializer for school profile (by super admin or school admin)."""

    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = [
            "id",
            "name",
            "logo",
            "logo_url",
            "address",
            "wilaya",
            "phone",
            "email",
            "website",
            "motto",
            "subdomain",
            "school_category",
            "has_primary",
            "has_middle",
            "has_high",
            "available_streams",
            "training_type",
            "subscription_plan",
            "subscription_active",
            "subscription_start",
            "subscription_end",
            "max_students",
            "is_active",
            "notes",
            "setup_completed",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None

    def validate_logo(self, value):
        if value:
            validate_school_logo(value)
        return value


class SectionSerializer(serializers.ModelSerializer):
    SECTION_NAME_MAP = {
        "PRIMARY": "École Primaire",
        "MIDDLE": "CEM",
        "HIGH": "Lycée",
    }

    class Meta:
        model = Section
        fields = "__all__"
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]
        extra_kwargs = {
            "name": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        # Auto-generate name from section_type if not provided
        if not attrs.get("name"):
            section_type = attrs.get("section_type", "")
            attrs["name"] = self.SECTION_NAME_MAP.get(section_type, section_type)
        return attrs


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = "__all__"
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]
        extra_kwargs = {"section": {"required": False, "allow_null": True}}


# ---------------------------------------------------------------------------
# SchoolSubscription serializers
# ---------------------------------------------------------------------------


class SchoolSubscriptionSerializer(serializers.ModelSerializer):
    """Read serializer for school subscription."""

    school_name = serializers.CharField(source="school.name", read_only=True)
    active_modules = serializers.SerializerMethodField()

    class Meta:
        model = SchoolSubscription
        fields = [
            "id",
            "school",
            "school_name",
            "is_active",
            "plan_name",
            "subscription_start",
            "subscription_end",
            "max_students",
            "suspension_reason",
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
            "monthly_total",
            "activation_log",
            "active_modules",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]

    def get_active_modules(self, obj):
        return obj.get_active_modules()


class SchoolSubscriptionUpdateSerializer(serializers.ModelSerializer):
    """Update serializer for modifying subscription details."""

    class Meta:
        model = SchoolSubscription
        fields = [
            "is_active",
            "plan_name",
            "subscription_start",
            "subscription_end",
            "max_students",
            "suspension_reason",
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
            "monthly_total",
        ]

    def validate(self, attrs):
        # module_pedagogique cannot be deactivated
        attrs.pop("module_pedagogique", None)
        return attrs


class ModuleActivationLogSerializer(serializers.ModelSerializer):
    activated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ModuleActivationLog
        fields = [
            "id",
            "school",
            "module_name",
            "action",
            "activated_by",
            "activated_by_name",
            "reason",
            "prorata_amount",
            "metadata",
            "created_at",
        ]
        read_only_fields = fields

    def get_activated_by_name(self, obj):
        if obj.activated_by:
            return f"{obj.activated_by.first_name} {obj.activated_by.last_name}"
        return None


class SubscriptionInvoiceSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source="school.name", read_only=True)
    generated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionInvoice
        fields = [
            "id",
            "school",
            "school_name",
            "invoice_number",
            "period_start",
            "period_end",
            "amount",
            "tax_amount",
            "total_amount",
            "status",
            "line_items",
            "notes",
            "paid_at",
            "due_date",
            "pdf_file",
            "generated_by",
            "generated_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "invoice_number",
            "generated_by",
            "created_at",
            "updated_at",
        ]

    def get_generated_by_name(self, obj):
        if obj.generated_by:
            return f"{obj.generated_by.first_name} {obj.generated_by.last_name}"
        return None


class ModuleActivateSerializer(serializers.Serializer):
    """Serializer for activating/deactivating a module."""

    reason = serializers.CharField(required=False, allow_blank=True, default="")


class SuspendSchoolSerializer(serializers.Serializer):
    """Serializer for suspending a school."""

    reason = serializers.CharField(required=True, min_length=5)


class InvoiceGenerateSerializer(serializers.Serializer):
    """Serializer for generating an invoice."""

    period_start = serializers.DateField()
    period_end = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class ContentResourceSerializer(serializers.ModelSerializer):
    """Serializer for educational content resources."""

    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ContentResource
        fields = [
            "id",
            "title",
            "description",
            "category",
            "subject",
            "level",
            "year",
            "file",
            "file_url",
            "thumbnail",
            "is_published",
            "download_count",
            "uploaded_by",
            "uploaded_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "uploaded_by",
            "download_count",
            "created_at",
            "updated_at",
        ]

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return f"{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}"
        return None
