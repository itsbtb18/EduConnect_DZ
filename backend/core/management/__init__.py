"""
Custom management command for checking and filtering tenant data.
"""

from django.core.management.base import BaseCommand


class TenantCommand(BaseCommand):
    """Base management command with tenant (school) awareness."""

    def add_arguments(self, parser):
        parser.add_argument(
            "--school-id",
            type=str,
            help="UUID of the school to target. If not provided, applies to all schools.",
        )

    def get_school(self, options):
        from apps.schools.models import School

        school_id = options.get("school_id")
        if school_id:
            try:
                return School.objects.get(id=school_id)
            except School.DoesNotExist:
                self.stderr.write(
                    self.style.ERROR(f"School with ID {school_id} not found.")
                )
                return None
        return None
