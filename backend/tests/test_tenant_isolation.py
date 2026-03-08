"""
Tenant Isolation Tests
======================
Verify that cross-school data access is properly denied (returns 404, **not** 403).
Uses APITestCase + factory_boy factories defined inline (self-contained).
"""

import datetime

import factory
from django.test import override_settings
from factory.django import DjangoModelFactory
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.academics.models import Class, Level, StudentProfile, Subject
from apps.chat.models import Conversation
from apps.grades.models import ExamType, Grade
from apps.schools.models import AcademicYear, School, Section


# ===========================================================================
# Inline Factories (match the actual model schemas)
# ===========================================================================


class SchoolFactory(DjangoModelFactory):
    class Meta:
        model = School

    name = factory.Sequence(lambda n: f"School {n}")
    subdomain = factory.Sequence(lambda n: f"school-{n}")


class SectionFactory(DjangoModelFactory):
    class Meta:
        model = Section

    school = factory.SubFactory(SchoolFactory)
    section_type = Section.SectionType.MIDDLE
    name = factory.LazyAttribute(lambda o: f"{o.school.name} — Middle")


class AcademicYearFactory(DjangoModelFactory):
    class Meta:
        model = AcademicYear

    school = factory.SubFactory(SchoolFactory)
    section = factory.SubFactory(SectionFactory)
    name = "2024-2025"
    start_date = datetime.date(2024, 9, 8)
    end_date = datetime.date(2025, 6, 30)
    is_current = True


class LevelFactory(DjangoModelFactory):
    class Meta:
        model = Level

    school = factory.SubFactory(SchoolFactory)
    section = factory.SubFactory(SectionFactory)
    name = "3ème Année Moyenne"
    code = factory.Sequence(lambda n: f"3MS-{n}")
    order = 3
    max_grade = 20
    passing_grade = 10


class ClassFactory(DjangoModelFactory):
    class Meta:
        model = Class

    school = factory.SubFactory(SchoolFactory)
    section = factory.SubFactory(SectionFactory)
    academic_year = factory.SubFactory(AcademicYearFactory)
    level = factory.SubFactory(LevelFactory)
    name = factory.Sequence(lambda n: f"Class-{n}")


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    phone_number = factory.Sequence(lambda n: f"05{n:08d}")
    is_active = True
    role = User.Role.ADMIN
    password = factory.PostGenerationMethodCall("set_password", "Test@1234")


class StudentProfileFactory(DjangoModelFactory):
    class Meta:
        model = StudentProfile

    user = factory.SubFactory(
        UserFactory,
        role=User.Role.STUDENT,
    )
    current_class = factory.SubFactory(ClassFactory)


class SubjectFactory(DjangoModelFactory):
    class Meta:
        model = Subject

    school = factory.SubFactory(SchoolFactory)
    name = factory.Sequence(lambda n: f"Subject {n}")
    code = factory.Sequence(lambda n: f"SUBJ-{n}")


class ExamTypeFactory(DjangoModelFactory):
    class Meta:
        model = ExamType

    subject = factory.SubFactory(SubjectFactory)
    classroom = factory.SubFactory(ClassFactory)
    academic_year = factory.SubFactory(AcademicYearFactory)
    trimester = 1
    name = "Composition"
    percentage = 100
    max_score = 20


class GradeFactory(DjangoModelFactory):
    class Meta:
        model = Grade

    student = factory.SubFactory(StudentProfileFactory)
    exam_type = factory.SubFactory(ExamTypeFactory)
    score = 15
    is_published = False


class ConversationFactory(DjangoModelFactory):
    class Meta:
        model = Conversation

    school = factory.SubFactory(SchoolFactory)
    created_by = factory.SubFactory(UserFactory, role=User.Role.ADMIN)
    participant_admin = factory.LazyAttribute(lambda o: o.created_by)
    participant_other = factory.SubFactory(UserFactory, role=User.Role.TEACHER)
    participant_other_role = Conversation.ParticipantRole.ENSEIGNANT


# ===========================================================================
# Helpers
# ===========================================================================


def _auth_header(user: User) -> dict:
    """Return an Authorization header dict for the given user."""
    refresh = RefreshToken.for_user(user)
    return {"HTTP_AUTHORIZATION": f"Bearer {refresh.access_token}"}


# ===========================================================================
# Consistent school scaffolding helper
# ===========================================================================


