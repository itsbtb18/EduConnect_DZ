import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/network/api_response.dart';
import '../models/chat_room_model.dart';

class ChatRoomRepository {
  final DioClient _dioClient;

  ChatRoomRepository(this._dioClient);

  Future<List<ChatRoom>> getRooms() async {
    try {
      final response = await _dioClient.dio.get(ApiEndpoints.chatRooms);
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => ChatRoom.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<ChatRoom> createRoom({
    required String name,
    required String roomType,
    String? classroomId,
  }) async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.chatRooms,
        data: {'name': name, 'room_type': roomType, 'classroom': ?classroomId},
      );
      return ChatRoom.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<RoomMessage>> getRoomMessages(
    String roomId, {
    int page = 1,
  }) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.chatRoomMessages(roomId),
        queryParameters: {'page': page},
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => RoomMessage.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<RoomMessage> sendRoomMessage(String roomId, String content) async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.chatRoomMessages(roomId),
        data: {'content': content},
      );
      return RoomMessage.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<Map<String, List<ChatContact>>> getContacts() async {
    try {
      final response = await _dioClient.dio.get(ApiEndpoints.chatContacts);
      final data = response.data as Map<String, dynamic>;
      return data.map(
        (key, value) => MapEntry(
          key,
          (value as List).map((e) => ChatContact.fromJson(e)).toList(),
        ),
      );
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }
}
