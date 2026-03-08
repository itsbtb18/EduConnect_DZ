"""
Library views — 16 APIView-based endpoints.

Books catalogue, copies, loans (borrow / return / renew),
reservations, special requests, my-loans, usage report.
"""

import datetime

from django.db.models import Q
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsSchoolAdmin, require_module

from .models import Book, BookCopy, Loan, Reservation, LibraryRequest
from .serializers import (
    BookSerializer,
    BookCreateSerializer,
    BookCopySerializer,
    BookCopyCreateSerializer,
    LoanSerializer,
    LoanCreateSerializer,
    ReservationSerializer,
    ReservationCreateSerializer,
    LibraryRequestSerializer,
    LibraryRequestCreateSerializer,
)

# ── defaults ──
MAX_LOANS_STUDENT = 3
MAX_LOANS_TEACHER = 5
DEFAULT_LOAN_DAYS = 14
MAX_RENEWALS = 2


def _school_qs(model, user):
    """Return non-deleted objects scoped to the user's school."""
    if user.role == "SUPER_ADMIN":
        return model.objects.filter(is_deleted=False)
    return model.objects.filter(school=user.school, is_deleted=False)


# ═══════════════════════════════════════════════════════════════════
# BOOK
# ═══════════════════════════════════════════════════════════════════
@require_module("bibliotheque")
class BookListCreateView(APIView):
    """
    GET  — search & list books (all authenticated users).
           ?q= free-text search (title, author, isbn, publisher, subject)
           ?category= filter by classification
           ?language= filter by language
           ?available=true only books with at least one available copy
    POST — create book (admin only).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _school_qs(Book, request.user)

        q = request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(author__icontains=q)
                | Q(isbn__icontains=q)
                | Q(publisher__icontains=q)
                | Q(subject__icontains=q)
            )
        cat = request.query_params.get("category")
        if cat:
            qs = qs.filter(category=cat)
        lang = request.query_params.get("language")
        if lang:
            qs = qs.filter(language=lang)
        available = request.query_params.get("available")
        if available == "true":
            qs = qs.filter(
                copies__status=BookCopy.Status.AVAILABLE,
                copies__is_deleted=False,
            ).distinct()

        return Response(BookSerializer(qs, many=True).data)

    def post(self, request):
        if request.user.role not in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN"):
            return Response(status=status.HTTP_403_FORBIDDEN)
        ser = BookCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        book = ser.save(school=request.user.school, created_by=request.user)
        return Response(BookSerializer(book).data, status=status.HTTP_201_CREATED)


@require_module("bibliotheque")
class BookDetailView(APIView):
    """GET / PUT / DELETE a single book."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        book = _school_qs(Book, request.user).filter(pk=pk).first()
        if not book:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(BookSerializer(book).data)

    def put(self, request, pk):
        if request.user.role not in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN"):
            return Response(status=status.HTTP_403_FORBIDDEN)
        book = _school_qs(Book, request.user).filter(pk=pk).first()
        if not book:
            return Response(status=status.HTTP_404_NOT_FOUND)
        ser = BookCreateSerializer(book, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        book = ser.save()
        return Response(BookSerializer(book).data)

    def delete(self, request, pk):
        if request.user.role not in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN"):
            return Response(status=status.HTTP_403_FORBIDDEN)
        book = _school_qs(Book, request.user).filter(pk=pk).first()
        if not book:
            return Response(status=status.HTTP_404_NOT_FOUND)
        book.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════
# BOOK COPY
# ═══════════════════════════════════════════════════════════════════
@require_module("bibliotheque")
class BookCopyListCreateView(APIView):
    """
    GET  — list copies, optionally filter by ?book=<uuid> or ?status=
    POST — create copy (admin only)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _school_qs(BookCopy, request.user)
        book_id = request.query_params.get("book")
        if book_id:
            qs = qs.filter(book_id=book_id)
        s = request.query_params.get("status")
        if s:
            qs = qs.filter(status=s)
        return Response(BookCopySerializer(qs, many=True).data)

    def post(self, request):
        if request.user.role not in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN"):
            return Response(status=status.HTTP_403_FORBIDDEN)
        ser = BookCopyCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        copy = ser.save(school=request.user.school, created_by=request.user)
        return Response(BookCopySerializer(copy).data, status=status.HTTP_201_CREATED)


@require_module("bibliotheque")
class BookCopyDetailView(APIView):
    """GET / PUT / DELETE a single copy."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        copy = _school_qs(BookCopy, request.user).filter(pk=pk).first()
        if not copy:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(BookCopySerializer(copy).data)

    def put(self, request, pk):
        if request.user.role not in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN"):
            return Response(status=status.HTTP_403_FORBIDDEN)
        copy = _school_qs(BookCopy, request.user).filter(pk=pk).first()
        if not copy:
            return Response(status=status.HTTP_404_NOT_FOUND)
        ser = BookCopyCreateSerializer(copy, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        copy = ser.save()
        return Response(BookCopySerializer(copy).data)

    def delete(self, request, pk):
        if request.user.role not in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN"):
            return Response(status=status.HTTP_403_FORBIDDEN)
        copy = _school_qs(BookCopy, request.user).filter(pk=pk).first()
        if not copy:
            return Response(status=status.HTTP_404_NOT_FOUND)
        copy.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════
# LOAN
# ═══════════════════════════════════════════════════════════════════
@require_module("bibliotheque")
class LoanListCreateView(APIView):
    """
    GET  — list loans (admin/teacher: all; student: own only).
           ?status= / ?borrower=
    POST — create loan / borrow a book (admin/teacher only).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _school_qs(Loan, request.user)
        if request.user.role in ("STUDENT", "PARENT"):
            qs = qs.filter(borrower=request.user)
        s = request.query_params.get("status")
        if s:
            qs = qs.filter(status=s)
        borrower = request.query_params.get("borrower")
        if borrower:
            qs = qs.filter(borrower_id=borrower)
        return Response(LoanSerializer(qs, many=True).data)

    def post(self, request):
        if request.user.role not in (
            "SUPER_ADMIN",
            "ADMIN",
            "SECTION_ADMIN",
            "TEACHER",
        ):
            return Response(status=status.HTTP_403_FORBIDDEN)

        ser = LoanCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        copy = ser.validated_data["book_copy"]
        borrower = ser.validated_data["borrower"]

        # Copy must be available
        if copy.status != BookCopy.Status.AVAILABLE:
            return Response(
                {"detail": "This copy is not available for borrowing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Copy must belong to same school
        if copy.school_id != request.user.school_id:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # Enforce max active loans
        active_count = Loan.objects.filter(
            borrower=borrower,
            school=request.user.school,
            status__in=[Loan.Status.ACTIVE, Loan.Status.OVERDUE],
            is_deleted=False,
        ).count()
        max_loans = (
            MAX_LOANS_TEACHER if borrower.role == "TEACHER" else MAX_LOANS_STUDENT
        )
        if active_count >= max_loans:
            return Response(
                {
                    "detail": f"Borrower has reached the maximum of {max_loans} active loans."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        due_date = ser.validated_data.get("due_date")
        if not due_date:
            due_date = datetime.date.today() + datetime.timedelta(
                days=DEFAULT_LOAN_DAYS
            )

        loan = Loan.objects.create(
            school=request.user.school,
            created_by=request.user,
            book_copy=copy,
            borrower=borrower,
            borrowed_date=datetime.date.today(),
            due_date=due_date,
            notes=ser.validated_data.get("notes", ""),
        )

        # Mark the copy as borrowed
        copy.status = BookCopy.Status.BORROWED
        copy.save(update_fields=["status", "updated_at"])

        return Response(LoanSerializer(loan).data, status=status.HTTP_201_CREATED)


@require_module("bibliotheque")
class LoanDetailView(APIView):
    """GET a single loan."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        loan = _school_qs(Loan, request.user).filter(pk=pk).first()
        if not loan:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(LoanSerializer(loan).data)


@require_module("bibliotheque")
class LoanReturnView(APIView):
    """POST — mark a loan as returned."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in (
            "SUPER_ADMIN",
            "ADMIN",
            "SECTION_ADMIN",
            "TEACHER",
        ):
            return Response(status=status.HTTP_403_FORBIDDEN)

        loan = _school_qs(Loan, request.user).filter(pk=pk).first()
        if not loan:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if loan.status == Loan.Status.RETURNED:
            return Response(
                {"detail": "Loan already returned."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        loan.status = Loan.Status.RETURNED
        loan.returned_date = datetime.date.today()
        loan.save(update_fields=["status", "returned_date", "updated_at"])

        # Free the copy
        copy = loan.book_copy
        copy.status = BookCopy.Status.AVAILABLE
        copy.save(update_fields=["status", "updated_at"])

        # Fulfil oldest pending reservation for this book
        pending = (
            Reservation.objects.filter(
                book=copy.book,
                school=request.user.school,
                status=Reservation.Status.PENDING,
                is_deleted=False,
            )
            .order_by("reserved_date")
            .first()
        )
        if pending:
            pending.status = Reservation.Status.FULFILLED
            pending.save(update_fields=["status", "updated_at"])

        return Response(LoanSerializer(loan).data)


@require_module("bibliotheque")
class LoanRenewView(APIView):
    """POST — renew a loan (extend due date)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in (
            "SUPER_ADMIN",
            "ADMIN",
            "SECTION_ADMIN",
            "TEACHER",
        ):
            return Response(status=status.HTTP_403_FORBIDDEN)

        loan = _school_qs(Loan, request.user).filter(pk=pk).first()
        if not loan:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if loan.status not in (Loan.Status.ACTIVE, Loan.Status.OVERDUE):
            return Response(
                {"detail": "Only active or overdue loans can be renewed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if loan.renewals_count >= MAX_RENEWALS:
            return Response(
                {"detail": f"Maximum {MAX_RENEWALS} renewals reached."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        loan.due_date = datetime.date.today() + datetime.timedelta(
            days=DEFAULT_LOAN_DAYS
        )
        loan.renewals_count += 1
        loan.status = Loan.Status.ACTIVE  # reset from OVERDUE if applicable
        loan.save(update_fields=["due_date", "renewals_count", "status", "updated_at"])

        return Response(LoanSerializer(loan).data)


# ═══════════════════════════════════════════════════════════════════
# MY LOANS
# ═══════════════════════════════════════════════════════════════════
@require_module("bibliotheque")
class MyLoansView(APIView):
    """GET — authenticated user sees their own loans."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _school_qs(Loan, request.user).filter(borrower=request.user)
        s = request.query_params.get("status")
        if s:
            qs = qs.filter(status=s)
        return Response(LoanSerializer(qs, many=True).data)


# ═══════════════════════════════════════════════════════════════════
# RESERVATION
# ═══════════════════════════════════════════════════════════════════
@require_module("bibliotheque")
class ReservationListCreateView(APIView):
    """
    GET  — list reservations (admin: all; others: own only).
    POST — create reservation for a book.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _school_qs(Reservation, request.user)
        if request.user.role in ("STUDENT", "PARENT", "TEACHER"):
            qs = qs.filter(user=request.user)
        return Response(ReservationSerializer(qs, many=True).data)

    def post(self, request):
        ser = ReservationCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        book = ser.validated_data["book"]

        # Book must belong to the same school
        if book.school_id != request.user.school_id:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # No duplicate pending reservation
        exists = Reservation.objects.filter(
            book=book,
            user=request.user,
            status=Reservation.Status.PENDING,
            is_deleted=False,
        ).exists()
        if exists:
            return Response(
                {"detail": "You already have a pending reservation for this book."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation = Reservation.objects.create(
            school=request.user.school,
            created_by=request.user,
            book=book,
            user=request.user,
            notes=ser.validated_data.get("notes", ""),
        )
        return Response(
            ReservationSerializer(reservation).data,
            status=status.HTTP_201_CREATED,
        )


@require_module("bibliotheque")
class ReservationCancelView(APIView):
    """POST — cancel a pending reservation."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        res = _school_qs(Reservation, request.user).filter(pk=pk).first()
        if not res:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # Only owner or admin can cancel
        if res.user_id != request.user.id and request.user.role not in (
            "SUPER_ADMIN",
            "ADMIN",
            "SECTION_ADMIN",
        ):
            return Response(status=status.HTTP_403_FORBIDDEN)

        if res.status != Reservation.Status.PENDING:
            return Response(
                {"detail": "Only pending reservations can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        res.status = Reservation.Status.CANCELLED
        res.save(update_fields=["status", "updated_at"])
        return Response(ReservationSerializer(res).data)


# ═══════════════════════════════════════════════════════════════════
# LIBRARY REQUEST
# ═══════════════════════════════════════════════════════════════════
@require_module("bibliotheque")
class LibraryRequestListCreateView(APIView):
    """
    GET  — list requests (admin: all; others: own only).
    POST — submit a special request.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _school_qs(LibraryRequest, request.user)
        if request.user.role in ("STUDENT", "PARENT", "TEACHER"):
            qs = qs.filter(requester=request.user)
        s = request.query_params.get("status")
        if s:
            qs = qs.filter(status=s)
        return Response(LibraryRequestSerializer(qs, many=True).data)

    def post(self, request):
        ser = LibraryRequestCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        req = LibraryRequest.objects.create(
            school=request.user.school,
            created_by=request.user,
            requester=request.user,
            **ser.validated_data,
        )
        return Response(
            LibraryRequestSerializer(req).data,
            status=status.HTTP_201_CREATED,
        )


@require_module("bibliotheque")
class LibraryRequestDetailView(APIView):
    """GET a single library request."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        req = _school_qs(LibraryRequest, request.user).filter(pk=pk).first()
        if not req:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(LibraryRequestSerializer(req).data)


@require_module("bibliotheque")
class LibraryRequestResolveView(APIView):
    """POST — admin approves or rejects a request. Body: {action, admin_response}."""

    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        req = _school_qs(LibraryRequest, request.user).filter(pk=pk).first()
        if not req:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if req.status != LibraryRequest.Status.PENDING:
            return Response(
                {"detail": "Only pending requests can be resolved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        action = request.data.get("action")
        if action not in ("approve", "reject"):
            return Response(
                {"detail": "action must be 'approve' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        req.status = (
            LibraryRequest.Status.APPROVED
            if action == "approve"
            else LibraryRequest.Status.REJECTED
        )
        req.admin_response = request.data.get("admin_response", "")
        req.resolved_by = request.user
        req.resolved_at = timezone.now()
        req.save(
            update_fields=[
                "status",
                "admin_response",
                "resolved_by",
                "resolved_at",
                "updated_at",
            ]
        )
        return Response(LibraryRequestSerializer(req).data)


# ═══════════════════════════════════════════════════════════════════
# USAGE REPORT
# ═══════════════════════════════════════════════════════════════════
@require_module("bibliotheque")
class UsageReportView(APIView):
    """GET — library usage statistics (admin only)."""

    permission_classes = [IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        books = Book.objects.filter(school=school, is_deleted=False)
        copies = BookCopy.objects.filter(school=school, is_deleted=False)
        loans = Loan.objects.filter(school=school, is_deleted=False)

        active_loans = loans.filter(
            status__in=[Loan.Status.ACTIVE, Loan.Status.OVERDUE]
        )
        overdue_loans = loans.filter(status=Loan.Status.OVERDUE)

        # ── popular books (most borrowed, top 10) ──
        book_counts: dict = {}
        for bid in loans.values_list("book_copy__book_id", flat=True):
            book_counts[bid] = book_counts.get(bid, 0) + 1

        top_books_raw = sorted(book_counts.items(), key=lambda x: x[1], reverse=True)[
            :10
        ]
        top_book_list = []
        for bid, count in top_books_raw:
            b = books.filter(pk=bid).first()
            if b:
                top_book_list.append(
                    {
                        "id": str(b.id),
                        "title": b.title,
                        "author": b.author,
                        "loan_count": count,
                    }
                )

        # ── active borrowers ──
        active_borrower_ids = set(active_loans.values_list("borrower_id", flat=True))

        # ── category distribution ──
        cat_dist: dict = {}
        for cat in books.values_list("category", flat=True):
            cat_dist[cat] = cat_dist.get(cat, 0) + 1

        return Response(
            {
                "total_books": books.count(),
                "total_copies": copies.count(),
                "available_copies": copies.filter(
                    status=BookCopy.Status.AVAILABLE
                ).count(),
                "total_loans": loans.count(),
                "active_loans": active_loans.count(),
                "overdue_loans": overdue_loans.count(),
                "active_borrowers": len(active_borrower_ids),
                "popular_books": top_book_list,
                "category_distribution": cat_dist,
            }
        )
