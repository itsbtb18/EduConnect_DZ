import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/constants/api_endpoints.dart';

// ── States ──────────────────────────────────────────────────────────────────

abstract class ChatbotState extends Equatable {
  List<ChatbotMessage> get messages;
  const ChatbotState();
  @override
  List<Object?> get props => [messages];
}

class ChatbotReady extends ChatbotState {
  @override
  final List<ChatbotMessage> messages;
  const ChatbotReady(this.messages);
  @override
  List<Object?> get props => [messages];
}

class ChatbotThinking extends ChatbotState {
  @override
  final List<ChatbotMessage> messages;
  const ChatbotThinking(this.messages);
  @override
  List<Object?> get props => [messages];
}

class ChatbotError extends ChatbotState {
  final String error;
  @override
  final List<ChatbotMessage> messages;
  const ChatbotError(this.error, this.messages);
  @override
  List<Object?> get props => [error, messages];
}

class ChatbotMessage {
  final String text;
  final bool isBot;
  ChatbotMessage({required this.text, required this.isBot});
}

// ── Cubit ───────────────────────────────────────────────────────────────────

class ChatbotCubit extends Cubit<ChatbotState> {
  final DioClient _dioClient = getIt<DioClient>();

  ChatbotCubit()
    : super(
        ChatbotReady([
          ChatbotMessage(
            text:
                'Bonjour! Je suis EduBot, ton assistant éducatif.\n'
                'Pose-moi des questions sur tes cours et je t\'aiderai!',
            isBot: true,
          ),
        ]),
      );

  List<ChatbotMessage> get _currentMessages {
    final s = state;
    if (s is ChatbotReady) return s.messages;
    if (s is ChatbotThinking) return s.messages;
    if (s is ChatbotError) return s.messages;
    return [];
  }

  Future<void> sendMessage(String text) async {
    final userMsg = ChatbotMessage(text: text, isBot: false);
    final updated = [..._currentMessages, userMsg];
    emit(ChatbotThinking(updated));

    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.chatbot,
        data: {'query': text},
      );
      final answer =
          response.data['response'] as String? ??
          response.data['answer'] as String? ??
          'Désolé, je n\'ai pas pu trouver de réponse.';
      final botMsg = ChatbotMessage(text: answer, isBot: true);
      emit(ChatbotReady([...updated, botMsg]));
    } catch (e) {
      final errorMsg = ChatbotMessage(
        text: 'Erreur de connexion. Réessaie plus tard.',
        isBot: true,
      );
      emit(ChatbotReady([...updated, errorMsg]));
    }
  }

  void clearConversation() {
    emit(
      ChatbotReady([
        ChatbotMessage(
          text: 'Conversation réinitialisée. Comment puis-je t\'aider?',
          isBot: true,
        ),
      ]),
    );
  }
}
