"""
Views for the Accounts app.
"""

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.permissions import IsAdmin

from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    PhonePinLoginSerializer,
    UserCreateSerializer,
    UserSerializer,
)

User = get_user_model()

# Max failed login attempts before lockout
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 30


class LoginView(TokenObtainPairView):
    """
    POST /api/v1/auth/login/
    Authenticate user and return JWT tokens.
    Includes account lockout after repeated failures.
    """

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get("email", "")
        try:
            user = User.objects.get(email=email)
            # Check lockout
            if user.locked_until and user.locked_until > timezone.now():
                return Response(
                    {"detail": "Account is locked. Try again later."},
                    status=status.HTTP_423_LOCKED,
                )
        except User.DoesNotExist:
            pass

        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            # Reset failed attempts on success
            try:
                user = User.objects.get(email=email)
                user.failed_login_attempts = 0
                user.locked_until = None
                user.save(update_fields=["failed_login_attempts", "locked_until"])
            except User.DoesNotExist:
                pass
        else:
            # Increment failed attempts
            try:
                user = User.objects.get(email=email)
                user.failed_login_attempts += 1
                if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
                    user.locked_until = timezone.now() + timezone.timedelta(
                        minutes=LOCKOUT_DURATION_MINUTES
                    )
                user.save(update_fields=["failed_login_attempts", "locked_until"])
            except User.DoesNotExist:
                pass

        return response


class PhonePinLoginView(APIView):
    """
    POST /api/v1/auth/login/pin/
    Authenticate young students using phone number + PIN.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PhonePinLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(
                phone=serializer.validated_data["phone"],
                pin=serializer.validated_data["pin"],
                role="student",
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid phone number or PIN."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Generate JWT tokens
        token_serializer = CustomTokenObtainPairSerializer()
        token = token_serializer.get_token(user)

        return Response(
            {
                "access": str(token.access_token),
                "refresh": str(token),
                "user": UserSerializer(user).data,
            }
        )


class TokenRefreshAPIView(TokenRefreshView):
    """
    POST /api/v1/auth/refresh/
    Refresh an expired access token.
    """

    pass


class UserListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/auth/users/       → List all users in the school
    POST /api/v1/auth/users/       → Create a new user (admin only)
    """

    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        return User.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/auth/users/<id>/
    PATCH  /api/v1/auth/users/<id>/
    DELETE /api/v1/auth/users/<id>/
    """

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return User.objects.filter(school=self.request.user.school)


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/v1/auth/me/     → Get current user's profile
    PATCH /api/v1/auth/me/     → Update current user's profile
    """

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    POST /api/v1/auth/change-password/
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])

        return Response({"detail": "Password changed successfully."})


class UpdateFCMTokenView(APIView):
    """
    POST /api/v1/auth/fcm-token/
    Update the user's FCM token for push notifications.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        fcm_token = request.data.get("fcm_token")
        if not fcm_token:
            return Response(
                {"detail": "fcm_token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.fcm_token = fcm_token
        request.user.save(update_fields=["fcm_token"])
        return Response({"detail": "FCM token updated."})
