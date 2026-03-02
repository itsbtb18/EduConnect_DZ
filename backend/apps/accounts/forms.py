"""
Custom admin forms for the ILMI User model.

Django's built-in UserCreationForm/UserChangeForm are designed for models
with a ``username`` field.  Since our User model uses ``phone_number`` as
the USERNAME_FIELD, we provide custom forms that:

- Reference the correct model fields
- Properly hash passwords on creation
- Show a read-only password hash on the change form
"""

from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.core.exceptions import ValidationError

User = get_user_model()


class CustomUserCreationForm(forms.ModelForm):
    """
    Form used by ``UserAdmin`` when **adding** a new user via Django admin.
    Handles password1/password2 confirmation and hashing via ``set_password()``.
    """

    password1 = forms.CharField(
        label="Mot de passe",
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
        help_text="Au moins 8 caractères.",
    )
    password2 = forms.CharField(
        label="Confirmer le mot de passe",
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
    )

    class Meta:
        model = User
        fields = (
            "phone_number",
            "first_name",
            "last_name",
            "role",
            "school",
            "is_active",
            "is_staff",
        )

    def clean_phone_number(self):
        phone = self.cleaned_data.get("phone_number")
        if phone and User.objects.filter(phone_number=phone).exists():
            raise ValidationError(
                "Un utilisateur avec ce numéro de téléphone existe déjà."
            )
        return phone

    def clean_password2(self):
        p1 = self.cleaned_data.get("password1")
        p2 = self.cleaned_data.get("password2")
        if p1 and p2 and p1 != p2:
            raise ValidationError("Les deux mots de passe ne correspondent pas.")
        return p2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class CustomUserChangeForm(forms.ModelForm):
    """
    Form used by ``UserAdmin`` when **editing** an existing user.
    Shows the password as a read-only hash with a link to the change form.
    """

    password = ReadOnlyPasswordHashField(
        label="Mot de passe",
        help_text=(
            "Les mots de passe ne sont pas stockés en clair, il est donc "
            "impossible de voir le mot de passe de cet utilisateur, mais vous "
            'pouvez le changer via <a href="../password/">ce formulaire</a>.'
        ),
    )

    class Meta:
        model = User
        fields = (
            "phone_number",
            "first_name",
            "last_name",
            "email",
            "photo",
            "role",
            "school",
            "is_active",
            "is_first_login",
            "is_staff",
            "is_superuser",
            "groups",
            "user_permissions",
        )
