# Generated manually — Algerian school hierarchy
#
# This migration:
#   1. Creates Level, Stream, LevelSubject models
#   2. Adds school FK to Class (populated from section.school)
#   3. Converts Class.level  CharField → FK(Level)
#   4. Converts Class.stream CharField → FK(Stream)
#   5. Renames Class.max_students → capacity
#   6. Renames classes table → classrooms
#   7. Removes Subject.coefficient (moved to LevelSubject)
#
# For an existing DB with data: a RunPython step auto-creates Level
# objects from old level strings. For a fresh DB: no-op and everything
# works cleanly.

import uuid
from decimal import Decimal

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


# ── Data migration helpers ──────────────────────────────────────────────


def populate_school_from_section(apps, schema_editor):
    """Copy school_id to Class rows from their linked section."""
    Class = apps.get_model("academics", "Class")
    for cls in Class.objects.select_related("section").filter(school__isnull=True):
        if cls.section_id:
            cls.school_id = cls.section.school_id
            cls.save(update_fields=["school_id"])


def migrate_class_levels(apps, schema_editor):
    """
    For existing rows: create Level objects from old level strings
    and link them to the new FK field.
    """
    Class = apps.get_model("academics", "Class")
    Level = apps.get_model("academics", "Level")

    level_cache = {}

    for cls in Class.objects.filter(level__isnull=True):
        old_level = getattr(cls, "_old_level", None) or ""
        if not old_level:
            continue

        cache_key = (str(cls.school_id), old_level)
        if cache_key not in level_cache:
            level, _ = Level.objects.get_or_create(
                school_id=cls.school_id,
                code=old_level,
                defaults={
                    "section_id": cls.section_id,
                    "name": old_level,
                    "order": 0,
                    "max_grade": Decimal("20"),
                    "passing_grade": Decimal("10"),
                    "has_streams": False,
                },
            )
            level_cache[cache_key] = level

        cls.level = level_cache[cache_key]
        cls.save(update_fields=["level_id"])


