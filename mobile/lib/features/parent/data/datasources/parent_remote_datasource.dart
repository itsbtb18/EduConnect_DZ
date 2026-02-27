import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';

/// Remote datasource for parent-facing API calls:
/// child grades, attendance, finance/payments, absence excuses.
class ParentRemoteDatasource {
  final DioClient _dioClient;

  ParentRemoteDatasource(this._dioClient);

  // ── Child grades ──────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getChildGrades({
    required String studentId,
    String? semesterId,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.grades,
      queryParameters: {
        'student': studentId,
        if (semesterId != null) 'semester': semesterId,
        'page': page,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getChildReportCards({
    required String studentId,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.reportCards,
      queryParameters: {'student': studentId},
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Child attendance ──────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getChildAttendance({
    required String studentId,
    String? month,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.attendance,
      queryParameters: {
        'student': studentId,
        if (month != null) 'month': month,
        'page': page,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Absence excuses ──────────────────────────────────────────────────────

  Future<void> submitAbsenceExcuse({
    required String studentId,
    required String date,
    required String reason,
    String? attachmentPath,
  }) async {
    final formData = FormData.fromMap({
      'student': studentId,
      'date': date,
      'reason': reason,
      if (attachmentPath != null)
        'attachment': await MultipartFile.fromFile(attachmentPath),
    });
    await _dioClient.dio.post(ApiEndpoints.absenceExcuses, data: formData);
  }

  // ── Finance / Payments ────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getFeeStructures({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.feeStructures,
      queryParameters: {'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getPayments({
    String? studentId,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.payments,
      queryParameters: {
        if (studentId != null) 'student': studentId,
        'page': page,
      },
    );
    return response.data as Map<String, dynamic>;
  }
}
