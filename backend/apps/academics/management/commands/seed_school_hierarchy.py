"""
Management command: seed_school_hierarchy

Seeds the complete Algerian school hierarchy for a given school:
  - Levels per cycle (Primaire/Moyen/Lycée)
  - Streams (filières) for lycée
  - Subject catalog
  - LevelSubject entries (coefficients per level/stream)

Usage:
  python manage.py seed_school_hierarchy --school-id <uuid>
  python manage.py seed_school_hierarchy --school-id <uuid> --cycle all
  python manage.py seed_school_hierarchy --school-id <uuid> --cycle primaire
"""

from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction


# ─── Subject catalog ────────────────────────────────────────────────────
# Master list of subjects with (name, arabic_name, code, color)

SUBJECTS = {
    "MATH": ("Mathématiques", "الرياضيات", "MATH", "#2196F3"),
    "ARAB": ("Langue Arabe", "اللغة العربية", "ARAB", "#4CAF50"),
    "FR": ("Langue Française", "اللغة الفرنسية", "FR", "#FF9800"),
    "EN": ("Langue Anglaise", "اللغة الإنجليزية", "EN", "#E91E63"),
    "SCI": ("Sciences Naturelles", "علوم الطبيعة و الحياة", "SCI", "#8BC34A"),
    "PHY": ("Sciences Physiques", "العلوم الفيزيائية", "PHY", "#00BCD4"),
    "HIS": ("Histoire", "التاريخ", "HIS", "#795548"),
    "GEO": ("Géographie", "الجغرافيا", "GEO", "#607D8B"),
    "EDC": ("Éducation Civique", "التربية المدنية", "EDC", "#9C27B0"),
    "EIS": ("Éducation Islamique", "التربية الإسلامية", "EIS", "#009688"),
    "EPS": ("Éducation Physique", "التربية البدنية", "EPS", "#FF5722"),
    "ART": ("Éducation Artistique", "التربية الفنية", "ART", "#FFEB3B"),
    "MUS": ("Éducation Musicale", "التربية الموسيقية", "MUS", "#AB47BC"),
    "TEC": ("Éducation Technologique", "التربية التكنولوجية", "TEC", "#3F51B5"),
    "INF": ("Informatique", "الإعلام الآلي", "INF", "#1565C0"),
    "PHI": ("Philosophie", "الفلسفة", "PHI", "#6D4C41"),
    "ECO": ("Économie et Gestion", "التسيير المحاسبي و المالي", "ECO", "#43A047"),
    "GES": ("Gestion", "التسيير", "GES", "#558B2F"),
    "DRT": ("Droit", "القانون", "DRT", "#455A64"),
    "ESP": ("Langue Espagnole", "اللغة الإسبانية", "ESP", "#D32F2F"),
    "ALL": ("Langue Allemande", "اللغة الألمانية", "ALL", "#F9A825"),
    "TAM": ("Tamazight", "اللغة الأمازيغية", "TAM", "#00897B"),
}


# ─── Primaire levels ────────────────────────────────────────────────────

PRIMAIRE_LEVELS = [
    ("Préparatoire", "PREP", 0),
    ("1ère Année Primaire", "1AP", 1),
    ("2ème Année Primaire", "2AP", 2),
    ("3ème Année Primaire", "3AP", 3),
    ("4ème Année Primaire", "4AP", 4),
    ("5ème Année Primaire", "5AP", 5),
]

