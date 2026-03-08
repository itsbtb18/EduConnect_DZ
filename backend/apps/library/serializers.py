"""
Library serializers — catalogue, copies, loans, reservations, requests.
"""

from rest_framework import serializers

from .models import Book, BookCopy, Loan, Reservation, LibraryRequest


# ──────────────── Book ────────────────

class BookSerializer(serializers.ModelSerializer):
    total_copies = serializers.SerializerMethodField()
    available_copies = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id", "title", "author", "isbn", "publisher",
            "category", "language", "subject", "description",
            "publication_year", "edition", "page_count",
            "cover_image_url", "total_copies", "available_copies",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_total_copies(self, obj):
        return obj.total_copies

    def get_available_copies(self, obj):
        return obj.available_copies


class BookCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = [
            "title", "author", "isbn", "publisher",
            "category", "language", "subject", "description",
            "publication_year", "edition", "page_count",
            "cover_image_url",
        ]


# ──────────────── BookCopy ────────────────

class BookCopySerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)

    class Meta:
        model = BookCopy
        fields = [
            "id", "book", "book_title", "barcode", "condition",
            "status", "location", "acquisition_date", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class BookCopyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookCopy
        fields = ["book", "barcode", "condition", "location", "acquisition_date", "notes"]


# ──────────────── Loan ────────────────

class LoanSerializer(serializers.ModelSerializer):
    borrower_name = serializers.CharField(source="borrower.full_name", read_only=True)
    book_title = serializers.CharField(source="book_copy.book.title", read_only=True)
    copy_barcode = serializers.CharField(source="book_copy.barcode", read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Loan
        fields = [
            "id", "book_copy", "borrower", "borrower_name",
            "book_title", "copy_barcode", "borrowed_date",
            "due_date", "returned_date", "status",
            "renewals_count", "is_overdue", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "status", "renewals_count",
            "created_at", "updated_at",
        ]


class LoanCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = ["book_copy", "borrower", "due_date", "notes"]
        extra_kwargs = {
            "due_date": {"required": False},
            "notes": {"required": False},
        }


# ──────────────── Reservation ────────────────

class ReservationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    book_title = serializers.CharField(source="book.title", read_only=True)

    class Meta:
        model = Reservation
        fields = [
            "id", "book", "user", "user_name", "book_title",
            "reserved_date", "status", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "reserved_date", "status",
            "created_at", "updated_at",
        ]


class ReservationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = ["book", "notes"]
        extra_kwargs = {
            "notes": {"required": False},
        }


# ──────────────── LibraryRequest ────────────────

class LibraryRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source="requester.full_name", read_only=True)
    resolved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LibraryRequest
        fields = [
            "id", "requester", "requester_name", "request_type",
            "title", "author", "description", "status",
            "admin_response", "resolved_by", "resolved_by_name",
            "resolved_at", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "requester", "status", "admin_response",
            "resolved_by", "resolved_at", "created_at", "updated_at",
        ]

    def get_resolved_by_name(self, obj):
        if obj.resolved_by:
            return obj.resolved_by.full_name
        return None


class LibraryRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryRequest
        fields = ["request_type", "title", "author", "description"]
