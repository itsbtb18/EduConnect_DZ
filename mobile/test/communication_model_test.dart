import 'package:flutter_test/flutter_test.dart';

import 'package:ilmi_mobile/features/shared/data/models/communication_model.dart';

void main() {
  group('Conversation.fromJson', () {
    test('parses complete conversation', () {
      final json = {
        'id': 'conv-1',
        'conversation_type': 'teacher_parent',
        'title': 'Discussion parent-prof',
        'participants': [
          {
            'user_id': 'u-1',
            'name': 'Ahmed Benali',
            'avatar': 'https://example.com/photo.jpg',
            'role': 'TEACHER',
          },
          {'user_id': 'u-2', 'name': 'Fatima Khaled', 'role': 'PARENT'},
        ],
        'last_message_text': 'Bonjour',
        'last_message_at': '2025-01-15T14:30:00Z',
        'unread_count': 3,
      };

      final conv = Conversation.fromJson(json);
      expect(conv.id, 'conv-1');
      expect(conv.conversationType, 'teacher_parent');
      expect(conv.title, 'Discussion parent-prof');
      expect(conv.participants.length, 2);
      expect(conv.participants[0].name, 'Ahmed Benali');
      expect(conv.participants[0].avatar, isNotNull);
      expect(conv.participants[1].avatar, isNull);
      expect(conv.lastMessageText, 'Bonjour');
      expect(conv.lastMessageAt!.hour, 14);
      expect(conv.unreadCount, 3);
    });

    test('handles minimal conversation', () {
      final json = {'id': 'conv-2', 'conversation_type': 'teacher_student'};

      final conv = Conversation.fromJson(json);
      expect(conv.title, isNull);
      expect(conv.participants, isEmpty);
      expect(conv.lastMessageText, isNull);
      expect(conv.lastMessageAt, isNull);
      expect(conv.unreadCount, 0);
    });
  });

  group('ConversationParticipant.fromJson', () {
    test('parses participant with all fields', () {
      final json = {
        'user_id': 'u-1',
        'name': 'Test User',
        'avatar': 'https://example.com/photo.jpg',
        'role': 'TEACHER',
      };

      final p = ConversationParticipant.fromJson(json);
      expect(p.userId, 'u-1');
      expect(p.name, 'Test User');
      expect(p.avatar, isNotNull);
      expect(p.role, 'TEACHER');
    });
  });

  group('Message.fromJson', () {
    test('parses complete message', () {
      final json = {
        'id': 'msg-1',
        'conversation': 'conv-1',
        'sender': 'u-1',
        'sender_name': 'Ahmed',
        'content': 'Hello!',
        'attachment_url': 'https://example.com/file.pdf',
        'attachment_type': 'document',
        'attachment_name': 'homework.pdf',
        'attachment_size': 1024,
        'status': 'DELIVERED',
        'is_pinned': true,
        'is_deleted': false,
        'created_at': '2025-01-15T14:30:00Z',
        'is_read': true,
      };

      final msg = Message.fromJson(json);
      expect(msg.id, 'msg-1');
      expect(msg.conversationId, 'conv-1');
      expect(msg.senderId, 'u-1');
      expect(msg.senderName, 'Ahmed');
      expect(msg.content, 'Hello!');
      expect(msg.attachmentUrl, isNotNull);
      expect(msg.attachmentType, 'document');
      expect(msg.attachmentName, 'homework.pdf');
      expect(msg.attachmentSize, 1024);
      expect(msg.status, 'DELIVERED');
      expect(msg.isPinned, true);
      expect(msg.isDeleted, false);
      expect(msg.isRead, true);
    });

    test('defaults optional fields', () {
      final json = {'id': 'msg-2', 'created_at': '2025-01-15T14:30:00Z'};

      final msg = Message.fromJson(json);
      expect(msg.conversationId, '');
      expect(msg.senderId, '');
      expect(msg.senderName, isNull);
      expect(msg.content, '');
      expect(msg.attachmentUrl, isNull);
      expect(msg.status, 'SENT');
      expect(msg.isPinned, false);
      expect(msg.isDeleted, false);
      expect(msg.isRead, false);
    });

    test('uses sender_id as fallback for sender', () {
      final json = {
        'id': 'msg-3',
        'sender_id': 'u-99',
        'content': 'Test',
        'created_at': '2025-01-15T14:30:00Z',
      };

      final msg = Message.fromJson(json);
      expect(msg.senderId, 'u-99');
    });
  });
}
