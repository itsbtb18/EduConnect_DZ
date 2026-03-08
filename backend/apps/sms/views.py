"""
SMS API views.
"""

from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import require_module

from .models import SMSCampaign, SMSConfig, SMSMessage, SMSTemplate
from .serializers import (
    SMSCampaignCreateSerializer,
    SMSCampaignSerializer,
    SMSConfigCreateSerializer,
    SMSConfigSerializer,
    SMSMessageSerializer,
    SMSSendSerializer,
    SMSTemplateCreateSerializer,
    SMSTemplateSerializer,
)
from .tasks import execute_campaign_task, send_sms_task


def _school_qs(model, user, include_deleted=False):
    qs = model.objects.all()
    if not include_deleted:
        qs = qs.filter(is_deleted=False)
    if user.role != "SUPER_ADMIN":
        qs = qs.filter(school=user.school)
    return qs


def _is_admin(user):
    return user.role in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN")


# ---------------------------------------------------------------------------
# SMS Config
# ---------------------------------------------------------------------------


@require_module("sms")
class SMSConfigView(APIView):
    """GET / PUT — SMS gateway configuration."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        config = _school_qs(SMSConfig, request.user).first()
        if not config:
            return Response({"detail": "Aucune configuration SMS"}, status=404)
        return Response(SMSConfigSerializer(config).data)

    def put(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        config = _school_qs(SMSConfig, request.user).first()
        if config:
            serializer = SMSConfigCreateSerializer(
                config, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(SMSConfigSerializer(config).data)
        else:
            serializer = SMSConfigCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            config = serializer.save(school=request.user.school)
            return Response(SMSConfigSerializer(config).data, status=201)


# ---------------------------------------------------------------------------
# SMS Balance
# ---------------------------------------------------------------------------


@require_module("sms")
class SMSBalanceView(APIView):
    """GET /api/v1/sms/balance/ — remaining balance & stats."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        config = _school_qs(SMSConfig, request.user).first()
        if not config:
            return Response(
                {
                    "remaining_balance": 0,
                    "monthly_quota": 0,
                    "usage_percentage": 0,
                    "cost_per_sms": 0,
                    "alert_threshold": 0,
                    "is_low": False,
                }
            )

        used = config.monthly_quota - config.remaining_balance
        usage_pct = (
            round((used / config.monthly_quota) * 100, 1) if config.monthly_quota else 0
        )

        # Monthly stats
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_msgs = _school_qs(SMSMessage, request.user).filter(
            created_at__gte=month_start
        )
        stats = month_msgs.aggregate(
            total=Count("id"),
            sent=Count("id", filter=Q(status="SENT")),
            delivered=Count("id", filter=Q(status="DELIVERED")),
            failed=Count("id", filter=Q(status="FAILED")),
            total_cost=Sum("cost"),
        )

        return Response(
            {
                "remaining_balance": config.remaining_balance,
                "monthly_quota": config.monthly_quota,
                "usage_percentage": usage_pct,
                "cost_per_sms": float(config.cost_per_sms),
                "alert_threshold": config.alert_threshold,
                "is_low": config.remaining_balance <= config.alert_threshold,
                "provider": config.provider,
                "provider_display": config.get_provider_display(),
                "month_stats": {
                    "total": stats["total"] or 0,
                    "sent": stats["sent"] or 0,
                    "delivered": stats["delivered"] or 0,
                    "failed": stats["failed"] or 0,
                    "total_cost": float(stats["total_cost"] or 0),
                    "delivery_rate": (
                        round((stats["delivered"] or 0) / (stats["sent"] or 1) * 100, 1)
                        if stats["sent"]
                        else 0
                    ),
                },
            }
        )


# ---------------------------------------------------------------------------
# Send SMS
# ---------------------------------------------------------------------------


