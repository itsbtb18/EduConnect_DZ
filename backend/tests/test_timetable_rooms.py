"""
Tests for:
  1. Attendance Justification Workflow (excuse approval updates is_justified)
  2. Room Management System (CRUD, occupancy)
  3. Timetable System (conflict detection, teacher schedule auto-gen, PDF export)

Uses APITestCase + inline factories.  All tests are self-contained.
"""

import datetime
import uuid

import factory
from django.test import override_settings
from factory.django import DjangoModelFactory
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.academics.models import (
    Class,
    Level,
    Room,
    ScheduleSlot,
    StudentProfile,
    Subject,
    TeacherAssignment,
    TeacherAvailability,
)
from apps.attendance.models import AbsenceExcuse, AttendanceRecord
from apps.schools.models import AcademicYear, School, Section


# ═══════════════════════════════════════════════════════════════════════════
# Inline Factories
# ═══════════════════════════════════════════════════════════════════════════


class SchoolFactory(DjangoModelFactory):
    class Meta:
        model = School

    name = factory.Sequence(lambda n: f"School-{n}")
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
    name = "2025-2026"
    start_date = datetime.date(2025, 9, 7)
    end_date = datetime.date(2026, 6, 30)
    is_current = True


class LevelFactory(DjangoModelFactory):
    class Meta:
        model = Level

    school = factory.SubFactory(SchoolFactory)
    section = factory.SubFactory(SectionFactory)
    name = "1ère Année Moyenne"
    code = factory.Sequence(lambda n: f"1AM-{n}")
    order = 1
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


class SubjectFactory(DjangoModelFactory):
    class Meta:
        model = Subject

    school = factory.SubFactory(SchoolFactory)
    name = "Mathématiques"
    code = factory.Sequence(lambda n: f"MATH-{n}")


class RoomFactory(DjangoModelFactory):
    class Meta:
        model = Room

    school = factory.SubFactory(SchoolFactory)
    name = factory.Sequence(lambda n: f"Salle-{n}")
    code = factory.Sequence(lambda n: f"S{n:03d}")
    room_type = Room.RoomType.CLASSROOM
    capacity = 35
    is_available = True


# ═══════════════════════════════════════════════════════════════════════════
# Shared setup mixin
# ═══════════════════════════════════════════════════════════════════════════


class BaseTestSetup:
    """Mixin that creates school, section, year, level, class, users, subject."""

    def _setup_base(self):
        self.school = School.objects.create(
            name="Test École", subdomain="test-ecole"
        )
        self.section = Section.objects.create(
            school=self.school,
            section_type=Section.SectionType.MIDDLE,
            name="Moyen",
        )
        self.academic_year = AcademicYear.objects.create(
            school=self.school,
            section=self.section,
            name="2025-2026",
            start_date=datetime.date(2025, 9, 7),
            end_date=datetime.date(2026, 6, 30),
            is_current=True,
        )
        self.level = Level.objects.create(
            school=self.school,
            section=self.section,
            name="1AM",
            code="1AM",
            order=1,
        )
        self.classroom = Class.objects.create(
            school=self.school,
            section=self.section,
            academic_year=self.academic_year,
            level=self.level,
            name="1AM-A",
        )
        self.classroom2 = Class.objects.create(
            school=self.school,
            section=self.section,
            academic_year=self.academic_year,
            level=self.level,
            name="1AM-B",
        )

        # Users
        self.admin_user = User.objects.create_user(
            phone_number="0550000001",
            password="Test@1234",
            school=self.school,
            role="ADMIN",
            first_name="Admin",
            last_name="Test",
        )
        self.teacher_user = User.objects.create_user(
            phone_number="0550000002",
            password="Test@1234",
            school=self.school,
            role="TEACHER",
            first_name="Karim",
            last_name="Benmoussa",
        )
        self.teacher_user2 = User.objects.create_user(
            phone_number="0550000003",
            password="Test@1234",
            school=self.school,
            role="TEACHER",
            first_name="Sara",
            last_name="Hadj",
        )
        self.student_user = User.objects.create_user(
            phone_number="0550000004",
            password="Test@1234",
            school=self.school,
            role="STUDENT",
            first_name="Ahmed",
            last_name="Benali",
        )
        self.parent_user = User.objects.create_user(
            phone_number="0550000005",
            password="Test@1234",
            school=self.school,
            role="PARENT",
            first_name="Mohamed",
            last_name="Benali",
        )

        # Link student to class and parent
        self.student_profile = StudentProfile.objects.get(user=self.student_user)
        self.student_profile.current_class = self.classroom
        self.student_profile.save()

        parent_profile = self.parent_user.parent_profile
        parent_profile.children.add(self.student_profile)

        # Subjects
        self.subject1 = Subject.objects.create(
            school=self.school, name="Mathématiques", code="MATH"
        )
        self.subject2 = Subject.objects.create(
            school=self.school, name="Physique", code="PHYS"
        )

        # Teacher assignment
        TeacherAssignment.objects.create(
            school=self.school,
            teacher=self.teacher_user,
            assigned_class=self.classroom,
            subject=self.subject1,
            academic_year=self.academic_year,
        )

        # Rooms
        self.room1 = Room.objects.create(
            school=self.school,
            name="Salle 101",
            code="S101",
            room_type=Room.RoomType.CLASSROOM,
            capacity=35,
        )
        self.room2 = Room.objects.create(
            school=self.school,
            name="Labo Physique",
            code="LAB-P",
            room_type=Room.RoomType.LAB,
            capacity=25,
        )


