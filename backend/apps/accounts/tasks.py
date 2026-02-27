"""
Celery tasks for the Accounts app.
Handles bulk import and account provisioning.
"""

from celery import shared_task


@shared_task(bind=True, max_retries=3)
def bulk_import_students(self, school_id: str, file_path: str, admin_user_id: str):
    """
    Process bulk student import from an uploaded Excel file.
    Creates student + parent accounts, links them, and queues SMS notifications.

    Expected Excel columns:
        student_first_name | student_last_name | date_of_birth | class_name | section
        parent_first_name  | parent_last_name  | parent_phone  | parent_email (optional)
        second_parent_phone (optional)

    Returns:
        dict with counts of created, errors, and skipped records.
    """
    import logging

    from django.contrib.auth import get_user_model

    from apps.schools.models import School

    logger = logging.getLogger(__name__)
    User = get_user_model()

    try:
        import openpyxl

        school = School.objects.get(id=school_id)
        User.objects.get(id=admin_user_id)  # Validate admin exists

        wb = openpyxl.load_workbook(file_path)
        ws = wb.active

        stats = {"created": 0, "errors": 0, "skipped": 0, "details": []}

        # Skip header row
        for row_num, row in enumerate(
            ws.iter_rows(min_row=2, values_only=True), start=2
        ):
            try:
                if (
                    not row[0] or not row[1]
                ):  # student_first_name, student_last_name required
                    stats["skipped"] += 1
                    continue

                student_first = str(row[0]).strip()
                student_last = str(row[1]).strip()
                dob = row[2]
                class_name = str(row[3]).strip() if row[3] else ""  # noqa: F841
                parent_first = str(row[5]).strip() if len(row) > 5 and row[5] else ""
                parent_last = str(row[6]).strip() if len(row) > 6 and row[6] else ""
                parent_phone = str(row[7]).strip() if len(row) > 7 and row[7] else ""
                parent_email = str(row[8]).strip() if len(row) > 8 and row[8] else ""

                # Generate temporary email for student if none
                student_email = f"{student_first.lower()}.{student_last.lower()}.{row_num}@{school.code}.educonnect.dz"
                temp_password = User.objects.make_random_password(length=10)

                # Create student account
                student = User.objects.create_user(
                    email=student_email,
                    password=temp_password,
                    first_name=student_first,
                    last_name=student_last,
                    date_of_birth=dob,
                    role="student",
                    school=school,
                    must_change_password=True,
                )

                # Handle parent account (check if phone already exists)
                if parent_phone:
                    existing_parent = User.objects.filter(
                        phone=parent_phone, role="parent", school=school
                    ).first()

                    if existing_parent:
                        # Link student to existing parent
                        existing_parent.parent_profile.children.add(student)
                    elif parent_email:
                        # Create new parent account
                        parent = User.objects.create_user(
                            email=parent_email,
                            password=User.objects.make_random_password(length=10),
                            first_name=parent_first,
                            last_name=parent_last,
                            phone=parent_phone,
                            role="parent",
                            school=school,
                            must_change_password=True,
                        )
                        parent.parent_profile.children.add(student)

                stats["created"] += 1

            except Exception as e:
                stats["errors"] += 1
                stats["details"].append({"row": row_num, "error": str(e)})
                logger.warning(f"Row {row_num} import error: {e}")

        logger.info(
            f"Bulk import complete for school {school.name}: "
            f"{stats['created']} created, {stats['errors']} errors, {stats['skipped']} skipped"
        )
        return stats

    except Exception as exc:
        logger.error(f"Bulk import failed: {exc}")
        raise self.retry(exc=exc, countdown=60)


@shared_task
def send_welcome_sms(user_id: str, temp_password: str):
    """
    Send welcome SMS to a newly created user with their temporary password.

    TODO: Integrate with Algerian SMS gateway (e.g., Twilio, Infobip, or local provider).
    """
    import logging

    from django.contrib.auth import get_user_model

    logger = logging.getLogger(__name__)
    User = get_user_model()

    try:
        user = User.objects.get(id=user_id)
        if not user.phone:
            return {"status": "skipped", "reason": "No phone number"}

        message = (
            f"Bienvenue sur EduConnect! Votre compte a été créé.\n"
            f"Email: {user.email}\n"
            f"Mot de passe temporaire: {temp_password}\n"
            f"Veuillez changer votre mot de passe à la première connexion."
        )

        # TODO: Send SMS via provider
        logger.info(f"SMS queued for {user.phone}: {message[:50]}...")

        return {"status": "queued", "phone": user.phone}

    except Exception as e:
        logger.error(f"SMS send failed for user {user_id}: {e}")
        return {"status": "failed", "error": str(e)}
