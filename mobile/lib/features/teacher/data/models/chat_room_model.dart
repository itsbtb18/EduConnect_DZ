/// Chat room model for broadcast / group chat
class ChatRoom {
  final String id;
  final String name;
  final String roomType; // CLASS_BROADCAST, TEACHER_STUDENT_GROUP, etc.
  final String? description;
  final int memberCount;
  final bool isActive;
  final String? lastMessageText;
  final DateTime? lastMessageAt;
  final DateTime? createdAt;

  const ChatRoom({
    required this.id,
    required this.name,
    required this.roomType,
    this.description,
    this.memberCount = 0,
    this.isActive = true,
    this.lastMessageText,
    this.lastMessageAt,
    this.createdAt,
  });

  bool get isBroadcast =>
      roomType == 'CLASS_BROADCAST' || roomType == 'ADMIN_BROADCAST';

  String get typeLabel => switch (roomType) {
    'CLASS_BROADCAST' => 'Broadcast Classe',
    'TEACHER_STUDENT_GROUP' => 'Groupe Élèves',
    'TEACHER_PARENT_GROUP' => 'Groupe Parents',
    'ADMIN_BROADCAST' => 'Broadcast Admin',
    _ => roomType,
  };

  factory ChatRoom.fromJson(Map<String, dynamic> json) => ChatRoom(
    id: json['id'] as String,
    name: json['name'] as String? ?? '',
    roomType: json['room_type'] as String? ?? json['type'] as String? ?? '',
    description: json['description'] as String?,
    memberCount: json['member_count'] as int? ?? 0,
    isActive: json['is_active'] as bool? ?? true,
    lastMessageText:
        json['last_message_text'] as String? ?? json['last_message'] as String?,
    lastMessageAt: json['last_message_at'] != null
        ? DateTime.parse(json['last_message_at'] as String)
        : null,
    createdAt: json['created_at'] != null
        ? DateTime.parse(json['created_at'] as String)
        : null,
  );
}

/// Contact list item from /chat/conversations/contacts/
class ChatContact {
  final String userId;
  final String name;
  final String role;
  final bool hasConversation;
  final String? conversationId;

  const ChatContact({
    required this.userId,
    required this.name,
    required this.role,
    this.hasConversation = false,
    this.conversationId,
  });

  factory ChatContact.fromJson(Map<String, dynamic> json) => ChatContact(
    userId: json['user_id'] as String? ?? json['id'] as String? ?? '',
    name: json['name'] as String? ?? json['full_name'] as String? ?? '',
    role: json['role'] as String? ?? '',
    hasConversation: json['has_conversation'] as bool? ?? false,
    conversationId: json['conversation_id'] as String?,
  );
}

/// Room message
class RoomMessage {
  final String id;
  final String senderId;
  final String? senderName;
  final String content;
  final String? attachment;
  final DateTime createdAt;

  const RoomMessage({
    required this.id,
    required this.senderId,
    this.senderName,
    required this.content,
    this.attachment,
    required this.createdAt,
  });

  factory RoomMessage.fromJson(Map<String, dynamic> json) => RoomMessage(
    id: json['id'] as String,
    senderId: json['sender'] as String? ?? json['sender_id'] as String? ?? '',
    senderName: json['sender_name'] as String?,
    content: json['content'] as String? ?? json['message'] as String? ?? '',
    attachment: json['attachment'] as String?,
    createdAt: DateTime.parse(json['created_at'] as String),
  );
}

/// Pre-defined message templates (client-side)
class MessageTemplate {
  final String title;
  final String content;

  const MessageTemplate({required this.title, required this.content});
}

const List<MessageTemplate> teacherMessageTemplates = [
  MessageTemplate(
    title: 'Bonne participation',
    content:
        'Votre enfant a très bien participé aujourd\'hui en classe. Continuez à l\'encourager !',
  ),
  MessageTemplate(
    title: 'Devoir non rendu',
    content:
        'Votre enfant n\'a pas rendu le devoir prévu. Merci de veiller à ce qu\'il soit fait.',
  ),
  MessageTemplate(
    title: 'Absence à justifier',
    content:
        'Votre enfant était absent(e) aujourd\'hui. Merci de fournir un justificatif.',
  ),
  MessageTemplate(
    title: 'Comportement exemplaire',
    content:
        'Je tiens à souligner le comportement exemplaire de votre enfant. Bravo !',
  ),
  MessageTemplate(
    title: 'Difficulté en cours',
    content:
        'Votre enfant semble avoir des difficultés dans ma matière. Je vous propose un rendez-vous pour en discuter.',
  ),
  MessageTemplate(
    title: 'Rappel examen',
    content:
        'Un examen est prévu prochainement. Merci de veiller à ce que votre enfant révise bien.',
  ),
];
