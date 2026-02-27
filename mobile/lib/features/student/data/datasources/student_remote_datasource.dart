import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';

/// Remote datasource for student-facing API calls:
/// grades, homework, academic schedule, subjects, lessons, resources.
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
        if (studentId != null) 'student': studentId,
        if (subjectId != null) 'subject': subjectId,
        if (semesterId != null) 'semester': semesterId,
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
      queryParameters: {
        if (studentId != null) 'student': studentId,
        'page': page,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Homework ──────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getHomework({
    String? classroomId,
    String? subjectId,
    String? status,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.homework,
      queryParameters: {
        if (classroomId != null) 'classroom': classroomId,
        if (subjectId != null) 'subject': subjectId,
        if (status != null) 'status': status,
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
      queryParameters: {if (classroomId != null) 'classroom': classroomId},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getSchedule({String? classroomId}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.schedule,
      queryParameters: {if (classroomId != null) 'classroom': classroomId},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getLessons({String? subjectId}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.lessons,
      queryParameters: {if (subjectId != null) 'subject': subjectId},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getResources({String? lessonId}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.resources,
      queryParameters: {if (lessonId != null) 'lesson': lessonId},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getClassrooms() async {
    final response = await _dioClient.dio.get(ApiEndpoints.classrooms);
    return response.data as Map<String, dynamic>;
  }
}
