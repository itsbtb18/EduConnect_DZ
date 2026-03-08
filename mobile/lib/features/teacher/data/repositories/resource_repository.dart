import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/network/api_response.dart';
import '../models/resource_model.dart';

class ResourceRepository {
  final DioClient _dioClient;

  ResourceRepository(this._dioClient);

  Future<List<TeachingResource>> getResources({
    String? subjectId,
    String? chapter,
    int page = 1,
  }) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.resources,
        queryParameters: {
          'subject': subjectId,
          'chapter': chapter,
          'page': page,
        }..removeWhere((_, v) => v == null),
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => TeachingResource.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<TeachingResource> uploadResource({
    required String title,
    String? description,
    required String subjectId,
    String? chapter,
    required String resourceType,
    String? filePath,
    String? externalLink,
  }) async {
    try {
      final formData = FormData.fromMap({
        'title': title,
        'description': ?description,
        'subject': subjectId,
        'chapter': ?chapter,
        'resource_type': resourceType,
        'external_link': ?externalLink,
        if (filePath != null)
          'file': await MultipartFile.fromFile(
            filePath,
            filename: filePath.split('/').last,
          ),
      });

      final response = await _dioClient.dio.post(
        ApiEndpoints.resources,
        data: formData,
      );
      return TeachingResource.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<void> deleteResource(String id) async {
    try {
      await _dioClient.dio.delete('${ApiEndpoints.resources}$id/');
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }
}
