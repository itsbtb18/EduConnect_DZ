"""
Management command: seed_data
Seeds the database with realistic test data for development and demos.
Usage: python manage.py seed_data --school-id <uuid> [--students 50] [--teachers 10]
"""

import random
import string

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone


class Command(BaseCommand):
    help = "Seed the database with realistic test data for a given school."

    FIRST_NAMES_M = [
        "Mohamed",
        "Ahmed",
        "Youcef",
        "Ali",
        "Omar",
        "Khalil",
        "Amine",
        "Walid",
        "Rachid",
        "Nadir",
        "Bilal",
        "Sofiane",
        "Karim",
        "Farid",
        "Samir",
        "Hamza",
        "Mourad",
        "Djamel",
    ]
    FIRST_NAMES_F = [
        "Fatima",
        "Amina",
        "Khadija",
        "Meriem",
        "Sara",
        "Nour",
        "Yasmine",
        "Lina",
        "Hanane",
        "Rania",
        "Lamia",
        "Soumia",
        "Nawal",
        "Imane",
        "Samira",
        "Zineb",
        "Houda",
        "Warda",
    ]
    LAST_NAMES = [
        "Benmoussa",
        "Benali",
        "Boudiaf",
        "Khelifi",
        "Rahmani",
        "Djebbar",
        "Mebarki",
        "Mansouri",
        "Belkacem",
        "Hadjadj",
        "Slimane",
        "Tounsi",
        "Amrani",
        "Bouzid",
        "Charef",
        "Dahmani",
        "Ferhat",
        "Guemri",
        "Haddad",
        "Idir",
    ]
    SUBJECTS = [
        ("Mathématiques", 5),
        ("Physique", 4),
        ("Sciences Naturelles", 3),
        ("Langue Arabe", 5),
        ("Langue Française", 4),
        ("Anglais", 3),
        ("Histoire-Géographie", 2),
        ("Éducation Islamique", 2),
        ("Éducation Civique", 1),
        ("Informatique", 2),
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            "--school-id",
            type=str,
            required=True,
            help="UUID of the school to seed data for.",
        )
        parser.add_argument(
            "--students",
            type=int,
            default=50,
            help="Number of students to create (default: 50).",
        )
        parser.add_argument(
            "--teachers",
            type=int,
            default=10,
            help="Number of teachers to create (default: 10).",
        )
        parser.add_argument(
            "--parents",
            type=int,
            default=30,
            help="Number of parents to create (default: 30).",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing seed data before creating new data.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        from apps.accounts.models import User
        from apps.schools.models import School

        school_id = options["school_id"]
        num_students = options["students"]
        num_teachers = options["teachers"]
        num_parents = options["parents"]

        try:
            school = School.objects.get(id=school_id)
        except School.DoesNotExist:
            raise CommandError(f"School with ID '{school_id}' does not exist.")

        self.stdout.write(f"Seeding data for school: {school.name}")

        if options["clear"]:
            self._clear_data(school)

        # 1. Create academic year and semesters
        academic_year = self._create_academic_year(school)

        # 2. Create levels and classrooms
        levels, classrooms = self._create_levels_and_classrooms(school)

        # 3. Create subjects
        subjects = self._create_subjects(school)

        # 4. Create teachers
        teachers = self._create_teachers(school, num_teachers)
        self.stdout.write(self.style.SUCCESS(f"  Created {len(teachers)} teachers"))

        # 5. Assign teachers to classrooms/subjects
        assignments = self._create_teacher_assignments(
            school, teachers, classrooms, subjects
        )
        self.stdout.write(
            self.style.SUCCESS(f"  Created {len(assignments)} teacher assignments")
        )

        # 6. Create parents
        parents = self._create_parents(school, num_parents)
        self.stdout.write(self.style.SUCCESS(f"  Created {len(parents)} parents"))

        # 7. Create students and assign to classrooms
        students = self._create_students(school, num_students, classrooms, parents)
        self.stdout.write(self.style.SUCCESS(f"  Created {len(students)} students"))

        # 8. Create grades
        grades_count = self._create_grades(school, students, assignments)
        self.stdout.write(self.style.SUCCESS(f"  Created {grades_count} grades"))

        # 9. Create attendance records
        att_count = self._create_attendance(school, students, classrooms)
        self.stdout.write(
            self.style.SUCCESS(f"  Created {att_count} attendance records")
        )

        # 10. Create announcements
        ann_count = self._create_announcements(school)
        self.stdout.write(self.style.SUCCESS(f"  Created {ann_count} announcements"))

        self.stdout.write(
            self.style.SUCCESS(f"\n✅ Seed complete for '{school.name}'!")
        )

    def _clear_data(self, school):
        from apps.accounts.models import User

        User.objects.filter(school=school).exclude(role="admin").delete()
        self.stdout.write(self.style.WARNING("  Cleared existing seed data"))

    def _create_academic_year(self, school):
        from apps.schools.models import AcademicYear

        year, created = AcademicYear.objects.get_or_create(
            school=school,
            name="2024-2025",
            defaults={
                "start_date": timezone.datetime(2024, 9, 8).date(),
                "end_date": timezone.datetime(2025, 6, 30).date(),
                "is_current": True,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS("  Created academic year 2024-2025"))
        return year

    def _create_levels_and_classrooms(self, school):
        from apps.academics.models import Classroom, Level

        level_data = [
            ("1ère Année Moyenne", "1AM"),
            ("2ème Année Moyenne", "2AM"),
            ("3ème Année Moyenne", "3AM"),
            ("4ème Année Moyenne", "4AM"),
        ]
        levels = []
        classrooms = []

        for name, code in level_data:
            level, _ = Level.objects.get_or_create(
                school=school,
                name=name,
                defaults={"code": code, "order": len(levels) + 1},
            )
            levels.append(level)

            for section in ["A", "B"]:
                cls, _ = Classroom.objects.get_or_create(
                    school=school,
                    name=f"{code} - {section}",
                    defaults={
                        "level": level,
                        "capacity": 35,
                    },
                )
                classrooms.append(cls)

        self.stdout.write(
            self.style.SUCCESS(
                f"  Created {len(levels)} levels, {len(classrooms)} classrooms"
            )
        )
        return levels, classrooms

    def _create_subjects(self, school):
        from apps.academics.models import Subject

        subjects = []
        for name, coeff in self.SUBJECTS:
            subj, _ = Subject.objects.get_or_create(
                school=school,
                name=name,
                defaults={"coefficient": coeff},
            )
            subjects.append(subj)
        self.stdout.write(self.style.SUCCESS(f"  Created {len(subjects)} subjects"))
        return subjects

    def _random_phone(self):
        prefix = random.choice(["05", "06", "07"])
        return f"{prefix}{''.join(random.choices(string.digits, k=8))}"

    def _create_user(self, school, role, first_name, last_name, email):
        from apps.accounts.models import User

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "school": school,
                "role": role,
                "first_name": first_name,
                "last_name": last_name,
                "phone_number": self._random_phone(),
                "is_active": True,
            },
        )
        if created:
            user.set_password("Test@1234")
            user.save(update_fields=["password"])
        return user, created

    def _create_teachers(self, school, count):
        teachers = []
        for i in range(count):
            fn = random.choice(self.FIRST_NAMES_M + self.FIRST_NAMES_F)
            ln = random.choice(self.LAST_NAMES)
            email = f"teacher.{fn.lower()}.{ln.lower()}{i}@{school.code or 'school'}.dz"
            user, _ = self._create_user(school, "teacher", fn, ln, email)
            teachers.append(user)
        return teachers

    def _create_parents(self, school, count):
        parents = []
        for i in range(count):
            fn = random.choice(self.FIRST_NAMES_M + self.FIRST_NAMES_F)
            ln = random.choice(self.LAST_NAMES)
            email = f"parent.{fn.lower()}.{ln.lower()}{i}@{school.code or 'school'}.dz"
            user, _ = self._create_user(school, "parent", fn, ln, email)
            parents.append(user)
        return parents

    def _create_students(self, school, count, classrooms, parents):
        from apps.accounts.models import StudentProfile

        students = []
        for i in range(count):
            fn = random.choice(self.FIRST_NAMES_M + self.FIRST_NAMES_F)
            ln = random.choice(self.LAST_NAMES)
            email = f"student.{fn.lower()}.{ln.lower()}{i}@{school.code or 'school'}.dz"
            user, _ = self._create_user(school, "student", fn, ln, email)

            # Assign to a classroom via profile
            profile = StudentProfile.objects.filter(user=user).first()
            if profile:
                profile.classroom = random.choice(classrooms)
                profile.save(update_fields=["classroom"])

            # Link to a random parent
            if parents:
                parent = random.choice(parents)
                user.parents.add(parent)

            students.append(user)
        return students

    def _create_teacher_assignments(self, school, teachers, classrooms, subjects):
        from apps.academics.models import TeacherAssignment

        assignments = []
        for classroom in classrooms:
            for subject in subjects:
                teacher = random.choice(teachers)
                assignment, _ = TeacherAssignment.objects.get_or_create(
                    school=school,
                    teacher=teacher,
                    classroom=classroom,
                    subject=subject,
                )
                assignments.append(assignment)
        return assignments

    def _create_grades(self, school, students, assignments):
        from apps.grades.models import ExamType, Grade

        exam_types = []
        for name, weight in [("Devoir 1", 25), ("Devoir 2", 25), ("Composition", 50)]:
            et, _ = ExamType.objects.get_or_create(
                school=school,
                name=name,
                defaults={"weight": weight},
            )
            exam_types.append(et)

        count = 0
        for student in students[:20]:  # Limit to 20 to avoid excessive data
            profile = getattr(student, "student_profile", None)
            if not profile or not profile.classroom:
                continue
            cls_assignments = [
                a for a in assignments if a.classroom == profile.classroom
            ]
            for assignment in cls_assignments:
                for exam_type in exam_types:
                    score = round(random.uniform(4, 20), 2)
                    Grade.objects.get_or_create(
                        school=school,
                        student=student,
                        teacher_assignment=assignment,
                        exam_type=exam_type,
                        defaults={
                            "score": min(score, 20),
                            "is_published": random.choice([True, True, False]),
                        },
                    )
                    count += 1
        return count

    def _create_attendance(self, school, students, classrooms):
        from apps.attendance.models import Attendance

        count = 0
        today = timezone.now().date()
        for student in students[:20]:
            for day_offset in range(5):
                date = today - timezone.timedelta(days=day_offset)
                status = random.choices(
                    ["present", "absent", "late"],
                    weights=[80, 12, 8],
                )[0]
                Attendance.objects.get_or_create(
                    school=school,
                    student=student,
                    date=date,
                    defaults={"status": status},
                )
                count += 1
        return count

    def _create_announcements(self, school):
        from apps.announcements.models import Announcement

        announcements_data = [
            (
                "Rentrée scolaire 2024-2025",
                "La rentrée est prévue pour le 8 septembre 2024.",
                "general",
            ),
            (
                "Réunion des parents",
                "Une réunion parents-professeurs aura lieu le 15 octobre.",
                "parents",
            ),
            (
                "Examens du 1er trimestre",
                "Les examens du premier trimestre débuteront le 1er décembre.",
                "general",
            ),
            (
                "Compétition de mathématiques",
                "Inscriptions ouvertes pour la compétition inter-écoles.",
                "students",
            ),
            (
                "Congé de vacances d'hiver",
                "Les vacances d'hiver sont du 19 décembre au 3 janvier.",
                "general",
            ),
        ]

        count = 0
        for title, content, audience in announcements_data:
            Announcement.objects.get_or_create(
                school=school,
                title=title,
                defaults={
                    "content": content,
                    "target_audience": audience,
                    "is_published": True,
                },
            )
            count += 1
        return count
