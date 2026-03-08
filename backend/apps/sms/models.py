"""
SMS module models — gateway config, templates, messages, campaigns.
"""

from django.db import models

from core.models import TenantModel


# ---------------------------------------------------------------------------
# SMSConfig — gateway configuration per school
# ---------------------------------------------------------------------------


class SMSConfig(TenantModel):
    """SMS gateway configuration for a school."""

    class GatewayProvider(models.TextChoices):
        CHINGUITEL = "CHINGUITEL", "Chinguitel"
        MOBILIS = "MOBILIS", "Mobilis SMS Pro"
        DJEZZY = "DJEZZY", "Djezzy Business"
        OOREDOO = "OOREDOO", "Ooredoo Business"
        TWILIO = "TWILIO", "Twilio"
        CUSTOM = "CUSTOM", "Custom API"

    provider = models.CharField(
        max_length=20,
        choices=GatewayProvider.choices,
        default=GatewayProvider.CUSTOM,
    )
    sender_name = models.CharField(
        max_length=11,
        help_text="Nom expéditeur (max 11 chars)",
    )
    api_key = models.CharField(max_length=255, blank=True)
    api_secret = models.CharField(max_length=255, blank=True)
    api_url = models.URLField(
        blank=True,
        help_text="URL de l'API passerelle SMS",
    )
    monthly_quota = models.PositiveIntegerField(
        default=1000,
        help_text="Quota mensuel de SMS",
    )
    remaining_balance = models.PositiveIntegerField(
        default=1000,
        help_text="Solde SMS restant ce mois",
    )
    alert_threshold = models.PositiveIntegerField(
        default=100,
        help_text="Seuil d'alerte solde bas",
    )
    is_active = models.BooleanField(default=True)
    cost_per_sms = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=5.00,
        help_text="Coût par SMS en DA",
    )

    class Meta:
        db_table = "sms_config"
        verbose_name = "SMS Configuration"
        verbose_name_plural = "SMS Configurations"

    def __str__(self):
        return f"{self.school} — {self.get_provider_display()}"


# ---------------------------------------------------------------------------
# SMSTemplate — reusable message templates with dynamic variables
# ---------------------------------------------------------------------------


