import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/library_model.dart';
import '../../data/repositories/library_repository.dart';

// ── Events ──────────────────────────────────────────────────────────────────

abstract class LibraryEvent extends Equatable {
  const LibraryEvent();
  @override
  List<Object?> get props => [];
}

class LoadBooks extends LibraryEvent {
  final String? query;
  final String? category;
  final String? language;
  const LoadBooks({this.query, this.category, this.language});
  @override
  List<Object?> get props => [query, category, language];
}

class LoadBookDetail extends LibraryEvent {
  final String bookId;
  const LoadBookDetail({required this.bookId});
  @override
  List<Object?> get props => [bookId];
}

class LoadMyLoans extends LibraryEvent {
  const LoadMyLoans();
}

class LoadChildLoans extends LibraryEvent {
  final String childId;
  const LoadChildLoans({required this.childId});
  @override
  List<Object?> get props => [childId];
}

class LoadMyReservations extends LibraryEvent {
  const LoadMyReservations();
}

class CreateReservation extends LibraryEvent {
  final String bookId;
  final String? notes;
  const CreateReservation({required this.bookId, this.notes});
  @override
  List<Object?> get props => [bookId, notes];
}

class CancelReservation extends LibraryEvent {
  final String reservationId;
  const CancelReservation({required this.reservationId});
  @override
  List<Object?> get props => [reservationId];
}

// ── States ──────────────────────────────────────────────────────────────────

abstract class LibraryState extends Equatable {
  const LibraryState();
  @override
  List<Object?> get props => [];
}

class LibraryInitial extends LibraryState {}

class LibraryLoading extends LibraryState {}

class BooksLoaded extends LibraryState {
  final List<Book> books;
  const BooksLoaded(this.books);
  @override
  List<Object?> get props => [books];
}

class BookDetailLoaded extends LibraryState {
  final Book book;
  const BookDetailLoaded(this.book);
  @override
  List<Object?> get props => [book];
}

class LoansLoaded extends LibraryState {
  final List<Loan> loans;
  const LoansLoaded(this.loans);
  @override
  List<Object?> get props => [loans];
}

class ReservationsLoaded extends LibraryState {
  final List<Reservation> reservations;
  const ReservationsLoaded(this.reservations);
  @override
  List<Object?> get props => [reservations];
}

class ReservationCreated extends LibraryState {}

class ReservationCancelled extends LibraryState {}

class LibraryError extends LibraryState {
  final String message;
  const LibraryError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── BLoC ────────────────────────────────────────────────────────────────────

class LibraryBloc extends Bloc<LibraryEvent, LibraryState> {
  final LibraryRepository _repo = getIt<LibraryRepository>();

  LibraryBloc() : super(LibraryInitial()) {
    on<LoadBooks>(_onLoadBooks);
    on<LoadBookDetail>(_onLoadBookDetail);
    on<LoadMyLoans>(_onLoadMyLoans);
    on<LoadChildLoans>(_onLoadChildLoans);
    on<LoadMyReservations>(_onLoadMyReservations);
    on<CreateReservation>(_onCreateReservation);
    on<CancelReservation>(_onCancelReservation);
  }

  Future<void> _onLoadBooks(
    LoadBooks event,
    Emitter<LibraryState> emit,
  ) async {
    emit(LibraryLoading());
    try {
      final books = await _repo.getBooks(
        query: event.query,
        category: event.category,
        language: event.language,
      );
      emit(BooksLoaded(books));
    } catch (e) {
      emit(LibraryError(e.toString()));
    }
  }

  Future<void> _onLoadBookDetail(
    LoadBookDetail event,
    Emitter<LibraryState> emit,
  ) async {
    emit(LibraryLoading());
    try {
      final book = await _repo.getBook(event.bookId);
      emit(BookDetailLoaded(book));
    } catch (e) {
      emit(LibraryError(e.toString()));
    }
  }

  Future<void> _onLoadMyLoans(
    LoadMyLoans event,
    Emitter<LibraryState> emit,
  ) async {
    emit(LibraryLoading());
    try {
      final loans = await _repo.getMyLoans();
      emit(LoansLoaded(loans));
    } catch (e) {
      emit(LibraryError(e.toString()));
    }
  }

  Future<void> _onLoadChildLoans(
    LoadChildLoans event,
    Emitter<LibraryState> emit,
  ) async {
    emit(LibraryLoading());
    try {
      final loans = await _repo.getLoansByBorrower(event.childId);
      emit(LoansLoaded(loans));
    } catch (e) {
      emit(LibraryError(e.toString()));
    }
  }

  Future<void> _onLoadMyReservations(
    LoadMyReservations event,
    Emitter<LibraryState> emit,
  ) async {
    emit(LibraryLoading());
    try {
      final reservations = await _repo.getMyReservations();
      emit(ReservationsLoaded(reservations));
    } catch (e) {
      emit(LibraryError(e.toString()));
    }
  }

  Future<void> _onCreateReservation(
    CreateReservation event,
    Emitter<LibraryState> emit,
  ) async {
    emit(LibraryLoading());
    try {
      await _repo.createReservation(bookId: event.bookId, notes: event.notes);
      emit(ReservationCreated());
    } catch (e) {
      emit(LibraryError(e.toString()));
    }
  }

  Future<void> _onCancelReservation(
    CancelReservation event,
    Emitter<LibraryState> emit,
  ) async {
    emit(LibraryLoading());
    try {
      await _repo.cancelReservation(event.reservationId);
      emit(ReservationCancelled());
    } catch (e) {
      emit(LibraryError(e.toString()));
    }
  }
}
