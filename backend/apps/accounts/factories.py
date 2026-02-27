"""
Test factories for the Accounts app using factory_boy.
"""

import factory
from factory.django import DjangoModelFactory


class UserFactory(DjangoModelFactory):
    """Factory for creating User instances."""

    class Meta:
        model = "accounts.User"
        django_get_or_create = ("email",)

    email = factory.Sequence(lambda n: f"user{n}@test-school.dz")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    phone_number = factory.LazyFunction(
        lambda: (
            f"05{''.join([str(factory.Faker('random_digit').evaluate(None, None, {})) for _ in range(8)])}"
        )
    )
    role = "student"
    is_active = True
    password = factory.PostGenerationMethodCall("set_password", "Test@1234")

    class Params:
        admin = factory.Trait(role="admin", is_staff=True)
        teacher = factory.Trait(role="teacher")
        student = factory.Trait(role="student")
        parent = factory.Trait(role="parent")


class AdminUserFactory(UserFactory):
    role = "admin"
    is_staff = True
    email = factory.Sequence(lambda n: f"admin{n}@test-school.dz")


class TeacherUserFactory(UserFactory):
    role = "teacher"
    email = factory.Sequence(lambda n: f"teacher{n}@test-school.dz")


class StudentUserFactory(UserFactory):
    role = "student"
    email = factory.Sequence(lambda n: f"student{n}@test-school.dz")


class ParentUserFactory(UserFactory):
    role = "parent"
    email = factory.Sequence(lambda n: f"parent{n}@test-school.dz")
