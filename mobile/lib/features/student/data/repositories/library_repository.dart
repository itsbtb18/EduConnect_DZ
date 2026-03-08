import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_response.dart';
import '../../../../core/network/dio_client.dart';
import '../models/library_model.dart';

/// Repository handling Library API calls.
class LibraryRepository {
  final DioClient _dioClient;

  LibraryRepository(this._dioClient);

  /// Fetch books catalog with optional filters.
  Future<List<Book>> getBooks({
    String? query,
    String? category,
    String? language,
    bool? available,
  }) async {
    try {
      final params = <String, dynamic>{};
      if (query != null && query.isNotEmpty) params['q'] = query;
      if (category != null) params['category'] = category;
      if (language != null) params['language'] = language;
      if (available == true) params['available'] = 'true';

      final response = await _dioClient.dio.get(
        ApiEndpoints.libraryBooks,
        queryParameters: params,
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => Book.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Fetch a single book detail.
  Future<Book> getBook(String bookId) async {
    try {
      final response = await _dioClient.dio.get(
        '${ApiEndpoints.libraryBooks}$bookId/',
      );
      return Book.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Fetch current user's loans.
  Future<List<Loan>> getMyLoans() async {
    try {
      final response = await _dioClient.dio.get(ApiEndpoints.libraryMyLoans);
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => Loan.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Fetch loans for a specific borrower (parent view).
  Future<List<Loan>> getLoansByBorrower(String borrowerId) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.libraryLoans,
        queryParameters: {'borrower': borrowerId},
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => Loan.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Create a reservation.
  Future<Reservation> createReservation({
    required String bookId,
    String? notes,
  }) async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.libraryReservations,
        data: {
          'book': bookId,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      );
      return Reservation.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Cancel a reservation.
  Future<void> cancelReservation(String reservationId) async {
    try {
      await _dioClient.dio.post(
        '${ApiEndpoints.libraryReservations}$reservationId/cancel/',
      );
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Fetch current user's reservations.
  Future<List<Reservation>> getMyReservations() async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.libraryReservations,
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => Reservation.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }
}
