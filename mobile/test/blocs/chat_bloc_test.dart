import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:ilmi_mobile/core/di/injection.dart';
import 'package:ilmi_mobile/core/network/sync_queue_service.dart';
import 'package:ilmi_mobile/core/storage/secure_storage_service.dart';
import 'package:ilmi_mobile/features/shared/data/models/communication_model.dart';
import 'package:ilmi_mobile/features/shared/data/repositories/chat_repository.dart';
import 'package:ilmi_mobile/features/shared/presentation/bloc/chat_bloc.dart';

// ── Mocks ───────────────────────────────────────────────────────────────────

class MockChatRepository extends Mock implements ChatRepository {}

class MockSecureStorageService extends Mock implements SecureStorageService {}

class MockSyncQueueService extends Mock implements SyncQueueService {}

// ── Fixtures ────────────────────────────────────────────────────────────────

final _conversations = [
  Conversation(
    id: 'conv-1',
    conversationType: 'broadcast',
    title: 'Classe 3A',
    lastMessageText: 'Bonjour',
    lastMessageAt: DateTime(2025, 1, 15),
  ),
  Conversation(
    id: 'conv-2',
    conversationType: 'teacher_parent',
    title: 'Parent Kaci',
    lastMessageText: 'Merci',
    lastMessageAt: DateTime(2025, 1, 14),
  ),
];

final _messages = [
  Message(
    id: 'm1',
    conversationId: 'conv-1',
    senderId: 'u1',
    senderName: 'Ahmed',
    content: 'Bonjour',
    createdAt: DateTime(2025, 1, 15, 8, 0),
  ),
  Message(
    id: 'm2',
    conversationId: 'conv-1',
    senderId: 'u2',
    senderName: 'Sara',
    content: 'Bonjour la classe !',
    createdAt: DateTime(2025, 1, 15, 8, 5),
  ),
];

// ── Tests ───────────────────────────────────────────────────────────────────

void main() {
  late MockChatRepository mockChatRepo;
  late MockSecureStorageService mockStorage;
  late MockSyncQueueService mockSyncQueue;

  setUp(() {
    mockChatRepo = MockChatRepository();
    mockStorage = MockSecureStorageService();
    mockSyncQueue = MockSyncQueueService();

    getIt.registerLazySingleton<ChatRepository>(() => mockChatRepo);
    getIt.registerLazySingleton<SecureStorageService>(() => mockStorage);
    getIt.registerLazySingleton<SyncQueueService>(() => mockSyncQueue);
  });

  tearDown(() async {
    await getIt.reset();
  });

  group('ChatBloc', () {
    test('initial state is ChatInitial', () {
      final bloc = ChatBloc();
      expect(bloc.state, ChatInitial());
      bloc.close();
    });

    // ── Load conversations ───────────────────────────────────────────────

    blocTest<ChatBloc, ChatState>(
      'emits [ChatLoading, ChatConversationsLoaded] on successful load',
      setUp: () {
        when(
          () => mockChatRepo.getConversations(),
        ).thenAnswer((_) async => _conversations);
      },
      build: () => ChatBloc(),
      act: (bloc) => bloc.add(ChatLoadConversations()),
      expect: () => [ChatLoading(), ChatConversationsLoaded(_conversations)],
    );

    blocTest<ChatBloc, ChatState>(
      'emits [ChatLoading, ChatError] when conversations load fails',
      setUp: () {
        when(
          () => mockChatRepo.getConversations(),
        ).thenThrow(Exception('Network error'));
      },
      build: () => ChatBloc(),
      act: (bloc) => bloc.add(ChatLoadConversations()),
      expect: () => [ChatLoading(), isA<ChatError>()],
    );

    // ── Select conversation ──────────────────────────────────────────────

    blocTest<ChatBloc, ChatState>(
      'emits [ChatLoading, ChatMessagesLoaded] on conversation select',
      setUp: () {
        // First load conversations so _conversations is populated
        when(
          () => mockChatRepo.getConversations(),
        ).thenAnswer((_) async => _conversations);
        when(
          () => mockChatRepo.getMessages(
            conversationId: any(named: 'conversationId'),
          ),
        ).thenAnswer((_) async => _messages);
        when(
          () => mockStorage.getAccessToken(),
        ).thenAnswer((_) async => null); // No WebSocket in test
      },
      build: () => ChatBloc(),
      act: (bloc) async {
        bloc.add(ChatLoadConversations());
        await Future.delayed(const Duration(milliseconds: 100));
        bloc.add(const ChatSelectConversation('conv-1'));
      },
      expect: () => [
        ChatLoading(),
        ChatConversationsLoaded(_conversations),
        ChatLoading(),
        isA<ChatMessagesLoaded>(),
      ],
    );

    // ── State equality ──────────────────────────────────────────────────

    test('ChatConversationsLoaded compares by conversations', () {
      expect(
        ChatConversationsLoaded(_conversations),
        equals(ChatConversationsLoaded(_conversations)),
      );
    });

    test('ChatError compares by message', () {
      expect(const ChatError('err'), equals(const ChatError('err')));
      expect(const ChatError('err'), isNot(equals(const ChatError('other'))));
    });

    // ── Event equality ──────────────────────────────────────────────────

    test('ChatSelectConversation equality', () {
      expect(
        const ChatSelectConversation('conv-1'),
        equals(const ChatSelectConversation('conv-1')),
      );
    });

    test('ChatSendMessage equality', () {
      expect(
        const ChatSendMessage('hello'),
        equals(const ChatSendMessage('hello')),
      );
    });
  });
}
