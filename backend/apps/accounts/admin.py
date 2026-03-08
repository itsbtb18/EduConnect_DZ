from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.academics.models import ParentProfile, StudentProfile, TeacherProfile

from .forms import CustomUserChangeForm, CustomUserCreationForm
from .models import UserContext

User = get_user_model()


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    fk_name = "user"
    can_delete = False
    extra = 0


class TeacherProfileInline(admin.StackedInline):
    model = TeacherProfile
    fk_name = "user"
    can_delete = False
    extra = 0


class ParentProfileInline(admin.StackedInline):
    model = ParentProfile
    fk_name = "user"
    can_delete = False
    extra = 0


class UserContextInline(admin.TabularInline):
    model = UserContext
    extra = 0
    fields = ("role", "school", "context_type", "is_active")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # ── Custom forms for our phone_number‑based User model ──
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    list_display = (
        "phone_number",
        "first_name",
        "last_name",
        "role",
        "school",
        "is_active",
    )
    list_filter = ("role", "school", "is_active")
    search_fields = ("phone_number", "first_name", "last_name", "email")
    ordering = ("last_name",)
    fieldsets = (
        (None, {"fields": ("phone_number", "password")}),
        (
            "Informations personnelles",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "email",
                    "photo",
                )
            },
        ),
        ("Rôle & École", {"fields": ("role", "school")}),
        ("Statut", {"fields": ("is_active", "is_first_login")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "phone_number",
                    "password1",
                    "password2",
                    "first_name",
                    "last_name",
                    "role",
                    "school",
                    "is_active",
                    "is_staff",
                ),
            },
        ),
    )
    inlines = [
        StudentProfileInline,
        TeacherProfileInline,
        ParentProfileInline,
        UserContextInline,
    ]

    def save_model(self, request, obj, form, change):
        """
        Ensure:
        1. Passwords are always properly hashed.
        2. SUPER_ADMIN users automatically get is_staff + is_superuser.
        """
        if change and "password" in form.changed_data:
            obj.set_password(form.cleaned_data["password"])

        # Auto-promote SUPER_ADMIN to staff / superuser
        if obj.role == "SUPER_ADMIN":
            obj.is_staff = True
            obj.is_superuser = True

        super().save_model(request, obj, form, change)


@admin.register(UserContext)
class UserContextAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "school", "context_type", "is_active")
    list_filter = ("role", "context_type", "is_active")
    search_fields = ("user__phone_number", "user__first_name", "user__last_name")
    raw_id_fields = ("user", "school")
