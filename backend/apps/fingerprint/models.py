"""
Fingerprint / biometric models — devices, templates, attendance log.
"""

import base64
import hashlib
import os

from django.conf import settings
from django.db import models
from django.utils import timezone

from core.models import TenantModel


# ---------------------------------------------------------------------------
# Encryption helpers (AES-256-GCM)
# ---------------------------------------------------------------------------


def _get_encryption_key():
    """Derive a 32-byte AES key from SECRET_KEY."""
    return hashlib.sha256(settings.SECRET_KEY.encode()).digest()


def encrypt_template(raw: bytes) -> bytes:
    """Encrypt fingerprint template data with AES-256-GCM."""
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    key = _get_encryption_key()
    nonce = os.urandom(12)
    ct = AESGCM(key).encrypt(nonce, raw, None)
    return base64.b64encode(nonce + ct)


def decrypt_template(stored: bytes) -> bytes:
    """Decrypt AES-256-GCM encrypted template data."""
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    key = _get_encryption_key()
    data = base64.b64decode(stored)
    nonce, ct = data[:12], data[12:]
    return AESGCM(key).decrypt(nonce, ct, None)


# ---------------------------------------------------------------------------
# FingerprintDevice
# ---------------------------------------------------------------------------


class FingerprintDevice(TenantModel):
    """A biometric device installed at the school."""

    class DeviceType(models.TextChoices):
        ZKTECO = "ZKTECO", "ZKTeco"
        SUPREMA = "SUPREMA", "Suprema"
        DIGITAL_PERSONA = "DIGITAL_PERSONA", "DigitalPersona"
        GENERIC = "GENERIC", "Générique"

    class DeviceStatus(models.TextChoices):
        ONLINE = "ONLINE", "En ligne"
        OFFLINE = "OFFLINE", "Hors ligne"
        MAINTENANCE = "MAINTENANCE", "Maintenance"
        ERROR = "ERROR", "Erreur"

    name = models.CharField(max_length=200)
    serial_number = models.CharField(max_length=100, unique=True)
    device_type = models.CharField(
        max_length=20, choices=DeviceType.choices, default=DeviceType.ZKTECO
    )
    location = models.CharField(max_length=200, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    port = models.PositiveIntegerField(default=4370)
    api_url = models.URLField(blank=True, default="")
    status = models.CharField(
        max_length=15, choices=DeviceStatus.choices, default=DeviceStatus.OFFLINE
    )
    firmware_version = models.CharField(max_length=50, blank=True, default="")
    last_heartbeat = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    last_sync = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "fingerprint_devices"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.serial_number})"

    @property
    def is_online(self):
        if not self.last_heartbeat:
            return False
        return (timezone.now() - self.last_heartbeat).total_seconds() < 120


# ---------------------------------------------------------------------------
# FingerprintRecord  (kept for backward compat — simple template)
# ---------------------------------------------------------------------------


class FingerprintRecord(TenantModel):
    """A user's enrolled fingerprint template (legacy simple)."""

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="fingerprint_records",
    )
    finger_index = models.PositiveSmallIntegerField(help_text="0-9 mapping to fingers")
    template_data = models.BinaryField(help_text="Encrypted fingerprint template")
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fingerprint_records"
        unique_together = ["user", "finger_index"]
        ordering = ["user", "finger_index"]

    def __str__(self):
        return f"{self.user} — Finger {self.finger_index}"


# ---------------------------------------------------------------------------
# FingerprintTemplate  (new — rich AES-256 encrypted template)
# ---------------------------------------------------------------------------

FINGER_CHOICES = [
    (0, "Pouce droit"),
    (1, "Index droit"),
    (2, "Majeur droit"),
    (3, "Annulaire droit"),
    (4, "Auriculaire droit"),
    (5, "Pouce gauche"),
    (6, "Index gauche"),
    (7, "Majeur gauche"),
    (8, "Annulaire gauche"),
    (9, "Auriculaire gauche"),
]


