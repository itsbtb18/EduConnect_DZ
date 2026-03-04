"""
Test factories for the Grades app using factory_boy.

NOTE: These factories need to be updated to match the new ExamType-based
architecture. The old ExamType was a simple model with school/name/weight.
The new ExamType references subject/classroom/academic_year/trimester.

Placeholder factories below — update when implementing full test suite.
"""

import factory
from decimal import Decimal
from factory.django import DjangoModelFactory


class ExamTypeFactory(DjangoModelFactory):
    """Factory for creating ExamType instances."""

    class Meta:
        model = "grades.ExamType"

    name = factory.Iterator(["Examen 1", "Examen 2", "Contrôle Continu"])
    percentage = factory.Iterator([Decimal("60"), Decimal("20"), Decimal("20")])
    max_score = Decimal("20")
    trimester = 1


class GradeFactory(DjangoModelFactory):
    """Factory for creating Grade instances."""

    class Meta:
        model = "grades.Grade"

    exam_type = factory.SubFactory(ExamTypeFactory)
    score = factory.Faker(
        "pydecimal",
        left_digits=2,
        right_digits=2,
        min_value=0,
        max_value=20,
    )
    is_absent = False
    is_published = False
