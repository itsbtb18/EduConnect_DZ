"""
Tests for the Canteen module — PROMPT 5.3.

Covers:
  - CanteenStudent CRUD (enrollment, nutritional status, dietary restrictions)
  - Menu CRUD (weekly / monthly / trimester period)
  - MenuItem CRUD (daily meals with allergens & suitability flags)
  - Menu publish workflow
  - MealAttendance single + bulk
  - Parent read-only menu access
  - Consumption report endpoint
  - Celery task: send_weekly_menu_to_parents
"""

import datetime
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient


# ─────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────


@pytest.fixture
def school(db):
    from apps.schools.models import School

    return School.objects.create(
        name="Canteen Test School",
        subdomain="canteen-test",
        address="1 Rue Cantine, Alger",
        phone="0551100000",
        wilaya="Alger",
        is_active=True,
    )


@pytest.fixture
def admin_user(db, school):
    from apps.accounts.models import User

    return User.objects.create_user(
        phone_number="0560000001",
        password="Test@1234",
        school=school,
        role="ADMIN",
        first_name="Admin",
        last_name="Cantine",
        is_staff=True,
    )


@pytest.fixture
def student_user(db, school):
    from apps.accounts.models import User

    return User.objects.create_user(
        phone_number="0560000002",
        password="Test@1234",
        school=school,
        role="STUDENT",
        first_name="Amine",
        last_name="Cherif",
    )


@pytest.fixture
def student_user2(db, school):
    from apps.accounts.models import User

    return User.objects.create_user(
        phone_number="0560000003",
        password="Test@1234",
        school=school,
        role="STUDENT",
        first_name="Sara",
        last_name="Meziane",
    )


@pytest.fixture
def parent_user(db, school, student_user):
    from apps.accounts.models import User

    parent = User.objects.create_user(
        phone_number="0560000004",
        password="Test@1234",
        school=school,
        role="PARENT",
        first_name="Nadia",
        last_name="Cherif",
    )
    # Link parent → student via profiles
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
def canteen_student(db, school, student_user):
    from apps.canteen.models import CanteenStudent

    return CanteenStudent.objects.create(
        school=school,
        student=student_user,
        start_date="2025-09-08",
        is_active=True,
        nutritional_status="NORMAL",
        dietary_restriction="NONE",
    )


@pytest.fixture
def menu(db, school):
    from apps.canteen.models import Menu

    return Menu.objects.create(
        school=school,
        title="Menu Semaine 12",
        period_type="WEEKLY",
        start_date="2026-03-16",
        end_date="2026-03-20",
        is_published=False,
    )


@pytest.fixture
def menu_item(db, school, menu):
    from apps.canteen.models import MenuItem

    return MenuItem.objects.create(
        school=school,
        menu=menu,
        date="2026-03-16",
        starter="Salade verte",
        main_course="Couscous poulet",
        side_dish="Légumes grillés",
        dessert="Orange",
        allergens="gluten",
        suitable_for_diabetic=True,
        suitable_for_celiac=False,
    )


# ─────────────────────────────────────────────────────────────────────────
# 1. CanteenStudent CRUD
# ─────────────────────────────────────────────────────────────────────────


