"""
Django signals for the Accounts app.
Handles automatic profile creation when users are created.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import ParentProfile, StudentProfile, TeacherProfile, User


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create the appropriate profile when a new User is saved.
    - Student → StudentProfile
    - Teacher → TeacherProfile
    - Parent → ParentProfile
    """
    if not created:
        return

    if instance.role == User.Role.STUDENT:
        StudentProfile.objects.get_or_create(user=instance)
    elif instance.role == User.Role.TEACHER:
        TeacherProfile.objects.get_or_create(user=instance)
    elif instance.role == User.Role.PARENT:
        ParentProfile.objects.get_or_create(user=instance)
