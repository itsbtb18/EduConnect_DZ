"""
Tests for the Transport module — PROMPT 5.4.

Covers:
  - BusDriver CRUD (registration, ID card, license validity)
  - TransportLine CRUD (neighbourhood, vehicle info, schedule)
  - BusStop CRUD (ordered waypoints, estimated times)
  - StudentTransport assignment CRUD
  - GPS position push + parent live-tracking
  - TripLog CRUD + performance report
  - Parent transport info endpoint
  - Celery tasks: departure & return reminders
  - Model properties & constraints
  - Permission checks (parent vs admin)
"""

import datetime
from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework.test import APIClient


# ─────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────


@pytest.fixture
def school(db):
    from apps.schools.models import School

    return School.objects.create(
        name="Transport Test School",
        subdomain="transport-test",
        address="1 Rue Transport, Alger",
        phone="0551200000",
        wilaya="Alger",
        is_active=True,
    )


@pytest.fixture
def admin_user(db, school):
    from apps.accounts.models import User

    return User.objects.create_user(
        phone_number="0570000001",
        password="Test@1234",
        school=school,
        role="ADMIN",
        first_name="Admin",
        last_name="Transport",
        is_staff=True,
    )


@pytest.fixture
def student_user(db, school):
    from apps.accounts.models import User

    return User.objects.create_user(
        phone_number="0570000002",
        password="Test@1234",
        school=school,
        role="STUDENT",
        first_name="Amine",
        last_name="Benali",
    )


@pytest.fixture
def student_user2(db, school):
    from apps.accounts.models import User

    return User.objects.create_user(
        phone_number="0570000003",
        password="Test@1234",
        school=school,
        role="STUDENT",
        first_name="Sara",
        last_name="Khelif",
    )


@pytest.fixture
def parent_user(db, school, student_user):
    from apps.accounts.models import User

    parent = User.objects.create_user(
        phone_number="0570000004",
        password="Test@1234",
        school=school,
        role="PARENT",
        first_name="Nadia",
        last_name="Benali",
    )
    sp = student_user.student_profile
    pp = parent.parent_profile
    pp.children.add(sp)
    return parent


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def parent_client(parent_user):
    client = APIClient()
    client.force_authenticate(user=parent_user)
    return client


@pytest.fixture
def student_client(student_user):
    client = APIClient()
    client.force_authenticate(user=student_user)
    return client


@pytest.fixture
def driver(db, school):
    from apps.transport.models import BusDriver

    return BusDriver.objects.create(
        school=school,
        first_name="Karim",
        last_name="Mesbah",
        phone="0551111111",
        national_id="12345678",
        date_of_birth="1985-03-15",
        blood_type="A+",
        license_number="DL-2020-1234",
        license_type="D",
        license_expiry="2028-12-31",
        emergency_contact_name="Fatima Mesbah",
        emergency_contact_phone="0559999999",
        hire_date="2023-09-01",
        is_active=True,
    )


@pytest.fixture
def line(db, school, driver):
    from apps.transport.models import TransportLine

    return TransportLine.objects.create(
        school=school,
        name="Ligne 1 — Bab El Oued",
        neighborhood="Bab El Oued",
        description="Route principale quartier nord",
        driver=driver,
        vehicle_plate="00123-116-16",
        vehicle_model="Hyundai County",
        vehicle_year=2022,
        vehicle_color="Jaune",
        capacity=30,
        departure_time="07:00",
        return_time="16:30",
        distance_km="12.50",
        is_active=True,
    )


@pytest.fixture
def stop1(db, school, line):
    from apps.transport.models import BusStop

    return BusStop.objects.create(
        school=school,
        line=line,
        name="Place des Martyrs",
        order=1,
        estimated_time="07:05",
        latitude="36.786500",
        longitude="3.060200",
    )


@pytest.fixture
def stop2(db, school, line):
    from apps.transport.models import BusStop

    return BusStop.objects.create(
        school=school,
        line=line,
        name="Rue Hassiba",
        order=2,
        estimated_time="07:15",
        latitude="36.790000",
        longitude="3.065000",
    )


@pytest.fixture
def student_transport(db, school, student_user, line, stop1, stop2):
    from apps.transport.models import StudentTransport

    return StudentTransport.objects.create(
        school=school,
        student=student_user,
        line=line,
        pickup_stop=stop1,
        dropoff_stop=stop2,
        start_date="2025-09-08",
        is_active=True,
    )


