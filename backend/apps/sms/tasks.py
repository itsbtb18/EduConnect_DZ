"""
SMS Celery tasks — sending, campaigns, auto-triggered messages.
"""

import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Send single SMS
# ---------------------------------------------------------------------------


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_sms_task(self, message_id: str):
    """Send a single SMS via the school's configured gateway."""
    from .gateway import get_gateway
    from .models import SMSConfig, SMSMessage

    try:
        msg = SMSMessage.objects.select_related("school").get(pk=message_id)
    except SMSMessage.DoesNotExist:
        logger.error("SMSMessage %s not found", message_id)
        return

    config = SMSConfig.objects.filter(
        school=msg.school, is_active=True, is_deleted=False
    ).first()

    if not config:
        msg.status = SMSMessage.Status.FAILED
        msg.error_message = "Aucune passerelle SMS configurée"
        msg.save(update_fields=["status", "error_message"])
        return

    if config.remaining_balance <= 0:
        msg.status = SMSMessage.Status.FAILED
        msg.error_message = "Solde SMS épuisé"
        msg.save(update_fields=["status", "error_message"])
        return

    gateway = get_gateway(config)
    result = gateway.send(msg.recipient_phone, msg.content)

    if result.success:
        msg.status = SMSMessage.Status.SENT
        msg.gateway_message_id = result.message_id
        msg.sent_at = timezone.now()
        msg.cost = config.cost_per_sms
        config.remaining_balance = max(0, config.remaining_balance - 1)
        config.save(update_fields=["remaining_balance"])
    else:
        msg.status = SMSMessage.Status.FAILED
        msg.error_message = result.error

    msg.save(
        update_fields=[
            "status",
            "gateway_message_id",
            "sent_at",
            "cost",
            "error_message",
        ]
    )

    # Alert if balance is low
    if config.remaining_balance <= config.alert_threshold:
        logger.warning(
            "SMS balance low for school %s: %d remaining (threshold: %d)",
            msg.school,
            config.remaining_balance,
            config.alert_threshold,
        )


# ---------------------------------------------------------------------------
# Execute campaign
# ---------------------------------------------------------------------------


@shared_task(bind=True, max_retries=1)
def execute_campaign_task(self, campaign_id: str):
    """Execute a bulk SMS campaign."""
    from apps.accounts.models import User

    from .models import SMSCampaign, SMSMessage

    try:
        campaign = SMSCampaign.objects.get(pk=campaign_id)
    except SMSCampaign.DoesNotExist:
        logger.error("SMSCampaign %s not found", campaign_id)
        return

    if campaign.status not in (SMSCampaign.Status.DRAFT, SMSCampaign.Status.SCHEDULED):
        return

    campaign.status = SMSCampaign.Status.SENDING
    campaign.save(update_fields=["status"])

    # Resolve recipients
    parents = User.objects.filter(school=campaign.school, role="PARENT", is_active=True)

    if (
        campaign.target_type == SMSCampaign.TargetType.SECTION
        and campaign.target_section
    ):
        student_ids = campaign.target_section.classrooms.values_list(
            "students__id", flat=True
        )
        parents = parents.filter(parent_children__id__in=student_ids).distinct()
    elif campaign.target_type == SMSCampaign.TargetType.CLASS and campaign.target_class:
        student_ids = campaign.target_class.students.values_list("id", flat=True)
        parents = parents.filter(parent_children__id__in=student_ids).distinct()
    elif campaign.target_type == SMSCampaign.TargetType.INDIVIDUAL:
        parents = campaign.target_individuals.all()

    phones = []
    for parent in parents:
        phone = getattr(parent, "phone", None) or getattr(parent, "phone_number", "")
        if phone:
            phones.append(
                {"phone": phone, "name": parent.get_full_name(), "user": parent}
            )

    campaign.total_recipients = len(phones)
    campaign.save(update_fields=["total_recipients"])

    for entry in phones:
        msg = SMSMessage.objects.create(
            school=campaign.school,
            recipient_phone=entry["phone"],
            recipient_name=entry["name"],
            content=campaign.message,
            event_type=SMSMessage.EventType.CAMPAIGN,
            campaign=campaign,
        )
        send_sms_task.delay(str(msg.pk))
        campaign.sent_count += 1

    campaign.status = SMSCampaign.Status.COMPLETED
    campaign.completed_at = timezone.now()
    campaign.save(update_fields=["status", "sent_count", "completed_at"])


