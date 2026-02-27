import 'package:dio/dio.dart';

import '../../core/constants/api_endpoints.dart';
import '../../core/network/api_response.dart';
import '../../core/network/dio_client.dart';
import '../models/finance_model.dart';

/// Repository handling all finance-related API calls.
class FinanceRepository {
  final DioClient _dioClient;

  FinanceRepository(this._dioClient);

  /// Fetch fee structures for the current school
  Future<List<FeeStructure>> getFees({String? levelId}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (levelId != null) queryParams['level'] = levelId;
      final response = await _dioClient.dio.get(
        ApiEndpoints.fees,
        queryParameters: queryParams,
      );
      final results = response.data['results'] as List<dynamic>? ?? [];
      return results
          .map((e) => FeeStructure.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Fetch payments for a student
  Future<List<Payment>> getPayments({required String studentId}) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.payments,
        queryParameters: {'student': studentId},
      );
      final results = response.data['results'] as List<dynamic>? ?? [];
      return results
          .map((e) => Payment.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Record a new payment
  Future<Payment> createPayment(Payment payment) async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.payments,
        data: payment.toJson(),
      );
      return Payment.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Fetch the financial summary for a student
  Future<FinanceSummary> getFinanceSummary(String studentId) async {
    try {
      final response = await _dioClient.dio.get(
        '${ApiEndpoints.payments}summary/',
        queryParameters: {'student': studentId},
      );
      return FinanceSummary.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Download payment receipt PDF
  Future<String> downloadReceipt(String paymentId) async {
    try {
      final response = await _dioClient.dio.get(
        '${ApiEndpoints.payments}$paymentId/receipt/',
      );
      return response.data['receipt_url'] as String? ?? '';
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }
}