class TestCanteenStudentCRUD:
    """Tests for CanteenStudent enrollment CRUD."""

    def test_create_canteen_student(self, admin_client, student_user):
        resp = admin_client.post(
            "/api/v1/canteen/students/",
            {
                "student": str(student_user.pk),
                "start_date": "2025-09-08",
                "is_active": True,
                "nutritional_status": "NORMAL",
                "dietary_restriction": "DIABETIC",
                "medical_note": "Insuline quotidienne",
            },
            format="json",
        )
        assert resp.status_code == 201
        assert resp.data["dietary_restriction"] == "DIABETIC"
        assert resp.data["medical_note"] == "Insuline quotidienne"

    def test_list_canteen_students(self, admin_client, canteen_student):
        resp = admin_client.get("/api/v1/canteen/students/")
        assert resp.status_code == 200
        assert resp.data["count"] == 1

    def test_list_filter_by_dietary_restriction(self, admin_client, canteen_student):
        resp = admin_client.get("/api/v1/canteen/students/?dietary_restriction=NONE")
        assert resp.status_code == 200
        assert resp.data["count"] == 1
        resp2 = admin_client.get(
            "/api/v1/canteen/students/?dietary_restriction=DIABETIC"
        )
        assert resp2.data["count"] == 0

    def test_list_filter_by_nutritional_status(self, admin_client, canteen_student):
        resp = admin_client.get(
            "/api/v1/canteen/students/?nutritional_status=NORMAL"
        )
        assert resp.data["count"] == 1
        resp2 = admin_client.get(
            "/api/v1/canteen/students/?nutritional_status=OBESE"
        )
        assert resp2.data["count"] == 0

    def test_detail_canteen_student(self, admin_client, canteen_student):
        resp = admin_client.get(
            f"/api/v1/canteen/students/{canteen_student.pk}/"
        )
        assert resp.status_code == 200
        assert resp.data["student_name"] == "Amine Cherif"

    def test_update_canteen_student(self, admin_client, canteen_student):
        resp = admin_client.patch(
            f"/api/v1/canteen/students/{canteen_student.pk}/",
            {"nutritional_status": "OVERWEIGHT", "medical_note": "Suivi diététique"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["nutritional_status"] == "OVERWEIGHT"

    def test_delete_canteen_student_soft(self, admin_client, canteen_student):
        resp = admin_client.delete(
            f"/api/v1/canteen/students/{canteen_student.pk}/"
        )
        assert resp.status_code == 204
        # Not actually gone — soft deleted
        from apps.canteen.models import CanteenStudent

        obj = CanteenStudent.objects.get(pk=canteen_student.pk)
        assert obj.is_deleted is True


# ─────────────────────────────────────────────────────────────────────────
# 2. Menu CRUD
# ─────────────────────────────────────────────────────────────────────────


class TestMenuCRUD:
    """Tests for Menu CRUD."""

    def test_create_menu(self, admin_client):
        resp = admin_client.post(
            "/api/v1/canteen/menus/",
            {
                "title": "Menu Semaine 14",
                "period_type": "WEEKLY",
                "start_date": "2026-03-30",
                "end_date": "2026-04-03",
            },
            format="json",
        )
        assert resp.status_code == 201
        assert resp.data["title"] == "Menu Semaine 14"

    def test_list_menus(self, admin_client, menu):
        resp = admin_client.get("/api/v1/canteen/menus/")
        assert resp.status_code == 200
        assert resp.data["count"] == 1

    def test_list_menus_filter_published(self, admin_client, menu):
        resp = admin_client.get("/api/v1/canteen/menus/?published=true")
        assert resp.data["count"] == 0
        menu.is_published = True
        menu.save()
        resp2 = admin_client.get("/api/v1/canteen/menus/?published=true")
        assert resp2.data["count"] == 1

    def test_detail_menu_with_items(self, admin_client, menu, menu_item):
        resp = admin_client.get(f"/api/v1/canteen/menus/{menu.pk}/")
        assert resp.status_code == 200
        assert len(resp.data["items"]) == 1
        assert resp.data["items"][0]["main_course"] == "Couscous poulet"

    def test_update_menu(self, admin_client, menu):
        resp = admin_client.patch(
            f"/api/v1/canteen/menus/{menu.pk}/",
            {"title": "Menu Semaine 12 — modifié"},
            format="json",
        )
        assert resp.status_code == 200
        assert "modifié" in resp.data["title"]

    def test_delete_menu_soft(self, admin_client, menu):
        resp = admin_client.delete(f"/api/v1/canteen/menus/{menu.pk}/")
        assert resp.status_code == 204


# ─────────────────────────────────────────────────────────────────────────
# 3. Menu publish workflow
# ─────────────────────────────────────────────────────────────────────────


class TestMenuPublish:
    """Tests for the menu publish endpoint."""

    def test_publish_menu(self, admin_client, menu):
        resp = admin_client.post(f"/api/v1/canteen/menus/{menu.pk}/publish/")
        assert resp.status_code == 200
        assert resp.data["is_published"] is True

    def test_publish_already_published(self, admin_client, menu):
        menu.is_published = True
        menu.save()
        resp = admin_client.post(f"/api/v1/canteen/menus/{menu.pk}/publish/")
        assert resp.status_code == 400


# ─────────────────────────────────────────────────────────────────────────
# 4. MenuItem CRUD
# ─────────────────────────────────────────────────────────────────────────


class TestMenuItemCRUD:
    """Tests for MenuItem CRUD."""

    def test_create_menu_item(self, admin_client, menu):
        resp = admin_client.post(
            f"/api/v1/canteen/menus/{menu.pk}/items/",
            {
                "date": "2026-03-17",
                "starter": "Chorba",
                "main_course": "Poulet rôti",
                "side_dish": "Riz",
                "dessert": "Fruit",
                "allergens": "",
                "suitable_for_diabetic": True,
                "suitable_for_celiac": True,
            },
            format="json",
        )
        assert resp.status_code == 201
        assert resp.data["main_course"] == "Poulet rôti"
        # day_of_week auto-computed (2026-03-17 is Tuesday)
        assert resp.data["day_of_week"] == "TUE"

    def test_list_menu_items(self, admin_client, menu, menu_item):
        resp = admin_client.get(f"/api/v1/canteen/menus/{menu.pk}/items/")
        assert resp.status_code == 200
        assert resp.data["count"] == 1

    def test_update_menu_item(self, admin_client, menu_item):
        resp = admin_client.patch(
            f"/api/v1/canteen/menu-items/{menu_item.pk}/",
            {"dessert": "Yaourt"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["dessert"] == "Yaourt"

    def test_delete_menu_item(self, admin_client, menu_item):
        resp = admin_client.delete(
            f"/api/v1/canteen/menu-items/{menu_item.pk}/"
        )
        assert resp.status_code == 204

    def test_day_of_week_auto_computed(self, db, school, menu):
        """MenuItem.save() auto-computes day_of_week from date."""
        from apps.canteen.models import MenuItem

        item = MenuItem.objects.create(
            school=school,
            menu=menu,
            date=datetime.date(2026, 3, 18),  # Wednesday
            main_course="Test",
        )
        assert item.day_of_week == "WED"


# ─────────────────────────────────────────────────────────────────────────
# 5. Meal Attendance — single + bulk
# ─────────────────────────────────────────────────────────────────────────


class TestMealAttendance:
    """Tests for MealAttendance single + bulk."""

    def test_create_attendance(self, admin_client, student_user, menu_item):
        resp = admin_client.post(
            "/api/v1/canteen/attendance/",
            {
                "student": str(student_user.pk),
                "menu_item": str(menu_item.pk),
                "date": "2026-03-16",
                "present": True,
            },
            format="json",
        )
        assert resp.status_code == 201
        assert resp.data["present"] is True

    def test_list_attendance_filter_date(
        self, admin_client, school, student_user, menu_item
    ):
        from apps.canteen.models import MealAttendance

        MealAttendance.objects.create(
            school=school,
            student=student_user,
            menu_item=menu_item,
            date="2026-03-16",
            present=True,
        )
        resp = admin_client.get("/api/v1/canteen/attendance/?date=2026-03-16")
        assert resp.status_code == 200
        assert resp.data["count"] == 1
        resp2 = admin_client.get("/api/v1/canteen/attendance/?date=2026-03-17")
        assert resp2.data["count"] == 0

    def test_bulk_attendance(
        self, admin_client, student_user, student_user2
    ):
        resp = admin_client.post(
            "/api/v1/canteen/attendance/bulk/",
            {
                "date": "2026-03-16",
                "entries": [
                    {"student": str(student_user.pk), "present": True},
                    {"student": str(student_user2.pk), "present": False, "notes": "Malade"},
                ],
            },
            format="json",
        )
        assert resp.status_code == 201
        assert resp.data["created"] == 2

    def test_bulk_attendance_update_existing(
        self, admin_client, school, student_user
    ):
        """Bulk attendance should update existing records (not duplicate)."""
        from apps.canteen.models import MealAttendance

        MealAttendance.objects.create(
            school=school,
            student=student_user,
            date="2026-03-16",
            present=True,
        )
        resp = admin_client.post(
            "/api/v1/canteen/attendance/bulk/",
            {
                "date": "2026-03-16",
                "entries": [
                    {"student": str(student_user.pk), "present": False},
                ],
            },
            format="json",
        )
        assert resp.status_code == 201
        assert resp.data["updated"] == 1
        assert resp.data["created"] == 0


# ─────────────────────────────────────────────────────────────────────────
# 6. Parent — read-only published menus
# ─────────────────────────────────────────────────────────────────────────


class TestParentMenuAccess:
    """Parents can read published menus, not unpublished."""

    def test_parent_sees_published_menus(self, parent_client, menu):
        menu.is_published = True
        menu.save()
        resp = parent_client.get("/api/v1/canteen/parent/menus/")
        assert resp.status_code == 200
        assert resp.data["count"] == 1

    def test_parent_does_not_see_unpublished(self, parent_client, menu):
        resp = parent_client.get("/api/v1/canteen/parent/menus/")
        assert resp.status_code == 200
        assert resp.data["count"] == 0

    def test_parent_cannot_create_menu(self, parent_client):
        resp = parent_client.post(
            "/api/v1/canteen/menus/",
            {"title": "Hack", "period_type": "WEEKLY", "start_date": "2026-04-01", "end_date": "2026-04-05"},
            format="json",
        )
        assert resp.status_code == 403


# ─────────────────────────────────────────────────────────────────────────
# 7. Consumption report
# ─────────────────────────────────────────────────────────────────────────


class TestConsumptionReport:
    """Tests for the consumption report endpoint."""

    def test_report_empty(self, admin_client):
        resp = admin_client.get(
            "/api/v1/canteen/reports/consumption/?start=2026-03-01&end=2026-03-31"
        )
        assert resp.status_code == 200
        assert resp.data["total_records"] == 0

    def test_report_with_data(
        self, admin_client, school, student_user, canteen_student
    ):
        from apps.canteen.models import MealAttendance

        MealAttendance.objects.create(
            school=school, student=student_user, date="2026-03-16", present=True
        )
        MealAttendance.objects.create(
            school=school, student=student_user, date="2026-03-17", present=False
        )
        resp = admin_client.get(
            "/api/v1/canteen/reports/consumption/?start=2026-03-01&end=2026-03-31"
        )
        assert resp.status_code == 200
        assert resp.data["total_records"] == 2
        assert resp.data["total_present"] == 1
        assert resp.data["total_absent"] == 1
        assert resp.data["enrolled_students"] == 1
        assert resp.data["attendance_rate"] == 50.0


# ─────────────────────────────────────────────────────────────────────────
# 8. Celery task — send_weekly_menu_to_parents
# ─────────────────────────────────────────────────────────────────────────


class TestCanteenCeleryTask:
    """Tests for the send_weekly_menu_to_parents Celery task."""

    @patch("apps.canteen.tasks._send_fcm_for_users")
    def test_send_weekly_menu_notification(
        self, mock_fcm, db, school, admin_user, student_user, parent_user, canteen_student
    ):
        from apps.canteen.models import Menu
        from apps.canteen.tasks import send_weekly_menu_to_parents

        today = datetime.date.today()
        next_monday = today + datetime.timedelta(days=(7 - today.weekday()) % 7 or 7)
        next_friday = next_monday + datetime.timedelta(days=4)

        Menu.objects.create(
            school=school,
            title="Menu prochain",
            period_type="WEEKLY",
            start_date=next_monday,
            end_date=next_friday,
            is_published=True,
        )
        result = send_weekly_menu_to_parents()
        assert result["menus_processed"] >= 1
        assert result["parents_notified"] >= 1
        mock_fcm.assert_called_once()

    @patch("apps.canteen.tasks._send_fcm_for_users")
    def test_unpublished_menu_not_sent(
        self, mock_fcm, db, school, admin_user, student_user, parent_user, canteen_student
    ):
        from apps.canteen.models import Menu
        from apps.canteen.tasks import send_weekly_menu_to_parents

        today = datetime.date.today()
        next_monday = today + datetime.timedelta(days=(7 - today.weekday()) % 7 or 7)
        next_friday = next_monday + datetime.timedelta(days=4)

        Menu.objects.create(
            school=school,
            title="Brouillon",
            period_type="WEEKLY",
            start_date=next_monday,
            end_date=next_friday,
            is_published=False,
        )
        result = send_weekly_menu_to_parents()
        assert result["parents_notified"] == 0
        mock_fcm.assert_not_called()


# ─────────────────────────────────────────────────────────────────────────
# 9. Model validation tests
# ─────────────────────────────────────────────────────────────────────────


class TestCanteenModels:
    """Model-level tests."""

    def test_canteen_student_str(self, canteen_student):
        assert "Amine Cherif" in str(canteen_student)

    def test_menu_str(self, menu):
        assert "Menu Semaine 12" in str(menu)

    def test_menu_item_str(self, menu_item):
        assert "Couscous poulet" in str(menu_item)

    def test_attendance_str(self, db, school, student_user):
        from apps.canteen.models import MealAttendance

        att = MealAttendance.objects.create(
            school=school, student=student_user, date="2026-03-16", present=True
        )
        assert "Présent" in str(att)

    def test_attendance_absent_str(self, db, school, student_user):
        from apps.canteen.models import MealAttendance

        att = MealAttendance.objects.create(
            school=school, student=student_user, date="2026-03-16", present=False
        )
        assert "Absent" in str(att)
