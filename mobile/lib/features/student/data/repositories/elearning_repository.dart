import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_response.dart';
import '../../../../core/network/dio_client.dart';
import '../models/elearning_model.dart';

class ElearningRepository {
  final DioClient _dioClient;
  ElearningRepository(this._dioClient);

  // ── Resources ──────────────────────────────────────────────────────

  Future<List<DigitalResource>> getResources({
    String? query,
    String? type,
    String? subject,
    String? level,
    String? chapter,
  }) async {
    try {
      final params = <String, dynamic>{};
      if (query != null && query.isNotEmpty) params['q'] = query;
      if (type != null) params['type'] = type;
      if (subject != null) params['subject'] = subject;
      if (level != null) params['level'] = level;
      if (chapter != null) params['chapter'] = chapter;

      final response = await _dioClient.dio.get(
        ApiEndpoints.elearningResources,
        queryParameters: params,
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => DigitalResource.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<DigitalResource> getResource(String id) async {
    try {
      final response = await _dioClient.dio.get(
        '${ApiEndpoints.elearningResources}$id/',
      );
      return DigitalResource.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<void> toggleFavourite(String id) async {
    try {
      await _dioClient.dio.post(
        '${ApiEndpoints.elearningResources}$id/favourite/',
      );
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<void> trackDownload(String id) async {
    try {
      await _dioClient.dio.post(
        '${ApiEndpoints.elearningResources}$id/download/',
      );
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  // ── Exam Bank ──────────────────────────────────────────────────────

  Future<List<ExamBankItem>> getExams({
    String? query,
    String? type,
    String? subject,
    String? level,
    int? year,
  }) async {
    try {
      final params = <String, dynamic>{};
      if (query != null && query.isNotEmpty) params['q'] = query;
      if (type != null) params['type'] = type;
      if (subject != null) params['subject'] = subject;
      if (level != null) params['level'] = level;
      if (year != null) params['year'] = year;

      final response = await _dioClient.dio.get(
        ApiEndpoints.elearningExams,
        queryParameters: params,
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => ExamBankItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<void> trackExamDownload(String id) async {
    try {
      await _dioClient.dio.post('${ApiEndpoints.elearningExams}$id/download/');
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  // ── Quizzes ────────────────────────────────────────────────────────

  Future<List<Quiz>> getQuizzes() async {
    try {
      final response = await _dioClient.dio.get(ApiEndpoints.elearningQuizzes);
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => Quiz.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<Quiz> getQuiz(String id) async {
    try {
      final response = await _dioClient.dio.get(
        '${ApiEndpoints.elearningQuizzes}$id/',
      );
      return Quiz.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<QuizAttempt> submitQuiz(
    String quizId,
    Map<String, dynamic> answers,
  ) async {
    try {
      final response = await _dioClient.dio.post(
        '${ApiEndpoints.elearningQuizzes}$quizId/submit/',
        data: {'answers': answers},
      );
      return QuizAttempt.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<QuizAttempt>> getMyAttempts() async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.elearningMyAttempts,
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => QuizAttempt.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  // ── Progress ───────────────────────────────────────────────────────

  Future<List<StudentProgress>> getProgress({String? studentId}) async {
    try {
      final params = <String, dynamic>{};
      if (studentId != null) params['student_id'] = studentId;

      final response = await _dioClient.dio.get(
        ApiEndpoints.elearningProgress,
        queryParameters: params,
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => StudentProgress.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }
}
