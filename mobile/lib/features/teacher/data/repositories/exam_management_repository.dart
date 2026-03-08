import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/network/api_response.dart';
import '../models/exam_model.dart';

class ExamManagementRepository {
  final DioClient _dioClient;

  ExamManagementRepository(this._dioClient);

  Future<List<ExamConfig>> getExamTypes({
    String? classroomId,
    String? subjectId,
    int? trimester,
  }) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.examTypes,
        queryParameters: {
          'classroom': classroomId,
          'subject': subjectId,
          'trimester': trimester,
        }..removeWhere((_, v) => v == null),
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => ExamConfig.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<ExamConfig> createExamType(ExamConfig config) async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.examTypes,
        data: config.toJson(),
      );
      return ExamConfig.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<void> bulkEnterGrades({
    required String examTypeId,
    required List<Map<String, dynamic>> grades,
  }) async {
    try {
      await _dioClient.dio.post(
        ApiEndpoints.gradesBulkEnter,
        data: {'exam_type_id': examTypeId, 'grades': grades},
      );
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<void> submitGrades(String examTypeId) async {
    try {
      await _dioClient.dio.post(
        ApiEndpoints.gradesSubmit,
        data: {'exam_type_id': examTypeId},
      );
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<GradeWorkflowStatus> getWorkflowStatus(String examTypeId) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.gradesWorkflowStatus,
        queryParameters: {'exam_type_id': examTypeId},
      );
      return GradeWorkflowStatus.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<CsvPreviewResult> csvPreview(String filePath) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          filePath,
          filename: filePath.split('/').last,
        ),
      });
      final response = await _dioClient.dio.post(
        ApiEndpoints.gradesCsvPreview,
        data: formData,
      );
      return CsvPreviewResult.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<void> csvConfirm(String previewId) async {
    try {
      await _dioClient.dio.post(
        ApiEndpoints.gradesCsvConfirm,
        data: {'preview_id': previewId},
      );
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<Map<String, dynamic>>> getGradesList({
    String? classroomId,
    String? examTypeId,
    int? trimester,
  }) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.gradesList,
        queryParameters: {
          'classroom_id': classroomId,
          'exam_type_id': examTypeId,
          'trimester': trimester,
        }..removeWhere((_, v) => v == null),
      );
      return List<Map<String, dynamic>>.from(response.data['results'] ?? []);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }
}
