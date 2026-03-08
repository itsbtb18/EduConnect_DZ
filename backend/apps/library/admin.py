from django.contrib import admin

from .models import Book, BookCopy, Loan, Reservation, LibraryRequest

admin.site.register(Book)
admin.site.register(BookCopy)
admin.site.register(Loan)
admin.site.register(Reservation)
admin.site.register(LibraryRequest)