# (subject_code, coefficient, is_mandatory, weekly_hours)
PRIMAIRE_SUBJECTS = {
    "PREP": [
        ("ARAB", 5, True, 6),
        ("FR", 3, True, 3),
        ("MATH", 4, True, 5),
        ("EIS", 2, True, 2),
        ("EDC", 1, True, 1),
        ("EPS", 1, True, 2),
        ("ART", 1, True, 1),
        ("MUS", 1, True, 1),
    ],
    "1AP": [
        ("ARAB", 5, True, 6),
        ("FR", 3, True, 3),
        ("MATH", 4, True, 5),
        ("EIS", 2, True, 2),
        ("EDC", 1, True, 1),
        ("EPS", 1, True, 2),
        ("ART", 1, True, 1),
        ("MUS", 1, True, 1),
    ],
    "2AP": [
        ("ARAB", 5, True, 6),
        ("FR", 3, True, 3),
        ("MATH", 4, True, 5),
        ("EIS", 2, True, 2),
        ("EDC", 1, True, 1),
        ("EPS", 1, True, 2),
        ("ART", 1, True, 1),
        ("MUS", 1, True, 1),
    ],
    "3AP": [
        ("ARAB", 5, True, 6),
        ("FR", 3, True, 4),
        ("MATH", 4, True, 5),
        ("EIS", 2, True, 2),
        ("EDC", 1, True, 1),
        ("SCI", 2, True, 2),
        ("EPS", 1, True, 2),
        ("ART", 1, True, 1),
    ],
    "4AP": [
        ("ARAB", 5, True, 6),
        ("FR", 3, True, 4),
        ("MATH", 4, True, 5),
        ("EIS", 2, True, 2),
        ("EDC", 1, True, 1),
        ("SCI", 2, True, 2),
        ("HIS", 1, True, 1),
        ("GEO", 1, True, 1),
        ("EPS", 1, True, 2),
        ("ART", 1, True, 1),
    ],
    "5AP": [
        ("ARAB", 5, True, 6),
        ("FR", 3, True, 4),
        ("MATH", 4, True, 5),
        ("EIS", 2, True, 2),
        ("EDC", 1, True, 1),
        ("SCI", 2, True, 2),
        ("HIS", 1, True, 1),
        ("GEO", 1, True, 1),
        ("EPS", 1, True, 2),
        ("ART", 1, True, 1),
    ],
}


# ─── Moyen levels ───────────────────────────────────────────────────────

MOYEN_LEVELS = [
    ("1ère Année Moyenne", "1AM", 1),
    ("2ème Année Moyenne", "2AM", 2),
    ("3ème Année Moyenne", "3AM", 3),
    ("4ème Année Moyenne", "4AM", 4),
]

MOYEN_SUBJECTS = {
    "1AM": [
        ("ARAB", 5, True, 5),
        ("FR", 4, True, 5),
        ("EN", 2, True, 3),
        ("MATH", 5, True, 5),
        ("SCI", 3, True, 2),
        ("PHY", 3, True, 2),
        ("HIS", 2, True, 2),
        ("GEO", 2, True, 1),
        ("EDC", 1, True, 1),
        ("EIS", 2, True, 2),
        ("TEC", 1, True, 1),
        ("INF", 1, True, 1),
        ("EPS", 1, True, 2),
        ("ART", 1, True, 1),
        ("MUS", 1, True, 1),
    ],
    "2AM": [
        ("ARAB", 5, True, 5),
        ("FR", 4, True, 5),
        ("EN", 2, True, 3),
        ("MATH", 5, True, 5),
        ("SCI", 3, True, 2),
        ("PHY", 3, True, 2),
        ("HIS", 2, True, 2),
        ("GEO", 2, True, 1),
        ("EDC", 1, True, 1),
        ("EIS", 2, True, 2),
        ("TEC", 1, True, 1),
        ("INF", 1, True, 1),
        ("EPS", 1, True, 2),
        ("ART", 1, True, 1),
        ("MUS", 1, True, 1),
    ],
    "3AM": [
        ("ARAB", 5, True, 5),
        ("FR", 4, True, 5),
        ("EN", 2, True, 3),
        ("MATH", 5, True, 5),
        ("SCI", 3, True, 2),
        ("PHY", 3, True, 2),
        ("HIS", 2, True, 2),
        ("GEO", 2, True, 1),
        ("EDC", 1, True, 1),
        ("EIS", 2, True, 2),
        ("TEC", 1, True, 1),
        ("INF", 1, True, 1),
        ("EPS", 1, True, 2),
        ("ART", 1, True, 1),
    ],
    "4AM": [
        ("ARAB", 5, True, 5),
        ("FR", 4, True, 5),
        ("EN", 2, True, 3),
        ("MATH", 5, True, 5),
        ("SCI", 3, True, 2),
        ("PHY", 3, True, 2),
        ("HIS", 2, True, 2),
        ("GEO", 2, True, 1),
        ("EDC", 1, True, 1),
        ("EIS", 2, True, 2),
        ("TEC", 1, True, 1),
        ("INF", 1, True, 1),
        ("EPS", 1, True, 2),
    ],
}