# ─────────────────────────────────────────────────────────────────────────
# BUS DRIVER TESTS
# ─────────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestBusDriverCRUD:
    def test_list_drivers(self, admin_client, driver):
        resp = admin_client.get("/api/v1/transport/drivers/")
        assert resp.status_code == 200
        assert resp.data["count"] >= 1

    def test_create_driver(self, admin_client):
        data = {
            "first_name": "Omar",
            "last_name": "Saidi",
            "phone": "0552222222",
            "national_id": "99887766",
            "license_number": "DL-2024-5678",
            "license_type": "D",
            "license_expiry": "2030-06-30",
            "blood_type": "O+",
        }
        resp = admin_client.post("/api/v1/transport/drivers/", data)
        assert resp.status_code == 201
        assert resp.data["first_name"] == "Omar"
        assert resp.data["national_id"] == "99887766"

    def test_detail_driver(self, admin_client, driver):
        resp = admin_client.get(f"/api/v1/transport/drivers/{driver.id}/")
        assert resp.status_code == 200
        assert resp.data["last_name"] == "Mesbah"

    def test_update_driver(self, admin_client, driver):
        resp = admin_client.patch(
            f"/api/v1/transport/drivers/{driver.id}/",
            {"phone": "0553333333"},
        )
        assert resp.status_code == 200
        assert resp.data["phone"] == "0553333333"

    def test_delete_driver(self, admin_client, driver):
        resp = admin_client.delete(f"/api/v1/transport/drivers/{driver.id}/")
        assert resp.status_code == 204
        from apps.transport.models import BusDriver
        driver.refresh_from_db()
        assert driver.is_deleted is True

    def test_driver_id_card(self, admin_client, driver):
        resp = admin_client.get(f"/api/v1/transport/drivers/{driver.id}/id-card/")
        assert resp.status_code == 200
        assert resp.data["full_name"] == "Karim Mesbah"
        assert resp.data["blood_type"] == "A+"
        assert resp.data["national_id"] == "12345678"
        assert resp.data["license_valid"] is True

    def test_search_drivers(self, admin_client, driver):
        resp = admin_client.get("/api/v1/transport/drivers/?q=Mesbah")
        assert resp.status_code == 200
        assert resp.data["count"] == 1


# ─────────────────────────────────────────────────────────────────────────
# TRANSPORT LINE TESTS
# ─────────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestTransportLineCRUD:
    def test_list_lines(self, admin_client, line):
        resp = admin_client.get("/api/v1/transport/lines/")
        assert resp.status_code == 200
        assert resp.data["count"] >= 1

    def test_create_line(self, admin_client, driver):
        data = {
            "name": "Ligne 2 — Kouba",
            "neighborhood": "Kouba",
            "driver": str(driver.id),
            "vehicle_plate": "00456-116-16",
            "vehicle_model": "Toyota Coaster",
            "vehicle_year": 2023,
            "vehicle_color": "Blanc",
            "capacity": 25,
            "departure_time": "07:15",
            "return_time": "16:45",
        }
        resp = admin_client.post("/api/v1/transport/lines/", data)
        assert resp.status_code == 201
        assert resp.data["neighborhood"] == "Kouba"
        assert resp.data["vehicle_plate"] == "00456-116-16"

    def test_detail_line_with_stops(self, admin_client, line, stop1, stop2):
        resp = admin_client.get(f"/api/v1/transport/lines/{line.id}/")
        assert resp.status_code == 200
        assert len(resp.data["stops"]) == 2
        assert resp.data["vehicle_model"] == "Hyundai County"

    def test_update_line(self, admin_client, line):
        resp = admin_client.patch(
            f"/api/v1/transport/lines/{line.id}/",
            {"capacity": 35},
        )
        assert resp.status_code == 200
        assert resp.data["capacity"] == 35

    def test_delete_line(self, admin_client, line):
        resp = admin_client.delete(f"/api/v1/transport/lines/{line.id}/")
        assert resp.status_code == 204
        line.refresh_from_db()
        assert line.is_deleted is True

    def test_filter_by_neighborhood(self, admin_client, line):
        resp = admin_client.get("/api/v1/transport/lines/?neighborhood=Bab")
        assert resp.status_code == 200
        assert resp.data["count"] == 1