# ---------------------------------------------------------------------------
# Auto-triggered SMS helpers
# ---------------------------------------------------------------------------


@shared_task
def send_absence_sms(school_id: str, student_id: str, date: str):
    """Auto SMS for student absence (high priority, within 10 min)."""
    from apps.accounts.models import User

    from .models import SMSConfig, SMSMessage, SMSTemplate

    try:
        student = User.objects.get(pk=student_id)
    except User.DoesNotExist:
        return

    config = SMSConfig.objects.filter(
        school_id=school_id, is_active=True, is_deleted=False
    ).first()
    if not config or config.remaining_balance <= 0:
        return

    # Find parent
    parent = User.objects.filter(
        parent_children=student, role="PARENT", is_active=True
    ).first()
    if not parent:
        return
    phone = getattr(parent, "phone", None) or getattr(parent, "phone_number", "")
    if not phone:
        return

    # Find template or use default
    template = SMSTemplate.objects.filter(
        school_id=school_id, event_type="ABSENCE", is_active=True, is_deleted=False
    ).first()

    context = {
        "first_name": student.first_name,
        "last_name": student.last_name,
        "date": date,
        "school_name": student.school.name if student.school else "",
    }

    if template:
        content = template.render(context)
    else:
        content = (
            f"ILMI — Votre enfant {student.first_name} {student.last_name} "
            f"est absent(e) le {date}. Merci de contacter l'établissement."
        )

    msg = SMSMessage.objects.create(
        school_id=school_id,
        recipient_phone=phone,
        recipient_name=parent.get_full_name(),
        content=content,
        event_type=SMSMessage.EventType.ABSENCE,
        template=template,
    )
    send_sms_task.delay(str(msg.pk))


@shared_task
def send_low_grade_sms(school_id: str, student_id: str, subject: str, grade: str):
    """Auto SMS when a student's grade falls below threshold."""
    from apps.accounts.models import User

    from .models import SMSConfig, SMSMessage, SMSTemplate

    try:
        student = User.objects.get(pk=student_id)
    except User.DoesNotExist:
        return

    config = SMSConfig.objects.filter(
        school_id=school_id, is_active=True, is_deleted=False
    ).first()
    if not config or config.remaining_balance <= 0:
        return

    parent = User.objects.filter(
        parent_children=student, role="PARENT", is_active=True
    ).first()
    if not parent:
        return
    phone = getattr(parent, "phone", None) or getattr(parent, "phone_number", "")
    if not phone:
        return

    template = SMSTemplate.objects.filter(
        school_id=school_id, event_type="LOW_GRADE", is_active=True, is_deleted=False
    ).first()

    context = {
        "first_name": student.first_name,
        "last_name": student.last_name,
        "subject": subject,
        "grade": grade,
        "school_name": student.school.name if student.school else "",
    }

    if template:
        content = template.render(context)
    else:
        content = (
            f"ILMI — {student.first_name} {student.last_name} a obtenu {grade} "
            f"en {subject}. Merci de suivre avec l'enseignant."
        )

    msg = SMSMessage.objects.create(
        school_id=school_id,
        recipient_phone=phone,
        recipient_name=parent.get_full_name(),
        content=content,
        event_type=SMSMessage.EventType.LOW_GRADE,
        template=template,
    )
    send_sms_task.delay(str(msg.pk))


