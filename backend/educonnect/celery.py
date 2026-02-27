"""
Celery configuration for EduConnect Algeria.

Broker/backend: Redis
Timezone: Africa/Algiers
Beat schedule: periodic school operations
"""

import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "educonnect.settings.production")

app = Celery("educonnect")

# ---------------------------------------------------------------------------
# Core configuration
# ---------------------------------------------------------------------------
app.conf.update(
    broker_url=os.environ.get("CELERY_BROKER_URL", "redis://127.0.0.1:6379/0"),
    result_backend=os.environ.get("CELERY_RESULT_BACKEND", "redis://127.0.0.1:6379/1"),
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Africa/Algiers",
    enable_utc=True,
)

# Load configuration from Django settings (CELERY_ namespace)
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()


# ---------------------------------------------------------------------------
# Beat schedule — periodic tasks
# ---------------------------------------------------------------------------
app.conf.beat_schedule = {
    # Archive completed academic years — every September 1st at midnight
    "archive-completed-academic-years": {
        "task": "apps.schools.tasks.archive_completed_academic_years",
        "schedule": crontab(minute=0, hour=0, day_of_month=1, month_of_year=9),
    },
    # Weekly parent digest — every Sunday at 20:00
    "send-weekly-parent-digest": {
        "task": "apps.notifications.tasks.send_weekly_parent_digest",
        "schedule": crontab(minute=0, hour=20, day_of_week=0),
    },
    # Cleanup expired/stale tokens — daily at 03:00
    "cleanup-expired-tokens": {
        "task": "apps.notifications.tasks.cleanup_expired_tokens",
        "schedule": crontab(minute=0, hour=3),
    },
    # Flag at-risk students (below threshold) — every Monday at 06:00
    "flag-at-risk-students": {
        "task": "apps.grades.tasks.flag_at_risk_students",
        "schedule": crontab(minute=0, hour=6, day_of_week=1),
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to verify Celery is working."""
    print(f"Request: {self.request!r}")
