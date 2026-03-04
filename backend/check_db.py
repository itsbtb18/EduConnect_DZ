#!/usr/bin/env python
"""Quick DB inspection script."""
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ilmi.settings.development")
django.setup()

from apps.accounts.models import User
from apps.schools.models import School, Section
from apps.academics.models import Class, TeacherProfile

print("=== USERS ===")
for u in User.objects.all():
    print(f"  {u.phone_number} role={u.role} school_id={u.school_id} active={u.is_active}")

print("\n=== SCHOOLS ===")
for s in School.objects.all():
    print(f"  id={s.id} name={s.name}")

print("\n=== SECTIONS ===")
for sec in Section.objects.all():
    print(f"  id={sec.id} type={sec.section_type} school={sec.school_id} name={sec.name}")

print("\n=== CLASSES ===")
for c in Class.objects.all():
    print(f"  id={c.id} name={c.name} school={c.school_id} ay={c.academic_year_id}")

print("\n=== TEACHERS (User role=TEACHER) ===")
for t in User.objects.filter(role="TEACHER"):
    print(f"  {t.phone_number} school={t.school_id} active={t.is_active}")

print("\n=== TEACHER PROFILES ===")
for tp in TeacherProfile.objects.all():
    print(f"  user={tp.user.phone_number} school={tp.school_id if hasattr(tp, 'school_id') else 'N/A'}")