# ─── Lycée levels + streams ─────────────────────────────────────────────

LYCEE_LEVELS = [
    ("1ère Année Secondaire", "1AS", 1),
    ("2ème Année Secondaire", "2AS", 2),
    ("3ème Année Secondaire", "3AS", 3),
]

# 1AS troncs communs
STREAMS_1AS = [
    ("Sciences et Technologies", "TC_SCI", "TC Sciences", True, 1),
    ("Lettres", "TC_LET", "TC Lettres", True, 2),
]

# 2AS/3AS filières
STREAMS_2AS_3AS = [
    ("Sciences Expérimentales", "SE", "Sc. Exp.", False, 1),
    ("Mathématiques", "MATH", "Maths", False, 2),
    ("Technique Mathématiques", "TM", "Tech Maths", False, 3),
    ("Lettres et Philosophie", "LPH", "Lettres/Philo", False, 4),
    ("Langues Étrangères", "LE", "Langues Étr.", False, 5),
    ("Gestion et Économie", "GE", "Gestion/Éco", False, 6),
]

# ── 1AS Tronc Commun Sciences et Technologies
LYCEE_1AS_TC_SCI = [
    ("ARAB", 3, True, 3),
    ("FR", 3, True, 4),
    ("EN", 2, True, 3),
    ("MATH", 5, True, 5),
    ("SCI", 4, True, 3),
    ("PHY", 4, True, 3),
    ("HIS", 2, True, 2),
    ("GEO", 2, True, 1),
    ("EIS", 2, True, 1),
    ("PHI", 2, True, 2),
    ("INF", 1, True, 1),
    ("EPS", 1, True, 2),
    ("TEC", 1, True, 1),
]

# ── 1AS Tronc Commun Lettres
LYCEE_1AS_TC_LET = [
    ("ARAB", 5, True, 5),
    ("FR", 4, True, 4),
    ("EN", 3, True, 3),
    ("MATH", 3, True, 3),
    ("SCI", 2, True, 2),
    ("PHY", 2, True, 2),
    ("HIS", 3, True, 3),
    ("GEO", 2, True, 1),
    ("EIS", 2, True, 1),
    ("PHI", 3, True, 2),
    ("INF", 1, True, 1),
    ("EPS", 1, True, 2),
]

# ── 2AS / 3AS Sciences Expérimentales
LYCEE_SE = [
    ("ARAB", 3, True, 3),
    ("FR", 3, True, 3),
    ("EN", 2, True, 3),
    ("MATH", 5, True, 5),
    ("SCI", 6, True, 5),
    ("PHY", 5, True, 4),
    ("HIS", 2, True, 2),
    ("GEO", 1, True, 1),
    ("EIS", 2, True, 1),
    ("PHI", 2, True, 2),
    ("EPS", 1, True, 2),
]

# ── 2AS / 3AS Mathématiques
LYCEE_MATH = [
    ("ARAB", 2, True, 2),
    ("FR", 3, True, 3),
    ("EN", 2, True, 3),
    ("MATH", 7, True, 7),
    ("SCI", 3, True, 3),
    ("PHY", 5, True, 4),
    ("HIS", 2, True, 2),
    ("GEO", 1, True, 1),
    ("EIS", 2, True, 1),
    ("PHI", 2, True, 2),
    ("EPS", 1, True, 2),
]

# ── 2AS / 3AS Technique Mathématiques
LYCEE_TM = [
    ("ARAB", 2, True, 2),
    ("FR", 3, True, 3),
    ("EN", 2, True, 3),
    ("MATH", 7, True, 6),
    ("SCI", 2, True, 2),
    ("PHY", 5, True, 4),
    ("TEC", 5, True, 4),
    ("HIS", 2, True, 1),
    ("EIS", 2, True, 1),
    ("PHI", 2, True, 2),
    ("EPS", 1, True, 2),
]

# ── 2AS / 3AS Lettres et Philosophie
LYCEE_LPH = [
    ("ARAB", 5, True, 5),
    ("FR", 4, True, 4),
    ("EN", 3, True, 3),
    ("MATH", 2, True, 2),
    ("SCI", 2, True, 2),
    ("PHY", 2, True, 2),
    ("HIS", 4, True, 3),
    ("GEO", 2, True, 2),
    ("EIS", 3, True, 2),
    ("PHI", 5, True, 4),
    ("EPS", 1, True, 2),
]

