import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';

/// Raw network calls for student-facing endpoints:
/// grades, homework, schedule, subjects, lessons, resources.
class StudentRemoteDatasource {
  final DioClient _dioClient;

  StudentRemoteDatasource(this._dioClient);

  // ── Grades ────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getGrades({
    String? studentId,
    String? subjectId,
    String? semesterId,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.grades,
      queryParameters: {
        'student': ?studentId,
        'subject': ?subjectId,
        'semester': ?semesterId,
        'page': page,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getReportCards({
    String? studentId,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.reportCards,
      queryParameters: {'student': ?studentId, 'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Homework ──────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getHomework({
    String? classroomId,
    String? subjectId,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.homework,
      queryParameters: {
        'classroom': ?classroomId,
        'subject': ?subjectId,
        'page': page,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> submitHomework({
    required String homeworkId,
    required FormData formData,
  }) async {
    await _dioClient.dio.post(ApiEndpoints.submissions, data: formData);
  }

  // ── Schedule / Subjects / Lessons / Resources ─────────────────────────────

  Future<Map<String, dynamic>> getSubjects({String? classroomId}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.subjects,
      queryParameters: {'classroom': ?classroomId},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getSchedule({String? classroomId}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.schedule,
      queryParameters: {'classroom': ?classroomId},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getLessons({String? subjectId}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.lessons,
      queryParameters: {'subject': ?subjectId},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getResources({String? lessonId}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.resources,
      queryParameters: {'lesson': ?lessonId},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getClassrooms() async {
    final response = await _dioClient.dio.get(ApiEndpoints.classrooms);
    return response.data as Map<String, dynamic>;
  }
}
