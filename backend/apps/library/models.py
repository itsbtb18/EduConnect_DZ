"""
Library models — catalogue, copies, loans, reservations, and requests.
"""

import datetime

from django.db import models

from core.models import TenantModel


# ──────────────────────────────────────────────────────────────────
# Book — catalogue entry (one per ISBN / title)
# ──────────────────────────────────────────────────────────────────
class Book(TenantModel):
    """A book in the school library catalog with classification."""

    class Category(models.TextChoices):
        FICTION = "FICTION", "Fiction"
        NON_FICTION = "NON_FICTION", "Non-Fiction"
        SCIENCE = "SCIENCE", "Sciences"
        MATHEMATICS = "MATHEMATICS", "Mathématiques"
        HISTORY = "HISTORY", "Histoire"
        GEOGRAPHY = "GEOGRAPHY", "Géographie"
        LITERATURE = "LITERATURE", "Littérature"
        RELIGION = "RELIGION", "Religion"
        ARTS = "ARTS", "Arts"
        TECHNOLOGY = "TECHNOLOGY", "Technologie"
        REFERENCE = "REFERENCE", "Référence"
        PHILOSOPHY = "PHILOSOPHY", "Philosophie"
        LANGUAGES = "LANGUAGES", "Langues"
        SPORTS = "SPORTS", "Sports"
        OTHER = "OTHER", "Autre"

    class Language(models.TextChoices):
        ARABIC = "ARABIC", "Arabe"
        FRENCH = "FRENCH", "Français"
        ENGLISH = "ENGLISH", "Anglais"
        TAMAZIGHT = "TAMAZIGHT", "Tamazight"
        OTHER = "OTHER", "Autre"

    title = models.CharField(max_length=300)
    author = models.CharField(max_length=200, blank=True)
    isbn = models.CharField(max_length=20, blank=True)
    publisher = models.CharField(max_length=200, blank=True)
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.OTHER,
    )
    language = models.CharField(
        max_length=20, choices=Language.choices, default=Language.ARABIC,
    )
    subject = models.CharField(
        max_length=200, blank=True, help_text="Subject area or course",
    )
    description = models.TextField(blank=True)
    publication_year = models.PositiveIntegerField(null=True, blank=True)
    edition = models.CharField(max_length=50, blank=True)
    page_count = models.PositiveIntegerField(null=True, blank=True)
    cover_image_url = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = "library_books"
        ordering = ["title"]

    def __str__(self):
        return self.title

    @property
    def total_copies(self):
        return self.copies.filter(is_deleted=False).count()

    @property
    def available_copies(self):
        return self.copies.filter(
            is_deleted=False, status=BookCopy.Status.AVAILABLE,
        ).count()


# ──────────────────────────────────────────────────────────────────
# BookCopy — individual physical copy
# ──────────────────────────────────────────────────────────────────
class BookCopy(TenantModel):
    """An individual physical copy of a book."""

    class Status(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Disponible"
        BORROWED = "BORROWED", "Emprunté"
        RESERVED = "RESERVED", "Réservé"
        LOST = "LOST", "Perdu"
        DAMAGED = "DAMAGED", "Endommagé"
        RETIRED = "RETIRED", "Retiré"

    class Condition(models.TextChoices):
        NEW = "NEW", "Neuf"
        GOOD = "GOOD", "Bon"
        FAIR = "FAIR", "Acceptable"
        POOR = "POOR", "Mauvais"
        DAMAGED = "DAMAGED", "Endommagé"

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="copies")
    barcode = models.CharField(
        max_length=50, blank=True, help_text="Unique barcode or inventory number",
    )
    condition = models.CharField(
        max_length=10, choices=Condition.choices, default=Condition.GOOD,
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.AVAILABLE,
    )
    location = models.CharField(
        max_length=100, blank=True, help_text="Shelf or section reference",
    )
    acquisition_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "library_book_copies"
        ordering = ["book__title", "barcode"]

    def __str__(self):
        return f"{self.book.title} — {self.barcode or str(self.id)[:8]}"


# ──────────────────────────────────────────────────────────────────
# Loan — borrowing record
# ──────────────────────────────────────────────────────────────────
class Loan(TenantModel):
    """A book loan to a student or teacher."""

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Actif"
        RETURNED = "RETURNED", "Retourné"
        OVERDUE = "OVERDUE", "En retard"
        LOST = "LOST", "Perdu"

    book_copy = models.ForeignKey(
        BookCopy, on_delete=models.CASCADE, related_name="loans",
    )
    borrower = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="library_loans",
    )
    borrowed_date = models.DateField()
    due_date = models.DateField()
    returned_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.ACTIVE,
    )
    renewals_count = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "library_loans"
        ordering = ["-borrowed_date"]

    def __str__(self):
        return f"{self.borrower} — {self.book_copy.book.title}"

    @property
    def is_overdue(self):
        if self.status == self.Status.RETURNED:
            return False
        return datetime.date.today() > self.due_date


# ──────────────────────────────────────────────────────────────────
# Reservation — queue for unavailable books
# ──────────────────────────────────────────────────────────────────
class Reservation(TenantModel):
    """A reservation for a book when all copies are borrowed."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        FULFILLED = "FULFILLED", "Satisfaite"
        CANCELLED = "CANCELLED", "Annulée"
        EXPIRED = "EXPIRED", "Expirée"

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="reservations")
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="library_reservations",
    )
    reserved_date = models.DateField(auto_now_add=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING,
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "library_reservations"
        ordering = ["-reserved_date"]

    def __str__(self):
        return f"{self.user} — {self.book.title} (Réservation)"


# ──────────────────────────────────────────────────────────────────
# LibraryRequest — special book requests / purchase suggestions
# ──────────────────────────────────────────────────────────────────
class LibraryRequest(TenantModel):
    """Special request for a book purchase or suggestion."""

    class RequestType(models.TextChoices):
        PURCHASE = "PURCHASE", "Achat"
        SUGGESTION = "SUGGESTION", "Suggestion"
        OTHER = "OTHER", "Autre"

    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        APPROVED = "APPROVED", "Approuvée"
        REJECTED = "REJECTED", "Rejetée"

    requester = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="library_requests",
    )
    request_type = models.CharField(
        max_length=12, choices=RequestType.choices, default=RequestType.SUGGESTION,
    )
    title = models.CharField(max_length=300, help_text="Requested book title")
    author = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True, help_text="Reason for request")
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING,
    )
    admin_response = models.TextField(blank=True)
    resolved_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="library_requests_resolved",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "library_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.requester} — {self.title} ({self.get_status_display()})"
