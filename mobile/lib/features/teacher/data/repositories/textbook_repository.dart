import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/network/api_response.dart';
import '../models/textbook_model.dart';

/// Repository for the electronic textbook (Cahier de Texte)
class TextbookRepository {
  final DioClient _dioClient;

  TextbookRepository(this._dioClient);

  Future<List<Lesson>> getLessons({
    String? classroomId,
    String? subjectId,
    int page = 1,
  }) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.lessons,
        queryParameters: {
          'classroom': classroomId,
          'subject': subjectId,
          'page': page,
        }..removeWhere((_, v) => v == null),
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

  Future<Lesson> createLesson(Map<String, dynamic> data) async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.lessons,
        data: data,
      );
      return Lesson.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<Lesson> updateLesson(String id, Map<String, dynamic> data) async {
    try {
      final response = await _dioClient.dio.patch(
        '${ApiEndpoints.lessons}$id/',
        data: data,
      );
      return Lesson.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<void> deleteLesson(String id) async {
    try {
      await _dioClient.dio.delete('${ApiEndpoints.lessons}$id/');
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }
}
