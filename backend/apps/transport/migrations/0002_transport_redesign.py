"""
Migration 0002 — Transport module redesign.

Drops the old scaffold models (Driver, BusLine, BusStop, TransportSubscription)
and creates the enhanced models:
  - BusDriver (replaces Driver)
  - TransportLine (replaces BusLine)
  - BusStop (redesigned with estimated_time)
  - StudentTransport (replaces TransportSubscription, OneToOne)
  - GPSPosition (new — real-time tracking)
  - TripLog (new — performance reporting)
"""

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("transport", "0001_initial"),
        ("schools", "0004_school_available_streams"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── Drop old tables ─────────────────────────────────
        migrations.DeleteModel(name="TransportSubscription"),
        migrations.DeleteModel(name="BusStop"),
        # Remove driver FK from BusLine before dropping both
        migrations.RemoveField(model_name="BusLine", name="driver"),
        migrations.DeleteModel(name="BusLine"),
        migrations.DeleteModel(name="Driver"),

        # ── BusDriver ──────────────────────────────────────
        migrations.CreateModel(
            name="BusDriver",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("first_name", models.CharField(max_length=100)),
                ("last_name", models.CharField(max_length=100)),
                ("phone", models.CharField(max_length=20)),
                ("national_id", models.CharField(blank=True, max_length=30)),
                ("date_of_birth", models.DateField(blank=True, null=True)),
                ("blood_type", models.CharField(blank=True, choices=[("A+", "A+"), ("A-", "A-"), ("B+", "B+"), ("B-", "B-"), ("AB+", "AB+"), ("AB-", "AB-"), ("O+", "O+"), ("O-", "O-")], max_length=5)),
                ("photo_url", models.CharField(blank=True, max_length=500)),
                ("address", models.CharField(blank=True, max_length=300)),
                ("license_number", models.CharField(blank=True, max_length=50)),
                ("license_type", models.CharField(blank=True, choices=[("B", "B"), ("C", "C"), ("D", "D"), ("E", "E")], max_length=10)),
                ("license_expiry", models.DateField(blank=True, null=True)),
                ("emergency_contact_name", models.CharField(blank=True, max_length=150)),
                ("emergency_contact_phone", models.CharField(blank=True, max_length=20)),
                ("hire_date", models.DateField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(app_label)s_%(class)s_created", to=settings.AUTH_USER_MODEL)),
                ("school", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="%(class)s_set", to="schools.school")),
            ],
            options={
                "db_table": "transport_drivers",
                "ordering": ["last_name", "first_name"],
            },
        ),

        # ── TransportLine ──────────────────────────────────
        migrations.CreateModel(
            name="TransportLine",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("name", models.CharField(help_text="e.g. Ligne 1 — Bab El Oued", max_length=100)),
                ("neighborhood", models.CharField(blank=True, help_text="Quarter / neighbourhood served", max_length=200)),
                ("description", models.TextField(blank=True)),
                ("vehicle_plate", models.CharField(blank=True, max_length=20)),
                ("vehicle_model", models.CharField(blank=True, max_length=100)),
                ("vehicle_year", models.PositiveIntegerField(blank=True, null=True)),
                ("vehicle_color", models.CharField(blank=True, max_length=50)),
                ("capacity", models.PositiveIntegerField(default=40)),
                ("departure_time", models.TimeField(blank=True, help_text="Morning departure from first stop", null=True)),
                ("return_time", models.TimeField(blank=True, help_text="Afternoon departure from school", null=True)),
                ("distance_km", models.DecimalField(blank=True, decimal_places=2, max_digits=7, null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("driver", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="lines", to="transport.busdriver")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(app_label)s_%(class)s_created", to=settings.AUTH_USER_MODEL)),
                ("school", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="%(class)s_set", to="schools.school")),
            ],
            options={
                "db_table": "transport_lines",
                "ordering": ["name"],
            },
        ),

        # ── BusStop ────────────────────────────────────────
        migrations.CreateModel(
            name="BusStop",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("name", models.CharField(max_length=200)),
                ("order", models.PositiveIntegerField(default=0)),
                ("estimated_time", models.TimeField(blank=True, help_text="Estimated arrival time at this stop", null=True)),
                ("latitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("longitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("line", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="stops", to="transport.transportline")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(app_label)s_%(class)s_created", to=settings.AUTH_USER_MODEL)),
                ("school", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="%(class)s_set", to="schools.school")),
            ],
            options={
                "db_table": "transport_stops",
                "ordering": ["line", "order"],
                "unique_together": {("line", "order")},
            },
        ),

        # ── StudentTransport ──────────────────────────────
        migrations.CreateModel(
            name="StudentTransport",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("start_date", models.DateField()),
                ("end_date", models.DateField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("student", models.OneToOneField(limit_choices_to={"role": "STUDENT"}, on_delete=django.db.models.deletion.CASCADE, related_name="transport_assignment", to=settings.AUTH_USER_MODEL)),
                ("line", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="students", to="transport.transportline")),
                ("pickup_stop", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="pickup_students", to="transport.busstop")),
                ("dropoff_stop", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="dropoff_students", to="transport.busstop")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(app_label)s_%(class)s_created", to=settings.AUTH_USER_MODEL)),
                ("school", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="%(class)s_set", to="schools.school")),
            ],
            options={
                "db_table": "transport_student_assignments",
                "ordering": ["-start_date"],
            },
        ),

        # ── GPSPosition ──────────────────────────────────
        migrations.CreateModel(
            name="GPSPosition",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("latitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("longitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("speed", models.DecimalField(blank=True, decimal_places=2, help_text="Speed in km/h", max_digits=6, null=True)),
                ("heading", models.DecimalField(blank=True, decimal_places=2, help_text="Bearing 0-360°", max_digits=5, null=True)),
                ("recorded_at", models.DateTimeField(help_text="Timestamp from the GPS device")),
                ("line", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="gps_positions", to="transport.transportline")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(app_label)s_%(class)s_created", to=settings.AUTH_USER_MODEL)),
                ("school", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="%(class)s_set", to="schools.school")),
            ],
            options={
                "db_table": "transport_gps_positions",
                "ordering": ["-recorded_at"],
            },
        ),

        # ── TripLog ───────────────────────────────────────
        migrations.CreateModel(
            name="TripLog",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("date", models.DateField()),
                ("trip_type", models.CharField(choices=[("DEPARTURE", "Departure (morning)"), ("RETURN", "Return (afternoon)")], default="DEPARTURE", max_length=10)),
                ("scheduled_time", models.TimeField(blank=True, null=True)),
                ("actual_time", models.TimeField(blank=True, null=True)),
                ("status", models.CharField(choices=[("ON_TIME", "On time"), ("DELAYED", "Delayed"), ("CANCELLED", "Cancelled")], default="ON_TIME", max_length=10)),
                ("delay_minutes", models.PositiveIntegerField(default=0)),
                ("passengers_count", models.PositiveIntegerField(default=0)),
                ("notes", models.TextField(blank=True)),
                ("line", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="trip_logs", to="transport.transportline")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(app_label)s_%(class)s_created", to=settings.AUTH_USER_MODEL)),
                ("school", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="%(class)s_set", to="schools.school")),
            ],
            options={
                "db_table": "transport_trip_logs",
                "ordering": ["-date", "trip_type"],
                "unique_together": {("line", "date", "trip_type")},
            },
        ),
    ]
