import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/network/sync_queue_service.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../data/models/communication_model.dart';
import '../../data/repositories/chat_repository.dart';

// ── Events ──────────────────────────────────────────────────────────────────

abstract class ChatEvent extends Equatable {
  const ChatEvent();
  @override
  List<Object?> get props => [];
}

class ChatLoadConversations extends ChatEvent {}

class ChatSelectConversation extends ChatEvent {
  final String conversationId;
  const ChatSelectConversation(this.conversationId);
  @override
  List<Object?> get props => [conversationId];
}

class ChatSendMessage extends ChatEvent {
  final String content;
  const ChatSendMessage(this.content);
  @override
  List<Object?> get props => [content];
}

class ChatSendAttachment extends ChatEvent {
  final String filePath;
  final String fileName;
  final String? content;
  const ChatSendAttachment({
    required this.filePath,
    required this.fileName,
    this.content,
  });
  @override
  List<Object?> get props => [filePath, fileName, content];
}

class ChatMessageReceived extends ChatEvent {
  final Message message;
  const ChatMessageReceived(this.message);
  @override
  List<Object?> get props => [message];
}

class ChatDisconnect extends ChatEvent {}

// ── States ──────────────────────────────────────────────────────────────────

abstract class ChatState extends Equatable {
  const ChatState();
  @override
  List<Object?> get props => [];
}

class ChatInitial extends ChatState {}

class ChatLoading extends ChatState {}

class ChatConversationsLoaded extends ChatState {
  final List<Conversation> conversations;
  const ChatConversationsLoaded(this.conversations);
  @override
  List<Object?> get props => [conversations];
}

class ChatMessagesLoaded extends ChatState {
  final String conversationId;
  final List<Message> messages;
  final List<Conversation> conversations;
  const ChatMessagesLoaded({
    required this.conversationId,
    required this.messages,
    required this.conversations,
  });
  @override
  List<Object?> get props => [conversationId, messages, conversations];
}

class ChatError extends ChatState {
  final String message;
  const ChatError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── BLoC ────────────────────────────────────────────────────────────────────

class ChatBloc extends Bloc<ChatEvent, ChatState> {
  final ChatRepository _chatRepo = getIt<ChatRepository>();
  final SecureStorageService _storage = getIt<SecureStorageService>();
  final SyncQueueService _syncQueue = getIt<SyncQueueService>();
  List<Conversation> _conversations = [];

  ChatBloc() : super(ChatInitial()) {
    on<ChatLoadConversations>(_onLoadConversations);
    on<ChatSelectConversation>(_onSelectConversation);
    on<ChatSendMessage>(_onSendMessage);
    on<ChatSendAttachment>(_onSendAttachment);
    on<ChatMessageReceived>(_onMessageReceived);
    on<ChatDisconnect>(_onDisconnect);
  }

  Future<void> _onLoadConversations(
    ChatLoadConversations event,
    Emitter<ChatState> emit,
  ) async {
    emit(ChatLoading());
    try {
      _conversations = await _chatRepo.getConversations();
      emit(ChatConversationsLoaded(_conversations));
    } catch (e) {
      emit(ChatError(e.toString()));
    }
  }

  Future<void> _onSelectConversation(
    ChatSelectConversation event,
    Emitter<ChatState> emit,
  ) async {
    emit(ChatLoading());
    try {
      final messages = await _chatRepo.getMessages(
        conversationId: event.conversationId,
      );

      // Connect WebSocket
      final token = await _storage.getAccessToken();
      if (token != null) {
        final stream = _chatRepo.connectToChat(event.conversationId, token);
        stream.listen((data) {
          try {
            final json = jsonDecode(data as String) as Map<String, dynamic>;
            if (json.containsKey('message')) {
              final msg = Message.fromJson(
                json['message'] as Map<String, dynamic>,
              );
              add(ChatMessageReceived(msg));
            }
          } catch (_) {}
        });
      }

      emit(
        ChatMessagesLoaded(
          conversationId: event.conversationId,
          messages: messages,
          conversations: _conversations,
        ),
      );
    } catch (e) {
      emit(ChatError(e.toString()));
    }
  }

  Future<void> _onSendMessage(
    ChatSendMessage event,
    Emitter<ChatState> emit,
  ) async {
    final result = await Connectivity().checkConnectivity();
    final offline = result.contains(ConnectivityResult.none);

    if (offline) {
      // Queue message for later sync.
      final currentState = state;
      String? conversationId;
      if (currentState is ChatMessagesLoaded) {
        conversationId = currentState.conversationId;
      }
      await _syncQueue.enqueue(
        method: 'POST',
        path: '/chat/messages/',
        body: {'conversation': conversationId, 'content': event.content},
        label: 'Message chat',
      );

      // Optimistic local insert so the user sees the message immediately.
      if (currentState is ChatMessagesLoaded) {
        final optimistic = Message(
          id: 'pending_${DateTime.now().millisecondsSinceEpoch}',
          conversationId: currentState.conversationId,
          content: event.content,
          senderName: 'Moi',
          senderId: '',
          createdAt: DateTime.now(),
          isRead: true,
        );
        emit(
          ChatMessagesLoaded(
            conversationId: currentState.conversationId,
            messages: [...currentState.messages, optimistic],
            conversations: _conversations,
          ),
        );
      }
      return;
    }

    _chatRepo.sendMessage(event.content);
  }

  Future<void> _onSendAttachment(
    ChatSendAttachment event,
    Emitter<ChatState> emit,
  ) async {
    final currentState = state;
    if (currentState is! ChatMessagesLoaded) return;

    try {
      final msg = await _chatRepo.uploadAttachment(
        conversationId: currentState.conversationId,
        filePath: event.filePath,
        fileName: event.fileName,
        content: event.content,
      );
      emit(
        ChatMessagesLoaded(
          conversationId: currentState.conversationId,
          messages: [...currentState.messages, msg],
          conversations: _conversations,
        ),
      );
    } catch (_) {
      // Silently fail, message won't appear
    }
  }

  void _onMessageReceived(ChatMessageReceived event, Emitter<ChatState> emit) {
    final currentState = state;
    if (currentState is ChatMessagesLoaded) {
      final updatedMessages = [...currentState.messages, event.message];
      emit(
        ChatMessagesLoaded(
          conversationId: currentState.conversationId,
          messages: updatedMessages,
          conversations: _conversations,
        ),
      );
    }
  }

  void _onDisconnect(ChatDisconnect event, Emitter<ChatState> emit) {
    _chatRepo.disconnect();
  }

  @override
  Future<void> close() {
    _chatRepo.disconnect();
    return super.close();
  }
}
