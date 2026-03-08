# Migration 0002: Canteen redesign
# - Remove old MealSubscription model
# - Redesign Menu (remove date/starter/main_course/dessert, add period_type/start_date/end_date/is_published)
# - Create CanteenStudent (enrollment + nutritional / dietary tracking)
# - Create MenuItem (daily meal lines within a Menu)
# - Redesign MealAttendance (menu FK → menu_item FK, add notes)

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("canteen", "0001_initial"),
        ("schools", "0004_school_available_streams"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ---------------------------------------------------------------
        # 1. Drop old MealSubscription table
        # ---------------------------------------------------------------
        migrations.DeleteModel(name="MealSubscription"),

        # ---------------------------------------------------------------
        # 2. Redesign Menu — drop old columns, add new columns
        # ---------------------------------------------------------------
        # Remove unique_together first
        migrations.AlterUniqueTogether(
            name="menu",
            unique_together=set(),
        ),
        # Remove old flat-meal columns
        migrations.RemoveField(model_name="menu", name="date"),
        migrations.RemoveField(model_name="menu", name="starter"),
        migrations.RemoveField(model_name="menu", name="main_course"),
        migrations.RemoveField(model_name="menu", name="dessert"),
        # Add new period-based columns
        migrations.AddField(
            model_name="menu",
            name="period_type",
            field=models.CharField(
                choices=[
                    ("WEEKLY", "Hebdomadaire"),
                    ("MONTHLY", "Mensuel"),
                    ("TRIMESTER", "Trimestriel"),
                ],
                default="WEEKLY",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="menu",
            name="start_date",
            field=models.DateField(
                default="2026-01-01",
                help_text="Début de la période du menu.",
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="menu",
            name="end_date",
            field=models.DateField(
                default="2026-01-07",
                help_text="Fin de la période du menu.",
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="menu",
            name="is_published",
            field=models.BooleanField(
                default=False,
                help_text="Publié et visible par les parents.",
            ),
        ),
        # Alter title — make it required (NOT blank)
        migrations.AlterField(
            model_name="menu",
            name="title",
            field=models.CharField(
                max_length=200,
                help_text="e.g. 'Menu Semaine 12 — Mars 2026'",
            ),
        ),
        migrations.AlterModelOptions(
            name="menu",
            options={"ordering": ["-start_date"]},
        ),
        migrations.AlterModelTable(
            name="menu",
            table="canteen_menus",
        ),

        # ---------------------------------------------------------------
        # 3. Create CanteenStudent
        # ---------------------------------------------------------------
        migrations.CreateModel(
            name="CanteenStudent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("start_date", models.DateField(help_text="Début d'inscription cantine.")),
                ("end_date", models.DateField(blank=True, help_text="Fin d'inscription (null = en cours).", null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("nutritional_status", models.CharField(
                    choices=[
                        ("NORMAL", "Normal"),
                        ("UNDERWEIGHT", "Insuffisance pondérale"),
                        ("OVERWEIGHT", "Surpoids"),
                        ("OBESE", "Obésité"),
                    ],
                    default="NORMAL",
                    max_length=14,
                )),
                ("dietary_restriction", models.CharField(
                    choices=[
                        ("NONE", "Aucune"),
                        ("DIABETIC", "Diabétique"),
                        ("CELIAC", "Cœliaque (sans gluten)"),
                        ("LACTOSE", "Intolérance au lactose"),
                        ("ALLERGY", "Allergie alimentaire"),
                        ("VEGETARIAN", "Végétarien"),
                        ("OTHER", "Autre"),
                    ],
                    default="NONE",
                    max_length=14,
                )),
                ("allergy_details", models.TextField(blank=True, default="", help_text="Détails si allergie ou restriction spéciale.")),
                ("medical_note", models.TextField(blank=True, default="", help_text="Note médicale importante pour la cantine.")),
                ("created_by", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(app_label)s_%(class)s_created",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("school", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="%(class)s_set",
                    to="schools.school",
                )),
                ("student", models.OneToOneField(
                    limit_choices_to={"role": "STUDENT"},
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="canteen_profile",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "db_table": "canteen_students",
                "ordering": ["student__last_name"],
            },
        ),

        # ---------------------------------------------------------------
        # 4. Create MenuItem (daily meal lines within a Menu)
        # ---------------------------------------------------------------
        migrations.CreateModel(
            name="MenuItem",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("date", models.DateField(help_text="Jour du repas.")),
                ("day_of_week", models.CharField(
                    blank=True,
                    choices=[
                        ("SUN", "Dimanche"),
                        ("MON", "Lundi"),
                        ("TUE", "Mardi"),
                        ("WED", "Mercredi"),
                        ("THU", "Jeudi"),
                    ],
                    max_length=3,
                )),
                ("starter", models.CharField(blank=True, default="", help_text="Entrée", max_length=200)),
                ("main_course", models.CharField(help_text="Plat principal", max_length=200)),
                ("side_dish", models.CharField(blank=True, default="", help_text="Accompagnement", max_length=200)),
                ("dessert", models.CharField(blank=True, default="", help_text="Dessert", max_length=200)),
                ("allergens", models.CharField(blank=True, default="", help_text="Allergènes présents (gluten, lactose, …).", max_length=300)),
                ("suitable_for_diabetic", models.BooleanField(default=True)),
                ("suitable_for_celiac", models.BooleanField(default=True)),
                ("calories_approx", models.PositiveIntegerField(blank=True, help_text="Calories approximatives.", null=True)),
                ("created_by", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(app_label)s_%(class)s_created",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("school", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="%(class)s_set",
                    to="schools.school",
                )),
                ("menu", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="items",
                    to="canteen.menu",
                )),
            ],
            options={
                "db_table": "canteen_menu_items",
                "ordering": ["date"],
                "unique_together": {("menu", "date")},
            },
        ),

        # ---------------------------------------------------------------
        # 5. Redesign MealAttendance — replace menu FK with menu_item FK, add notes
        # ---------------------------------------------------------------
        migrations.RemoveField(model_name="mealattendance", name="menu"),
        migrations.AddField(
            model_name="mealattendance",
            name="menu_item",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="attendances",
                to="canteen.menuitem",
            ),
        ),
        migrations.AddField(
            model_name="mealattendance",
            name="notes",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Remarques (e.g. repas spécial fourni).",
                max_length=255,
            ),
        ),
    ]
