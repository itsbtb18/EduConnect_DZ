"""
EduConnect Algeria — URL Configuration
=======================================
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

# API v1 URL patterns
api_v1_patterns = [
    path("auth/", include("apps.accounts.urls")),
    path("schools/", include("apps.schools.urls")),
    path("academics/", include("apps.academics.urls")),
    path("grades/", include("apps.grades.urls")),
    path("homework/", include("apps.homework.urls")),
    path("announcements/", include("apps.announcements.urls")),
    path("attendance/", include("apps.attendance.urls")),
    path("chat/", include("apps.chat.urls")),
    path("finance/", include("apps.finance.urls")),
    path("notifications/", include("apps.notifications.urls")),
    path("ai/", include("apps.ai_chatbot.urls")),
]

urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),
    # API v1
    path("api/v1/", include(api_v1_patterns)),
    # API Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    # Debug toolbar
    import debug_toolbar

    urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]
