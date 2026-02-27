from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.academics.models import ParentProfile, StudentProfile, TeacherProfile

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


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("phone_number", "first_name", "last_name", "role", "school", "is_active")
    list_filter = ("role", "school", "is_active")
    search_fields = ("phone_number", "first_name", "last_name", "email")
    ordering = ("last_name",)
    fieldsets = (
        (None, {"fields": ("phone_number", "password")}),
        (
            "Personal Info",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "email",
                    "photo",
                )
            },
        ),
        ("Role & School", {"fields": ("role", "school")}),
        ("Status", {"fields": ("is_active", "is_first_login")}),
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
                ),
            },
        ),
    )
    inlines = [StudentProfileInline, TeacherProfileInline, ParentProfileInline]
