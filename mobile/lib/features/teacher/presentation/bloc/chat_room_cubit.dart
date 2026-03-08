import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/chat_room_model.dart';
import '../../data/repositories/chat_room_repository.dart';

// ── States ──────────────────────────────────────────────────────────────────

abstract class ChatRoomState extends Equatable {
  const ChatRoomState();
  @override
  List<Object?> get props => [];
}

class ChatRoomInitial extends ChatRoomState {}

class ChatRoomLoading extends ChatRoomState {}

class ChatRoomListLoaded extends ChatRoomState {
  final List<ChatRoom> rooms;
  const ChatRoomListLoaded(this.rooms);
  @override
  List<Object?> get props => [rooms];
}

class ChatRoomMessagesLoaded extends ChatRoomState {
  final List<RoomMessage> messages;
  final ChatRoom room;
  const ChatRoomMessagesLoaded(this.messages, this.room);
  @override
  List<Object?> get props => [messages, room];
}

class ChatContactsLoaded extends ChatRoomState {
  final Map<String, List<ChatContact>> contacts;
  const ChatContactsLoaded(this.contacts);
  @override
  List<Object?> get props => [contacts];
}

class ChatRoomError extends ChatRoomState {
  final String message;
  const ChatRoomError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── Cubit ───────────────────────────────────────────────────────────────────

class ChatRoomCubit extends Cubit<ChatRoomState> {
  final ChatRoomRepository _repo = getIt<ChatRoomRepository>();

  ChatRoomCubit() : super(ChatRoomInitial());

  Future<void> loadRooms() async {
    emit(ChatRoomLoading());
    try {
      final rooms = await _repo.getRooms();
      emit(ChatRoomListLoaded(rooms));
    } catch (e) {
      emit(ChatRoomError(e.toString()));
    }
  }

  Future<void> loadMessages(ChatRoom room) async {
    emit(ChatRoomLoading());
    try {
      final messages = await _repo.getRoomMessages(room.id);
      emit(ChatRoomMessagesLoaded(messages, room));
    } catch (e) {
      emit(ChatRoomError(e.toString()));
    }
  }

  Future<void> sendMessage(ChatRoom room, String content) async {
    try {
      await _repo.sendRoomMessage(room.id, content);
      // Reload messages
      final messages = await _repo.getRoomMessages(room.id);
      emit(ChatRoomMessagesLoaded(messages, room));
    } catch (e) {
      emit(ChatRoomError(e.toString()));
    }
  }

  Future<void> createRoom({
    required String name,
    required String roomType,
    String? classroomId,
  }) async {
    emit(ChatRoomLoading());
    try {
      await _repo.createRoom(
        name: name,
        roomType: roomType,
        classroomId: classroomId,
      );
      // Reload rooms
      final rooms = await _repo.getRooms();
      emit(ChatRoomListLoaded(rooms));
    } catch (e) {
      emit(ChatRoomError(e.toString()));
    }
  }

  Future<void> loadContacts() async {
    emit(ChatRoomLoading());
    try {
      final contacts = await _repo.getContacts();
      emit(ChatContactsLoaded(contacts));
    } catch (e) {
      emit(ChatRoomError(e.toString()));
    }
  }
}