# ── 2AS / 3AS Langues Étrangères
LYCEE_LE = [
    ("ARAB", 3, True, 3),
    ("FR", 5, True, 5),
    ("EN", 5, True, 5),
    ("MATH", 2, True, 2),
    ("SCI", 2, True, 2),
    ("PHY", 2, True, 2),
    ("HIS", 3, True, 2),
    ("GEO", 2, True, 1),
    ("EIS", 2, True, 1),
    ("PHI", 3, True, 3),
    ("ESP", 3, False, 3),
    ("EPS", 1, True, 2),
]

# ── 2AS / 3AS Gestion et Économie
LYCEE_GE = [
    ("ARAB", 3, True, 3),
    ("FR", 3, True, 3),
    ("EN", 2, True, 3),
    ("MATH", 4, True, 4),
    ("ECO", 6, True, 5),
    ("GES", 4, True, 4),
    ("DRT", 2, True, 2),
    ("HIS", 2, True, 2),
    ("EIS", 2, True, 1),
    ("PHI", 2, True, 2),
    ("EPS", 1, True, 2),
]

# Map stream code → subject list
LYCEE_STREAM_SUBJECTS = {
    "TC_SCI": LYCEE_1AS_TC_SCI,
    "TC_LET": LYCEE_1AS_TC_LET,
    "SE": LYCEE_SE,
    "MATH": LYCEE_MATH,
    "TM": LYCEE_TM,
    "LPH": LYCEE_LPH,
    "LE": LYCEE_LE,
    "GE": LYCEE_GE,
}