class SMSTemplate(TenantModel):
    """Reusable SMS template with variable placeholders."""

    class Language(models.TextChoices):
        FR = "FR", "Français"
        AR = "AR", "العربية"

    class EventType(models.TextChoices):
        ABSENCE = "ABSENCE", "Absence"
        ARRIVAL = "ARRIVAL", "Arrivée"
        LOW_GRADE = "LOW_GRADE", "Note sous seuil"
        PAYMENT_REMINDER = "PAYMENT_REMINDER", "Rappel de paiement"
        PAYMENT_OVERDUE = "PAYMENT_OVERDUE", "Paiement en retard"
        URGENT_ANNOUNCEMENT = "URGENT_ANNOUNCEMENT", "Annonce urgente"
        EVENT_REMINDER = "EVENT_REMINDER", "Rappel événement"
        WELCOME = "WELCOME", "Bienvenue"
        CUSTOM = "CUSTOM", "Personnalisé"

    name = models.CharField(max_length=100)
    content = models.TextField(
        help_text=(
            "Variables disponibles : [NOM_ELEVE], [PRENOM_ELEVE], "
            "[CLASSE], [DATE], [HEURE], [MONTANT], [MATIERE], "
            "[NOTE], [ECOLE], [EVENEMENT]"
        ),
    )
    language = models.CharField(
        max_length=2,
        choices=Language.choices,
        default=Language.FR,
    )
    event_type = models.CharField(
        max_length=25,
        choices=EventType.choices,
        default=EventType.CUSTOM,
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "sms_templates"
        ordering = ["event_type", "name"]

    def __str__(self):
        return f"{self.name} ({self.get_event_type_display()})"

    def render(self, context: dict) -> str:
        """Replace placeholders with actual values."""
        text = self.content
        mapping = {
            "[NOM_ELEVE]": context.get("last_name", ""),
            "[PRENOM_ELEVE]": context.get("first_name", ""),
            "[CLASSE]": context.get("class_name", ""),
            "[DATE]": context.get("date", ""),
            "[HEURE]": context.get("time", ""),
            "[MONTANT]": context.get("amount", ""),
            "[MATIERE]": context.get("subject", ""),
            "[NOTE]": context.get("grade", ""),
            "[ECOLE]": context.get("school_name", ""),
            "[EVENEMENT]": context.get("event_name", ""),
        }
        for placeholder, value in mapping.items():
            text = text.replace(placeholder, str(value))
        return text


# ---------------------------------------------------------------------------
# SMSMessage — individual SMS record
# ---------------------------------------------------------------------------


class SMSMessage(TenantModel):
    """Single SMS message record."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        SENT = "SENT", "Envoyé"
        DELIVERED = "DELIVERED", "Livré"
        FAILED = "FAILED", "Échoué"

    class EventType(models.TextChoices):
        ABSENCE = "ABSENCE", "Absence"
        ARRIVAL = "ARRIVAL", "Arrivée"
        LOW_GRADE = "LOW_GRADE", "Note sous seuil"
        PAYMENT_REMINDER = "PAYMENT_REMINDER", "Rappel de paiement"
        PAYMENT_OVERDUE = "PAYMENT_OVERDUE", "Paiement en retard"
        URGENT_ANNOUNCEMENT = "URGENT_ANNOUNCEMENT", "Annonce urgente"
        EVENT_REMINDER = "EVENT_REMINDER", "Rappel événement"
        WELCOME = "WELCOME", "Bienvenue"
        CAMPAIGN = "CAMPAIGN", "Campagne"
        CUSTOM = "CUSTOM", "Personnalisé"

    recipient_phone = models.CharField(max_length=20)
    recipient_name = models.CharField(max_length=150, blank=True)
    content = models.TextField()
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.PENDING,
    )
    event_type = models.CharField(
        max_length=25,
        choices=EventType.choices,
        default=EventType.CUSTOM,
    )
    template = models.ForeignKey(
        SMSTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="messages",
    )
    campaign = models.ForeignKey(
        "SMSCampaign",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="messages",
    )
    cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    gateway_message_id = models.CharField(max_length=255, blank=True)
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "sms_messages"
        ordering = ["-created_at"]

    def __str__(self):
        return f"SMS → {self.recipient_phone} ({self.get_status_display()})"


# ---------------------------------------------------------------------------
# SMSCampaign — bulk SMS campaigns
# ---------------------------------------------------------------------------


class SMSCampaign(TenantModel):
    """Bulk SMS campaign targeting groups."""

    class TargetType(models.TextChoices):
        ALL = "ALL", "Tous les parents"
        SECTION = "SECTION", "Section"
        CLASS = "CLASS", "Classe"
        INDIVIDUAL = "INDIVIDUAL", "Individus"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Brouillon"
        SCHEDULED = "SCHEDULED", "Programmée"
        SENDING = "SENDING", "En cours d'envoi"
        COMPLETED = "COMPLETED", "Terminée"
        CANCELLED = "CANCELLED", "Annulée"

    title = models.CharField(max_length=200)
    message = models.TextField()
    target_type = models.CharField(
        max_length=15,
        choices=TargetType.choices,
        default=TargetType.ALL,
    )
    target_section = models.ForeignKey(
        "academics.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    target_class = models.ForeignKey(
        "academics.Classroom",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    target_individuals = models.ManyToManyField(
        "accounts.User",
        blank=True,
        related_name="sms_campaigns",
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    estimated_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    total_recipients = models.PositiveIntegerField(default=0)
    sent_count = models.PositiveIntegerField(default=0)
    delivered_count = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "sms_campaigns"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