@require_module("sms")
class SMSSendView(APIView):
    """POST /api/v1/sms/send/ — send a single SMS."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = SMSSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # If template_id, render it
        content = data["message"]
        template = None
        if data.get("template_id"):
            template = SMSTemplate.objects.filter(
                pk=data["template_id"],
                school=request.user.school,
                is_deleted=False,
            ).first()
            if template:
                content = template.render(data.get("template_context", {}))

        msg = SMSMessage.objects.create(
            school=request.user.school,
            recipient_phone=data["phone"],
            content=content,
            event_type=SMSMessage.EventType.CUSTOM,
            template=template,
            created_by=request.user,
        )
        send_sms_task.delay(str(msg.pk))
        return Response(SMSMessageSerializer(msg).data, status=201)


# ---------------------------------------------------------------------------
# SMS History
# ---------------------------------------------------------------------------


@require_module("sms")
class SMSHistoryView(APIView):
    """GET /api/v1/sms/history/ — paginated SMS history."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        qs = _school_qs(SMSMessage, request.user).select_related("template", "campaign")

        # Filters
        sms_status = request.query_params.get("status")
        if sms_status:
            qs = qs.filter(status=sms_status.upper())

        event_type = request.query_params.get("event_type")
        if event_type:
            qs = qs.filter(event_type=event_type.upper())

        date_from = request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)

        date_to = request.query_params.get("date_to")
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        search = request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(recipient_phone__icontains=search)
                | Q(recipient_name__icontains=search)
                | Q(content__icontains=search)
            )

        page_size = min(int(request.query_params.get("page_size", 20)), 100)
        page = max(int(request.query_params.get("page", 1)), 1)
        offset = (page - 1) * page_size
        total = qs.count()

        items = qs[offset : offset + page_size]
        return Response(
            {
                "count": total,
                "results": SMSMessageSerializer(items, many=True).data,
            }
        )


# ---------------------------------------------------------------------------
# SMS Templates CRUD
# ---------------------------------------------------------------------------


