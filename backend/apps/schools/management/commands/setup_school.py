"""
Management command: setup_school
Creates a new school with an admin user and initial configuration.
Usage: python manage.py setup_school --name "School Name" --admin-email admin@school.dz
"""

from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Set up a new school with admin user and default configuration."

    def add_arguments(self, parser):
        parser.add_argument(
            "--name",
            type=str,
            required=True,
            help="Name of the school.",
        )
        parser.add_argument(
            "--code",
            type=str,
            default="",
            help="Short code for the school (e.g., 'lycee-alger').",
        )
        parser.add_argument(
            "--admin-email",
            type=str,
            required=True,
            help="Email for the school admin user.",
        )
        parser.add_argument(
            "--admin-password",
            type=str,
            default="Admin@1234",
            help="Password for the admin user (default: Admin@1234).",
        )
        parser.add_argument(
            "--admin-first-name",
            type=str,
            default="Admin",
            help="Admin user first name.",
        )
        parser.add_argument(
            "--admin-last-name",
            type=str,
            default="",
            help="Admin user last name.",
        )
        parser.add_argument(
            "--wilaya",
            type=str,
            default="",
            help="Wilaya (state) of the school.",
        )
        parser.add_argument(
            "--address",
            type=str,
            default="",
            help="Physical address of the school.",
        )
        parser.add_argument(
            "--phone",
            type=str,
            default="",
            help="School phone number.",
        )
        parser.add_argument(
            "--type",
            type=str,
            default="middle",
            choices=["primary", "middle", "secondary"],
            help="Type of school (primary, middle, secondary).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        from apps.accounts.models import User
        from apps.schools.models import AcademicYear, School

        self.stdout.write("Setting up new school...")

        # 1. Create the school
        school = School.objects.create(
            name=options["name"],
            code=options["code"] or options["name"].lower().replace(" ", "-")[:20],
            address=options["address"],
            phone=options["phone"],
            wilaya=options["wilaya"],
            school_type=options["type"],
            is_active=True,
        )
        self.stdout.write(
            self.style.SUCCESS(f"  ✅ School created: {school.name} (ID: {school.id})")
        )

        # 2. Create admin user
        admin = User.objects.create_user(
            email=options["admin_email"],
            password=options["admin_password"],
            school=school,
            role="admin",
            first_name=options["admin_first_name"],
            last_name=options["admin_last_name"],
            is_staff=True,
        )
        self.stdout.write(self.style.SUCCESS(f"  ✅ Admin user created: {admin.email}"))

        # 3. Create default academic year
        from django.utils import timezone

        now = timezone.now()
        if now.month >= 9:
            start_year = now.year
        else:
            start_year = now.year - 1
        end_year = start_year + 1

        academic_year = AcademicYear.objects.create(
            school=school,
            name=f"{start_year}-{end_year}",
            start_date=timezone.datetime(start_year, 9, 8).date(),
            end_date=timezone.datetime(end_year, 6, 30).date(),
            is_current=True,
        )
        self.stdout.write(
            self.style.SUCCESS(f"  ✅ Academic year created: {academic_year.name}")
        )

        # 4. Create default exam types
        from apps.grades.models import ExamType

        for name, weight in [("Devoir 1", 25), ("Devoir 2", 25), ("Composition", 50)]:
            ExamType.objects.create(school=school, name=name, weight=weight)
        self.stdout.write(self.style.SUCCESS("  ✅ Default exam types created"))

        # 5. Create default levels based on school type
        from apps.academics.models import Level

        if options["type"] == "primary":
            levels_data = [
                ("1ère Année Primaire", "1AP", 1),
                ("2ème Année Primaire", "2AP", 2),
                ("3ème Année Primaire", "3AP", 3),
                ("4ème Année Primaire", "4AP", 4),
                ("5ème Année Primaire", "5AP", 5),
            ]
        elif options["type"] == "middle":
            levels_data = [
                ("1ère Année Moyenne", "1AM", 1),
                ("2ème Année Moyenne", "2AM", 2),
                ("3ème Année Moyenne", "3AM", 3),
                ("4ème Année Moyenne", "4AM", 4),
            ]
        else:  # secondary
            levels_data = [
                ("1ère Année Secondaire", "1AS", 1),
                ("2ème Année Secondaire", "2AS", 2),
                ("3ème Année Secondaire", "3AS", 3),
            ]

        for name, code, order in levels_data:
            Level.objects.create(school=school, name=name, code=code, order=order)
        self.stdout.write(
            self.style.SUCCESS(f"  ✅ {len(levels_data)} default levels created")
        )

        # Summary
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(self.style.SUCCESS("🎓 School setup complete!"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(f"  School ID:    {school.id}")
        self.stdout.write(f"  School Name:  {school.name}")
        self.stdout.write(f"  Admin Email:  {admin.email}")
        self.stdout.write(f"  Admin Pass:   {options['admin_password']}")
        self.stdout.write(f"  Academic Year: {academic_year.name}")
        self.stdout.write("")
        self.stdout.write(
            "  Next steps:\n"
            "    1. Run: python manage.py seed_data "
            f"--school-id {school.id}\n"
            "    2. Start the server: python manage.py runserver\n"
            "    3. Login at: http://localhost:8000/admin/"
        )
