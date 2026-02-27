"""
EduConnect Algeria — Base Django Settings
==========================================
Settings common to all environments.
"""

from datetime import timedelta
from pathlib import Path

from decouple import Csv, config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config("DJANGO_SECRET_KEY", default="insecure-dev-key-change-me")

DEBUG = config("DJANGO_DEBUG", default=False, cast=bool)

ALLOWED_HOSTS = config(
    "DJANGO_ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv()
)


# ===========================================================================
# Application definition
# ===========================================================================

DJANGO_APPS = [
    "daphne",  # Must be before django.contrib.staticfiles for ASGI
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "django_extensions",
    "django_celery_beat",
    "django_celery_results",
    "channels",
    "drf_spectacular",
    "storages",
]

LOCAL_APPS = [
    "apps.accounts",
    "apps.schools",
    "apps.academics",
    "apps.grades",
    "apps.homework",
    "apps.announcements",
    "apps.attendance",
    "apps.chat",
    "apps.finance",
    "apps.notifications",
    "apps.ai_chatbot",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS


# ===========================================================================
# Middleware
# ===========================================================================

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "core.middleware.tenant.TenantMiddleware",
]

ROOT_URLCONF = "educonnect.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "educonnect.wsgi.application"
ASGI_APPLICATION = "educonnect.asgi.application"


# ===========================================================================
# Database
# ===========================================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default="educonnect_db"),
        "USER": config("DB_USER", default="educonnect_user"),
        "PASSWORD": config("DB_PASSWORD", default="password"),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
    }
}


# ===========================================================================
# Authentication
# ===========================================================================

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ===========================================================================
# Internationalization
# ===========================================================================

LANGUAGE_CODE = "fr"  # Default to French for Algeria

LANGUAGES = [
    ("ar", "Arabic"),
    ("fr", "French"),
    ("en", "English"),
]

TIME_ZONE = "Africa/Algiers"

USE_I18N = True
USE_L10N = True
USE_TZ = True

LOCALE_PATHS = [BASE_DIR / "locale"]


# ===========================================================================
# Static & Media files
# ===========================================================================

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"


# ===========================================================================
# Django REST Framework
# ===========================================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/minute",
        "user": "120/minute",
    },
    "DATETIME_FORMAT": "%Y-%m-%dT%H:%M:%S%z",
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
}


# ===========================================================================
# JWT Settings
# ===========================================================================

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=config("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", default=30, cast=int)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=config("JWT_REFRESH_TOKEN_LIFETIME_DAYS", default=7, cast=int)
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}


# ===========================================================================
# CORS Settings
# ===========================================================================

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:3000,http://localhost:8080",
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True


# ===========================================================================
# Channels (WebSocket)
# ===========================================================================

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [config("REDIS_URL", default="redis://localhost:6379/0")],
        },
    },
}


# ===========================================================================
# Celery
# ===========================================================================

CELERY_BROKER_URL = config("CELERY_BROKER_URL", default="redis://localhost:6379/1")
CELERY_RESULT_BACKEND = config(
    "CELERY_RESULT_BACKEND", default="redis://localhost:6379/2"
)
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"


# ===========================================================================
# File Upload
# ===========================================================================

FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB for homework files


# ===========================================================================
# API Documentation (Spectacular)
# ===========================================================================

SPECTACULAR_SETTINGS = {
    "TITLE": "EduConnect Algeria API",
    "DESCRIPTION": "Complete E-Learning & School Management API for Private Schools in Algeria",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": "/api/v[0-9]",
    "COMPONENT_SPLIT_REQUEST": True,
}


# ===========================================================================
# Default primary key field type
# ===========================================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ===========================================================================
# Firebase (V1 API — Push Notifications)
# ===========================================================================

import os

FIREBASE_SERVICE_ACCOUNT_PATH = os.path.join(
    BASE_DIR,
    config("FIREBASE_SERVICE_ACCOUNT_PATH", default="firebase-service-account.json"),
)
FIREBASE_PROJECT_ID = config("FIREBASE_PROJECT_ID", default="educonnectdz")


# ===========================================================================
# OpenAI / AI Chatbot
# ===========================================================================

OPENAI_API_KEY = config("OPENAI_API_KEY", default="")
PINECONE_API_KEY = config("PINECONE_API_KEY", default="")
PINECONE_ENVIRONMENT = config("PINECONE_ENVIRONMENT", default="")
PINECONE_INDEX_NAME = config("PINECONE_INDEX_NAME", default="educonnect-knowledge")
