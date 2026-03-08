import 'package:dio/dio.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/network/api_response.dart';
import '../models/communication_model.dart';

/// Repository for chat conversations and messages (REST + WebSocket)
class ChatRepository {
  final DioClient _dioClient;
  WebSocketChannel? _wsChannel;

  ChatRepository(this._dioClient);

  Future<List<Conversation>> getConversations({int page = 1}) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.conversations,
        queryParameters: {'page': page},
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => Conversation.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<Message>> getMessages({
    required String conversationId,
    int page = 1,
  }) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.messages,
        queryParameters: {'conversation': conversationId, 'page': page},
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => Message.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Connect to WebSocket for real-time messaging
  Stream<dynamic> connectToChat(String conversationId, String accessToken) {
    final uri = Uri.parse(
      '${AppConstants.wsBaseUrl}/chat/$conversationId/?token=$accessToken',
    );
    _wsChannel = WebSocketChannel.connect(uri);
    return _wsChannel!.stream;
  }

  /// Send a message through WebSocket
  void sendMessage(String content) {
    _wsChannel?.sink.add('{"message": "$content"}');
  }

  /// Send mark-read through WebSocket
  void sendMarkRead() {
    _wsChannel?.sink.add('{"type": "mark_read"}');
  }

  /// Upload a file attachment to a conversation via REST
  Future<Message> uploadAttachment({
    required String conversationId,
    required String filePath,
    required String fileName,
    String? content,
  }) async {
    try {
      final formData = FormData.fromMap({
        'conversation': conversationId,
        'content': content ?? '',
        'attachment': await MultipartFile.fromFile(
          filePath,
          filename: fileName,
        ),
      });
      final response = await _dioClient.dio.post(
        '${ApiEndpoints.conversations}$conversationId/upload/',
        data: formData,
      );
      return Message.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Disconnect WebSocket
  void disconnect() {
    _wsChannel?.sink.close();
    _wsChannel = null;
  }
}