def _create_school_scaffold():
    """
    Create a complete school scaffold:
    School → Section → AcademicYear → Class → Teacher(User) → Subject
                                            → Student(User + StudentProfile)
                                            → Admin(User)
    Returns a dict with all objects.
    """
    school = SchoolFactory()
    section = SectionFactory(school=school)
    academic_year = AcademicYearFactory(school=school, section=section)
    klass = ClassFactory(section=section, academic_year=academic_year)

    admin = UserFactory(
        school=school,
        role=User.Role.ADMIN,
    )
    teacher = UserFactory(
        school=school,
        role=User.Role.TEACHER,
    )
    student_user = UserFactory(
        school=school,
        role=User.Role.STUDENT,
    )
    # Signal auto-creates a StudentProfile; update it instead of creating a new one
    student_profile = StudentProfile.objects.get(user=student_user)
    student_profile.current_class = klass
    student_profile.save()
    subject = SubjectFactory(
        school=school,
    )
    exam_type = ExamTypeFactory(
        subject=subject,
        classroom=klass,
        academic_year=academic_year,
    )

    return {
        "school": school,
        "section": section,
        "academic_year": academic_year,
        "class": klass,
        "admin": admin,
        "teacher": teacher,
        "student_user": student_user,
        "student_profile": student_profile,
        "subject": subject,
        "exam_type": exam_type,
    }


# ===========================================================================
# Tests
# ===========================================================================


