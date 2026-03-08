"""
Celery configuration for ILMI.

Broker/backend: Redis
Timezone: Africa/Algiers
Beat schedule: periodic school operations
"""

import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ilmi.settings.production")

app = Celery("ilmi")

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
    # Check expired payments — daily at 08:00
    "check-expired-payments": {
        "task": "apps.finance.tasks.check_expired_payments",
        "schedule": crontab(minute=0, hour=8),
    },
    # Send payment reminders (expiring in 7 days) — every Sunday at 09:00
    "send-payment-reminders": {
        "task": "apps.finance.tasks.send_payment_reminders",
        "schedule": crontab(minute=0, hour=9, day_of_week=0),
    },
    # Detect chronic absenteeism — daily at 07:00 (Africa/Algiers)
    "detect-chronic-absenteeism": {
        "task": "apps.attendance.tasks.detect_chronic_absenteeism",
        "schedule": crontab(minute=0, hour=7),
    },
    # Refresh fee enrollment statuses — daily at 08:30
    "refresh-enrollment-statuses": {
        "task": "apps.finance.tasks.refresh_enrollment_statuses",
        "schedule": crontab(minute=30, hour=8),
    },
    # Auto-generate monthly payslips — 1st of each month at 06:00
    "generate-monthly-payslips": {
        "task": "apps.finance.tasks.generate_monthly_payslips",
        "schedule": crontab(minute=0, hour=6, day_of_month=1),
    },
    # Send next-week canteen menu to parents — every Saturday at 18:00
    "send-weekly-canteen-menu": {
        "task": "apps.canteen.tasks.send_weekly_menu_to_parents",
        "schedule": crontab(minute=0, hour=18, day_of_week=6),
    },
    # Transport departure reminder — school days (Sun-Thu) at 06:30
    "send-transport-departure-reminder": {
        "task": "apps.transport.tasks.send_transport_departure_reminder",
        "schedule": crontab(minute=30, hour=6, day_of_week="0,1,2,3,6"),
    },
    # Transport return reminder — school days (Sun-Thu) at 14:00
    "send-transport-return-reminder": {
        "task": "apps.transport.tasks.send_transport_return_reminder",
        "schedule": crontab(minute=0, hour=14, day_of_week="0,1,2,3,6"),
    },
    # Library — check overdue loans daily at 07:30
    "check-overdue-loans": {
        "task": "apps.library.tasks.check_overdue_loans",
        "schedule": crontab(minute=30, hour=7),
    },
    # Library — send due-date reminders daily at 08:00
    "send-due-date-reminders": {
        "task": "apps.library.tasks.send_due_date_reminders",
        "schedule": crontab(minute=0, hour=8),
    },
    # Subscription renewal check — daily at 06:00
    "check-subscription-renewals": {
        "task": "apps.schools.tasks.check_subscription_renewals",
        "schedule": crontab(minute=0, hour=6),
    },
    # Weekly notification summary — every Sunday at 20:00
    "send-weekly-notification-summary": {
        "task": "apps.notifications.tasks.send_weekly_notification_summary",
        "schedule": crontab(minute=0, hour=20, day_of_week=0),
    },
    # ── Security tasks ──
    # Check dormant accounts — daily at 02:00
    "check-dormant-accounts": {
        "task": "apps.accounts.tasks.check_dormant_accounts",
        "schedule": crontab(minute=0, hour=2),
    },
    # Cleanup expired sessions — daily at 03:30
    "cleanup-expired-sessions": {
        "task": "apps.accounts.tasks.cleanup_expired_sessions",
        "schedule": crontab(minute=30, hour=3),
    },
    # Cleanup expired OTPs — every 6 hours
    "cleanup-expired-otps": {
        "task": "apps.accounts.tasks.cleanup_expired_otps",
        "schedule": crontab(minute=0, hour="*/6"),
    },
    # Cleanup old login attempts — weekly on Monday at 04:00
    "cleanup-old-login-attempts": {
        "task": "apps.accounts.tasks.cleanup_old_login_attempts",
        "schedule": crontab(minute=0, hour=4, day_of_week=1),
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to verify Celery is working."""
    print(f"Request: {self.request!r}")
