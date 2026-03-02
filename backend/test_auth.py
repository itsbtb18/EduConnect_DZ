import django, os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ilmi.settings.development")
django.setup()

from django.contrib.auth import get_user_model, authenticate

User = get_user_model()

print("USERNAME_FIELD:", User.USERNAME_FIELD)
print()

# Test: create via create_user and verify auth
u = User.objects.create_user(
    phone_number="0555999888",
    password="testpass123",
    first_name="Test",
    last_name="User",
    role="ADMIN",
    is_active=True,
)
print("Created user hash:", u.password[:40])
r = authenticate(phone_number="0555999888", password="testpass123")
print("create_user auth:", "YES" if r else "NO")
u.delete()

# Check existing admin user password
admin_user = User.objects.filter(phone_number="0773613301").first()
if admin_user:
    print()
    print("Existing admin:", admin_user.phone_number)
    print("Has usable password:", admin_user.has_usable_password())
    print("Password hash:", admin_user.password[:50])
    # Try to reset and test
    admin_user.set_password("admin123456")
    admin_user.save()
    r2 = authenticate(phone_number="0773613301", password="admin123456")
    print("After reset to admin123456:", "YES" if r2 else "NO")