# ─────────────────────────────────────────────────────────────────────────
# BUS STOP TESTS
# ─────────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestBusStopCRUD:
    def test_list_stops(self, admin_client, stop1, stop2):
        resp = admin_client.get("/api/v1/transport/stops/")
        assert resp.status_code == 200
        assert resp.data["count"] == 2

    def test_create_stop(self, admin_client, line):
        data = {
            "line": str(line.id),
            "name": "Arrêt Gare",
            "order": 3,
            "estimated_time": "07:25",
            "latitude": "36.750000",
            "longitude": "3.040000",
        }
        resp = admin_client.post("/api/v1/transport/stops/", data)
        assert resp.status_code == 201
        assert resp.data["name"] == "Arrêt Gare"

    def test_filter_stops_by_line(self, admin_client, line, stop1, stop2):
        resp = admin_client.get(f"/api/v1/transport/stops/?line={line.id}")
        assert resp.status_code == 200
        assert resp.data["count"] == 2

    def test_update_stop(self, admin_client, stop1):
        resp = admin_client.patch(
            f"/api/v1/transport/stops/{stop1.id}/",
            {"estimated_time": "07:10"},
        )
        assert resp.status_code == 200

    def test_delete_stop(self, admin_client, stop1):
        resp = admin_client.delete(f"/api/v1/transport/stops/{stop1.id}/")
        assert resp.status_code == 204


# ─────────────────────────────────────────────────────────────────────────
# STUDENT TRANSPORT ASSIGNMENT TESTS
# ─────────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestStudentTransportCRUD:
    def test_list_assignments(self, admin_client, student_transport):
        resp = admin_client.get("/api/v1/transport/students/")
        assert resp.status_code == 200
        assert resp.data["count"] >= 1

    def test_create_assignment(self, admin_client, student_user2, line, stop1):
        data = {
            "student": str(student_user2.id),
            "line": str(line.id),
            "pickup_stop": str(stop1.id),
            "start_date": "2025-09-08",
            "is_active": True,
        }
        resp = admin_client.post("/api/v1/transport/students/", data)
        assert resp.status_code == 201
        assert str(resp.data["student"]) == str(student_user2.id)

    def test_detail_assignment(self, admin_client, student_transport):
        resp = admin_client.get(
            f"/api/v1/transport/students/{student_transport.id}/"
        )
        assert resp.status_code == 200
        assert resp.data["line_name"] == "Ligne 1 — Bab El Oued"

    def test_update_assignment(self, admin_client, student_transport):
        resp = admin_client.patch(
            f"/api/v1/transport/students/{student_transport.id}/",
            {"is_active": False},
        )
        assert resp.status_code == 200
        assert resp.data["is_active"] is False

    def test_delete_assignment(self, admin_client, student_transport):
        resp = admin_client.delete(
            f"/api/v1/transport/students/{student_transport.id}/"
        )
        assert resp.status_code == 204

    def test_filter_by_line(self, admin_client, student_transport, line):
        resp = admin_client.get(f"/api/v1/transport/students/?line={line.id}")
        assert resp.status_code == 200
        assert resp.data["count"] == 1


# ─────────────────────────────────────────────────────────────────────────
# GPS TRACKING TESTS
# ─────────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestGPSTracking:
    def test_push_gps_position(self, admin_client, line):
        data = {
            "line": str(line.id),
            "latitude": "36.786500",
            "longitude": "3.060200",
            "speed": "35.50",
            "heading": "180.00",
            "recorded_at": "2026-03-06T08:00:00Z",
        }
        resp = admin_client.post("/api/v1/transport/gps/", data)
        assert resp.status_code == 201
        assert resp.data["latitude"] == "36.786500"

    def test_parent_gps_tracking(self, parent_client, student_transport, line):
        from apps.transport.models import GPSPosition

        GPSPosition.objects.create(
            school=line.school,
            line=line,
            latitude="36.790000",
            longitude="3.065000",
            speed="25.00",
            heading="90.00",
            recorded_at=timezone.now(),
        )
        resp = parent_client.get("/api/v1/transport/gps/track/")
        assert resp.status_code == 200
        assert len(resp.data["results"]) == 1
        assert resp.data["results"][0]["gps"] is not None
        assert resp.data["results"][0]["child_name"] == "Amine Benali"

    def test_parent_no_children_assigned(self, parent_client):
        """Parent with no transport-assigned children sees empty results."""
        # parent_user's child has no transport assignment here
        resp = parent_client.get("/api/v1/transport/gps/track/")
        assert resp.status_code == 200
        assert len(resp.data["results"]) == 0

    def test_student_cannot_push_gps(self, student_client, line):
        """GPS push is admin-only."""
        data = {
            "line": str(line.id),
            "latitude": "36.786500",
            "longitude": "3.060200",
            "recorded_at": "2026-03-06T08:00:00Z",
        }
        resp = student_client.post("/api/v1/transport/gps/", data)
        assert resp.status_code == 403


