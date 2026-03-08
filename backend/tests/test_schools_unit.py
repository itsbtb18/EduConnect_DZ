"""
Unit tests for the schools app — School, Section, AcademicYear, SchoolSubscription.
"""
import pytest
from datetime import date


# ════════════════════════════════════════════════════════════════
# SCHOOL MODEL TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestSchoolModel:
    """Tests for the School model."""

    def test_school_creation(self, school):
        assert school.pk is not None
        assert school.name == "Test School"
        assert school.is_active
        assert not school.is_deleted

    def test_school_subdomain_unique(self, school):
        from apps.schools.models import School

        with pytest.raises(Exception):
            School.objects.create(
                name="Duplicate",
                subdomain="test-school",
                address="Another Street",
                phone="0551111111",
                wilaya="Oran",
            )

    def test_school_soft_delete(self, school):
        school.soft_delete()
        school.refresh_from_db()
        assert school.is_deleted
        assert school.deleted_at is not None

    def test_school_wilayas(self):
        from apps.schools.models import School

        school = School.objects.create(
            name="Oran School",
            subdomain="oran-school",
            address="1 Rue test",
            phone="0552222222",
            wilaya="Oran",
        )
        assert school.wilaya == "Oran"

    def test_school_categories(self):
        from apps.schools.models import School

        for cat in ["SCHOOL", "TRAINING_CENTER"]:
            s = School.objects.create(
                name=f"Cat {cat}",
                subdomain=f"cat-{cat.lower()}",
                address="Test",
                phone=f"055333{cat[:4].replace('_','')}",
                wilaya="Alger",
                school_category=cat,
            )
            assert s.school_category == cat


# ════════════════════════════════════════════════════════════════
# SECTION MODEL TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestSectionModel:
    """Tests for the Section model."""

    def test_section_creation(self, section):
        assert section.pk is not None
        assert section.name == "Moyen"
        assert section.is_active

    def test_section_types(self, school):
        from apps.schools.models import Section

        for stype in [Section.SectionType.PRIMARY, Section.SectionType.MIDDLE, Section.SectionType.HIGH]:
            sec = Section.objects.create(
                school=school,
                section_type=stype,
                name=f"Section {stype}",
            )
            assert sec.section_type == stype

    def test_section_soft_delete(self, section):
        section.soft_delete()
        section.refresh_from_db()
        assert section.is_deleted


# ════════════════════════════════════════════════════════════════
# ACADEMIC YEAR MODEL TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestAcademicYearModel:
    """Tests for the AcademicYear model."""

    def test_academic_year_creation(self, academic_year):
        assert academic_year.pk is not None
        assert academic_year.name == "2024-2025"
        assert academic_year.is_current

    def test_academic_year_dates(self, academic_year):
        assert academic_year.start_date < academic_year.end_date

    def test_academic_year_soft_delete(self, academic_year):
        academic_year.soft_delete()
        academic_year.refresh_from_db()
        assert academic_year.is_deleted


# ════════════════════════════════════════════════════════════════
# SCHOOL SUBSCRIPTION MODEL TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestSchoolSubscriptionModel:
    """Tests for the SchoolSubscription model."""

    def test_create_subscription(self, school):
        from apps.schools.models import SchoolSubscription

        sub = SchoolSubscription.objects.create(
            school=school,
            plan_name="Premium",
            is_active=True,
            max_students=500,
            subscription_start=date(2025, 1, 1),
            subscription_end=date(2025, 12, 31),
        )
        assert sub.pk is not None
        assert sub.is_active
        assert sub.plan_name == "Premium"

    def test_module_activation(self, school):
        from apps.schools.models import SchoolSubscription

        sub = SchoolSubscription.objects.create(
            school=school,
            plan_name="Basic",
            module_grades=True,
            module_attendance=True,
            module_finance=False,
        )
        assert sub.is_module_active("grades")
        assert sub.is_module_active("attendance")
        assert not sub.is_module_active("finance")

    def test_get_active_modules(self, school):
        from apps.schools.models import SchoolSubscription

        sub = SchoolSubscription.objects.create(
            school=school,
            plan_name="Full",
            module_grades=True,
            module_attendance=True,
            module_finance=True,
            module_chat=True,
            module_library=False,
        )
        active = sub.get_active_modules()
        assert "grades" in active
        assert "attendance" in active
        assert "finance" in active
        assert "chat" in active
        assert "library" not in active
