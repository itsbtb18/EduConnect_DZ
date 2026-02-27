"""
Test factories for the Academics app using factory_boy.
"""

import factory
from factory.django import DjangoModelFactory

from apps.schools.factories import SchoolFactory


class LevelFactory(DjangoModelFactory):
    """Factory for creating Level instances."""

    class Meta:
        model = "academics.Level"

    school = factory.SubFactory(SchoolFactory)
    name = factory.Sequence(lambda n: f"Level {n}")
    code = factory.Sequence(lambda n: f"L{n}")
    order = factory.Sequence(lambda n: n)


class ClassroomFactory(DjangoModelFactory):
    """Factory for creating Classroom instances."""

    class Meta:
        model = "academics.Classroom"

    school = factory.SubFactory(SchoolFactory)
    name = factory.Sequence(lambda n: f"Classroom {n}")
    level = factory.SubFactory(LevelFactory)
    capacity = 35


class SubjectFactory(DjangoModelFactory):
    """Factory for creating Subject instances."""

    class Meta:
        model = "academics.Subject"

    school = factory.SubFactory(SchoolFactory)
    name = factory.Sequence(lambda n: f"Subject {n}")
    coefficient = 3


class TeacherAssignmentFactory(DjangoModelFactory):
    """Factory for creating TeacherAssignment instances."""

    class Meta:
        model = "academics.TeacherAssignment"

    school = factory.SubFactory(SchoolFactory)
    teacher = factory.SubFactory(
        "apps.accounts.factories.TeacherUserFactory",
        school=factory.SelfAttribute("..school"),
    )
    classroom = factory.SubFactory(
        ClassroomFactory,
        school=factory.SelfAttribute("..school"),
    )
    subject = factory.SubFactory(
        SubjectFactory,
        school=factory.SelfAttribute("..school"),
    )