# ═══════════════════════════════════════════════════════════════════════════
# 1. ATTENDANCE JUSTIFICATION WORKFLOW TESTS
# ═══════════════════════════════════════════════════════════════════════════


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
)
class TestAttendanceJustificationWorkflow(APITestCase, BaseTestSetup):
    """Test the excuse submit → review → is_justified update workflow."""

    def setUp(self):
        self._setup_base()
        # Create an absence record
        self.absence = AttendanceRecord.objects.create(
            student=self.student_profile,
            class_obj=self.classroom,
            academic_year=self.academic_year,
            date=datetime.date(2025, 11, 15),
            period="MORNING",
            status=AttendanceRecord.Status.ABSENT,
            marked_by=self.teacher_user,
            school=self.school,
        )

    def test_01_parent_submit_excuse(self):
        """Parent can submit an excuse for their child's absence."""
        self.client.force_authenticate(user=self.parent_user)
        resp = self.client.post(
            "/api/v1/attendance/excuses/",
            {
                "attendance_record_id": str(self.absence.pk),
                "justification_text": "Mon fils était malade.",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["status"], "PENDING")
        self.assertEqual(resp.data["justification_text"], "Mon fils était malade.")

    def test_02_parent_cannot_excuse_other_student(self):
        """Parent cannot submit excuse for a student they're not linked to."""
        other_student = User.objects.create_user(
            phone_number="0550000090",
            password="Test@1234",
            school=self.school,
            role="STUDENT",
            first_name="Other",
            last_name="Student",
        )
        other_profile = StudentProfile.objects.get(user=other_student)
        other_absence = AttendanceRecord.objects.create(
            student=other_profile,
            class_obj=self.classroom,
            date=datetime.date(2025, 11, 15),
            period="AFTERNOON",
            status=AttendanceRecord.Status.ABSENT,
            marked_by=self.teacher_user,
            school=self.school,
        )
        self.client.force_authenticate(user=self.parent_user)
        resp = self.client.post(
            "/api/v1/attendance/excuses/",
            {
                "attendance_record_id": str(other_absence.pk),
                "justification_text": "Raison quelconque.",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_03_admin_approve_excuse_updates_is_justified(self):
        """When admin approves an excuse, AttendanceRecord.is_justified → True."""
        # Create excuse
        excuse = AbsenceExcuse.objects.create(
            attendance_record=self.absence,
            submitted_by=self.parent_user,
            justification_text="Malade — certificat médical.",
        )
        self.assertFalse(self.absence.is_justified)

        # Admin approves
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.patch(
            f"/api/v1/attendance/excuses/{excuse.pk}/review/",
            {"status": "APPROVED"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "APPROVED")

        # Verify AttendanceRecord is now justified
        self.absence.refresh_from_db()
        self.assertTrue(self.absence.is_justified)
        self.assertEqual(self.absence.justified_by, self.admin_user)
        self.assertIsNotNone(self.absence.justified_at)

    def test_04_admin_reject_excuse_does_not_justify(self):
        """When admin rejects an excuse, is_justified stays False."""
        excuse = AbsenceExcuse.objects.create(
            attendance_record=self.absence,
            submitted_by=self.parent_user,
            justification_text="Pas de raison valide.",
        )
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.patch(
            f"/api/v1/attendance/excuses/{excuse.pk}/review/",
            {"status": "REJECTED"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "REJECTED")

        self.absence.refresh_from_db()
        self.assertFalse(self.absence.is_justified)

    def test_05_cannot_review_already_reviewed_excuse(self):
        """An already-approved excuse cannot be reviewed again."""
        excuse = AbsenceExcuse.objects.create(
            attendance_record=self.absence,
            submitted_by=self.parent_user,
            justification_text="Déjà approuvé.",
            status=AbsenceExcuse.Status.APPROVED,
            reviewed_by=self.admin_user,
        )
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.patch(
            f"/api/v1/attendance/excuses/{excuse.pk}/review/",
            {"status": "REJECTED"},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


# ═══════════════════════════════════════════════════════════════════════════
# 2. ROOM MANAGEMENT TESTS
# ═══════════════════════════════════════════════════════════════════════════


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
)
class TestRoomManagement(APITestCase, BaseTestSetup):
    """Test Room CRUD and occupancy endpoints."""

    def setUp(self):
        self._setup_base()

    def test_06_create_room(self):
        """Admin can create a room."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post(
            "/api/v1/academics/rooms/",
            {
                "name": "Salle 201",
                "code": "S201",
                "room_type": "CLASSROOM",
                "capacity": 30,
                "floor": "2ème",
                "building": "Bâtiment A",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["name"], "Salle 201")
        self.assertEqual(resp.data["room_type"], "CLASSROOM")

    def test_07_list_rooms(self):
        """Admin can list all rooms for their school."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get("/api/v1/academics/rooms/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        names = [r["name"] for r in resp.data["results"]]
        self.assertIn("Salle 101", names)
        self.assertIn("Labo Physique", names)

    def test_08_update_room(self):
        """Admin can update a room."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.patch(
            f"/api/v1/academics/rooms/{self.room1.pk}/",
            {"capacity": 40, "is_available": False},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.room1.refresh_from_db()
        self.assertEqual(self.room1.capacity, 40)
        self.assertFalse(self.room1.is_available)

    def test_09_delete_room(self):
        """Admin can soft-delete a room."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.delete(f"/api/v1/academics/rooms/{self.room2.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.room2.refresh_from_db()
        self.assertTrue(self.room2.is_deleted)

    def test_10_room_occupancy(self):
        """Room occupancy endpoint shows slot counts."""
        # Add a schedule slot to room1
        ScheduleSlot.objects.create(
            school=self.school,
            assigned_class=self.classroom,
            subject=self.subject1,
            teacher=self.teacher_user,
            day_of_week=0,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(9, 0),
            room=self.room1,
        )
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get("/api/v1/academics/rooms/occupancy/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        room1_data = next(r for r in resp.data if r["name"] == "Salle 101")
        self.assertEqual(room1_data["total_slots"], 1)
        self.assertEqual(len(room1_data["slots"]), 1)

    def test_11_room_schedule(self):
        """Room schedule endpoint shows slots per day."""
        ScheduleSlot.objects.create(
            school=self.school,
            assigned_class=self.classroom,
            subject=self.subject1,
            teacher=self.teacher_user,
            day_of_week=1,
            start_time=datetime.time(10, 0),
            end_time=datetime.time(11, 0),
            room=self.room1,
        )
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get(f"/api/v1/academics/rooms/{self.room1.pk}/schedule/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Day 1 (Monday) should have 1 slot — keys are integers
        self.assertIn(1, resp.data)
        self.assertEqual(len(resp.data[1]), 1)

    def test_12_filter_rooms_by_type(self):
        """Admin can filter rooms by type."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get("/api/v1/academics/rooms/?type=LAB")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        for r in resp.data["results"]:
            self.assertEqual(r["room_type"], "LAB")


# ═══════════════════════════════════════════════════════════════════════════
# 3. TIMETABLE CONFLICT DETECTION TESTS
# ═══════════════════════════════════════════════════════════════════════════


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
)
class TestTimetableConflicts(APITestCase, BaseTestSetup):
    """Test schedule conflict detection for teachers, rooms, and classes."""

    def setUp(self):
        self._setup_base()
        # Create an existing slot: teacher_user teaches MATH in 1AM-A
        # on Sunday 08:00-09:00 in Salle 101
        self.existing_slot = ScheduleSlot.objects.create(
            school=self.school,
            assigned_class=self.classroom,
            subject=self.subject1,
            teacher=self.teacher_user,
            day_of_week=0,  # Sunday
            start_time=datetime.time(8, 0),
            end_time=datetime.time(9, 0),
            room=self.room1,
            academic_year=self.academic_year,
        )

    def test_13_teacher_conflict_detected(self):
        """Creating a slot for the same teacher at the same time → 409."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post(
            "/api/v1/academics/schedule/",
            {
                "assigned_class": str(self.classroom2.pk),
                "subject": str(self.subject2.pk),
                "teacher": str(self.teacher_user.pk),
                "day_of_week": 0,
                "start_time": "08:30",
                "end_time": "09:30",
                "room": str(self.room2.pk),
                "academic_year": str(self.academic_year.pk),
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_409_CONFLICT)
        conflict_types = [c["type"] for c in resp.data["conflicts"]]
        self.assertIn("TEACHER", conflict_types)

    def test_14_room_conflict_detected(self):
        """Creating a slot in the same room at the same time → 409 ROOM."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post(
            "/api/v1/academics/schedule/",
            {
                "assigned_class": str(self.classroom2.pk),
                "subject": str(self.subject2.pk),
                "teacher": str(self.teacher_user2.pk),
                "day_of_week": 0,
                "start_time": "08:00",
                "end_time": "09:00",
                "room": str(self.room1.pk),  # same room
                "academic_year": str(self.academic_year.pk),
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_409_CONFLICT)
        conflict_types = [c["type"] for c in resp.data["conflicts"]]
        self.assertIn("ROOM", conflict_types)

    def test_15_class_conflict_detected(self):
        """Creating a slot for the same class at the same time → 409 CLASS."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post(
            "/api/v1/academics/schedule/",
            {
                "assigned_class": str(self.classroom.pk),  # same class
                "subject": str(self.subject2.pk),
                "teacher": str(self.teacher_user2.pk),
                "day_of_week": 0,
                "start_time": "08:00",
                "end_time": "09:00",
                "room": str(self.room2.pk),
                "academic_year": str(self.academic_year.pk),
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_409_CONFLICT)
        conflict_types = [c["type"] for c in resp.data["conflicts"]]
        self.assertIn("CLASS", conflict_types)

    def test_16_no_conflict_different_time(self):
        """Slot at a different time → no conflict → 201."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post(
            "/api/v1/academics/schedule/",
            {
                "assigned_class": str(self.classroom.pk),
                "subject": str(self.subject2.pk),
                "teacher": str(self.teacher_user.pk),
                "day_of_week": 0,
                "start_time": "09:00",  # after existing slot ends
                "end_time": "10:00",
                "room": str(self.room1.pk),
                "academic_year": str(self.academic_year.pk),
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_17_no_conflict_different_day(self):
        """Slot on a different day → no conflict → 201."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post(
            "/api/v1/academics/schedule/",
            {
                "assigned_class": str(self.classroom.pk),
                "subject": str(self.subject1.pk),
                "teacher": str(self.teacher_user.pk),
                "day_of_week": 1,  # Monday
                "start_time": "08:00",
                "end_time": "09:00",
                "room": str(self.room1.pk),
                "academic_year": str(self.academic_year.pk),
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_18_force_create_despite_conflict(self):
        """With ?force=true, slot is created even with conflicts."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post(
            "/api/v1/academics/schedule/?force=true",
            {
                "assigned_class": str(self.classroom2.pk),
                "subject": str(self.subject2.pk),
                "teacher": str(self.teacher_user.pk),
                "day_of_week": 0,
                "start_time": "08:00",
                "end_time": "09:00",
                "room": str(self.room1.pk),
                "academic_year": str(self.academic_year.pk),
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_19_check_conflicts_preview(self):
        """POST check-conflicts/ returns conflict list without creating."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post(
            "/api/v1/academics/schedule/check-conflicts/",
            {
                "day_of_week": 0,
                "start_time": "08:00",
                "end_time": "09:00",
                "teacher": str(self.teacher_user.pk),
                "room": str(self.room1.pk),
                "assigned_class": str(self.classroom.pk),
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["has_conflicts"])
        self.assertGreater(len(resp.data["conflicts"]), 0)


# ═══════════════════════════════════════════════════════════════════════════
# 4. TEACHER AVAILABILITY TESTS
# ═══════════════════════════════════════════════════════════════════════════


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
)
class TestTeacherAvailability(APITestCase, BaseTestSetup):
    """Test teacher availability blocks and conflict interaction."""

    def setUp(self):
        self._setup_base()

    def test_20_create_availability_block(self):
        """Admin can create a teacher unavailability block."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post(
            "/api/v1/academics/teacher-availability/",
            {
                "teacher": str(self.teacher_user.pk),
                "day_of_week": 2,
                "start_time": "08:00",
                "end_time": "12:00",
                "reason": "Formation continue",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["reason"], "Formation continue")

    def test_21_availability_block_causes_conflict(self):
        """Scheduling during an unavailability block → 409."""
        TeacherAvailability.objects.create(
            school=self.school,
            teacher=self.teacher_user,
            day_of_week=3,  # Wednesday
            start_time=datetime.time(8, 0),
            end_time=datetime.time(12, 0),
            reason="Indisponible",
        )
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post(
            "/api/v1/academics/schedule/",
            {
                "assigned_class": str(self.classroom.pk),
                "subject": str(self.subject1.pk),
                "teacher": str(self.teacher_user.pk),
                "day_of_week": 3,
                "start_time": "09:00",
                "end_time": "10:00",
                "room": str(self.room1.pk),
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_409_CONFLICT)
        types = [c["type"] for c in resp.data["conflicts"]]
        self.assertIn("TEACHER_UNAVAILABLE", types)

    def test_22_list_availability_by_teacher(self):
        """List availability blocks filtered by teacher."""
        TeacherAvailability.objects.create(
            school=self.school,
            teacher=self.teacher_user,
            day_of_week=0,
            start_time=datetime.time(14, 0),
            end_time=datetime.time(16, 0),
        )
        TeacherAvailability.objects.create(
            school=self.school,
            teacher=self.teacher_user2,
            day_of_week=0,
            start_time=datetime.time(14, 0),
            end_time=datetime.time(16, 0),
        )
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get(
            f"/api/v1/academics/teacher-availability/?teacher={self.teacher_user.pk}"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data if isinstance(resp.data, list) else resp.data.get("results", resp.data)
        # All results should be for teacher_user
        for item in results:
            self.assertEqual(str(item["teacher"]), str(self.teacher_user.pk))


# ═══════════════════════════════════════════════════════════════════════════
# 5. TEACHER SCHEDULE AUTO-GENERATION TESTS
# ═══════════════════════════════════════════════════════════════════════════


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
)
class TestTeacherScheduleAutoGen(APITestCase, BaseTestSetup):
    """Test auto-generation of teacher schedule from class timetables."""

    def setUp(self):
        self._setup_base()
        # Create class slots
        ScheduleSlot.objects.create(
            school=self.school,
            assigned_class=self.classroom,
            subject=self.subject1,
            teacher=self.teacher_user,
            day_of_week=0,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(9, 0),
            room=self.room1,
        )
        ScheduleSlot.objects.create(
            school=self.school,
            assigned_class=self.classroom2,
            subject=self.subject1,
            teacher=self.teacher_user,
            day_of_week=0,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(10, 0),
            room=self.room2,
        )
        ScheduleSlot.objects.create(
            school=self.school,
            assigned_class=self.classroom,
            subject=self.subject1,
            teacher=self.teacher_user,
            day_of_week=1,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(9, 0),
            room=self.room1,
        )

    def test_23_teacher_schedule_endpoint(self):
        """GET teacher-schedule returns schedule organized by day."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get(
            f"/api/v1/academics/schedule/teacher-schedule/{self.teacher_user.pk}/"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Day 0 (Sunday) should have 2 slots — keys are integers
        self.assertEqual(len(resp.data[0]), 2)
        # Day 1 (Monday) should have 1 slot
        self.assertEqual(len(resp.data[1]), 1)

    def test_24_class_schedule_endpoint(self):
        """GET class-schedule returns schedule organized by day."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get(
            f"/api/v1/academics/schedule/class-schedule/{self.classroom.pk}/"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Day 0 has 1 slot for this class — keys are integers
        self.assertEqual(len(resp.data[0]), 1)
        # Day 1 has 1 slot
        self.assertEqual(len(resp.data[1]), 1)

    def test_25_teacher_schedule_empty_for_no_slots(self):
        """Teacher with no slots gets empty schedule."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get(
            f"/api/v1/academics/schedule/teacher-schedule/{self.teacher_user2.pk}/"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data, {})


# ═══════════════════════════════════════════════════════════════════════════
# 6. CONFLICT DETECTION SERVICE UNIT TESTS
# ═══════════════════════════════════════════════════════════════════════════


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
)
class TestConflictDetectionService(APITestCase, BaseTestSetup):
    """Unit tests for the detect_conflicts and validate_slot functions."""

    def setUp(self):
        self._setup_base()
        self.slot = ScheduleSlot.objects.create(
            school=self.school,
            assigned_class=self.classroom,
            subject=self.subject1,
            teacher=self.teacher_user,
            day_of_week=0,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(9, 0),
            room=self.room1,
        )

    def test_26_detect_teacher_conflict(self):
        """detect_conflicts finds teacher overlap."""
        from apps.academics.services import detect_conflicts

        conflicts = detect_conflicts(
            school=self.school,
            day_of_week=0,
            start_time=datetime.time(8, 30),
            end_time=datetime.time(9, 30),
            teacher=self.teacher_user,
        )
        self.assertTrue(any(c["type"] == "TEACHER" for c in conflicts))

    def test_27_detect_room_conflict(self):
        """detect_conflicts finds room overlap."""
        from apps.academics.services import detect_conflicts

        conflicts = detect_conflicts(
            school=self.school,
            day_of_week=0,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(8, 30),
            room=self.room1,
        )
        self.assertTrue(any(c["type"] == "ROOM" for c in conflicts))

    def test_28_detect_class_conflict(self):
        """detect_conflicts finds class overlap."""
        from apps.academics.services import detect_conflicts

        conflicts = detect_conflicts(
            school=self.school,
            day_of_week=0,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(9, 0),
            assigned_class=self.classroom,
        )
        self.assertTrue(any(c["type"] == "CLASS" for c in conflicts))

    def test_29_no_conflict_when_excluded(self):
        """Excluding the slot's own ID reports no conflict."""
        from apps.academics.services import detect_conflicts

        conflicts = detect_conflicts(
            school=self.school,
            day_of_week=0,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(9, 0),
            teacher=self.teacher_user,
            room=self.room1,
            assigned_class=self.classroom,
            exclude_slot_id=self.slot.pk,
        )
        self.assertEqual(len(conflicts), 0)

    def test_30_validate_slot_with_availability(self):
        """validate_slot catches teacher unavailability."""
        from apps.academics.services import validate_slot

        TeacherAvailability.objects.create(
            school=self.school,
            teacher=self.teacher_user2,
            day_of_week=2,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(12, 0),
        )
        issues = validate_slot(
            school=self.school,
            day_of_week=2,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(10, 0),
            teacher=self.teacher_user2,
        )
        self.assertTrue(any(i["type"] == "TEACHER_UNAVAILABLE" for i in issues))


# ═══════════════════════════════════════════════════════════════════════════
# 7. SCHEDULE SLOT UPDATE / CONFLICT ON UPDATE TESTS
# ═══════════════════════════════════════════════════════════════════════════


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
)
class TestScheduleSlotUpdate(APITestCase, BaseTestSetup):
    """Test that updating a slot also validates conflicts."""

    def setUp(self):
        self._setup_base()
        self.slot1 = ScheduleSlot.objects.create(
            school=self.school,
            assigned_class=self.classroom,
            subject=self.subject1,
            teacher=self.teacher_user,
            day_of_week=0,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(9, 0),
            room=self.room1,
        )
        self.slot2 = ScheduleSlot.objects.create(
            school=self.school,
            assigned_class=self.classroom2,
            subject=self.subject2,
            teacher=self.teacher_user2,
            day_of_week=0,
            start_time=datetime.time(10, 0),
            end_time=datetime.time(11, 0),
            room=self.room2,
        )

    def test_31_update_slot_no_conflict(self):
        """Updating slot2 to a non-conflicting time works."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.patch(
            f"/api/v1/academics/schedule/{self.slot2.pk}/",
            {"start_time": "11:00", "end_time": "12:00"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_32_update_slot_with_room_conflict(self):
        """Moving slot2 to same room + overlapping time as slot1 → 409."""
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.patch(
            f"/api/v1/academics/schedule/{self.slot2.pk}/",
            {
                "start_time": "08:00",
                "end_time": "09:00",
                "room": str(self.room1.pk),
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_409_CONFLICT)
