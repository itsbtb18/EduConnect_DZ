"""
Canteen models — student enrolment with nutritional/medical info,
weekly menus with individual menu items, daily meal attendance,
and consumption reports.
"""

import datetime

from django.db import models
from django.db.models import Count, Q, Sum

from core.models import TenantModel


# =========================================================================
# CANTEEN STUDENT — Student registration + nutritional / medical info
# =========================================================================


class CanteenStudent(TenantModel):
    """
    A student enrolled in the canteen service for the current period.
    Holds medical / dietary information relevant for meal planning.
    """

    class NutritionalStatus(models.TextChoices):
        NORMAL = "NORMAL", "Normal"
        UNDERWEIGHT = "UNDERWEIGHT", "Insuffisance pondérale"
        OVERWEIGHT = "OVERWEIGHT", "Surpoids"
        OBESE = "OBESE", "Obésité"

    class DietaryRestriction(models.TextChoices):
        NONE = "NONE", "Aucune"
        DIABETIC = "DIABETIC", "Diabétique"
        CELIAC = "CELIAC", "Cœliaque (sans gluten)"
        LACTOSE = "LACTOSE", "Intolérance au lactose"
        ALLERGY = "ALLERGY", "Allergie alimentaire"
        VEGETARIAN = "VEGETARIAN", "Végétarien"
        OTHER = "OTHER", "Autre"

    student = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="canteen_profile",
        limit_choices_to={"role": "STUDENT"},
    )
    start_date = models.DateField(help_text="Début d'inscription cantine.")
    end_date = models.DateField(
        null=True, blank=True, help_text="Fin d'inscription (null = en cours)."
    )
    is_active = models.BooleanField(default=True)

    # Nutritional / medical
    nutritional_status = models.CharField(
        max_length=14,
        choices=NutritionalStatus.choices,
        default=NutritionalStatus.NORMAL,
    )
    dietary_restriction = models.CharField(
        max_length=14,
        choices=DietaryRestriction.choices,
        default=DietaryRestriction.NONE,
    )
    allergy_details = models.TextField(
        blank=True,
        default="",
        help_text="Détails si allergie ou restriction spéciale.",
    )
    medical_note = models.TextField(
        blank=True,
        default="",
        help_text="Note médicale importante pour la cantine.",
    )

    class Meta:
        db_table = "canteen_students"
        ordering = ["student__last_name"]

    def __str__(self):
        return f"{self.student.full_name} — {self.get_nutritional_status_display()}"


# =========================================================================
# MENU — Weekly / daily canteen menu
# =========================================================================


class Menu(TenantModel):
    """
    A canteen menu for a specific week.
    One menu per week per school.
    """

    class MenuPeriod(models.TextChoices):
        WEEKLY = "WEEKLY", "Hebdomadaire"
        MONTHLY = "MONTHLY", "Mensuel"
        TRIMESTER = "TRIMESTER", "Trimestriel"

    title = models.CharField(
        max_length=200,
        help_text="e.g. 'Menu Semaine 12 — Mars 2026'",
    )
    period_type = models.CharField(
        max_length=10,
        choices=MenuPeriod.choices,
        default=MenuPeriod.WEEKLY,
    )
    start_date = models.DateField(help_text="Début de la période du menu.")
    end_date = models.DateField(help_text="Fin de la période du menu.")
    is_published = models.BooleanField(
        default=False,
        help_text="Publié et visible par les parents.",
    )
    notes = models.TextField(
        blank=True, default="", help_text="Notes générales du menu."
    )

    class Meta:
        db_table = "canteen_menus"
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.title} ({self.start_date} → {self.end_date})"


# =========================================================================
# MENU ITEM — Individual daily meal line
# =========================================================================


class MenuItem(TenantModel):
    """
    A single day's meal within a Menu.
    Multiple items per menu (one per day).
    """

    class DayOfWeek(models.TextChoices):
        SUNDAY = "SUN", "Dimanche"
        MONDAY = "MON", "Lundi"
        TUESDAY = "TUE", "Mardi"
        WEDNESDAY = "WED", "Mercredi"
        THURSDAY = "THU", "Jeudi"

    menu = models.ForeignKey(
        Menu, on_delete=models.CASCADE, related_name="items"
    )
    date = models.DateField(help_text="Jour du repas.")
    day_of_week = models.CharField(
        max_length=3, choices=DayOfWeek.choices, blank=True
    )
    starter = models.CharField(
        max_length=200, blank=True, default="", help_text="Entrée"
    )
    main_course = models.CharField(max_length=200, help_text="Plat principal")
    side_dish = models.CharField(
        max_length=200, blank=True, default="", help_text="Accompagnement"
    )
    dessert = models.CharField(
        max_length=200, blank=True, default="", help_text="Dessert"
    )
    # Medical/dietary info for this specific day
    allergens = models.CharField(
        max_length=300,
        blank=True,
        default="",
        help_text="Allergènes présents (gluten, lactose, …).",
    )
    suitable_for_diabetic = models.BooleanField(default=True)
    suitable_for_celiac = models.BooleanField(default=True)
    calories_approx = models.PositiveIntegerField(
        null=True, blank=True, help_text="Calories approximatives."
    )

    class Meta:
        db_table = "canteen_menu_items"
        ordering = ["date"]
        unique_together = ("menu", "date")

    def save(self, *args, **kwargs):
        if not self.day_of_week and self.date:
            # Map Python weekday (0=Monday) to Algerian school week
            DAY_MAP = {6: "SUN", 0: "MON", 1: "TUE", 2: "WED", 3: "THU"}
            d = self.date
            if isinstance(d, str):
                d = datetime.date.fromisoformat(d)
            self.day_of_week = DAY_MAP.get(d.weekday(), "")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.date} — {self.main_course}"


# =========================================================================
# MEAL ATTENDANCE — daily check-in
# =========================================================================


class MealAttendance(TenantModel):
    """
    Daily record of a student eating (or not) at the canteen.
    """

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="meal_attendances",
        limit_choices_to={"role": "STUDENT"},
    )
    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.CASCADE,
        related_name="attendances",
        null=True,
        blank=True,
    )
    date = models.DateField()
    present = models.BooleanField(default=True)
    notes = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Remarques (e.g. repas spécial fourni).",
    )

    class Meta:
        db_table = "canteen_attendances"
        unique_together = ("student", "date")
        ordering = ["-date"]

    def __str__(self):
        status = "Présent" if self.present else "Absent"
        return f"{self.student.full_name} — {self.date} — {status}"