def noop(apps, schema_editor):
    """Reverse migration no-op."""
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("academics", "0003_add_timetable_model"),
        ("schools", "0003_alter_academicyear_unique_together_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 1. CREATE NEW HIERARCHY MODELS
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        migrations.CreateModel(
            name="Level",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                (
                    "deleted_at",
                    models.DateTimeField(blank=True, null=True),
                ),
                (
                    "name",
                    models.CharField(
                        help_text="e.g. 1ère Année Primaire",
                        max_length=100,
                    ),
                ),
                (
                    "code",
                    models.CharField(
                        help_text="e.g. PREP, 1AP, 2AM, 3AS",
                        max_length=10,
                    ),
                ),
                (
                    "order",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="Sort order within the section",
                    ),
                ),
                (
                    "max_grade",
                    models.DecimalField(
                        decimal_places=2,
                        default=20,
                        help_text="Maximum grade: 10 for primaire, 20 for moyen/lycée",
                        max_digits=4,
                    ),
                ),
                (
                    "passing_grade",
                    models.DecimalField(
                        decimal_places=2,
                        default=10,
                        help_text="Passing threshold: 5 for primaire, 10 for moyen/lycée",
                        max_digits=4,
                    ),
                ),
                (
                    "has_streams",
                    models.BooleanField(
                        default=False,
                        help_text="True for lycée levels that have filières",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="%(class)s_set",
                        to="schools.school",
                    ),
                ),
                (
                    "section",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="levels",
                        to="schools.section",
                    ),
                ),
            ],
            options={
                "db_table": "levels",
                "ordering": ["section", "order"],
                "unique_together": {("school", "code")},
            },
        ),
        migrations.CreateModel(
            name="Stream",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                (
                    "deleted_at",
                    models.DateTimeField(blank=True, null=True),
                ),
                (
                    "name",
                    models.CharField(
                        help_text="e.g. Sciences Expérimentales",
                        max_length=100,
                    ),
                ),
                (
                    "code",
                    models.CharField(
                        help_text="e.g. SCI, MATH, LPH",
                        max_length=20,
                    ),
                ),
                (
                    "short_name",
                    models.CharField(
                        blank=True,
                        help_text="Abbreviated name for UI",
                        max_length=30,
                    ),
                ),
                (
                    "is_tronc_commun",
                    models.BooleanField(
                        default=False,
                        help_text="True for 1AS tronc commun streams",
                    ),
                ),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "level",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="streams",
                        to="academics.level",
                    ),
                ),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="%(class)s_set",
                        to="schools.school",
                    ),
                ),
            ],
            options={
                "db_table": "streams",
                "ordering": ["level", "order"],
                "unique_together": {("school", "level", "code")},
            },
        ),
        migrations.CreateModel(
            name="LevelSubject",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                (
                    "deleted_at",
                    models.DateTimeField(blank=True, null=True),
                ),
                (
                    "coefficient",
                    models.DecimalField(
                        decimal_places=2,
                        default=1,
                        help_text="Coefficient for weighted-average calculation",
                        max_digits=4,
                    ),
                ),
                ("is_mandatory", models.BooleanField(default=True)),
                (
                    "weekly_hours",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="Hours per week",
                        max_digits=4,
                        null=True,
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "level",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="level_subjects",
                        to="academics.level",
                    ),
                ),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="%(class)s_set",
                        to="schools.school",
                    ),
                ),
                (
                    "stream",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="stream_subjects",
                        to="academics.stream",
                    ),
                ),
                (
                    "subject",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="level_assignments",
                        to="academics.subject",
                    ),
                ),
            ],
            options={
                "db_table": "level_subjects",
                "ordering": ["level", "stream", "-coefficient"],
            },
        ),
        migrations.AddConstraint(
            model_name="levelsubject",
            constraint=models.UniqueConstraint(
                condition=models.Q(("stream__isnull", False)),
                fields=["school", "level", "stream", "subject"],
                name="unique_level_stream_subject",
            ),
        ),
        migrations.AddConstraint(
            model_name="levelsubject",
            constraint=models.UniqueConstraint(
                condition=models.Q(("stream__isnull", True)),
                fields=["school", "level", "subject"],
                name="unique_level_subject_no_stream",
            ),
        ),
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 2. ADD SCHOOL FK TO CLASS  (was AuditModel → now TenantModel)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        migrations.AddField(
            model_name="class",
            name="school",
            field=models.ForeignKey(
                null=True,  # Temporarily nullable for data migration
                on_delete=django.db.models.deletion.CASCADE,
                related_name="%(class)s_set",
                to="schools.school",
            ),
        ),
        migrations.RunPython(populate_school_from_section, noop),
        migrations.AlterField(
            model_name="class",
            name="school",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="%(class)s_set",
                to="schools.school",
            ),
        ),
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 3. CONVERT CLASS.LEVEL  (CharField → FK to Level)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        migrations.RenameField(
            model_name="class",
            old_name="level",
            new_name="_old_level",
        ),
        migrations.AddField(
            model_name="class",
            name="level",
            field=models.ForeignKey(
                null=True,  # Temporarily nullable for data migration
                on_delete=django.db.models.deletion.CASCADE,
                related_name="classes",
                to="academics.level",
            ),
        ),
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 4. CONVERT CLASS.STREAM  (CharField → FK to Stream)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        migrations.RenameField(
            model_name="class",
            old_name="stream",
            new_name="_old_stream",
        ),
        migrations.AddField(
            model_name="class",
            name="stream",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="classes",
                to="academics.stream",
            ),
        ),
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 5. DATA MIGRATION — Create Levels from old strings, link FKs
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        migrations.RunPython(migrate_class_levels, noop),
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 6. FINALIZE — Make level non-null, drop old columns
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        migrations.AlterField(
            model_name="class",
            name="level",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="classes",
                to="academics.level",
            ),
        ),
        migrations.RemoveField(model_name="class", name="_old_level"),
        migrations.RemoveField(model_name="class", name="_old_stream"),
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 7. RENAME max_students → capacity
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        migrations.RenameField(
            model_name="class",
            old_name="max_students",
            new_name="capacity",
        ),
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 8. ALTER TABLE NAME & OPTIONS
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        migrations.AlterModelTable(
            name="class",
            table="classrooms",
        ),
        migrations.AlterModelOptions(
            name="class",
            options={
                "ordering": ["level__order", "name"],
                "verbose_name_plural": "classes",
            },
        ),
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 9. REMOVE COEFFICIENT FROM SUBJECT (moved to LevelSubject)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        migrations.RemoveField(model_name="subject", name="coefficient"),
    ]
