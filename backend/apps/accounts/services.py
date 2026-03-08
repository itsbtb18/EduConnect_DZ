"""
StudentParentCreationService
==============================
Centralised service that handles every scenario when creating or
importing a student that should be linked to one **or two** parent
accounts (father + mother).

Key behaviours
--------------
* **Phone deduplication** — if a parent User with the given phone
  already exists, the student is linked to that parent's profile
  instead of creating a duplicate account.
* **Father + Mother** — two separate parent accounts can be linked
  to the same StudentProfile via the M2M ``children`` field.
* **Relationship tag** — each ParentProfile carries a ``relationship``
  (FATHER / MOTHER / GUARDIAN).
* **Temporary password** — every *new* user (student & parent) gets a
  random temp password; ``is_first_login`` is set to ``True``.
* **Idempotent** — calling the service twice with the same parent
  phone simply re-links without error.
"""

import logging
import secrets
import string
from dataclasses import dataclass, field
from typing import Optional

from django.db import transaction

from apps.academics.models import ParentProfile, StudentProfile
from apps.accounts.models import User

logger = logging.getLogger(__name__)


# ── helpers ──────────────────────────────────────────────────────────────────


def _temp_password(length: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _generate_student_phone(first: str, last: str, school_id) -> str:
    """Placeholder phone for students who have no real phone."""
    suffix = secrets.token_hex(3)
    return f"STU{str(school_id)[:6]}{suffix}"


# ── result dataclass ─────────────────────────────────────────────────────────


@dataclass
class CreationResult:
    student_user: Optional[User] = None
    student_profile: Optional[StudentProfile] = None
    student_password: str = ""
    parent_results: list = field(default_factory=list)
    errors: list = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return self.student_user is not None and not self.errors


@dataclass
class ParentResult:
    user: User
    profile: ParentProfile
    was_existing: bool  # True = linked (phone already existed)
    temp_password: str  # empty if was_existing


# ── main service ─────────────────────────────────────────────────────────────


class StudentParentCreationService:
    """
    Create a student and optionally link / create parent(s).

    Usage::

        svc = StudentParentCreationService(
            school=school,
            created_by=admin_user,
        )
        result = svc.create_student_with_parents(
            first_name="Ahmed",
            last_name="Benali",
            current_class=class_obj,
            parent_phone="0555123456",
            parent_first_name="Karim",
            parent_last_name="Benali",
            parent_relationship="FATHER",
            second_parent_phone="0555654321",
            second_parent_first_name="Fatima",
            second_parent_last_name="Benali",
            second_parent_relationship="MOTHER",
        )
    """

    def __init__(self, *, school, created_by):
        self.school = school
        self.created_by = created_by

    # ── public entry point ───────────────────────────────────────────────

    @transaction.atomic
    def create_student_with_parents(
        self,
        *,
        first_name: str,
        last_name: str,
        current_class=None,
        phone_number: str = "",
        email: str = "",
        date_of_birth=None,
        student_id: str = "",
        # primary parent
        parent_phone: str = "",
        parent_first_name: str = "",
        parent_last_name: str = "",
        parent_relationship: str = "",
        # second parent (optional)
        second_parent_phone: str = "",
        second_parent_first_name: str = "",
        second_parent_last_name: str = "",
        second_parent_relationship: str = "",
    ) -> CreationResult:
        result = CreationResult()

        # ── 1. Create student user ───────────────────────────────────────
        if not phone_number:
            phone_number = _generate_student_phone(
                first_name, last_name, self.school.pk
            )

        student_password = _temp_password()
        try:
            student_user = User.objects.create_user(
                phone_number=phone_number,
                password=student_password,
                first_name=first_name,
                last_name=last_name,
                email=email or "",
                role=User.Role.STUDENT,
                school=self.school,
                is_first_login=True,
                created_by=self.created_by,
            )
        except Exception as exc:
            result.errors.append(f"Student creation failed: {exc}")
            return result

        result.student_user = student_user
        result.student_password = student_password

        # ── 2. Student profile (signal may have created it) ──────────────
        profile, _ = StudentProfile.objects.get_or_create(user=student_user)
        if current_class:
            profile.current_class = current_class
        if date_of_birth:
            profile.date_of_birth = date_of_birth
        if student_id:
            profile.student_id = student_id
        profile.save()
        result.student_profile = profile

        # ── 3. Link / create parent(s) ───────────────────────────────────
        if parent_phone:
            pr = self._link_or_create_parent(
                phone=parent_phone,
                first_name=parent_first_name,
                last_name=parent_last_name or last_name,
                relationship=parent_relationship,
                student_profile=profile,
            )
            if pr:
                result.parent_results.append(pr)

        if second_parent_phone and second_parent_phone != parent_phone:
            pr2 = self._link_or_create_parent(
                phone=second_parent_phone,
                first_name=second_parent_first_name,
                last_name=second_parent_last_name or last_name,
                relationship=second_parent_relationship,
                student_profile=profile,
            )
            if pr2:
                result.parent_results.append(pr2)

        return result

    # ── public: link parent to existing student ──────────────────────────

    def link_parent_to_student(
        self,
        *,
        student_profile: StudentProfile,
        parent_phone: str,
        parent_first_name: str = "",
        parent_last_name: str = "",
        parent_relationship: str = "",
    ) -> Optional[ParentResult]:
        """Attach a parent to an **already-existing** student."""
        return self._link_or_create_parent(
            phone=parent_phone,
            first_name=parent_first_name,
            last_name=parent_last_name,
            relationship=parent_relationship,
            student_profile=student_profile,
        )

    # ── private ──────────────────────────────────────────────────────────

    def _link_or_create_parent(
        self,
        *,
        phone: str,
        first_name: str,
        last_name: str,
        relationship: str,
        student_profile: StudentProfile,
    ) -> Optional[ParentResult]:
        """
        Deduplicate by phone number.

        * If a PARENT user with this phone exists → link child and return.
        * Otherwise → create User + ParentProfile, set relationship, link.
        """
        existing = User.objects.filter(
            phone_number=phone,
            role=User.Role.PARENT,
        ).first()

        if existing:
            profile, _ = ParentProfile.objects.get_or_create(
                user=existing,
                defaults={"created_by": self.created_by},
            )
            profile.children.add(student_profile)
            # Update relationship if provided and profile doesn't have one
            if relationship and not profile.relationship:
                profile.relationship = relationship
                profile.save(update_fields=["relationship"])

            logger.info(
                "Linked existing parent %s (phone=%s) to student %s",
                existing.pk,
                phone,
                student_profile.pk,
            )
            return ParentResult(
                user=existing,
                profile=profile,
                was_existing=True,
                temp_password="",
            )

        # ── create new parent ────────────────────────────────────────────
        pwd = _temp_password()
        parent_user = User.objects.create_user(
            phone_number=phone,
            password=pwd,
            first_name=first_name or "Parent",
            last_name=last_name or student_profile.user.last_name,
            role=User.Role.PARENT,
            school=self.school,
            is_first_login=True,
            created_by=self.created_by,
        )
        # Signal auto-creates ParentProfile; fetch it
        profile, _ = ParentProfile.objects.get_or_create(
            user=parent_user,
            defaults={"created_by": self.created_by},
        )
        if relationship:
            profile.relationship = relationship
            profile.save(update_fields=["relationship"])
        profile.children.add(student_profile)

        logger.info(
            "Created new parent %s (phone=%s) for student %s",
            parent_user.pk,
            phone,
            student_profile.pk,
        )
        return ParentResult(
            user=parent_user,
            profile=profile,
            was_existing=False,
            temp_password=pwd,
        )
