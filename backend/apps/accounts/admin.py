from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import ParentProfile, StudentProfile, TeacherProfile

User = get_user_model()


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False
    extra = 0


class TeacherProfileInline(admin.StackedInline):
    model = TeacherProfile
    can_delete = False
    extra = 0


class ParentProfileInline(admin.StackedInline):
    model = ParentProfile
    can_delete = False
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "first_name", "last_name", "role", "school", "is_active")
    list_filter = ("role", "school", "is_active", "gender")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal Info",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "arabic_first_name",
                    "arabic_last_name",
                    "phone",
                    "date_of_birth",
                    "gender",
                    "avatar",
                )
            },
        ),
        ("Role & School", {"fields": ("role", "school", "language")}),
        (
            "Security",
            {
                "fields": (
                    "pin",
                    "must_change_password",
                    "failed_login_attempts",
                    "locked_until",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
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
                    "email",
                    "password1",
                    "password2",
                    "first_name",
                    "last_name",
                    "role",
                    "school",
                ),
            },
        ),
    )
    inlines = [StudentProfileInline, TeacherProfileInline, ParentProfileInline]