# ─────────────────────────────────────────────────────────────────────────
# TRIP LOG & PERFORMANCE REPORT TESTS
# ─────────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestTripLogAndReport:
    def test_create_trip_log(self, admin_client, line):
        data = {
            "line": str(line.id),
            "date": "2026-03-05",
            "trip_type": "DEPARTURE",
            "scheduled_time": "07:00",
            "actual_time": "07:05",
            "status": "DELAYED",
            "delay_minutes": 5,
            "passengers_count": 28,
        }
        resp = admin_client.post("/api/v1/transport/trips/", data)
        assert resp.status_code == 201
        assert resp.data["status"] == "DELAYED"

    def test_list_trip_logs(self, admin_client, line):
        from apps.transport.models import TripLog

        TripLog.objects.create(
            school=line.school,
            line=line,
            date="2026-03-04",
            trip_type="DEPARTURE",
            status="ON_TIME",
            passengers_count=25,
        )
        resp = admin_client.get("/api/v1/transport/trips/")
        assert resp.status_code == 200
        assert resp.data["count"] >= 1

    def test_trip_log_detail(self, admin_client, line):
        from apps.transport.models import TripLog

        trip = TripLog.objects.create(
            school=line.school,
            line=line,
            date="2026-03-03",
            trip_type="RETURN",
            status="ON_TIME",
            passengers_count=20,
        )
        resp = admin_client.get(f"/api/v1/transport/trips/{trip.id}/")
        assert resp.status_code == 200
        assert resp.data["trip_type"] == "RETURN"

    def test_performance_report_empty(self, admin_client):
        resp = admin_client.get("/api/v1/transport/report/")
        assert resp.status_code == 200
        assert resp.data["total_trips"] == 0

    def test_performance_report_with_data(self, admin_client, line):
        from apps.transport.models import TripLog

        # Create some trip logs
        TripLog.objects.create(
            school=line.school, line=line,
            date="2026-03-01", trip_type="DEPARTURE",
            status="ON_TIME", delay_minutes=0, passengers_count=28,
        )
        TripLog.objects.create(
            school=line.school, line=line,
            date="2026-03-01", trip_type="RETURN",
            status="DELAYED", delay_minutes=10, passengers_count=26,
        )
        TripLog.objects.create(
            school=line.school, line=line,
            date="2026-03-02", trip_type="DEPARTURE",
            status="ON_TIME", delay_minutes=0, passengers_count=30,
        )
        TripLog.objects.create(
            school=line.school, line=line,
            date="2026-03-02", trip_type="RETURN",
            status="CANCELLED", delay_minutes=0, passengers_count=0,
        )

        resp = admin_client.get("/api/v1/transport/report/")
        assert resp.status_code == 200
        assert resp.data["total_trips"] == 4
        assert resp.data["on_time_count"] == 2
        assert resp.data["delayed_count"] == 1
        assert resp.data["cancelled_count"] == 1
        assert resp.data["on_time_rate"] == 50.0
        assert len(resp.data["lines"]) == 1

    def test_report_filter_by_date(self, admin_client, line):
        from apps.transport.models import TripLog

        TripLog.objects.create(
            school=line.school, line=line,
            date="2026-02-15", trip_type="DEPARTURE",
            status="ON_TIME", passengers_count=20,
        )
        TripLog.objects.create(
            school=line.school, line=line,
            date="2026-03-10", trip_type="DEPARTURE",
            status="DELAYED", delay_minutes=15, passengers_count=22,
        )
        resp = admin_client.get(
            "/api/v1/transport/report/?date_from=2026-03-01&date_to=2026-03-31"
        )
        assert resp.status_code == 200
        assert resp.data["total_trips"] == 1


