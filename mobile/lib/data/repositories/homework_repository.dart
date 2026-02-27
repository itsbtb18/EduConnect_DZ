import 'package:dio/dio.dart';

import '../../core/constants/api_endpoints.dart';
import '../../core/network/dio_client.dart';
import '../../core/network/api_response.dart';
import '../models/homework_model.dart';

/// Repository for homework tasks and submissions
class HomeworkRepository {
  final DioClient _dioClient;

  HomeworkRepository(this._dioClient);

  Future<List<HomeworkTask>> getTasks({
    String? classroomId,
    String? subjectId,
    int page = 1,
  }) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.homework,
        queryParameters: {
          'classroom': ?classroomId,
          'subject': ?subjectId,
          'page': page,
        },
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => HomeworkTask.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Teacher: create a homework task
  Future<HomeworkTask> createTask({
    required String title,
    String? description,
    required String subjectId,
    required String classroomId,
    required DateTime dueDate,
    String? attachmentPath,
  }) async {
    try {
      final formData = FormData.fromMap({
        'title': title,
        'description': description,
        'subject': subjectId,
        'classroom': classroomId,
        'due_date': dueDate.toIso8601String(),
        if (attachmentPath != null)
          'attachment': await MultipartFile.fromFile(attachmentPath),
      });

      final response = await _dioClient.dio.post(
        ApiEndpoints.homework,
        data: formData,
      );
      return HomeworkTask.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Student: submit homework
  Future<HomeworkSubmission> submitHomework({
    required String taskId,
    String? content,
    String? filePath,
  }) async {
    try {
      final formData = FormData.fromMap({
        'task': taskId,
        'content': ?content,
        if (filePath != null) 'file': await MultipartFile.fromFile(filePath),
      });

      final response = await _dioClient.dio.post(
        ApiEndpoints.submissions,
        data: formData,
      );
      return HomeworkSubmission.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Get submissions for a task (teacher) or student's own submissions
  Future<List<HomeworkSubmission>> getSubmissions({
    String? taskId,
    int page = 1,
  }) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.submissions,
        queryParameters: {'task': ?taskId, 'page': page},
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => HomeworkSubmission.fromJson(json),
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
