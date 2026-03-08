"""
Library module tests - 45 tests across 9 test classes.
"""

import datetime
from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.library.models import Book, BookCopy, Loan, Reservation, LibraryRequest
from apps.library.tasks import check_overdue_loans, send_due_date_reminders
from apps.schools.models import School


def _school(**kw):
    defaults = {
        "name": "Lib School",
        "address": "Algiers",
        "phone": "021000000",
        "subscription_plan": "premium",
    }
    defaults.update(kw)
    return School.objects.create(**defaults)


def _user(phone, role, school, **kw):
    kw.setdefault("first_name", role.capitalize())
    kw.setdefault("last_name", "User")
    return User.objects.create_user(
        phone_number=phone, password="pass1234", role=role, school=school, **kw,
    )


def _book(school, **kw):
    defaults = {
        "title": "Maths Avancees",
        "author": "A. Karim",
        "isbn": "978-0001",
        "category": "MATHEMATICS",
        "language": "FRENCH",
        "subject": "Mathematiques",
    }
    defaults.update(kw)
    return Book.objects.create(school=school, **defaults)


def _copy(school, book, **kw):
    defaults = {"barcode": "BC001", "condition": "GOOD", "status": "AVAILABLE"}
    defaults.update(kw)
    return BookCopy.objects.create(school=school, book=book, **defaults)