@require_module("sms")
class SMSTemplateListCreateView(APIView):
    """GET / POST — SMS templates."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        qs = _school_qs(SMSTemplate, request.user)

        event_type = request.query_params.get("event_type")
        if event_type:
            qs = qs.filter(event_type=event_type.upper())

        language = request.query_params.get("language")
        if language:
            qs = qs.filter(language=language.upper())

        return Response(SMSTemplateSerializer(qs, many=True).data)

    def post(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = SMSTemplateCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        template = serializer.save(school=request.user.school, created_by=request.user)
        return Response(SMSTemplateSerializer(template).data, status=201)


@require_module("sms")
class SMSTemplateDetailView(APIView):
    """GET / PUT / DELETE — single SMS template."""

    permission_classes = [IsAuthenticated]

    def _get_obj(self, request, pk):
        return _school_qs(SMSTemplate, request.user).filter(pk=pk).first()

    def get(self, request, pk):
        obj = self._get_obj(request, pk)
        if not obj:
            return Response(status=404)
        return Response(SMSTemplateSerializer(obj).data)

    def put(self, request, pk):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        obj = self._get_obj(request, pk)
        if not obj:
            return Response(status=404)
        serializer = SMSTemplateCreateSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(SMSTemplateSerializer(obj).data)

    def delete(self, request, pk):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        obj = self._get_obj(request, pk)
        if not obj:
            return Response(status=404)
        obj.soft_delete()
        return Response(status=204)


# ---------------------------------------------------------------------------
# SMS Campaigns
# ---------------------------------------------------------------------------


@require_module("sms")
class SMSCampaignListCreateView(APIView):
    """GET / POST — SMS campaigns."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        qs = _school_qs(SMSCampaign, request.user)

        campaign_status = request.query_params.get("status")
        if campaign_status:
            qs = qs.filter(status=campaign_status.upper())

        return Response(SMSCampaignSerializer(qs, many=True).data)

    def post(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = SMSCampaignCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        campaign = serializer.save(school=request.user.school, created_by=request.user)

        # Estimate cost
        from apps.accounts.models import User

        config = _school_qs(SMSConfig, request.user).first()
        cost_per = float(config.cost_per_sms) if config else 5.0

        if campaign.target_type == SMSCampaign.TargetType.ALL:
            count = User.objects.filter(
                school=request.user.school, role="PARENT", is_active=True
            ).count()
        elif (
            campaign.target_type == SMSCampaign.TargetType.SECTION
            and campaign.target_section
        ):
            student_ids = campaign.target_section.classrooms.values_list(
                "students__id", flat=True
            )
            count = (
                User.objects.filter(
                    parent_children__id__in=student_ids, role="PARENT", is_active=True
                )
                .distinct()
                .count()
            )
        elif (
            campaign.target_type == SMSCampaign.TargetType.CLASS
            and campaign.target_class
        ):
            student_ids = campaign.target_class.students.values_list("id", flat=True)
            count = (
                User.objects.filter(
                    parent_children__id__in=student_ids, role="PARENT", is_active=True
                )
                .distinct()
                .count()
            )
        else:
            count = campaign.target_individuals.count()

        campaign.total_recipients = count
        campaign.estimated_cost = count * cost_per
        campaign.save(update_fields=["total_recipients", "estimated_cost"])

        # Auto-execute if no scheduled_at or scheduled_at is now
        if not campaign.scheduled_at or campaign.scheduled_at <= timezone.now():
            execute_campaign_task.delay(str(campaign.pk))
        else:
            campaign.status = SMSCampaign.Status.SCHEDULED
            campaign.save(update_fields=["status"])

        return Response(SMSCampaignSerializer(campaign).data, status=201)


@require_module("sms")
class SMSCampaignDetailView(APIView):
    """GET / DELETE — single SMS campaign."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        obj = _school_qs(SMSCampaign, request.user).filter(pk=pk).first()
        if not obj:
            return Response(status=404)
        # Include messages
        messages = SMSMessage.objects.filter(campaign=obj, is_deleted=False)
        data = SMSCampaignSerializer(obj).data
        data["messages"] = SMSMessageSerializer(messages[:100], many=True).data
        return Response(data)

    def delete(self, request, pk):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        obj = _school_qs(SMSCampaign, request.user).filter(pk=pk).first()
        if not obj:
            return Response(status=404)
        if obj.status in (SMSCampaign.Status.DRAFT, SMSCampaign.Status.SCHEDULED):
            obj.status = SMSCampaign.Status.CANCELLED
            obj.save(update_fields=["status"])
        obj.soft_delete()
        return Response(status=204)


# ---------------------------------------------------------------------------
# SMS Analytics / Dashboard
# ---------------------------------------------------------------------------


@require_module("sms")
class SMSAnalyticsView(APIView):
    """GET /api/v1/sms/analytics/ — SMS dashboard data."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        msgs = _school_qs(SMSMessage, request.user)
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_msgs = msgs.filter(created_at__gte=month_start)

        # Overall stats
        overall = msgs.aggregate(
            total=Count("id"),
            sent=Count("id", filter=Q(status="SENT")),
            delivered=Count("id", filter=Q(status="DELIVERED")),
            failed=Count("id", filter=Q(status="FAILED")),
            total_cost=Sum("cost"),
        )

        # Monthly stats
        monthly = month_msgs.aggregate(
            total=Count("id"),
            sent=Count("id", filter=Q(status="SENT")),
            delivered=Count("id", filter=Q(status="DELIVERED")),
            failed=Count("id", filter=Q(status="FAILED")),
            total_cost=Sum("cost"),
        )

        # Daily breakdown for current month (for chart)
        from django.db.models.functions import TruncDate

        daily = (
            month_msgs.annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        # By event type
        by_event = (
            month_msgs.values("event_type")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        # Recent campaigns
        campaigns = _school_qs(SMSCampaign, request.user)[:5]

        config = _school_qs(SMSConfig, request.user).first()

        return Response(
            {
                "balance": {
                    "remaining": config.remaining_balance if config else 0,
                    "quota": config.monthly_quota if config else 0,
                    "is_low": (config.remaining_balance <= config.alert_threshold)
                    if config
                    else False,
                },
                "overall": {
                    "total": overall["total"] or 0,
                    "sent": overall["sent"] or 0,
                    "delivered": overall["delivered"] or 0,
                    "failed": overall["failed"] or 0,
                    "total_cost": float(overall["total_cost"] or 0),
                },
                "monthly": {
                    "total": monthly["total"] or 0,
                    "sent": monthly["sent"] or 0,
                    "delivered": monthly["delivered"] or 0,
                    "failed": monthly["failed"] or 0,
                    "total_cost": float(monthly["total_cost"] or 0),
                    "delivery_rate": (
                        round(
                            (monthly["delivered"] or 0)
                            / max(monthly["sent"] or 1, 1)
                            * 100,
                            1,
                        )
                    ),
                },
                "daily_chart": [
                    {"date": str(d["day"]), "count": d["count"]} for d in daily
                ],
                "by_event_type": list(by_event),
                "recent_campaigns": SMSCampaignSerializer(campaigns, many=True).data,
            }
        )
