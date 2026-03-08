/// Models for the Library (Bibliothèque) module.
library;

class Book {
  final String id;
  final String title;
  final String author;
  final String isbn;
  final String publisher;
  final String category;
  final String language;
  final String subject;
  final String description;
  final int? publicationYear;
  final String edition;
  final int? pageCount;
  final String coverImageUrl;
  final int totalCopies;
  final int availableCopies;
  final String createdAt;

  const Book({
    required this.id,
    required this.title,
    required this.author,
    this.isbn = '',
    this.publisher = '',
    this.category = 'OTHER',
    this.language = 'FRENCH',
    this.subject = '',
    this.description = '',
    this.publicationYear,
    this.edition = '',
    this.pageCount,
    this.coverImageUrl = '',
    this.totalCopies = 0,
    this.availableCopies = 0,
    this.createdAt = '',
  });

  factory Book.fromJson(Map<String, dynamic> json) {
    return Book(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      author: json['author'] as String? ?? '',
      isbn: json['isbn'] as String? ?? '',
      publisher: json['publisher'] as String? ?? '',
      category: json['category'] as String? ?? 'OTHER',
      language: json['language'] as String? ?? 'FRENCH',
      subject: json['subject'] as String? ?? '',
      description: json['description'] as String? ?? '',
      publicationYear: json['publication_year'] as int?,
      edition: json['edition'] as String? ?? '',
      pageCount: json['page_count'] as int?,
      coverImageUrl: json['cover_image_url'] as String? ?? '',
      totalCopies: json['total_copies'] as int? ?? 0,
      availableCopies: json['available_copies'] as int? ?? 0,
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  bool get isAvailable => availableCopies > 0;
}

class Loan {
  final String id;
  final String bookCopy;
  final String borrower;
  final String borrowerName;
  final String bookTitle;
  final String copyBarcode;
  final String borrowedDate;
  final String dueDate;
  final String? returnedDate;
  final String status;
  final int renewalsCount;
  final bool isOverdue;
  final String notes;

  const Loan({
    required this.id,
    required this.bookCopy,
    required this.borrower,
    required this.borrowerName,
    required this.bookTitle,
    this.copyBarcode = '',
    required this.borrowedDate,
    required this.dueDate,
    this.returnedDate,
    required this.status,
    this.renewalsCount = 0,
    this.isOverdue = false,
    this.notes = '',
  });

  factory Loan.fromJson(Map<String, dynamic> json) {
    return Loan(
      id: json['id'] as String? ?? '',
      bookCopy: json['book_copy'] as String? ?? '',
      borrower: json['borrower'] as String? ?? '',
      borrowerName: json['borrower_name'] as String? ?? '',
      bookTitle: json['book_title'] as String? ?? '',
      copyBarcode: json['copy_barcode'] as String? ?? '',
      borrowedDate: json['borrowed_date'] as String? ?? '',
      dueDate: json['due_date'] as String? ?? '',
      returnedDate: json['returned_date'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      renewalsCount: json['renewals_count'] as int? ?? 0,
      isOverdue: json['is_overdue'] as bool? ?? false,
      notes: json['notes'] as String? ?? '',
    );
  }
}

class Reservation {
  final String id;
  final String book;
  final String user;
  final String userName;
  final String bookTitle;
  final String reservedDate;
  final String status;
  final String notes;

  const Reservation({
    required this.id,
    required this.book,
    required this.user,
    this.userName = '',
    this.bookTitle = '',
    required this.reservedDate,
    required this.status,
    this.notes = '',
  });

  factory Reservation.fromJson(Map<String, dynamic> json) {
    return Reservation(
      id: json['id'] as String? ?? '',
      book: json['book'] as String? ?? '',
      user: json['user'] as String? ?? '',
      userName: json['user_name'] as String? ?? '',
      bookTitle: json['book_title'] as String? ?? '',
      reservedDate: json['reserved_date'] as String? ?? '',
      status: json['status'] as String? ?? 'PENDING',
      notes: json['notes'] as String? ?? '',
    );
  }
}