class Command(BaseCommand):
    help = (
        "Seed the complete Algerian school hierarchy for a school: "
        "levels, streams, subjects, coefficients."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--school-id",
            type=str,
            required=True,
            help="UUID of the school to seed.",
        )
        parser.add_argument(
            "--cycle",
            type=str,
            default="all",
            choices=["all", "primaire", "moyen", "lycee"],
            help="Which cycle(s) to seed (default: all).",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing hierarchy data for this school first.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        from apps.academics.models import Level, LevelSubject, Stream, Subject
        from apps.schools.models import School, Section

        school_id = options["school_id"]
        try:
            school = School.objects.get(pk=school_id)
        except School.DoesNotExist:
            raise CommandError(f"School with ID {school_id} does not exist.")

        cycle = options["cycle"]
        self.stdout.write(f"\n🎓 Seeding hierarchy for: {school.name}")
        self.stdout.write(f"   Cycle: {cycle}\n")

        if options["clear"]:
            LevelSubject.objects.filter(school=school).delete()
            Stream.objects.filter(school=school).delete()
            Level.objects.filter(school=school).delete()
            self.stdout.write(
                self.style.WARNING("  🗑  Cleared existing hierarchy data")
            )

        # ── Ensure subjects exist ──
        subject_map = {}
        for code, (name, arabic, _, color) in SUBJECTS.items():
            obj, created = Subject.objects.get_or_create(
                school=school,
                code=code,
                defaults={
                    "name": name,
                    "arabic_name": arabic,
                    "color": color,
                },
            )
            subject_map[code] = obj
            if created:
                self.stdout.write(f"  📚 Created subject: {name}")

        # ── Helper to create levels + level_subjects ──
        def seed_cycle(
            section_type,
            section_name,
            levels_data,
            subjects_map,
            max_grade,
            passing_grade,
            streams_data=None,
        ):
            section, _ = Section.objects.get_or_create(
                school=school,
                section_type=section_type,
                defaults={"name": section_name},
            )
            self.stdout.write(f"\n  ── {section_name} ({section_type}) ──")

            for level_name, level_code, order in levels_data:
                level, created = Level.objects.get_or_create(
                    school=school,
                    code=level_code,
                    defaults={
                        "section": section,
                        "name": level_name,
                        "order": order,
                        "max_grade": max_grade,
                        "passing_grade": passing_grade,
                        "has_streams": streams_data is not None
                        and level_code in [ld[1] for ld in levels_data if ld[2] >= 1],
                    },
                )
                status_icon = "✅" if created else "⏭️ "
                self.stdout.write(f"  {status_icon} Level: {level_code} — {level_name}")

                # Plain level subjects (no streams)
                if level_code in subjects_map:
                    count = 0
                    for subj_code, coeff, mandatory, hours in subjects_map[level_code]:
                        if subj_code not in subject_map:
                            continue
                        _, c = LevelSubject.objects.get_or_create(
                            school=school,
                            level=level,
                            stream=None,
                            subject=subject_map[subj_code],
                            defaults={
                                "coefficient": Decimal(str(coeff)),
                                "is_mandatory": mandatory,
                                "weekly_hours": Decimal(str(hours)),
                            },
                        )
                        if c:
                            count += 1
                    if count:
                        self.stdout.write(f"       → {count} subjects configured")

            return section

        # ── Helper to seed streams for lycée ──
        def seed_streams(section, level_code_list, streams_config):
            for level_code in level_code_list:
                try:
                    level = Level.objects.get(school=school, code=level_code)
                except Level.DoesNotExist:
                    continue

                # Set has_streams on this level
                if not level.has_streams:
                    level.has_streams = True
                    level.save(update_fields=["has_streams"])

                # Determine which streams apply
                if level_code == "1AS":
                    applicable = STREAMS_1AS
                else:
                    applicable = STREAMS_2AS_3AS

                for s_name, s_code, s_short, is_tc, s_order in applicable:
                    stream, created = Stream.objects.get_or_create(
                        school=school,
                        level=level,
                        code=s_code,
                        defaults={
                            "name": s_name,
                            "short_name": s_short,
                            "is_tronc_commun": is_tc,
                            "order": s_order,
                        },
                    )
                    status_icon = "✅" if created else "⏭️ "
                    self.stdout.write(
                        f"     {status_icon} Stream: {level_code} — {s_name}"
                    )

                    # Seed subjects for this stream
                    stream_subjects = LYCEE_STREAM_SUBJECTS.get(s_code, [])
                    count = 0
                    for subj_code, coeff, mandatory, hours in stream_subjects:
                        if subj_code not in subject_map:
                            continue
                        _, c = LevelSubject.objects.get_or_create(
                            school=school,
                            level=level,
                            stream=stream,
                            subject=subject_map[subj_code],
                            defaults={
                                "coefficient": Decimal(str(coeff)),
                                "is_mandatory": mandatory,
                                "weekly_hours": Decimal(str(hours)),
                            },
                        )
                        if c:
                            count += 1
                    if count:
                        self.stdout.write(f"            → {count} subjects configured")

        # ── Execute seeding ──
        if cycle in ("all", "primaire"):
            seed_cycle(
                Section.SectionType.PRIMARY,
                "Primaire",
                PRIMAIRE_LEVELS,
                PRIMAIRE_SUBJECTS,
                max_grade=Decimal("10"),
                passing_grade=Decimal("5"),
            )

        if cycle in ("all", "moyen"):
            seed_cycle(
                Section.SectionType.MIDDLE,
                "Moyen",
                MOYEN_LEVELS,
                MOYEN_SUBJECTS,
                max_grade=Decimal("20"),
                passing_grade=Decimal("10"),
            )

        if cycle in ("all", "lycee"):
            section = seed_cycle(
                Section.SectionType.HIGH,
                "Lycée",
                LYCEE_LEVELS,
                {},  # No plain subjects for lycée — all go through streams
                max_grade=Decimal("20"),
                passing_grade=Decimal("10"),
            )
            seed_streams(section, ["1AS", "2AS", "3AS"], None)

        # ── Summary ──
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 55))
        self.stdout.write(self.style.SUCCESS("  ✅ Hierarchy seeding complete!"))
        self.stdout.write(self.style.SUCCESS("=" * 55))
        self.stdout.write(
            f"  Levels:         {Level.objects.filter(school=school).count()}"
        )
        self.stdout.write(
            f"  Streams:        {Stream.objects.filter(school=school).count()}"
        )
        self.stdout.write(
            f"  Subjects:       {Subject.objects.filter(school=school).count()}"
        )
        self.stdout.write(
            f"  LevelSubjects:  {LevelSubject.objects.filter(school=school).count()}"
        )
        self.stdout.write("")
