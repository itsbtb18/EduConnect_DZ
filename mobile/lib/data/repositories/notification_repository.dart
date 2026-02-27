import 'package:dio/dio.dart';

import '../../core/constants/api_endpoints.dart';
import '../../core/network/dio_client.dart';
import '../../core/network/api_response.dart';
import '../models/communication_model.dart';

/// Repository for notifications
class NotificationRepository {
  final DioClient _dioClient;

  NotificationRepository(this._dioClient);

  Future<List<AppNotification>> getNotifications({int page = 1}) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.notifications,
        queryParameters: {'page': page},
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => AppNotification.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<void> markAsRead(String notificationId) async {
    try {
      await _dioClient.dio.post(
        '${ApiEndpoints.notifications}$notificationId/mark_read/',
      );
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _dioClient.dio.post('${ApiEndpoints.notifications}mark_all_read/');
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<int> getUnreadCount() async {
    try {
      final response = await _dioClient.dio.get(
        '${ApiEndpoints.notifications}unread_count/',
      );
      return response.data['count'] as int? ?? 0;
    } catch (_) {
      return 0;
    }
  }
}
