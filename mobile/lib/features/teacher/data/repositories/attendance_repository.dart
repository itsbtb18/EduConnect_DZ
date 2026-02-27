import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/network/api_response.dart';
import '../../../shared/data/models/communication_model.dart';

/// Repository for attendance records
class AttendanceRepository {
  final DioClient _dioClient;

  AttendanceRepository(this._dioClient);

  Future<List<AttendanceRecord>> getRecords({
    String? studentId,
    String? classroomId,
    String? date,
    int page = 1,
  }) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.attendance,
        queryParameters: {
          'student': ?studentId,
          'classroom': ?classroomId,
          'date': ?date,
          'page': page,
        },
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => AttendanceRecord.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Teacher: mark attendance for a class
  Future<void> markAttendance({
    required String classroomId,
    required String date,
    required List<Map<String, String>>
    records, // [{student: id, status: present/absent/late}]
  }) async {
    try {
      await _dioClient.dio.post(
        ApiEndpoints.attendance,
        data: {'classroom': classroomId, 'date': date, 'records': records},
      );
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Parent: submit absence excuse
  Future<void> submitExcuse({
    required String studentId,
    required String date,
    required String reason,
    String? attachmentPath,
  }) async {
    try {
      final formData = FormData.fromMap({
        'student': studentId,
        'date': date,
        'reason': reason,
        if (attachmentPath != null)
          'attachment': await MultipartFile.fromFile(attachmentPath),
      });

      await _dioClient.dio.post(ApiEndpoints.absenceExcuses, data: formData);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }
}
