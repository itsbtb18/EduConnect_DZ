"""
Test factories for the Schools app using factory_boy.
"""

import factory
from factory.django import DjangoModelFactory


class SchoolFactory(DjangoModelFactory):
    """Factory for creating School instances."""

    class Meta:
        model = "schools.School"
        django_get_or_create = ("code",)

    name = factory.Sequence(lambda n: f"Test School {n}")
    code = factory.Sequence(lambda n: f"school-{n}")
    address = factory.Faker("address")
    phone = factory.LazyFunction(lambda: "0551234567")
    wilaya = "Alger"
    school_type = "middle"
    is_active = True


class AcademicYearFactory(DjangoModelFactory):
    """Factory for creating AcademicYear instances."""

    class Meta:
        model = "schools.AcademicYear"

    school = factory.SubFactory(SchoolFactory)
    name = "2024-2025"
    start_date = factory.LazyFunction(lambda: "2024-09-08")
    end_date = factory.LazyFunction(lambda: "2025-06-30")
    is_current = True
