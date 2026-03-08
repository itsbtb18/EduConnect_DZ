"""
Library redesign — drop old scaffold models, create 5 new models.

Old models dropped: Book (scaffold), Loan (scaffold)
New models created: Book, BookCopy, Loan, Reservation, LibraryRequest
"""

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("library", "0001_initial"),
        ("schools", "0004_school_available_streams"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── Drop old scaffold models ──
        migrations.DeleteModel(name="Loan"),
        migrations.DeleteModel(name="Book"),

        # ── Book (redesigned) ──
        migrations.CreateModel(
            name="Book",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("title", models.CharField(max_length=300)),
                ("author", models.CharField(blank=True, max_length=200)),
                ("isbn", models.CharField(blank=True, max_length=20)),
                ("publisher", models.CharField(blank=True, max_length=200)),
                ("category", models.CharField(
                    choices=[
                        ("FICTION", "Fiction"), ("NON_FICTION", "Non-Fiction"),
                        ("SCIENCE", "Sciences"), ("MATHEMATICS", "Mathématiques"),
                        ("HISTORY", "Histoire"), ("GEOGRAPHY", "Géographie"),
                        ("LITERATURE", "Littérature"), ("RELIGION", "Religion"),
                        ("ARTS", "Arts"), ("TECHNOLOGY", "Technologie"),
                        ("REFERENCE", "Référence"), ("PHILOSOPHY", "Philosophie"),
                        ("LANGUAGES", "Langues"), ("SPORTS", "Sports"),
                        ("OTHER", "Autre"),
                    ],
                    default="OTHER", max_length=20,
                )),
                ("language", models.CharField(
                    choices=[
                        ("ARABIC", "Arabe"), ("FRENCH", "Français"),
                        ("ENGLISH", "Anglais"), ("TAMAZIGHT", "Tamazight"),
                        ("OTHER", "Autre"),
                    ],
                    default="ARABIC", max_length=20,
                )),
                ("subject", models.CharField(blank=True, help_text="Subject area or course", max_length=200)),
                ("description", models.TextField(blank=True)),
                ("publication_year", models.PositiveIntegerField(blank=True, null=True)),
                ("edition", models.CharField(blank=True, max_length=50)),
                ("page_count", models.PositiveIntegerField(blank=True, null=True)),
                ("cover_image_url", models.CharField(blank=True, max_length=500)),
                ("created_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(app_label)s_%(class)s_created", to=settings.AUTH_USER_MODEL,
                )),
                ("school", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="%(class)s_set", to="schools.school",
                )),
            ],
            options={"db_table": "library_books", "ordering": ["title"]},
        ),

        # ── BookCopy ──
        migrations.CreateModel(
            name="BookCopy",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("barcode", models.CharField(blank=True, help_text="Unique barcode or inventory number", max_length=50)),
                ("condition", models.CharField(
                    choices=[
                        ("NEW", "Neuf"), ("GOOD", "Bon"), ("FAIR", "Acceptable"),
                        ("POOR", "Mauvais"), ("DAMAGED", "Endommagé"),
                    ],
                    default="GOOD", max_length=10,
                )),
                ("status", models.CharField(
                    choices=[
                        ("AVAILABLE", "Disponible"), ("BORROWED", "Emprunté"),
                        ("RESERVED", "Réservé"), ("LOST", "Perdu"),
                        ("DAMAGED", "Endommagé"), ("RETIRED", "Retiré"),
                    ],
                    default="AVAILABLE", max_length=10,
                )),
                ("location", models.CharField(blank=True, help_text="Shelf or section reference", max_length=100)),
                ("acquisition_date", models.DateField(blank=True, null=True)),
                ("notes", models.TextField(blank=True)),
                ("book", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="copies", to="library.book",
                )),
                ("created_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(app_label)s_%(class)s_created", to=settings.AUTH_USER_MODEL,
                )),
                ("school", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="%(class)s_set", to="schools.school",
                )),
            ],
            options={"db_table": "library_book_copies", "ordering": ["book__title", "barcode"]},
        ),

        # ── Loan (redesigned) ──
        migrations.CreateModel(
            name="Loan",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("borrowed_date", models.DateField()),
                ("due_date", models.DateField()),
                ("returned_date", models.DateField(blank=True, null=True)),
                ("status", models.CharField(
                    choices=[
                        ("ACTIVE", "Actif"), ("RETURNED", "Retourné"),
                        ("OVERDUE", "En retard"), ("LOST", "Perdu"),
                    ],
                    default="ACTIVE", max_length=10,
                )),
                ("renewals_count", models.PositiveIntegerField(default=0)),
                ("notes", models.TextField(blank=True)),
                ("book_copy", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="loans", to="library.bookcopy",
                )),
                ("borrower", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="library_loans", to=settings.AUTH_USER_MODEL,
                )),
                ("created_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(app_label)s_%(class)s_created", to=settings.AUTH_USER_MODEL,
                )),
                ("school", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="%(class)s_set", to="schools.school",
                )),
            ],
            options={"db_table": "library_loans", "ordering": ["-borrowed_date"]},
        ),

        # ── Reservation ──
        migrations.CreateModel(
            name="Reservation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("reserved_date", models.DateField(auto_now_add=True)),
                ("status", models.CharField(
                    choices=[
                        ("PENDING", "En attente"), ("FULFILLED", "Satisfaite"),
                        ("CANCELLED", "Annulée"), ("EXPIRED", "Expirée"),
                    ],
                    default="PENDING", max_length=10,
                )),
                ("notes", models.TextField(blank=True)),
                ("book", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="reservations", to="library.book",
                )),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="library_reservations", to=settings.AUTH_USER_MODEL,
                )),
                ("created_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(app_label)s_%(class)s_created", to=settings.AUTH_USER_MODEL,
                )),
                ("school", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="%(class)s_set", to="schools.school",
                )),
            ],
            options={"db_table": "library_reservations", "ordering": ["-reserved_date"]},
        ),

        # ── LibraryRequest ──
        migrations.CreateModel(
            name="LibraryRequest",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("request_type", models.CharField(
                    choices=[
                        ("PURCHASE", "Achat"), ("SUGGESTION", "Suggestion"),
                        ("OTHER", "Autre"),
                    ],
                    default="SUGGESTION", max_length=12,
                )),
                ("title", models.CharField(help_text="Requested book title", max_length=300)),
                ("author", models.CharField(blank=True, max_length=200)),
                ("description", models.TextField(blank=True, help_text="Reason for request")),
                ("status", models.CharField(
                    choices=[
                        ("PENDING", "En attente"), ("APPROVED", "Approuvée"),
                        ("REJECTED", "Rejetée"),
                    ],
                    default="PENDING", max_length=10,
                )),
                ("admin_response", models.TextField(blank=True)),
                ("resolved_at", models.DateTimeField(blank=True, null=True)),
                ("requester", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="library_requests", to=settings.AUTH_USER_MODEL,
                )),
                ("resolved_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="library_requests_resolved", to=settings.AUTH_USER_MODEL,
                )),
                ("created_by", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(app_label)s_%(class)s_created", to=settings.AUTH_USER_MODEL,
                )),
                ("school", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="%(class)s_set", to="schools.school",
                )),
            ],
            options={"db_table": "library_requests", "ordering": ["-created_at"]},
        ),
    ]
