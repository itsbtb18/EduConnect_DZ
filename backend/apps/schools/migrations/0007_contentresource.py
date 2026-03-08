import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("schools", "0006_subscription_system"),
    ]

    operations = [
        migrations.CreateModel(
            name="ContentResource",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("title", models.CharField(max_length=300)),
                ("description", models.TextField(blank=True)),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("BEP", "BEP"),
                            ("BEM", "BEM"),
                            ("BAC", "BAC"),
                            ("TEXTBOOK", "Manuel scolaire"),
                            ("GUIDE", "Guide pédagogique"),
                            ("OTHER", "Autre"),
                        ],
                        max_length=20,
                    ),
                ),
                ("subject", models.CharField(blank=True, max_length=100)),
                (
                    "level",
                    models.CharField(
                        blank=True,
                        help_text="e.g. 1AS, 2AS, 3AS, 4AM, 5AP",
                        max_length=50,
                    ),
                ),
                (
                    "year",
                    models.CharField(
                        blank=True,
                        help_text="e.g. 2024, 2023",
                        max_length=10,
                    ),
                ),
                (
                    "file",
                    models.FileField(
                        blank=True, null=True, upload_to="content/resources/"
                    ),
                ),
                (
                    "file_url",
                    models.URLField(
                        blank=True,
                        help_text="External URL if no file uploaded",
                    ),
                ),
                (
                    "thumbnail",
                    models.ImageField(
                        blank=True, null=True, upload_to="content/thumbnails/"
                    ),
                ),
                ("is_published", models.BooleanField(default=True)),
                ("download_count", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="uploaded_content",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "content_resources",
                "ordering": ["-created_at"],
            },
        ),
    ]
