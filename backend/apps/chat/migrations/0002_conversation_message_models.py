"""
Replace ChatRoom/Message/MessageRead with Conversation/Message models.
Drops old tables and creates new ones — no data migration needed.
"""

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import apps.chat.models


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0001_initial"),
        ("schools", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── Drop old models ──
        migrations.DeleteModel(name="MessageRead"),
        migrations.DeleteModel(name="Message"),
        migrations.DeleteModel(name="ChatRoom"),
        # ── Create Conversation ──
        migrations.CreateModel(
            name="Conversation",
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
                (
                    "participant_other_role",
                    models.CharField(
                        choices=[
                            ("parent", "Parent"),
                            ("enseignant", "Enseignant"),
                            ("eleve", "Élève"),
                            ("admin", "Admin"),
                        ],
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("last_message_at", models.DateTimeField(blank=True, null=True)),
                ("is_read_by_admin", models.BooleanField(default=True)),
                ("unread_count_admin", models.PositiveIntegerField(default=0)),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="created_conversations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "participant_admin",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="admin_conversations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "participant_other",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="other_conversations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conversations",
                        to="schools.school",
                    ),
                ),
            ],
            options={
                "db_table": "conversations",
                "ordering": ["-last_message_at", "-created_at"],
                "unique_together": {("participant_admin", "participant_other")},
            },
        ),
        # ── Create Message ──
        migrations.CreateModel(
            name="Message",
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
                ("content", models.TextField(blank=True)),
                (
                    "attachment",
                    models.FileField(
                        blank=True,
                        null=True,
                        upload_to=apps.chat.models.chat_attachment_path,
                    ),
                ),
                (
                    "attachment_type",
                    models.CharField(
                        blank=True,
                        choices=[("image", "Image"), ("document", "Document")],
                        max_length=20,
                        null=True,
                    ),
                ),
                (
                    "attachment_name",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                (
                    "attachment_size",
                    models.PositiveIntegerField(blank=True, null=True),
                ),
                ("is_read", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "conversation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to="chat.conversation",
                    ),
                ),
                (
                    "sender",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sent_messages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "conversation_messages",
                "ordering": ["created_at"],
            },
        ),
    ]
