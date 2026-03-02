import os

import django

os.environ["DJANGO_SETTINGS_MODULE"] = "ilmi.settings.development"
django.setup()

from django.contrib.auth import get_user_model, authenticate  # noqa: E402

User = get_user_model()

print("=" * 80)
print("ALL USERS:")
print("=" * 80)
for u in User.objects.all():
    pwd = u.password
    hashed = (
        pwd.startswith("pbkdf2_")
        or pwd.startswith("argon2")
        or pwd.startswith("bcrypt")
    )
    print(f"  Phone: {u.phone_number}")
    print(f"  Name: {u.first_name} {u.last_name}")
    print(f"  Role: {u.role} | Active: {u.is_active} | Staff: {u.is_staff}")
    print(f"  Password hashed: {hashed} | Prefix: {pwd[:40]}")
    print(f"  School: {u.school}")
    print("-" * 40)

print()
print("=" * 80)
print("TESTING AUTHENTICATION:")
print("=" * 80)
for u in User.objects.all():
    # Try common passwords
    for test_pwd in ["admin123456", "password", "12345678"]:
        result = authenticate(phone_number=u.phone_number, password=test_pwd)
        if result:
            print(f"  {u.phone_number} authenticates with '{test_pwd}': YES")
            break
    else:
        print(f"  {u.phone_number}: could NOT authenticate with common passwords")
        # Check if password is plain text
        if not u.password.startswith("pbkdf2_") and not u.password.startswith("argon2"):
            print(f"    >>> PASSWORD IS NOT HASHED! Raw value: {u.password[:50]}")
