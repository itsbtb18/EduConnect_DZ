/// Chat & message models matching Django chat app
library;

class Conversation {
  final String id;
  final String conversationType; // teacher_student, teacher_parent, broadcast
  final String? title;
  final List<ConversationParticipant> participants;
  final String? lastMessageText;
  final DateTime? lastMessageAt;
  final int unreadCount;

  const Conversation({
    required this.id,
    required this.conversationType,
    this.title,
    this.participants = const [],
    this.lastMessageText,
    this.lastMessageAt,
    this.unreadCount = 0,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) => Conversation(
    id: json['id'] as String,
    conversationType: json['conversation_type'] as String,
    title: json['title'] as String?,
    participants:
        (json['participants'] as List?)
            ?.map(
              (e) =>
                  ConversationParticipant.fromJson(e as Map<String, dynamic>),
            )
            .toList() ??
        [],
    lastMessageText: json['last_message_text'] as String?,
    lastMessageAt: json['last_message_at'] != null
        ? DateTime.parse(json['last_message_at'] as String)
        : null,
    unreadCount: json['unread_count'] as int? ?? 0,
  );
}

class ConversationParticipant {
  final String userId;
  final String name;
  final String? avatar;
  final String role;

  const ConversationParticipant({
    required this.userId,
    required this.name,
    this.avatar,
    required this.role,
  });

  factory ConversationParticipant.fromJson(Map<String, dynamic> json) =>
      ConversationParticipant(
        userId: json['user_id'] as String,
        name: json['name'] as String,
        avatar: json['avatar'] as String?,
        role: json['role'] as String,
      );
}

class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String? senderName;
  final String content;
  final String? attachment;
  final DateTime createdAt;
  final bool isRead;

  const Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    this.senderName,
    required this.content,
    this.attachment,
    required this.createdAt,
    this.isRead = false,
  });

  factory Message.fromJson(Map<String, dynamic> json) => Message(
    id: json['id'] as String,
    conversationId: json['conversation'] as String,
    senderId: json['sender'] as String,
    senderName: json['sender_name'] as String?,
    content: json['content'] as String,
    attachment: json['attachment'] as String?,
    createdAt: DateTime.parse(json['created_at'] as String),
    isRead: json['is_read'] as bool? ?? false,
  );
}

/// Announcement model
class Announcement {
  final String id;
  final String title;
  final String content;
  final String priority; // low, normal, high, urgent
  final String targetAudience; // all, teachers, students, parents
  final String? authorName;
  final DateTime createdAt;

  const Announcement({
    required this.id,
    required this.title,
    required this.content,
    this.priority = 'normal',
    this.targetAudience = 'all',
    this.authorName,
    required this.createdAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) => Announcement(
    id: json['id'] as String,
    title: json['title'] as String,
    content: json['content'] as String,
    priority: json['priority'] as String? ?? 'normal',
    targetAudience: json['target_audience'] as String? ?? 'all',
    authorName: json['author_name'] as String?,
    createdAt: DateTime.parse(json['created_at'] as String),
  );
}

/// Calendar event model
class CalendarEvent {
  final String id;
  final String title;
  final String? description;
  final DateTime startDate;
  final DateTime endDate;
  final String eventType; // holiday, exam, meeting, activity
  final bool isAllDay;

  const CalendarEvent({
    required this.id,
    required this.title,
    this.description,
    required this.startDate,
    required this.endDate,
    this.eventType = 'activity',
    this.isAllDay = false,
  });

  factory CalendarEvent.fromJson(Map<String, dynamic> json) => CalendarEvent(
    id: json['id'] as String,
    title: json['title'] as String,
    description: json['description'] as String?,
    startDate: DateTime.parse(json['start_date'] as String),
    endDate: DateTime.parse(json['end_date'] as String),
    eventType: json['event_type'] as String? ?? 'activity',
    isAllDay: json['is_all_day'] as bool? ?? false,
  );
}

/// Notification model
class AppNotification {
  final String id;
  final String title;
  final String message;
  final String notificationType;
  final bool isRead;
  final DateTime createdAt;
  final Map<String, dynamic>? data;

  const AppNotification({
    required this.id,
    required this.title,
    required this.message,
    this.notificationType = 'general',
    this.isRead = false,
    required this.createdAt,
    this.data,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id'] as String,
        title: json['title'] as String,
        message: json['message'] as String,
        notificationType: json['notification_type'] as String? ?? 'general',
        isRead: json['is_read'] as bool? ?? false,
        createdAt: DateTime.parse(json['created_at'] as String),
        data: json['data'] as Map<String, dynamic>?,
      );
}

/// Attendance record
class AttendanceRecord {
  final String id;
  final String studentId;
  final String? studentName;
  final DateTime date;
  final String status; // present, absent, late, excused
  final String? note;

  const AttendanceRecord({
    required this.id,
    required this.studentId,
    this.studentName,
    required this.date,
    required this.status,
    this.note,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) =>
      AttendanceRecord(
        id: json['id'] as String,
        studentId: json['student'] as String,
        studentName: json['student_name'] as String?,
        date: DateTime.parse(json['date'] as String),
        status: json['status'] as String,
        note: json['note'] as String?,
      );
}
