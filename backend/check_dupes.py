"""De-duplicate subjects: keep one per (school, code), delete the rest."""
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ilmi.settings")
django.setup()
from apps.academics.models import Subject
from apps.schools.models import School
from django.db.models import Count

schools = School.objects.all()
for school in schools:
    dupes = (
        Subject.objects.filter(school=school)
        .values("code")
        .annotate(cnt=Count("id"))
        .filter(cnt__gt=1)
    )
    total_deleted = 0
    for d in dupes:
        # Keep the first one (oldest by created_at), delete the rest
        all_with_code = list(
            Subject.objects.filter(school=school, code=d["code"])
            .order_by("created_at")
            .values_list("id", flat=True)
        )
        keep_id = all_with_code[0]
        to_delete = Subject.objects.filter(school=school, code=d["code"]).exclude(id=keep_id)
        n = to_delete.count()
        to_delete.delete()
        total_deleted += n
        print("  school=%s code=%s deleted=%d kept=1" % (school.name, d["code"], n))
    remaining = Subject.objects.filter(school=school).count()
    print("School %s: deleted %d dupes, %d subjects remaining" % (school.name, total_deleted, remaining))
print("DEDUP_DONE")