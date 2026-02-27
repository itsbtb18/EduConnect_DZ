import 'package:dio/dio.dart';

import '../../core/constants/api_endpoints.dart';
import '../../core/network/dio_client.dart';
import '../../core/network/api_response.dart';
import '../models/grade_model.dart';

/// Repository for grades and report cards
class GradeRepository {
  final DioClient _dioClient;

  GradeRepository(this._dioClient);

  Future<List<Grade>> getGrades({
    String? studentId,
    String? subjectId,
    String? semesterId,
    int page = 1,
  }) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.grades,
        queryParameters: {
          'student': ?studentId,
          'subject': ?subjectId,
          'semester': ?semesterId,
          'page': page,
        },
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => Grade.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Teacher: submit a grade
  Future<Grade> createGrade({
    required String studentId,
    required String subjectId,
    required String examTypeId,
    required double score,
    String? remark,
  }) async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.grades,
        data: {
          'student': studentId,
          'subject': subjectId,
          'exam_type': examTypeId,
          'score': score,
          'remark': remark,
        },
      );
      return Grade.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<ReportCard>> getReportCards({String? studentId}) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.reportCards,
        queryParameters: {'student': ?studentId},
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => ReportCard.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<ExamType>> getExamTypes() async {
    try {
      final response = await _dioClient.dio.get(ApiEndpoints.examTypes);
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => ExamType.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }
}
