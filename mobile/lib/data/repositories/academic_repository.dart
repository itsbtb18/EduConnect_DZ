import 'package:dio/dio.dart';

import '../../core/constants/api_endpoints.dart';
import '../../core/network/dio_client.dart';
import '../../core/network/api_response.dart';
import '../models/academic_model.dart';

/// Repository for academics-related API calls (schedule, subjects, lessons)
class AcademicRepository {
  final DioClient _dioClient;

  AcademicRepository(this._dioClient);

  Future<List<Subject>> getSubjects({String? classroomId}) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.subjects,
        queryParameters: {'classroom': ?classroomId},
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => Subject.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<ScheduleSlot>> getSchedule({String? classroomId}) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.schedule,
        queryParameters: {'classroom': ?classroomId},
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => ScheduleSlot.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<Lesson>> getLessons({String? subjectId}) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.lessons,
        queryParameters: {'subject': ?subjectId},
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => Lesson.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<Resource>> getResources({String? lessonId}) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.resources,
        queryParameters: {'lesson': ?lessonId},
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => Resource.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<Classroom>> getClassrooms() async {
    try {
      final response = await _dioClient.dio.get(ApiEndpoints.classrooms);
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => Classroom.fromJson(json),
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
