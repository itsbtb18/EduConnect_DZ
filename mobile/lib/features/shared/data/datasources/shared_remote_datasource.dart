import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';

/// Remote datasource for shared/cross-role API calls:
/// announcements, events, chat conversations, notifications.
class SharedRemoteDatasource {
  final DioClient _dioClient;

  SharedRemoteDatasource(this._dioClient);

  // ── Announcements ─────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getAnnouncements({
    int page = 1,
    String? targetAudience,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.announcements,
      queryParameters: {
        'page': page,
        if (targetAudience != null) 'target_audience': targetAudience,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getAnnouncementDetail(String id) async {
    final response = await _dioClient.dio.get(
      '${ApiEndpoints.announcements}$id/',
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createAnnouncement(
    Map<String, dynamic> data,
  ) async {
    final response = await _dioClient.dio.post(
      ApiEndpoints.announcements,
      data: data,
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Events ────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getEvents({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.events,
      queryParameters: {'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Chat ──────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getConversations({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.conversations,
      queryParameters: {'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getMessages({
    required String conversationId,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.messages,
      queryParameters: {'conversation': conversationId, 'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> sendMessage({
    required String conversationId,
    required String content,
  }) async {
    final response = await _dioClient.dio.post(
      ApiEndpoints.messages,
      data: {'conversation': conversationId, 'content': content},
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getNotifications({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.notifications,
      queryParameters: {'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> markNotificationRead(String id) async {
    await _dioClient.dio.patch(
      '${ApiEndpoints.notifications}$id/',
      data: {'is_read': true},
    );
  }

  Future<void> markAllNotificationsRead() async {
    await _dioClient.dio.post('${ApiEndpoints.notifications}mark-all-read/');
  }

  // ── AI Chatbot ────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> queryChatbot(String message) async {
    final response = await _dioClient.dio.post(
      ApiEndpoints.chatbot,
      data: {'message': message},
    );
    return response.data as Map<String, dynamic>;
  }
}