class FingerprintTemplate(TenantModel):
    """
    Rich fingerprint template with AES-256-GCM encryption.
    At least 2 fingers, 3 captures per finger required.
    """

    class Status(models.TextChoices):
        ENROLLED = "ENROLLED", "Enregistré"
        NOT_ENROLLED = "NOT_ENROLLED", "Non enregistré"
        RENEWAL_NEEDED = "RENEWAL_NEEDED", "À renouveler"

    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.CASCADE,
        related_name="fingerprint_templates",
    )
    finger_index = models.PositiveSmallIntegerField(choices=FINGER_CHOICES)
    capture_number = models.PositiveSmallIntegerField(
        default=1, help_text="1-3, several captures per finger"
    )
    encrypted_data = models.BinaryField(help_text="AES-256-GCM encrypted template")
    quality_score = models.PositiveSmallIntegerField(
        default=0, help_text="0-100, reader-reported quality"
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.ENROLLED
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "fingerprint_templates"
        unique_together = ["student", "finger_index", "capture_number"]
        ordering = ["student", "finger_index", "capture_number"]

    def __str__(self):
        return (
            f"{self.student} — Doigt {self.get_finger_index_display()}"
            f" — Capture {self.capture_number}"
        )

    def set_template_data(self, raw_bytes: bytes):
        """Encrypt and store template data."""
        self.encrypted_data = encrypt_template(raw_bytes)

    def get_template_data(self) -> bytes:
        """Decrypt and return raw template data."""
        return decrypt_template(bytes(self.encrypted_data))


# ---------------------------------------------------------------------------
# BiometricAttendanceLog (enhanced with auto tardiness)
# ---------------------------------------------------------------------------


class BiometricAttendanceLog(TenantModel):
    """An attendance scan event captured by a device."""

    class EventType(models.TextChoices):
        CHECK_IN = "CHECK_IN", "Arrivée"
        CHECK_OUT = "CHECK_OUT", "Départ"

    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.CASCADE,
        related_name="biometric_logs",
        null=True,
        blank=True,
    )
    # Legacy FK kept for backward compat
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="biometric_attendance",
        null=True,
        blank=True,
    )
    device = models.ForeignKey(
        FingerprintDevice,
        on_delete=models.SET_NULL,
        null=True,
        related_name="attendance_logs",
    )
    timestamp = models.DateTimeField()
    event_type = models.CharField(
        max_length=10, choices=EventType.choices, default=EventType.CHECK_IN
    )
    verified = models.BooleanField(default=True)
    confidence_score = models.PositiveSmallIntegerField(
        default=100, help_text="Match confidence 0-100"
    )

    # Tardiness — auto-calculated
    is_late = models.BooleanField(default=False)
    late_minutes = models.PositiveIntegerField(default=0)
    expected_time = models.TimeField(
        null=True, blank=True, help_text="Expected arrival time from timetable"
    )

    # Sync tracking
    synced_to_attendance = models.BooleanField(default=False)
    attendance_record = models.ForeignKey(
        "attendance.AttendanceRecord",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="biometric_log",
    )
    is_manual_fallback = models.BooleanField(default=False)

    class Meta:
        db_table = "fingerprint_attendance_logs"
        ordering = ["-timestamp"]

    def __str__(self):
        name = self.student or self.user
        return f"{name} — {self.get_event_type_display()} — {self.timestamp}"

    def calculate_tardiness(self, expected_time=None):
        """Calculate if student is late and by how many minutes."""
        ref = expected_time or self.expected_time
        if not ref:
            return
        arrival = self.timestamp.time()
        from datetime import datetime, timedelta

        today = self.timestamp.date()
        expected_dt = datetime.combine(today, ref)
        arrival_dt = datetime.combine(today, arrival)
        diff = arrival_dt - expected_dt
        if diff > timedelta(0):
            self.is_late = True
            self.late_minutes = int(diff.total_seconds() / 60)
        else:
            self.is_late = False
            self.late_minutes = 0
