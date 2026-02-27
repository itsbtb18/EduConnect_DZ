import 'package:dio/dio.dart';

import '../../core/constants/api_endpoints.dart';
import '../../core/network/api_response.dart';
import '../../core/network/dio_client.dart';
import '../models/announcement_model.dart';

/// Repository handling announcement and event API calls.
class AnnouncementRepository {
  final DioClient _dioClient;

  AnnouncementRepository(this._dioClient);

  /// Fetch paginated list of announcements
  Future<List<Announcement>> getAnnouncements({
    int page = 1,
    String? targetAudience,
  }) async {
    try {
      final queryParams = <String, dynamic>{'page': page};
      if (targetAudience != null) {
        queryParams['target_audience'] = targetAudience;
      }
      final response = await _dioClient.dio.get(
        ApiEndpoints.announcements,
        queryParameters: queryParams,
      );
      final results = response.data['results'] as List<dynamic>? ?? [];
      return results
          .map((e) => Announcement.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Fetch a single announcement by ID
  Future<Announcement> getAnnouncementDetail(String id) async {
    try {
      final response = await _dioClient.dio.get(
        '${ApiEndpoints.announcements}$id/',
      );
      return Announcement.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Create a new announcement (admin/teacher only)
  Future<Announcement> createAnnouncement(Announcement announcement) async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.announcements,
        data: announcement.toJson(),
      );
      return Announcement.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Fetch list of school events
  Future<List<SchoolEvent>> getEvents({int page = 1}) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.events,
        queryParameters: {'page': page},
      );
      final results = response.data['results'] as List<dynamic>? ?? [];
      return results
          .map((e) => SchoolEvent.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }
}
