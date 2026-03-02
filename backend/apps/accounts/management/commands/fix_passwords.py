"""
Management command: fix_passwords
Scans all users and re-hashes any password that is stored in plain text.

Usage:
    python manage.py fix_passwords          # dry-run — only report
    python manage.py fix_passwords --apply  # actually fix the passwords
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import identify_hasher
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Detect and fix users whose password is stored as plain text (unhashed)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            default=False,
            help="Actually re-hash the passwords. Without this flag, only a dry-run report is printed.",
        )

    def handle(self, *args, **options):
        apply = options["apply"]
        fixed = 0
        skipped = 0

        for user in User.objects.all().iterator():
            if not user.password:
                skipped += 1
                continue
            if user.password.startswith("!"):
                # Unusable password — skip
                skipped += 1
                continue
            try:
                identify_hasher(user.password)
                # Password is properly hashed
                skipped += 1
            except ValueError:
                # Plain-text password detected
                if apply:
                    user.set_password(user.password)
                    user.save(update_fields=["password"])
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  FIXED: {user.phone_number} ({user.get_full_name()})"
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  NEEDS FIX: {user.phone_number} ({user.get_full_name()})"
                        )
                    )
                fixed += 1

        mode = "Fixed" if apply else "Would fix"
        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(f"{mode} {fixed} user(s). Skipped {skipped} (already OK).")
        )
        if not apply and fixed > 0:
            self.stdout.write(
                self.style.NOTICE("Run again with --apply to actually fix them.")
            )
