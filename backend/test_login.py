"""Test login flow exactly as the frontend does it."""

import os

import django

os.environ["DJANGO_SETTINGS_MODULE"] = "ilmi.settings.development"
django.setup()

from django.contrib.auth import get_user_model, authenticate  # noqa: E402
from rest_framework.test import APIRequestFactory  # noqa: E402
from apps.accounts.views import LoginView  # noqa: E402

User = get_user_model()

print("=" * 70)
print("1. ALL USERS IN DATABASE")
print("=" * 70)
for u in User.objects.all():
    print(f"  Phone: {u.phone_number} | Name: {u.first_name} {u.last_name}")
    print(f"  Role: {u.role} | Active: {u.is_active} | Staff: {u.is_staff}")
    print(f"  School: {u.school} | Hash prefix: {u.password[:25]}...")
    # Test Django's authenticate() directly
    for pwd in ["admin123456", "admin1234", "password123", "12345678", "Admin123456"]:
        result = authenticate(phone_number=u.phone_number, password=pwd)
        if result:
            print(f"  >>> Authenticates with: '{pwd}'")
            break
    else:
        print("  >>> Could NOT authenticate with any common password")
    print()

print("=" * 70)
print("2. TESTING LOGIN API ENDPOINT")
print("=" * 70)
factory = APIRequestFactory()

for u in User.objects.all():
    for pwd in ["admin123456", "admin1234", "password123", "12345678"]:
        request = factory.post(
            "/api/v1/auth/login/",
            {"phone_number": u.phone_number, "password": pwd},
            format="json",
        )
        try:
            response = LoginView.as_view()(request)
            print(f"  {u.phone_number} + '{pwd}': STATUS {response.status_code}")
            if response.status_code == 200:
                print(f"    Response keys: {list(response.data.keys())}")
                print(f"    Role: {response.data.get('role')}")
                break
            else:
                print(f"    Error: {response.data}")
        except Exception as e:
            print(f"  {u.phone_number} + '{pwd}': EXCEPTION: {e}")
    print()

print("=" * 70)
print("3. TESTING USER CREATION VIA DJANGO ADMIN FORM")
print("=" * 70)
# Simulate what Django admin does
try:
    # Try creating a test user via the admin form mechanism
    test_data = {
        "phone_number": "0555000001",
        "password1": "testpass123",
        "password2": "testpass123",
        "first_name": "Test",
        "last_name": "Admin",
        "role": "ADMIN",
    }
    # Create user directly via manager to verify
    u = User.objects.create_user(
        phone_number="0555000001",
        password="testpass123",
        first_name="Test",
        last_name="Admin",
        role="ADMIN",
        is_active=True,
    )
    print(f"  Created test user: {u.phone_number}")
    print(f"  Password hashed: {u.password[:25]}...")

    # Test authentication
    result = authenticate(phone_number="0555000001", password="testpass123")
    print(f"  Authentication: {'SUCCESS' if result else 'FAILED'}")

    # Test API login
    request = factory.post(
        "/api/v1/auth/login/",
        {"phone_number": "0555000001", "password": "testpass123"},
        format="json",
    )
    response = LoginView.as_view()(request)
    print(f"  API Login: STATUS {response.status_code}")
    if response.status_code != 200:
        print(f"    Error: {response.data}")

    # Cleanup
    u.delete()
    print("  Test user deleted")
except Exception as e:
    print(f"  Error: {e}")
    # Cleanup just in case
    User.objects.filter(phone_number="0555000001").delete()
