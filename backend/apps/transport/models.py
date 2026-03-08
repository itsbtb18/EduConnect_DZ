"""
Transport models — bus lines by neighbourhood, drivers with ID cards,
vehicle info, student assignment, GPS tracking, and trip logs.
"""

import datetime

from django.db import models

from core.models import TenantModel


# =====================================================================
# BUS DRIVER — registration & ID-card info
# =====================================================================


class BusDriver(TenantModel):
    """
    Bus driver employed by the school.
    Stores identity, license, and emergency-contact data needed for
    the printed or digital ID card.
    """

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    national_id = models.CharField(max_length=30, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    blood_type = models.CharField(
        max_length=5,
        blank=True,
        choices=[
            ("A+", "A+"), ("A-", "A-"),
            ("B+", "B+"), ("B-", "B-"),
            ("AB+", "AB+"), ("AB-", "AB-"),
            ("O+", "O+"), ("O-", "O-"),
        ],
    )
    photo_url = models.CharField(max_length=500, blank=True)
    address = models.CharField(max_length=300, blank=True)

    # License
    license_number = models.CharField(max_length=50, blank=True)
    license_type = models.CharField(
        max_length=10,
        blank=True,
        choices=[("B", "B"), ("C", "C"), ("D", "D"), ("E", "E")],
    )
    license_expiry = models.DateField(blank=True, null=True)

    # Emergency contact
    emergency_contact_name = models.CharField(max_length=150, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)

    hire_date = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "transport_drivers"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def license_valid(self):
        """True when the license expiry is in the future or not set."""
        if not self.license_expiry:
            return True
        today = datetime.date.today()
        if isinstance(self.license_expiry, str):
            return datetime.date.fromisoformat(self.license_expiry) >= today
        return self.license_expiry >= today


# =====================================================================
# TRANSPORT LINE — route by neighbourhood with vehicle info
# =====================================================================


class TransportLine(TenantModel):
    """
    A school-bus route.  Contains neighbourhood, schedule times,
    and the full vehicle description.
    """

    name = models.CharField(
        max_length=100,
        help_text="e.g. Ligne 1 — Bab El Oued",
    )
    neighborhood = models.CharField(
        max_length=200,
        blank=True,
        help_text="Quarter / neighbourhood served",
    )
    description = models.TextField(blank=True)

    # Driver
    driver = models.ForeignKey(
        BusDriver,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lines",
    )

    # Vehicle info
    vehicle_plate = models.CharField(max_length=20, blank=True)
    vehicle_model = models.CharField(max_length=100, blank=True)
    vehicle_year = models.PositiveIntegerField(blank=True, null=True)
    vehicle_color = models.CharField(max_length=50, blank=True)
    capacity = models.PositiveIntegerField(default=40)

    # Schedule
    departure_time = models.TimeField(
        blank=True, null=True,
        help_text="Morning departure from first stop",
    )
    return_time = models.TimeField(
        blank=True, null=True,
        help_text="Afternoon departure from school",
    )
    distance_km = models.DecimalField(
        max_digits=7, decimal_places=2, blank=True, null=True,
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "transport_lines"
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def enrolled_count(self):
        return self.students.filter(is_active=True, is_deleted=False).count()


# =====================================================================
# BUS STOP — ordered waypoints along a line
# =====================================================================


class BusStop(TenantModel):
    """An ordered stop along a transport line."""

    line = models.ForeignKey(
        TransportLine, on_delete=models.CASCADE, related_name="stops",
    )
    name = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)
    estimated_time = models.TimeField(
        blank=True, null=True,
        help_text="Estimated arrival time at this stop",
    )
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True,
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True,
    )

    class Meta:
        db_table = "transport_stops"
        ordering = ["line", "order"]
        unique_together = ["line", "order"]

    def __str__(self):
        return f"{self.line.name} — {self.name}"


# =====================================================================
# STUDENT TRANSPORT — student ↔ line assignment
# =====================================================================


class StudentTransport(TenantModel):
    """Assigns a student to a transport line with pickup/dropoff stops."""

    student = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="transport_assignment",
        limit_choices_to={"role": "STUDENT"},
    )
    line = models.ForeignKey(
        TransportLine,
        on_delete=models.CASCADE,
        related_name="students",
    )
    pickup_stop = models.ForeignKey(
        BusStop,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pickup_students",
    )
    dropoff_stop = models.ForeignKey(
        BusStop,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dropoff_students",
    )
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "transport_student_assignments"
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.student} → {self.line.name}"


# =====================================================================
# GPS POSITION — real-time bus location for parent tracking
# =====================================================================


class GPSPosition(TenantModel):
    """
    Periodic GPS ping from a bus (keyed by transport line).
    Parents query latest position for any line their child is assigned to.
    """

    line = models.ForeignKey(
        TransportLine,
        on_delete=models.CASCADE,
        related_name="gps_positions",
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    speed = models.DecimalField(
        max_digits=6, decimal_places=2, blank=True, null=True,
        help_text="Speed in km/h",
    )
    heading = models.DecimalField(
        max_digits=5, decimal_places=2, blank=True, null=True,
        help_text="Bearing 0-360°",
    )
    recorded_at = models.DateTimeField(
        help_text="Timestamp from the GPS device",
    )

    class Meta:
        db_table = "transport_gps_positions"
        ordering = ["-recorded_at"]

    def __str__(self):
        return f"{self.line.name} @ {self.recorded_at}"


# =====================================================================
# TRIP LOG — daily trip records for performance reporting
# =====================================================================


class TripLog(TenantModel):
    """
    Daily log entry for a bus trip (morning departure or afternoon return).
    Used for performance / punctuality reports.
    """

    class TripType(models.TextChoices):
        DEPARTURE = "DEPARTURE", "Departure (morning)"
        RETURN = "RETURN", "Return (afternoon)"

    class TripStatus(models.TextChoices):
        ON_TIME = "ON_TIME", "On time"
        DELAYED = "DELAYED", "Delayed"
        CANCELLED = "CANCELLED", "Cancelled"

    line = models.ForeignKey(
        TransportLine,
        on_delete=models.CASCADE,
        related_name="trip_logs",
    )
    date = models.DateField()
    trip_type = models.CharField(
        max_length=10,
        choices=TripType.choices,
        default=TripType.DEPARTURE,
    )
    scheduled_time = models.TimeField(blank=True, null=True)
    actual_time = models.TimeField(blank=True, null=True)
    status = models.CharField(
        max_length=10,
        choices=TripStatus.choices,
        default=TripStatus.ON_TIME,
    )
    delay_minutes = models.PositiveIntegerField(default=0)
    passengers_count = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "transport_trip_logs"
        ordering = ["-date", "trip_type"]
        unique_together = ["line", "date", "trip_type"]

    def __str__(self):
        return f"{self.line.name} — {self.date} ({self.trip_type})"
