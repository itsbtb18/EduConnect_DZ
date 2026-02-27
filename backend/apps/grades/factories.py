"""
Test factories for the Grades app using factory_boy.
"""

import factory
from factory.django import DjangoModelFactory

from apps.academics.factories import TeacherAssignmentFactory
from apps.schools.factories import SchoolFactory


class ExamTypeFactory(DjangoModelFactory):
    """Factory for creating ExamType instances."""

    class Meta:
        model = "grades.ExamType"

    school = factory.SubFactory(SchoolFactory)
    name = factory.Iterator(["Devoir 1", "Devoir 2", "Composition"])
    weight = factory.Iterator([25, 25, 50])


class GradeFactory(DjangoModelFactory):
    """Factory for creating Grade instances."""

    class Meta:
        model = "grades.Grade"

    school = factory.SubFactory(SchoolFactory)
    student = factory.SubFactory(
        "apps.accounts.factories.StudentUserFactory",
        school=factory.SelfAttribute("..school"),
    )
    teacher_assignment = factory.SubFactory(
        TeacherAssignmentFactory,
        school=factory.SelfAttribute("..school"),
    )
    exam_type = factory.SubFactory(
        ExamTypeFactory,
        school=factory.SelfAttribute("..school"),
    )
    score = factory.Faker(
        "pydecimal", left_digits=2, right_digits=2, min_value=0, max_value=20
    )
    is_published = True
