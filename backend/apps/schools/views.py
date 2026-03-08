from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

import logging
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone

from core.permissions import IsSchoolAdmin, IsSuperAdmin

from .models import (
    AcademicYear,
    ContentResource,
    ModuleActivationLog,
    School,
    SchoolSubscription,
    Section,
    SubscriptionInvoice,
    SuperAdminImpersonationLog,
    MODULE_SLUG_TO_FIELD,
)
from .serializers import (
    AcademicYearSerializer,
    ContentResourceSerializer,
    InvoiceGenerateSerializer,
    ModuleActivateSerializer,
    ModuleActivationLogSerializer,
    SchoolCreateSerializer,
    SchoolSerializer,
    SchoolSubscriptionSerializer,
    SchoolSubscriptionUpdateSerializer,
    SchoolUpdateSerializer,
    SectionSerializer,
    SubscriptionInvoiceSerializer,
    SuspendSchoolSerializer,
)

logger = logging.getLogger(__name__)


class IsSuperOrSchoolAdmin(permissions.BasePermission):
    """Allow SUPER_ADMIN, ADMIN, or SECTION_ADMIN."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN")
        )


class SchoolViewSet(viewsets.ModelViewSet):
    """
    CRUD for schools.
    - SUPER_ADMIN: full CRUD on all schools.
    - ADMIN / SECTION_ADMIN: read-only on their own school.
    """

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action == "create":
            return SchoolCreateSerializer
        if self.action in ("update", "partial_update"):
            return SchoolUpdateSerializer
        return SchoolSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "my_school", "profile"):
            return [permissions.IsAuthenticated(), IsSuperOrSchoolAdmin()]
        if self.action in ("update_profile", "complete_setup", "upload_logo"):
            return [permissions.IsAuthenticated(), IsSuperOrSchoolAdmin()]
        # Create/Update/Delete = superadmin only
        return [permissions.IsAuthenticated(), IsSuperAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs = School.objects.filter(is_deleted=False)

        if user.role == "SUPER_ADMIN":
            search = self.request.query_params.get("search")
            if search:
                from django.db.models import Q

                qs = qs.filter(
                    Q(name__icontains=search) | Q(subdomain__icontains=search)
                )
            return qs

        # School admins only see their own school
        return qs.filter(pk=user.school_id)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def _resolve_school(self, request):
        """Resolve school for current user — supports SUPER_ADMIN fallback."""
        if request.user.school_id:
            return School.objects.get(pk=request.user.school_id)
        # SUPER_ADMIN: fallback to the only school if there is exactly one
        schools = School.objects.filter(is_deleted=False)
        if schools.count() == 1:
            return schools.first()
        return None

    @action(detail=False, methods=["get"], url_path="my-school")
    def my_school(self, request):
        """GET /api/v1/schools/my-school/ — return the current user's school."""
        school = self._resolve_school(request)
        if not school:
            return Response({"detail": "No school assigned."}, status=404)
        return Response(SchoolSerializer(school, context={"request": request}).data)

    @action(detail=False, methods=["get"], url_path="profile")
    def profile(self, request):
        """GET /api/v1/schools/profile/ — school admin gets own school profile (includes logo URL)."""
        school = self._resolve_school(request)
        if not school:
            return Response({"detail": "No school assigned."}, status=404)
        return Response(SchoolSerializer(school, context={"request": request}).data)

    @action(detail=False, methods=["patch"], url_path="update-profile")
    def update_profile(self, request):
        """PATCH /api/v1/schools/update-profile/ — school admin updates own school profile."""
        school = self._resolve_school(request)
        if not school:
            return Response({"detail": "No school assigned."}, status=404)
        serializer = SchoolUpdateSerializer(
            school, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="complete-setup")
    def complete_setup(self, request):
        """POST /api/v1/schools/complete-setup/ — mark first-time wizard as done."""
        school = self._resolve_school(request)
        if not school:
            return Response({"detail": "No school assigned."}, status=404)
        school.setup_completed = True
        school.save(update_fields=["setup_completed", "updated_at"])
        return Response({"detail": "Setup completed.", "setup_completed": True})

    @action(detail=True, methods=["post"], url_path="logo")
    def upload_logo(self, request, pk=None):
        """POST /api/v1/schools/{id}/logo/ — upload/replace school logo."""
        school = self.get_object()
        logo = request.FILES.get("logo")
        if not logo:
            return Response(
                {"detail": "No logo file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Validate
        from .models import validate_school_logo

        try:
            validate_school_logo(logo)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Delete old logo if exists
        if school.logo:
            school.logo.delete(save=False)
        school.logo = logo
        school.save(update_fields=["logo", "updated_at"])
        return Response(
            SchoolSerializer(school, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class AcademicYearViewSet(viewsets.ModelViewSet):
    """CRUD for academic years — school admin or superadmin."""

    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get_school(self):
        """Resolve school for the current user (supports SUPER_ADMIN)."""
        user = self.request.user
        if user.school_id:
            return user.school
        school_id = self.request.query_params.get("school") or self.request.data.get(
            "school"
        )
        if school_id:
            return School.objects.filter(pk=school_id, is_deleted=False).first()
        schools = School.objects.filter(is_deleted=False)
        if schools.count() == 1:
            return schools.first()
        return None

    def get_queryset(self):
        school = self._get_school()
        if school:
            return AcademicYear.objects.filter(school=school)
        return AcademicYear.objects.none()

    def perform_create(self, serializer):
        school = self._get_school()
        if not school:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"school": "Impossible de déterminer l'école."})
        # Auto-assign the first section if none provided
        section = serializer.validated_data.get("section")
        if not section:
            section = Section.objects.filter(school=school).first()
        serializer.save(
            school=school,
            section=section,
            created_by=self.request.user,
        )

    def create(self, request, *args, **kwargs):
        """
        Override create to handle duplicate academic year gracefully.
        If an academic year with the same (school, name) already exists,
        return the existing one instead of raising a 500 IntegrityError.
        """
        from django.db import IntegrityError

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except IntegrityError:
            # The academic year already exists — return it
            name = serializer.validated_data.get("name")
            school = self._get_school()
            existing = AcademicYear.objects.filter(school=school, name=name).first()
            if existing:
                return Response(
                    AcademicYearSerializer(existing).data,
                    status=status.HTTP_200_OK,
                )
            return Response(
                {
                    "detail": f"Une année académique '{name}' existe déjà pour cette école."
                },
                status=status.HTTP_409_CONFLICT,
            )
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


class SectionViewSet(viewsets.ModelViewSet):
    """CRUD for sections — school admin or superadmin."""

    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get_school(self):
        """Resolve school for the current user (supports SUPER_ADMIN)."""
        user = self.request.user
        if user.school_id:
            return user.school
        # SUPER_ADMIN: try to get school from query param or use the only school
        school_id = self.request.query_params.get("school") or self.request.data.get(
            "school"
        )
        if school_id:
            return School.objects.filter(pk=school_id, is_deleted=False).first()
        # Fallback: if there's only one school, use it
        schools = School.objects.filter(is_deleted=False)
        if schools.count() == 1:
            return schools.first()
        return None

    def get_queryset(self):
        school = self._get_school()
        if school:
            return Section.objects.filter(school=school)
        return Section.objects.none()

    def perform_create(self, serializer):
        school = self._get_school()
        if not school:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"school": "Impossible de déterminer l'école."})
        serializer.save(
            school=school,
            created_by=self.request.user,
        )

    def create(self, request, *args, **kwargs):
        """
        Override create with idempotence:
        If section already exists for this school + section_type → return existing (200).
        Otherwise create new (201).
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        school = self._get_school()
        section_type = serializer.validated_data.get("section_type")

        if school and section_type:
            existing = Section.objects.filter(
                school=school, section_type=section_type
            ).first()
            if existing:
                logger.info(
                    "Section %s already exists for school %s — returning existing.",
                    section_type,
                    school.id,
                )
                return Response(
                    SectionSerializer(existing).data,
                    status=status.HTTP_200_OK,
                )

        try:
            self.perform_create(serializer)
        except Exception as e:
            logger.error(
                "Error creating section: school=%s, data=%s, error=%s",
                school.id if school else None,
                request.data,
                str(e),
                exc_info=True,
            )
            return Response(
                {"detail": f"Erreur lors de la création de la section: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


# ===========================================================================
# Super Admin — Subscription Management
# ===========================================================================


class SubscriptionDetailView(APIView):
    """
    GET  /api/v1/schools/super/{school_id}/subscription/
    PATCH /api/v1/schools/super/{school_id}/subscription/
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def _get_school(self, school_id):
        try:
            return School.objects.get(pk=school_id, is_deleted=False)
        except School.DoesNotExist:
            return None

    def get(self, request, school_id):
        school = self._get_school(school_id)
        if not school:
            return Response({"detail": "École non trouvée."}, status=404)

        subscription, _ = SchoolSubscription.objects.get_or_create(
            school=school,
            defaults={
                "plan_name": school.subscription_plan,
                "subscription_start": school.subscription_start or date.today(),
                "subscription_end": school.subscription_end,
                "max_students": school.max_students,
                "is_active": school.subscription_active,
            },
        )
        serializer = SchoolSubscriptionSerializer(subscription)
        return Response(serializer.data)

    def patch(self, request, school_id):
        school = self._get_school(school_id)
        if not school:
            return Response({"detail": "École non trouvée."}, status=404)

        subscription, _ = SchoolSubscription.objects.get_or_create(
            school=school,
            defaults={
                "plan_name": school.subscription_plan,
                "subscription_start": school.subscription_start or date.today(),
                "max_students": school.max_students,
                "is_active": school.subscription_active,
            },
        )
        serializer = SchoolSubscriptionUpdateSerializer(
            subscription, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(SchoolSubscriptionSerializer(subscription).data)


class ModuleActivateView(APIView):
    """
    POST /api/v1/schools/super/{school_id}/modules/{module}/activate/
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def post(self, request, school_id, module):
        try:
            school = School.objects.get(pk=school_id, is_deleted=False)
        except School.DoesNotExist:
            return Response({"detail": "École non trouvée."}, status=404)

        field_name = MODULE_SLUG_TO_FIELD.get(module)
        if not field_name:
            return Response(
                {"detail": f"Module inconnu: {module}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if module == "pedagogique":
            return Response(
                {"detail": "Le module pédagogique est toujours actif."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ModuleActivateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        subscription, _ = SchoolSubscription.objects.get_or_create(
            school=school,
            defaults={
                "plan_name": school.subscription_plan,
                "subscription_start": school.subscription_start or date.today(),
                "max_students": school.max_students,
                "is_active": school.subscription_active,
            },
        )

        if getattr(subscription, field_name):
            return Response(
                {"detail": f"Le module '{module}' est déjà activé."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate prorata
        prorata = Decimal("0.00")
        if subscription.subscription_end:
            remaining_days = (subscription.subscription_end - date.today()).days
            if remaining_days > 0:
                total_days = (
                    subscription.subscription_end - subscription.subscription_start
                ).days or 1
                prorata = (
                    Decimal(str(remaining_days))
                    / Decimal(str(total_days))
                    * Decimal("1000.00")
                ).quantize(Decimal("0.01"))

        # Activate
        setattr(subscription, field_name, True)
        subscription.save()

        # Log
        log = ModuleActivationLog.objects.create(
            school=school,
            module_name=module,
            action=ModuleActivationLog.Action.ACTIVATED,
            activated_by=request.user,
            reason=serializer.validated_data.get("reason", ""),
            prorata_amount=prorata,
            metadata={
                "field": field_name,
                "activated_at": timezone.now().isoformat(),
            },
        )

        subscription.activation_log.append(
            {
                "action": "ACTIVATED",
                "module": module,
                "by": str(request.user.id),
                "at": timezone.now().isoformat(),
                "prorata": str(prorata),
            }
        )
        subscription.save(update_fields=["activation_log", "updated_at"])

        return Response(
            {
                "detail": f"Module '{module}' activé avec succès.",
                "prorata_amount": str(prorata),
                "log": ModuleActivationLogSerializer(log).data,
                "subscription": SchoolSubscriptionSerializer(subscription).data,
            },
            status=status.HTTP_200_OK,
        )


class ModuleDeactivateView(APIView):
    """
    POST /api/v1/schools/super/{school_id}/modules/{module}/deactivate/
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def post(self, request, school_id, module):
        try:
            school = School.objects.get(pk=school_id, is_deleted=False)
        except School.DoesNotExist:
            return Response({"detail": "École non trouvée."}, status=404)

        field_name = MODULE_SLUG_TO_FIELD.get(module)
        if not field_name:
            return Response(
                {"detail": f"Module inconnu: {module}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if module == "pedagogique":
            return Response(
                {"detail": "Le module pédagogique ne peut pas être désactivé."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ModuleActivateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            subscription = school.subscription
        except SchoolSubscription.DoesNotExist:
            return Response(
                {"detail": "Aucun abonnement trouvé pour cette école."},
                status=404,
            )

        if not getattr(subscription, field_name):
            return Response(
                {"detail": f"Le module '{module}' est déjà désactivé."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        setattr(subscription, field_name, False)
        subscription.save()

        log = ModuleActivationLog.objects.create(
            school=school,
            module_name=module,
            action=ModuleActivationLog.Action.DEACTIVATED,
            activated_by=request.user,
            reason=serializer.validated_data.get("reason", ""),
            metadata={
                "field": field_name,
                "deactivated_at": timezone.now().isoformat(),
            },
        )

        subscription.activation_log.append(
            {
                "action": "DEACTIVATED",
                "module": module,
                "by": str(request.user.id),
                "at": timezone.now().isoformat(),
            }
        )
        subscription.save(update_fields=["activation_log", "updated_at"])

        return Response(
            {
                "detail": f"Module '{module}' désactivé.",
                "log": ModuleActivationLogSerializer(log).data,
                "subscription": SchoolSubscriptionSerializer(subscription).data,
            },
            status=status.HTTP_200_OK,
        )


class SchoolSuspendView(APIView):
    """POST /api/v1/schools/super/{school_id}/suspend/"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def post(self, request, school_id):
        try:
            school = School.objects.get(pk=school_id, is_deleted=False)
        except School.DoesNotExist:
            return Response({"detail": "École non trouvée."}, status=404)

        serializer = SuspendSchoolSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        school.is_active = False
        school.subscription_active = False
        school.save(update_fields=["is_active", "subscription_active", "updated_at"])

        subscription, _ = SchoolSubscription.objects.get_or_create(
            school=school,
            defaults={"plan_name": school.subscription_plan},
        )
        subscription.is_active = False
        subscription.suspension_reason = serializer.validated_data["reason"]
        subscription.save(
            update_fields=["is_active", "suspension_reason", "updated_at"]
        )

        return Response(
            {
                "detail": "École suspendue.",
                "reason": serializer.validated_data["reason"],
            }
        )


class InvoiceListView(APIView):
    """GET /api/v1/schools/super/{school_id}/invoices/"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request, school_id):
        try:
            school = School.objects.get(pk=school_id, is_deleted=False)
        except School.DoesNotExist:
            return Response({"detail": "École non trouvée."}, status=404)

        invoices = SubscriptionInvoice.objects.filter(school=school)
        invoice_status = request.query_params.get("status")
        if invoice_status:
            invoices = invoices.filter(status=invoice_status.upper())

        serializer = SubscriptionInvoiceSerializer(invoices, many=True)
        return Response(serializer.data)


class InvoiceGenerateView(APIView):
    """POST /api/v1/schools/super/{school_id}/invoices/generate/"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def post(self, request, school_id):
        try:
            school = School.objects.get(pk=school_id, is_deleted=False)
        except School.DoesNotExist:
            return Response({"detail": "École non trouvée."}, status=404)

        serializer = InvoiceGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            subscription = school.subscription
        except SchoolSubscription.DoesNotExist:
            return Response(
                {"detail": "Aucun abonnement trouvé pour cette école."},
                status=404,
            )

        # Build line items from active modules
        line_items = []
        module_prices = {
            "pedagogique": Decimal("0.00"),
            "empreintes": Decimal("2000.00"),
            "finance": Decimal("3000.00"),
            "cantine": Decimal("1500.00"),
            "transport": Decimal("2000.00"),
            "auto_education": Decimal("1000.00"),
            "sms": Decimal("500.00"),
            "bibliotheque": Decimal("1000.00"),
            "infirmerie": Decimal("1000.00"),
            "mobile_apps": Decimal("2000.00"),
            "ai_chatbot": Decimal("5000.00"),
        }
        total = Decimal("0.00")
        for slug in subscription.get_active_modules():
            price = module_prices.get(slug, Decimal("0.00"))
            if price > 0:
                line_items.append({"module": slug, "amount": str(price)})
                total += price

        tax_amount = (total * Decimal("0.19")).quantize(Decimal("0.01"))
        total_amount = total + tax_amount

        count = SubscriptionInvoice.objects.filter(school=school).count()
        invoice_number = (
            f"INV-{school.subdomain.upper()}-"
            f"{timezone.now().strftime('%Y%m')}-{count + 1:04d}"
        )

        invoice = SubscriptionInvoice.objects.create(
            school=school,
            invoice_number=invoice_number,
            period_start=serializer.validated_data["period_start"],
            period_end=serializer.validated_data["period_end"],
            amount=total,
            tax_amount=tax_amount,
            total_amount=total_amount,
            line_items=line_items,
            notes=serializer.validated_data.get("notes", ""),
            due_date=serializer.validated_data["period_end"],
            generated_by=request.user,
        )

        return Response(
            SubscriptionInvoiceSerializer(invoice).data,
            status=status.HTTP_201_CREATED,
        )


class InvoiceMarkPaidView(APIView):
    """PATCH /api/v1/schools/super/{school_id}/invoices/{invoice_id}/mark-paid/"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def patch(self, request, school_id, invoice_id):
        try:
            invoice = SubscriptionInvoice.objects.get(
                pk=invoice_id, school_id=school_id
            )
        except SubscriptionInvoice.DoesNotExist:
            return Response({"detail": "Facture non trouvée."}, status=404)

        invoice.status = SubscriptionInvoice.Status.PAID
        invoice.paid_at = timezone.now()
        invoice.save(update_fields=["status", "paid_at", "updated_at"])

        return Response(SubscriptionInvoiceSerializer(invoice).data)


class ModuleActivationLogListView(APIView):
    """GET /api/v1/schools/super/{school_id}/module-logs/"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request, school_id):
        try:
            school = School.objects.get(pk=school_id, is_deleted=False)
        except School.DoesNotExist:
            return Response({"detail": "École non trouvée."}, status=404)

        logs = ModuleActivationLog.objects.filter(school=school)
        serializer = ModuleActivationLogSerializer(logs, many=True)
        return Response(serializer.data)


class AllInvoicesListView(APIView):
    """GET /api/v1/schools/super/invoices/ — all invoices (Super Admin)"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        invoices = SubscriptionInvoice.objects.select_related("school").all()

        invoice_status = request.query_params.get("status")
        if invoice_status:
            invoices = invoices.filter(status=invoice_status.upper())

        school_id = request.query_params.get("school")
        if school_id:
            invoices = invoices.filter(school_id=school_id)

        date_from = request.query_params.get("date_from")
        if date_from:
            invoices = invoices.filter(created_at__date__gte=date_from)

        date_to = request.query_params.get("date_to")
        if date_to:
            invoices = invoices.filter(created_at__date__lte=date_to)

        serializer = SubscriptionInvoiceSerializer(invoices, many=True)
        return Response(serializer.data)


# ===========================================================================
# Super Admin — Analytics
# ===========================================================================

MODULE_PRICES = {
    "pedagogique": Decimal("0.00"),
    "empreintes": Decimal("2000.00"),
    "finance": Decimal("3000.00"),
    "cantine": Decimal("1500.00"),
    "transport": Decimal("2000.00"),
    "auto_education": Decimal("1000.00"),
    "sms": Decimal("500.00"),
    "bibliotheque": Decimal("1000.00"),
    "infirmerie": Decimal("1000.00"),
    "mobile_apps": Decimal("2000.00"),
    "ai_chatbot": Decimal("5000.00"),
}


class AnalyticsOverviewView(APIView):
    """GET /api/v1/schools/super/analytics/overview/"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        from apps.accounts.models import User

        now = timezone.now()
        schools = School.objects.filter(is_deleted=False)
        total_schools = schools.count()
        active_schools = schools.filter(
            is_active=True, subscription_active=True
        ).count()
        inactive_schools = total_schools - active_schools
        new_schools_7d = schools.filter(created_at__gte=now - timedelta(days=7)).count()
        new_schools_30d = schools.filter(
            created_at__gte=now - timedelta(days=30)
        ).count()

        users = User.objects.filter(is_active=True)
        total_users = users.count()
        new_users_7d = users.filter(created_at__gte=now - timedelta(days=7)).count()
        new_users_30d = users.filter(created_at__gte=now - timedelta(days=30)).count()

        # Revenue from paid invoices
        total_revenue = SubscriptionInvoice.objects.filter(status="PAID").aggregate(
            total=Sum("total_amount")
        )["total"] or Decimal("0.00")

        revenue_30d = SubscriptionInvoice.objects.filter(
            status="PAID", paid_at__gte=now - timedelta(days=30)
        ).aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")

        # MRR estimate from active subscriptions
        mrr = Decimal("0.00")
        for sub in SchoolSubscription.objects.filter(is_active=True):
            for slug, field in MODULE_SLUG_TO_FIELD.items():
                if getattr(sub, field, False):
                    mrr += MODULE_PRICES.get(slug, Decimal("0.00"))

        # Expiring soon (next 30 days)
        expiring_soon = SchoolSubscription.objects.filter(
            is_active=True,
            subscription_end__isnull=False,
            subscription_end__lte=now.date() + timedelta(days=30),
            subscription_end__gte=now.date(),
        ).count()

        # Growth rate (schools this month vs last month)
        this_month_start = now.replace(day=1)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        schools_this_month = schools.filter(created_at__gte=this_month_start).count()
        schools_last_month = schools.filter(
            created_at__gte=last_month_start, created_at__lt=this_month_start
        ).count()
        growth_rate = 0
        if schools_last_month > 0:
            growth_rate = round(
                ((schools_this_month - schools_last_month) / schools_last_month) * 100
            )

        return Response(
            {
                "total_schools": total_schools,
                "active_schools": active_schools,
                "inactive_schools": inactive_schools,
                "new_schools_7d": new_schools_7d,
                "new_schools_30d": new_schools_30d,
                "total_users": total_users,
                "new_users_7d": new_users_7d,
                "new_users_30d": new_users_30d,
                "total_revenue": str(total_revenue),
                "revenue_30d": str(revenue_30d),
                "mrr": str(mrr),
                "expiring_soon": expiring_soon,
                "growth_rate": growth_rate,
            }
        )


class AnalyticsRevenueView(APIView):
    """GET /api/v1/schools/super/analytics/revenue/"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        # Revenue by month (last 12 months)
        twelve_months_ago = timezone.now() - timedelta(days=365)
        monthly = (
            SubscriptionInvoice.objects.filter(
                status="PAID", paid_at__gte=twelve_months_ago
            )
            .annotate(month=TruncMonth("paid_at"))
            .values("month")
            .annotate(total=Sum("total_amount"), count=Count("id"))
            .order_by("month")
        )
        by_month = [
            {
                "month": m["month"].strftime("%Y-%m"),
                "total": str(m["total"]),
                "invoice_count": m["count"],
            }
            for m in monthly
        ]

        # Revenue by module (from line_items in paid invoices)
        by_module = defaultdict(lambda: Decimal("0.00"))
        paid_invoices = SubscriptionInvoice.objects.filter(status="PAID")
        for inv in paid_invoices.only("line_items"):
            for item in inv.line_items or []:
                by_module[item.get("module", "unknown")] += Decimal(
                    str(item.get("amount", "0"))
                )
        module_revenue = [
            {"module": k, "total": str(v)}
            for k, v in sorted(by_module.items(), key=lambda x: x[1], reverse=True)
        ]

        return Response(
            {
                "by_month": by_month,
                "by_module": module_revenue,
            }
        )


class AnalyticsModulesUsageView(APIView):
    """GET /api/v1/schools/super/analytics/modules-usage/"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        subs = SchoolSubscription.objects.filter(is_active=True)
        total = subs.count() or 1
        usage = []
        for slug, field in MODULE_SLUG_TO_FIELD.items():
            count = subs.filter(**{field: True}).count()
            usage.append(
                {
                    "module": slug,
                    "count": count,
                    "percentage": round((count / total) * 100, 1),
                    "price": str(MODULE_PRICES.get(slug, Decimal("0.00"))),
                }
            )
        usage.sort(key=lambda x: x["count"], reverse=True)
        return Response(usage)


class AnalyticsSchoolsMapView(APIView):
    """GET /api/v1/schools/super/analytics/schools-map/"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        schools = School.objects.filter(is_deleted=False)
        wilaya_data = (
            schools.values("wilaya")
            .annotate(
                count=Count("id"),
                active=Count("id", filter=Q(is_active=True, subscription_active=True)),
            )
            .order_by("-count")
        )
        result = [
            {
                "wilaya": w["wilaya"] or "Non spécifiée",
                "count": w["count"],
                "active": w["active"],
            }
            for w in wilaya_data
        ]
        return Response(result)


class AnalyticsChurnView(APIView):
    """GET /api/v1/schools/super/analytics/churn/"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        now = timezone.now()
        subs = SchoolSubscription.objects.all()
        total = subs.count() or 1
        active = subs.filter(is_active=True).count()
        suspended = subs.filter(is_active=False).count()
        renewal_rate = round((active / total) * 100, 1)

        # Expiring in 7/14/30 days
        expiring_7d = subs.filter(
            is_active=True,
            subscription_end__isnull=False,
            subscription_end__lte=now.date() + timedelta(days=7),
            subscription_end__gte=now.date(),
        ).count()
        expiring_14d = subs.filter(
            is_active=True,
            subscription_end__isnull=False,
            subscription_end__lte=now.date() + timedelta(days=14),
            subscription_end__gte=now.date(),
        ).count()
        expiring_30d = subs.filter(
            is_active=True,
            subscription_end__isnull=False,
            subscription_end__lte=now.date() + timedelta(days=30),
            subscription_end__gte=now.date(),
        ).count()

        # Recently churned (deactivated in last 30 days)
        recently_churned = School.objects.filter(
            is_deleted=False,
            is_active=False,
            updated_at__gte=now - timedelta(days=30),
        ).count()

        return Response(
            {
                "total_subscriptions": total,
                "active": active,
                "suspended": suspended,
                "renewal_rate": renewal_rate,
                "expiring_7d": expiring_7d,
                "expiring_14d": expiring_14d,
                "expiring_30d": expiring_30d,
                "recently_churned": recently_churned,
            }
        )


# ===========================================================================
# Super Admin — Impersonation
# ===========================================================================


class ImpersonateStartView(APIView):
    """POST /api/v1/schools/super/<school_id>/impersonate/"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def post(self, request, school_id):
        from apps.accounts.models import User
        from rest_framework_simplejwt.tokens import RefreshToken

        try:
            school = School.objects.get(pk=school_id, is_deleted=False)
        except School.DoesNotExist:
            return Response({"detail": "École non trouvée."}, status=404)

        # Find the school's admin user
        target_user = User.objects.filter(
            school=school, role="ADMIN", is_active=True
        ).first()
        if not target_user:
            return Response(
                {"detail": "Aucun administrateur actif trouvé pour cette école."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Generate impersonation token with special claims
        refresh = RefreshToken.for_user(target_user)
        refresh["is_impersonating"] = True
        refresh["impersonator_id"] = str(request.user.id)
        refresh["impersonator_name"] = (
            f"{request.user.first_name} {request.user.last_name}"
        )
        refresh["role"] = target_user.role
        refresh["school_id"] = str(school.id)
        refresh["is_first_login"] = False

        try:
            refresh["active_modules"] = school.subscription.get_active_modules()
        except Exception:
            refresh["active_modules"] = []

        # Log the impersonation
        log = SuperAdminImpersonationLog.objects.create(
            super_admin=request.user,
            target_school=school,
            target_user=target_user,
            action="IMPERSONATION_STARTED",
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
        )

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "school": {
                    "id": str(school.id),
                    "name": school.name,
                    "subdomain": school.subdomain,
                },
                "target_user": {
                    "id": str(target_user.id),
                    "name": f"{target_user.first_name} {target_user.last_name}",
                    "role": target_user.role,
                },
                "log_id": str(log.id),
            }
        )


class ImpersonateEndView(APIView):
    """POST /api/v1/schools/super/impersonate/end/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        log_id = request.data.get("log_id")
        if log_id:
            try:
                log = SuperAdminImpersonationLog.objects.get(pk=log_id)
                log.ended_at = timezone.now()
                log.action = "IMPERSONATION_ENDED"
                log.save(update_fields=["ended_at", "action"])
            except SuperAdminImpersonationLog.DoesNotExist:
                pass

        return Response({"detail": "Impersonation terminée."})


class ImpersonationLogsView(APIView):
    """GET /api/v1/schools/super/impersonation-logs/"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        logs = SuperAdminImpersonationLog.objects.select_related(
            "super_admin", "target_school", "target_user"
        ).order_by("-started_at")[:100]

        data = [
            {
                "id": str(log.id),
                "super_admin_name": f"{log.super_admin.first_name} {log.super_admin.last_name}",
                "target_school_name": log.target_school.name,
                "target_school_id": str(log.target_school.id),
                "target_user_name": (
                    f"{log.target_user.first_name} {log.target_user.last_name}"
                    if log.target_user
                    else "—"
                ),
                "action": log.action,
                "ip_address": log.ip_address,
                "started_at": log.started_at.isoformat() if log.started_at else None,
                "ended_at": log.ended_at.isoformat() if log.ended_at else None,
                "duration_minutes": (
                    round((log.ended_at - log.started_at).total_seconds() / 60)
                    if log.ended_at and log.started_at
                    else None
                ),
            }
            for log in logs
        ]
        return Response(data)


# ===========================================================================
# Super Admin — Content Management
# ===========================================================================


class ContentResourceViewSet(viewsets.ModelViewSet):
    """CRUD for educational content resources (BEP/BEM/BAC exams, textbooks)."""

    serializer_class = ContentResourceSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = ContentResource.objects.all()
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category.upper())
        subject = self.request.query_params.get("subject")
        if subject:
            qs = qs.filter(subject__icontains=subject)
        level = self.request.query_params.get("level")
        if level:
            qs = qs.filter(level__icontains=level)
        return qs

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


# ===========================================================================
# Super Admin — Broadcast & Performance
# ===========================================================================


class BroadcastView(APIView):
    """POST /api/v1/schools/super/broadcast/"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        title = request.data.get("title", "")
        message_text = request.data.get("message", "")
        target = request.data.get("target", "all")  # all | active | plan:PRO

        if not title or not message_text:
            return Response(
                {"detail": "Le titre et le message sont requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        schools = School.objects.filter(is_deleted=False)
        if target == "active":
            schools = schools.filter(is_active=True, subscription_active=True)
        elif target.startswith("plan:"):
            plan = target.split(":", 1)[1]
            schools = schools.filter(subscription_plan=plan)

        count = schools.count()

        # In production, this would send notifications via Celery
        # For now, we just return the count of targeted schools
        return Response(
            {
                "detail": f"Diffusion envoyée à {count} école(s).",
                "targeted_schools": count,
                "title": title,
            }
        )


class PerformanceView(APIView):
    """GET /api/v1/schools/super/analytics/performance/"""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        from apps.accounts.models import User

        # Storage per school (approximate from files)
        schools = School.objects.filter(is_deleted=False).order_by("name")[:20]
        storage = []
        for school in schools:
            invoice_count = SubscriptionInvoice.objects.filter(school=school).count()
            user_count = User.objects.filter(school=school, is_active=True).count()
            storage.append(
                {
                    "school_id": str(school.id),
                    "school_name": school.name,
                    "user_count": user_count,
                    "invoice_count": invoice_count,
                }
            )

        return Response(
            {
                "schools": storage,
                "total_schools": School.objects.filter(is_deleted=False).count(),
                "total_users": User.objects.filter(is_active=True).count(),
                "total_invoices": SubscriptionInvoice.objects.count(),
            }
        )