# 1. Book CRUD + search (7 tests)
@override_settings(
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
    DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage",
)
class TestBookCRUD(TestCase):
    def setUp(self):
        self.school = _school()
        self.admin = _user("0600000001", "ADMIN", self.school)
        self.student = _user("0600000002", "STUDENT", self.school)
        self.c = APIClient()

    def test_admin_create_book(self):
        self.c.force_authenticate(self.admin)
        resp = self.c.post("/api/v1/library/books/", {
            "title": "Physique Tome 1",
            "author": "B. Ahmed",
            "category": "SCIENCE",
            "language": "FRENCH",
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["title"], "Physique Tome 1")
        self.assertEqual(resp.data["category"], "SCIENCE")

    def test_list_books(self):
        _book(self.school)
        _book(self.school, title="Histoire Algerie", isbn="978-0002", category="HISTORY")
        self.c.force_authenticate(self.student)
        resp = self.c.get("/api/v1/library/books/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)

    def test_search_by_title(self):
        _book(self.school)
        _book(self.school, title="Chimie Organique", isbn="978-0003", category="SCIENCE")
        self.c.force_authenticate(self.student)
        resp = self.c.get("/api/v1/library/books/", {"q": "chimie"})
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["title"], "Chimie Organique")

    def test_search_by_category(self):
        _book(self.school)
        _book(self.school, title="Bio", isbn="978-0004", category="SCIENCE")
        self.c.force_authenticate(self.student)
        resp = self.c.get("/api/v1/library/books/", {"category": "SCIENCE"})
        self.assertEqual(len(resp.data), 1)

    def test_filter_available_only(self):
        b1 = _book(self.school)
        b2 = _book(self.school, title="Livre 2", isbn="978-0005")
        _copy(self.school, b1, barcode="BC100")
        _copy(self.school, b2, barcode="BC101", status="BORROWED")
        self.c.force_authenticate(self.student)
        resp = self.c.get("/api/v1/library/books/", {"available": "true"})
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["title"], b1.title)

    def test_update_book(self):
        book = _book(self.school)
        self.c.force_authenticate(self.admin)
        resp = self.c.put(f"/api/v1/library/books/{book.id}/", {"title": "Maths V2"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["title"], "Maths V2")

    def test_delete_book_soft(self):
        book = _book(self.school)
        self.c.force_authenticate(self.admin)
        resp = self.c.delete(f"/api/v1/library/books/{book.id}/")
        self.assertEqual(resp.status_code, 204)
        book.refresh_from_db()
        self.assertTrue(book.is_deleted)


# 2. BookCopy CRUD (5 tests)
@override_settings(
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
    DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage",
)
class TestBookCopyCRUD(TestCase):
    def setUp(self):
        self.school = _school()
        self.admin = _user("0600000011", "ADMIN", self.school)
        self.student = _user("0600000012", "STUDENT", self.school)
        self.book = _book(self.school)
        self.c = APIClient()

    def test_admin_create_copy(self):
        self.c.force_authenticate(self.admin)
        resp = self.c.post("/api/v1/library/copies/", {
            "book": str(self.book.id),
            "barcode": "BC200",
            "condition": "NEW",
            "location": "Etagere A3",
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["barcode"], "BC200")

    def test_list_copies_by_book(self):
        _copy(self.school, self.book, barcode="BC201")
        _copy(self.school, self.book, barcode="BC202")
        self.c.force_authenticate(self.student)
        resp = self.c.get("/api/v1/library/copies/", {"book": str(self.book.id)})
        self.assertEqual(len(resp.data), 2)

    def test_update_copy(self):
        cp = _copy(self.school, self.book, barcode="BC203")
        self.c.force_authenticate(self.admin)
        resp = self.c.put(f"/api/v1/library/copies/{cp.id}/", {"condition": "FAIR"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["condition"], "FAIR")

    def test_delete_copy(self):
        cp = _copy(self.school, self.book, barcode="BC204")
        self.c.force_authenticate(self.admin)
        resp = self.c.delete(f"/api/v1/library/copies/{cp.id}/")
        self.assertEqual(resp.status_code, 204)
        cp.refresh_from_db()
        self.assertTrue(cp.is_deleted)

    def test_student_cannot_create_copy(self):
        self.c.force_authenticate(self.student)
        resp = self.c.post("/api/v1/library/copies/", {
            "book": str(self.book.id),
            "barcode": "BC205",
        })
        self.assertEqual(resp.status_code, 403)


# 3. Loan workflow (8 tests)
@override_settings(
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
    DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage",
)
class TestLoanWorkflow(TestCase):
    def setUp(self):
        self.school = _school()
        self.admin = _user("0600000021", "ADMIN", self.school)
        self.teacher = _user("0600000022", "TEACHER", self.school)
        self.student = _user("0600000023", "STUDENT", self.school)
        self.book = _book(self.school)
        self.copy = _copy(self.school, self.book, barcode="BC300")
        self.c = APIClient()

    def test_create_loan(self):
        self.c.force_authenticate(self.admin)
        resp = self.c.post("/api/v1/library/loans/", {
            "book_copy": str(self.copy.id),
            "borrower": str(self.student.id),
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["status"], "ACTIVE")
        self.copy.refresh_from_db()
        self.assertEqual(self.copy.status, "BORROWED")

    def test_loan_unavailable_copy_rejected(self):
        self.copy.status = "BORROWED"
        self.copy.save()
        self.c.force_authenticate(self.admin)
        resp = self.c.post("/api/v1/library/loans/", {
            "book_copy": str(self.copy.id),
            "borrower": str(self.student.id),
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn("not available", resp.data["detail"])

    def test_loan_max_loans_exceeded(self):
        self.c.force_authenticate(self.admin)
        for i in range(3):
            cp = _copy(self.school, self.book, barcode=f"BC30{i+1}")
            Loan.objects.create(
                school=self.school,
                book_copy=cp,
                borrower=self.student,
                borrowed_date=datetime.date.today(),
                due_date=datetime.date.today() + datetime.timedelta(days=14),
                status="ACTIVE",
            )
            cp.status = "BORROWED"
            cp.save()
        cp4 = _copy(self.school, self.book, barcode="BC304")
        resp = self.c.post("/api/v1/library/loans/", {
            "book_copy": str(cp4.id),
            "borrower": str(self.student.id),
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn("maximum", resp.data["detail"])

    def test_return_loan(self):
        self.c.force_authenticate(self.admin)
        loan = Loan.objects.create(
            school=self.school,
            book_copy=self.copy,
            borrower=self.student,
            borrowed_date=datetime.date.today(),
            due_date=datetime.date.today() + datetime.timedelta(days=14),
        )
        self.copy.status = "BORROWED"
        self.copy.save()
        resp = self.c.post(f"/api/v1/library/loans/{loan.id}/return/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "RETURNED")
        self.copy.refresh_from_db()
        self.assertEqual(self.copy.status, "AVAILABLE")

    def test_return_already_returned_fails(self):
        self.c.force_authenticate(self.admin)
        loan = Loan.objects.create(
            school=self.school,
            book_copy=self.copy,
            borrower=self.student,
            borrowed_date=datetime.date.today(),
            due_date=datetime.date.today() + datetime.timedelta(days=14),
            status="RETURNED",
            returned_date=datetime.date.today(),
        )
        resp = self.c.post(f"/api/v1/library/loans/{loan.id}/return/")
        self.assertEqual(resp.status_code, 400)

    def test_renew_loan(self):
        self.c.force_authenticate(self.admin)
        loan = Loan.objects.create(
            school=self.school,
            book_copy=self.copy,
            borrower=self.student,
            borrowed_date=datetime.date.today(),
            due_date=datetime.date.today() + datetime.timedelta(days=14),
        )
        resp = self.c.post(f"/api/v1/library/loans/{loan.id}/renew/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["renewals_count"], 1)
        expected_due = datetime.date.today() + datetime.timedelta(days=14)
        self.assertEqual(resp.data["due_date"], str(expected_due))

    def test_renew_max_renewals_exceeded(self):
        self.c.force_authenticate(self.admin)
        loan = Loan.objects.create(
            school=self.school,
            book_copy=self.copy,
            borrower=self.student,
            borrowed_date=datetime.date.today(),
            due_date=datetime.date.today() + datetime.timedelta(days=14),
            renewals_count=2,
        )
        resp = self.c.post(f"/api/v1/library/loans/{loan.id}/renew/")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Maximum", resp.data["detail"])

    def test_my_loans(self):
        loan = Loan.objects.create(
            school=self.school,
            book_copy=self.copy,
            borrower=self.student,
            borrowed_date=datetime.date.today(),
            due_date=datetime.date.today() + datetime.timedelta(days=14),
        )
        self.c.force_authenticate(self.student)
        resp = self.c.get("/api/v1/library/my-loans/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(str(resp.data[0]["id"]), str(loan.id))


# 4. Reservations (5 tests)
@override_settings(
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
    DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage",
)
class TestReservations(TestCase):
    def setUp(self):
        self.school = _school()
        self.admin = _user("0600000031", "ADMIN", self.school)
        self.student = _user("0600000032", "STUDENT", self.school)
        self.student2 = _user("0600000033", "STUDENT", self.school, first_name="Ali")
        self.book = _book(self.school)
        self.copy = _copy(self.school, self.book, barcode="BC400")
        self.c = APIClient()

    def test_create_reservation(self):
        self.c.force_authenticate(self.student)
        resp = self.c.post("/api/v1/library/reservations/", {
            "book": str(self.book.id),
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["status"], "PENDING")

    def test_duplicate_reservation_rejected(self):
        Reservation.objects.create(
            school=self.school, book=self.book, user=self.student,
        )
        self.c.force_authenticate(self.student)
        resp = self.c.post("/api/v1/library/reservations/", {
            "book": str(self.book.id),
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn("already have a pending", resp.data["detail"])

    def test_cancel_reservation(self):
        res = Reservation.objects.create(
            school=self.school, book=self.book, user=self.student,
        )
        self.c.force_authenticate(self.student)
        resp = self.c.post(f"/api/v1/library/reservations/{res.id}/cancel/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "CANCELLED")

    def test_cancel_non_pending_fails(self):
        res = Reservation.objects.create(
            school=self.school, book=self.book, user=self.student,
            status="FULFILLED",
        )
        self.c.force_authenticate(self.student)
        resp = self.c.post(f"/api/v1/library/reservations/{res.id}/cancel/")
        self.assertEqual(resp.status_code, 400)

    def test_return_fulfils_pending_reservation(self):
        res = Reservation.objects.create(
            school=self.school, book=self.book, user=self.student2,
        )
        self.copy.status = "BORROWED"
        self.copy.save()
        loan = Loan.objects.create(
            school=self.school,
            book_copy=self.copy,
            borrower=self.student,
            borrowed_date=datetime.date.today(),
            due_date=datetime.date.today() + datetime.timedelta(days=14),
        )
        self.c.force_authenticate(self.admin)
        resp = self.c.post(f"/api/v1/library/loans/{loan.id}/return/")
        self.assertEqual(resp.status_code, 200)
        res.refresh_from_db()
        self.assertEqual(res.status, "FULFILLED")


# 5. Library requests (6 tests)
@override_settings(
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
    DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage",
)
class TestLibraryRequests(TestCase):
    def setUp(self):
        self.school = _school()
        self.admin = _user("0600000041", "ADMIN", self.school)
        self.teacher = _user("0600000042", "TEACHER", self.school)
        self.c = APIClient()

    def test_create_request(self):
        self.c.force_authenticate(self.teacher)
        resp = self.c.post("/api/v1/library/requests/", {
            "request_type": "PURCHASE",
            "title": "Advanced Python",
            "author": "G. Rossum",
            "description": "Needed for the CS club.",
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["status"], "PENDING")
        self.assertEqual(resp.data["title"], "Advanced Python")

    def test_list_own_requests(self):
        LibraryRequest.objects.create(
            school=self.school, requester=self.teacher,
            title="Book A", request_type="SUGGESTION",
        )
        LibraryRequest.objects.create(
            school=self.school, requester=self.admin,
            title="Book B", request_type="PURCHASE",
        )
        self.c.force_authenticate(self.teacher)
        resp = self.c.get("/api/v1/library/requests/")
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["title"], "Book A")

    def test_approve_request(self):
        req = LibraryRequest.objects.create(
            school=self.school, requester=self.teacher,
            title="Book C", request_type="PURCHASE",
        )
        self.c.force_authenticate(self.admin)
        resp = self.c.post(f"/api/v1/library/requests/{req.id}/resolve/", {
            "action": "approve",
            "admin_response": "We will purchase it next month.",
        })
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "APPROVED")
        self.assertEqual(resp.data["admin_response"], "We will purchase it next month.")

    def test_reject_request(self):
        req = LibraryRequest.objects.create(
            school=self.school, requester=self.teacher,
            title="Book D", request_type="PURCHASE",
        )
        self.c.force_authenticate(self.admin)
        resp = self.c.post(f"/api/v1/library/requests/{req.id}/resolve/", {
            "action": "reject",
            "admin_response": "Not in the budget.",
        })
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "REJECTED")

    def test_resolve_already_resolved_fails(self):
        req = LibraryRequest.objects.create(
            school=self.school, requester=self.teacher,
            title="Book E", request_type="PURCHASE",
            status="APPROVED",
        )
        self.c.force_authenticate(self.admin)
        resp = self.c.post(f"/api/v1/library/requests/{req.id}/resolve/", {
            "action": "reject",
        })
        self.assertEqual(resp.status_code, 400)

    def test_invalid_action_rejected(self):
        req = LibraryRequest.objects.create(
            school=self.school, requester=self.teacher,
            title="Book F", request_type="PURCHASE",
        )
        self.c.force_authenticate(self.admin)
        resp = self.c.post(f"/api/v1/library/requests/{req.id}/resolve/", {
            "action": "maybe",
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn("approve", resp.data["detail"])


# 6. Usage report (3 tests)
@override_settings(
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
    DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage",
)
class TestUsageReport(TestCase):
    def setUp(self):
        self.school = _school()
        self.admin = _user("0600000051", "ADMIN", self.school)
        self.student = _user("0600000052", "STUDENT", self.school)
        self.book = _book(self.school)
        self.copy = _copy(self.school, self.book, barcode="BC500")
        self.c = APIClient()

    def test_usage_report(self):
        self.c.force_authenticate(self.admin)
        resp = self.c.get("/api/v1/library/usage-report/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("total_books", resp.data)
        self.assertIn("total_copies", resp.data)
        self.assertEqual(resp.data["total_books"], 1)
        self.assertEqual(resp.data["total_copies"], 1)

    def test_usage_report_popular_books(self):
        Loan.objects.create(
            school=self.school, book_copy=self.copy, borrower=self.student,
            borrowed_date=datetime.date.today(),
            due_date=datetime.date.today() + datetime.timedelta(days=14),
            status="RETURNED",
        )
        self.c.force_authenticate(self.admin)
        resp = self.c.get("/api/v1/library/usage-report/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data["popular_books"]), 1)
        self.assertEqual(resp.data["popular_books"][0]["loan_count"], 1)

    def test_student_cannot_access_report(self):
        self.c.force_authenticate(self.student)
        resp = self.c.get("/api/v1/library/usage-report/")
        self.assertEqual(resp.status_code, 403)


# 7. Permissions (5 tests)
@override_settings(
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
    DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage",
)
class TestPermissions(TestCase):
    def setUp(self):
        self.school = _school()
        self.admin = _user("0600000061", "ADMIN", self.school)
        self.teacher = _user("0600000062", "TEACHER", self.school)
        self.student = _user("0600000063", "STUDENT", self.school)
        self.parent = _user("0600000064", "PARENT", self.school)
        self.book = _book(self.school)
        self.copy = _copy(self.school, self.book, barcode="BC600")
        self.c = APIClient()

    def test_student_cannot_create_book(self):
        self.c.force_authenticate(self.student)
        resp = self.c.post("/api/v1/library/books/", {"title": "New Book"})
        self.assertEqual(resp.status_code, 403)

    def test_student_cannot_create_loan(self):
        self.c.force_authenticate(self.student)
        resp = self.c.post("/api/v1/library/loans/", {
            "book_copy": str(self.copy.id),
            "borrower": str(self.student.id),
        })
        self.assertEqual(resp.status_code, 403)

    def test_student_cannot_return_loan(self):
        loan = Loan.objects.create(
            school=self.school, book_copy=self.copy, borrower=self.student,
            borrowed_date=datetime.date.today(),
            due_date=datetime.date.today() + datetime.timedelta(days=14),
        )
        self.c.force_authenticate(self.student)
        resp = self.c.post(f"/api/v1/library/loans/{loan.id}/return/")
        self.assertEqual(resp.status_code, 403)

    def test_parent_cannot_delete_book(self):
        self.c.force_authenticate(self.parent)
        resp = self.c.delete(f"/api/v1/library/books/{self.book.id}/")
        self.assertEqual(resp.status_code, 403)

    def test_teacher_can_create_loan(self):
        self.c.force_authenticate(self.teacher)
        resp = self.c.post("/api/v1/library/loans/", {
            "book_copy": str(self.copy.id),
            "borrower": str(self.student.id),
        })
        self.assertEqual(resp.status_code, 201)


# 8. Tenant isolation (3 tests)
@override_settings(
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
    DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage",
)
class TestTenantIsolation(TestCase):
    def setUp(self):
        self.school1 = _school(subdomain="lib-school-1")
        self.school2 = _school(name="Other School", phone="021000001", subdomain="lib-school-2")
        self.admin1 = _user("0600000071", "ADMIN", self.school1)
        self.admin2 = _user("0600000072", "ADMIN", self.school2)
        self.student2 = _user("0600000073", "STUDENT", self.school2)
        self.book1 = _book(self.school1)
        self.book2 = _book(self.school2, title="Other Book", isbn="978-9999")
        self.copy1 = _copy(self.school1, self.book1, barcode="BC700")
        self.copy2 = _copy(self.school2, self.book2, barcode="BC701")
        self.c = APIClient()

    def test_cannot_see_other_school_books(self):
        self.c.force_authenticate(self.admin1)
        resp = self.c.get("/api/v1/library/books/")
        titles = [b["title"] for b in resp.data]
        self.assertIn(self.book1.title, titles)
        self.assertNotIn(self.book2.title, titles)

    def test_cannot_see_other_school_loans(self):
        Loan.objects.create(
            school=self.school2, book_copy=self.copy2, borrower=self.student2,
            borrowed_date=datetime.date.today(),
            due_date=datetime.date.today() + datetime.timedelta(days=14),
        )
        self.c.force_authenticate(self.admin1)
        resp = self.c.get("/api/v1/library/loans/")
        self.assertEqual(len(resp.data), 0)

    def test_cannot_borrow_other_school_copy(self):
        student1 = _user("0600000074", "STUDENT", self.school1)
        self.c.force_authenticate(self.admin1)
        resp = self.c.post("/api/v1/library/loans/", {
            "book_copy": str(self.copy2.id),
            "borrower": str(student1.id),
        })
        self.assertEqual(resp.status_code, 404)


# 9. Celery tasks (3 tests)
@override_settings(
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
    DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage",
)
class TestCeleryTasks(TestCase):
    def setUp(self):
        self.school = _school()
        self.student = _user("0600000081", "STUDENT", self.school)
        self.book = _book(self.school)
        self.copy = _copy(self.school, self.book, barcode="BC800")

    @patch("apps.library.tasks._send_fcm_for_users")
    def test_check_overdue_loans(self, mock_fcm):
        loan = Loan.objects.create(
            school=self.school,
            book_copy=self.copy,
            borrower=self.student,
            borrowed_date=datetime.date.today() - datetime.timedelta(days=20),
            due_date=datetime.date.today() - datetime.timedelta(days=5),
            status="ACTIVE",
        )
        count = check_overdue_loans()
        self.assertEqual(count, 1)
        loan.refresh_from_db()
        self.assertEqual(loan.status, "OVERDUE")
        self.assertTrue(mock_fcm.called)

    @patch("apps.library.tasks._send_fcm_for_users")
    def test_send_due_date_reminders(self, mock_fcm):
        Loan.objects.create(
            school=self.school,
            book_copy=self.copy,
            borrower=self.student,
            borrowed_date=datetime.date.today(),
            due_date=datetime.date.today() + datetime.timedelta(days=1),
            status="ACTIVE",
        )
        count = send_due_date_reminders()
        self.assertEqual(count, 1)
        self.assertTrue(mock_fcm.called)

    @patch("apps.library.tasks._send_fcm_for_users")
    def test_overdue_does_not_affect_returned(self, mock_fcm):
        Loan.objects.create(
            school=self.school,
            book_copy=self.copy,
            borrower=self.student,
            borrowed_date=datetime.date.today() - datetime.timedelta(days=20),
            due_date=datetime.date.today() - datetime.timedelta(days=5),
            status="RETURNED",
            returned_date=datetime.date.today() - datetime.timedelta(days=6),
        )
        count = check_overdue_loans()
        self.assertEqual(count, 0)
        self.assertFalse(mock_fcm.called)