@shared_task
def send_payment_reminder_sms(
    school_id: str, student_id: str, amount: str, due_date: str
):
    """Auto SMS for payment reminders (J-7, J0, J+3)."""
    from apps.accounts.models import User

    from .models import SMSConfig, SMSMessage, SMSTemplate

    try:
        student = User.objects.get(pk=student_id)
    except User.DoesNotExist:
        return

    config = SMSConfig.objects.filter(
        school_id=school_id, is_active=True, is_deleted=False
    ).first()
    if not config or config.remaining_balance <= 0:
        return

    parent = User.objects.filter(
        parent_children=student, role="PARENT", is_active=True
    ).first()
    if not parent:
        return
    phone = getattr(parent, "phone", None) or getattr(parent, "phone_number", "")
    if not phone:
        return

    template = SMSTemplate.objects.filter(
        school_id=school_id,
        event_type="PAYMENT_REMINDER",
        is_active=True,
        is_deleted=False,
    ).first()

    context = {
        "first_name": student.first_name,
        "last_name": student.last_name,
        "amount": amount,
        "date": due_date,
        "school_name": student.school.name if student.school else "",
    }

    if template:
        content = template.render(context)
    else:
        content = (
            f"ILMI — Rappel: paiement de {amount} DA pour {student.first_name} "
            f"{student.last_name} attendu le {due_date}."
        )

    msg = SMSMessage.objects.create(
        school_id=school_id,
        recipient_phone=phone,
        recipient_name=parent.get_full_name(),
        content=content,
        event_type=SMSMessage.EventType.PAYMENT_REMINDER,
        template=template,
    )
    send_sms_task.delay(str(msg.pk))


@shared_task
def send_arrival_sms(school_id: str, student_id: str, time: str):
    """Auto SMS when fingerprint confirms student arrival."""
    from apps.accounts.models import User

    from .models import SMSConfig, SMSMessage, SMSTemplate

    try:
        student = User.objects.get(pk=student_id)
    except User.DoesNotExist:
        return

    config = SMSConfig.objects.filter(
        school_id=school_id, is_active=True, is_deleted=False
    ).first()
    if not config or config.remaining_balance <= 0:
        return

    parent = User.objects.filter(
        parent_children=student, role="PARENT", is_active=True
    ).first()
    if not parent:
        return
    phone = getattr(parent, "phone", None) or getattr(parent, "phone_number", "")
    if not phone:
        return

    template = SMSTemplate.objects.filter(
        school_id=school_id, event_type="ARRIVAL", is_active=True, is_deleted=False
    ).first()

    context = {
        "first_name": student.first_name,
        "last_name": student.last_name,
        "time": time,
        "school_name": student.school.name if student.school else "",
    }

    if template:
        content = template.render(context)
    else:
        content = (
            f"ILMI — {student.first_name} {student.last_name} est arrivé(e) "
            f"à l'école à {time}."
        )

    msg = SMSMessage.objects.create(
        school_id=school_id,
        recipient_phone=phone,
        recipient_name=parent.get_full_name(),
        content=content,
        event_type=SMSMessage.EventType.ARRIVAL,
        template=template,
    )
    send_sms_task.delay(str(msg.pk))


@shared_task
def send_urgent_announcement_sms(school_id: str, title: str, body: str):
    """Send urgent announcement to all parents via SMS."""
    from apps.accounts.models import User

    from .models import SMSConfig, SMSMessage

    config = SMSConfig.objects.filter(
        school_id=school_id, is_active=True, is_deleted=False
    ).first()
    if not config or config.remaining_balance <= 0:
        return

    parents = User.objects.filter(school_id=school_id, role="PARENT", is_active=True)

    content = f"ILMI URGENT — {title}: {body}"[:640]

    for parent in parents:
        phone = getattr(parent, "phone", None) or getattr(parent, "phone_number", "")
        if not phone:
            continue
        msg = SMSMessage.objects.create(
            school_id=school_id,
            recipient_phone=phone,
            recipient_name=parent.get_full_name(),
            content=content,
            event_type=SMSMessage.EventType.URGENT_ANNOUNCEMENT,
        )
        send_sms_task.delay(str(msg.pk))