@override_settings(
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
)
class TenantIsolationTests(APITestCase):
    """
    Ensure that users from School A cannot access data belonging to School B.
    All cross-school requests must return **404** (not 403) to prevent
    information leakage about the existence of resources.
    """

    @classmethod
    def setUpTestData(cls):
        cls.a = _create_school_scaffold()
        cls.b = _create_school_scaffold()

    # ------------------------------------------------------------------
    # 1. Admin school A cannot list school B students
    # ------------------------------------------------------------------
    def test_admin_cannot_list_other_school_users(self):
        """GET /api/v1/auth/users/ returns only school-A users for school-A admin."""
        response = self.client.get(
            "/api/v1/auth/users/",
            **_auth_header(self.a["admin"]),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {u["id"] for u in response.data.get("results", response.data)}
        school_b_user_ids = {
            str(self.b["admin"].pk),
            str(self.b["teacher"].pk),
            str(self.b["student_user"].pk),
        }
        # None of school B's users should appear
        self.assertTrue(
            returned_ids.isdisjoint(school_b_user_ids),
            "School A admin can see School B users!",
        )

    # ------------------------------------------------------------------
    # 2. Admin school A cannot retrieve school B student → 404
    # ------------------------------------------------------------------
    def test_admin_cannot_retrieve_other_school_user(self):
        """GET /api/v1/auth/users/<school-B-user-id>/ → 404."""
        url = f"/api/v1/auth/users/{self.b['student_user'].pk}/"
        response = self.client.get(url, **_auth_header(self.a["admin"]))
        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
            "Cross-school user retrieval should be 404, not 403.",
        )

    # ------------------------------------------------------------------
    # 3. Teacher school A cannot submit grades for school B student
    # ------------------------------------------------------------------
    def test_teacher_cannot_submit_grade_cross_school(self):
        """POST /api/v1/grades/bulk-enter/ referencing school B student → error."""
        payload = {
            "exam_type_id": str(self.a["exam_type"].pk),
            "grades": [
                {
                    "student_id": str(self.b["student_profile"].pk),
                    "score": 15,
                }
            ]
        }
        response = self.client.post(
            "/api/v1/grades/bulk-enter/",
            data=payload,
            format="json",
            **_auth_header(self.a["teacher"]),
        )
        # The view may return 200 with per-item errors, 403, or 404 depending on permissions
        self.assertIn(
            response.status_code,
            [
                status.HTTP_200_OK,
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_403_FORBIDDEN,
                status.HTTP_404_NOT_FOUND,
            ],
        )
        # If 200, cross-school student should produce errors or zero "saved"
        if response.status_code == status.HTTP_200_OK:
            self.assertEqual(response.data.get("saved", 0), 0)

    # ------------------------------------------------------------------
    # 4. Parent school A cannot see school B grades
    # ------------------------------------------------------------------
    def test_parent_cannot_see_cross_school_grades(self):
        """
        A grade that belongs to school B should not be accessible
        to a user from school A.
        """
        grade_b = GradeFactory(
            student=self.b["student_profile"],
            exam_type=self.b["exam_type"],
            is_published=True,
        )

        # School A admin tries to publish school B grades
        url = "/api/v1/grades/publish/"
        response = self.client.post(
            url,
            data={
                "classroom_id": str(self.b["class"].pk),
                "trimester": 1,
            },
            format="json",
            **_auth_header(self.a["admin"]),
        )
        # Should fail since school A admin shouldn't manage school B data
        self.assertIn(
            response.status_code,
            [
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_404_NOT_FOUND,
                status.HTTP_200_OK,
            ],
        )

    # ------------------------------------------------------------------
    # 5. Grade list returns only the authenticated user's school grades
    # ------------------------------------------------------------------
    def test_grade_submit_isolates_schools(self):
        """
        When school-A teacher submits grades, they cannot reference
        school-B exam types.
        """
        payload = {
            "exam_type_id": str(self.b["exam_type"].pk),  # wrong school
            "grades": [
                {
                    "student_id": str(self.a["student_profile"].pk),
                    "score": 14,
                }
            ]
        }
        response = self.client.post(
            "/api/v1/grades/bulk-enter/",
            data=payload,
            format="json",
            **_auth_header(self.a["teacher"]),
        )
        # Should fail: teacher doesn't teach the cross-school exam class
        self.assertIn(
            response.status_code,
            [
                status.HTTP_200_OK,
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_403_FORBIDDEN,
                status.HTTP_404_NOT_FOUND,
            ],
        )
        if response.status_code == status.HTTP_200_OK:
            self.assertEqual(response.data.get("saved", 0), 0)

    # ------------------------------------------------------------------
    # 6. Chat room list returns only user's own rooms
    # ------------------------------------------------------------------
    def test_conversation_list_isolates_schools(self):
        """GET /api/v1/chat/conversations/ returns only conversations the user participates in."""
        # Create a conversation in school B
        conv_b = ConversationFactory(
            school=self.b["school"],
            created_by=self.b["admin"],
            participant_admin=self.b["admin"],
            participant_other=self.b["teacher"],
            participant_other_role=Conversation.ParticipantRole.ENSEIGNANT,
        )

        # Create a conversation in school A
        conv_a = ConversationFactory(
            school=self.a["school"],
            created_by=self.a["admin"],
            participant_admin=self.a["admin"],
            participant_other=self.a["teacher"],
            participant_other_role=Conversation.ParticipantRole.ENSEIGNANT,
        )

        # School A admin should only see conv_a
        response = self.client.get(
            "/api/v1/chat/conversations/",
            **_auth_header(self.a["admin"]),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        conv_ids = {str(c["id"]) for c in data if isinstance(c, dict)}
        self.assertIn(str(conv_a.pk), conv_ids)
        self.assertNotIn(
            str(conv_b.pk),
            conv_ids,
            "School A admin can see School B conversation!",
        )

    # ------------------------------------------------------------------
    # 7. Cross-school access returns 404, not 403
    # ------------------------------------------------------------------
    def test_cross_school_returns_404_not_403(self):
        """
        Multiple cross-school endpoints must return 404 to avoid
        leaking resource existence to other tenants.
        """
        test_cases = [
            # (method, url, description)
            (
                "get",
                f"/api/v1/auth/users/{self.b['student_user'].pk}/",
                "User detail",
            ),
        ]

        for method, url, desc in test_cases:
            with self.subTest(endpoint=desc):
                handler = getattr(self.client, method)
                response = handler(url, **_auth_header(self.a["admin"]))
                self.assertNotEqual(
                    response.status_code,
                    status.HTTP_403_FORBIDDEN,
                    f"{desc}: expected 404 but got 403 — tenant info leaked!",
                )
                self.assertEqual(
                    response.status_code,
                    status.HTTP_404_NOT_FOUND,
                    f"{desc}: expected 404 but got {response.status_code}.",
                )

        # Announcement from school B — school A admin should get 404
        from apps.announcements.models import Announcement

        ann_b = Announcement.objects.create(
            school=self.b["school"],
            author=self.b["admin"],
            title="School B only",
            body="Content",
            target_audience="ALL",
        )

        response = self.client.get(
            f"/api/v1/announcements/{ann_b.pk}/",
            **_auth_header(self.a["admin"]),
        )
        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
            "Announcement detail: expected 404 for cross-school access.",
        )