# ─────────────────────────────────────────────────────────────────────────
# PARENT TRANSPORT INFO TESTS
# ─────────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestParentTransportInfo:
    def test_parent_sees_child_transport(
        self, parent_client, student_transport, line, stop1, stop2
    ):
        resp = parent_client.get("/api/v1/transport/parent-info/")
        assert resp.status_code == 200
        results = resp.data["results"]
        assert len(results) == 1
        info = results[0]
        assert info["child_name"] == "Amine Benali"
        assert info["line"]["name"] == "Ligne 1 — Bab El Oued"
        assert info["line"]["neighborhood"] == "Bab El Oued"
        assert info["driver"]["name"] == "Karim Mesbah"
        assert len(info["stops"]) == 2

    def test_parent_no_transport(self, parent_client):
        """Parent whose child has no assignment sees empty."""
        resp = parent_client.get("/api/v1/transport/parent-info/")
        assert resp.status_code == 200
        assert len(resp.data["results"]) == 0

    def test_admin_cannot_use_parent_endpoint(self, admin_client):
        resp = admin_client.get("/api/v1/transport/parent-info/")
        assert resp.status_code == 403


# ─────────────────────────────────────────────────────────────────────────
# CELERY TASKS TESTS
# ─────────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestTransportCeleryTasks:
    @patch("apps.transport.tasks._send_fcm_for_users")
    def test_departure_reminder_on_school_day(
        self, mock_fcm, school, driver, line, student_transport, parent_user
    ):
        from apps.transport.tasks import send_transport_departure_reminder

        # Patch today to a Sunday (school day in Algeria)
        with patch("apps.transport.tasks.datetime") as mock_dt:
            mock_dt.date.today.return_value = datetime.date(2026, 3, 8)  # Sunday
            mock_dt.date.side_effect = lambda *a, **kw: datetime.date(*a, **kw)
            send_transport_departure_reminder()

        assert mock_fcm.called

    @patch("apps.transport.tasks._send_fcm_for_users")
    def test_departure_reminder_skips_weekend(self, mock_fcm):
        from apps.transport.tasks import send_transport_departure_reminder

        # Patch today to a Friday (not a school day)
        with patch("apps.transport.tasks.datetime") as mock_dt:
            mock_dt.date.today.return_value = datetime.date(2026, 3, 6)  # Friday
            mock_dt.date.side_effect = lambda *a, **kw: datetime.date(*a, **kw)
            send_transport_departure_reminder()

        assert not mock_fcm.called

    @patch("apps.transport.tasks._send_fcm_for_users")
    def test_return_reminder(
        self, mock_fcm, school, driver, line, student_transport, parent_user
    ):
        from apps.transport.tasks import send_transport_return_reminder

        with patch("apps.transport.tasks.datetime") as mock_dt:
            mock_dt.date.today.return_value = datetime.date(2026, 3, 8)  # Sunday
            mock_dt.date.side_effect = lambda *a, **kw: datetime.date(*a, **kw)
            send_transport_return_reminder()

        assert mock_fcm.called


# ─────────────────────────────────────────────────────────────────────────
# MODEL PROPERTIES & CONSTRAINTS
# ─────────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestTransportModels:
    def test_driver_full_name(self, driver):
        assert driver.full_name == "Karim Mesbah"

    def test_driver_license_valid(self, driver):
        assert driver.license_valid is True

    def test_driver_license_expired(self, school):
        from apps.transport.models import BusDriver

        d = BusDriver.objects.create(
            school=school,
            first_name="Ali",
            last_name="Expired",
            phone="0550000000",
            license_expiry="2020-01-01",
        )
        assert d.license_valid is False

    def test_line_enrolled_count(self, line, student_transport):
        assert line.enrolled_count == 1

    def test_bus_stop_str(self, stop1):
        assert "Bab El Oued" in str(stop1)
        assert "Martyrs" in str(stop1)

    def test_trip_log_unique_constraint(self, line):
        from django.db import IntegrityError
        from apps.transport.models import TripLog

        TripLog.objects.create(
            school=line.school, line=line,
            date="2026-03-06", trip_type="DEPARTURE",
            status="ON_TIME",
        )
        with pytest.raises(IntegrityError):
            TripLog.objects.create(
                school=line.school, line=line,
                date="2026-03-06", trip_type="DEPARTURE",
                status="DELAYED",
            )

    def test_student_transport_onetoone(self, student_transport, student_user, line, school):
        """Cannot assign same student twice."""
        from django.db import IntegrityError
        from apps.transport.models import StudentTransport

        with pytest.raises(IntegrityError):
            StudentTransport.objects.create(
                school=school,
                student=student_user,
                line=line,
                start_date="2025-10-01",
            )
