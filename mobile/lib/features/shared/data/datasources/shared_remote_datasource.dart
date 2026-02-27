import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/dio_client.dart';

/// Raw network calls for shared / cross-role endpoints:
/// announcements, events, chat, notifications, AI chatbot.
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
      queryParameters: {'page': page, 'target_audience': ?targetAudience},
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

  String chatWebSocketUrl(String conversationId, String accessToken) =>
      '${AppConstants.wsBaseUrl}/chat/$conversationId/?token=$accessToken';

  // ── Notifications ─────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getNotifications({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.notifications,
      queryParameters: {'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> markAsRead(String notificationId) async {
    await _dioClient.dio.post(
      '${ApiEndpoints.notifications}$notificationId/mark_read/',
    );
  }

  Future<void> markAllAsRead() async {
    await _dioClient.dio.post('${ApiEndpoints.notifications}mark_all_read/');
  }

  Future<int> getUnreadCount() async {
    final response = await _dioClient.dio.get(
      '${ApiEndpoints.notifications}unread_count/',
    );
    return response.data['count'] as int? ?? 0;
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
