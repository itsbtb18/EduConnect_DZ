/// Announcement model matching the Django announcements app.
class Announcement {
  final String id;
  final String title;
  final String content;
  final String targetAudience; // general, teachers, students, parents
  final String? authorName;
  final String? attachmentUrl;
  final bool isPublished;
  final bool isPinned;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const Announcement({
    required this.id,
    required this.title,
    required this.content,
    required this.targetAudience,
    this.authorName,
    this.attachmentUrl,
    this.isPublished = true,
    this.isPinned = false,
    required this.createdAt,
    this.updatedAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      targetAudience: json['target_audience'] as String? ?? 'general',
      authorName: json['author_name'] as String?,
      attachmentUrl: json['attachment'] as String?,
      isPublished: json['is_published'] as bool? ?? true,
      isPinned: json['is_pinned'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'content': content,
      'target_audience': targetAudience,
      'is_published': isPublished,
      'is_pinned': isPinned,
    };
  }
}

/// Event model (subtype of announcements with date/location)
class SchoolEvent {
  final String id;
  final String title;
  final String description;
  final DateTime eventDate;
  final String? location;
  final String targetAudience;
  final bool isAllDay;
  final DateTime createdAt;

  const SchoolEvent({
    required this.id,
    required this.title,
    required this.description,
    required this.eventDate,
    this.location,
    required this.targetAudience,
    this.isAllDay = true,
    required this.createdAt,
  });

  factory SchoolEvent.fromJson(Map<String, dynamic> json) {
    return SchoolEvent(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      eventDate: DateTime.parse(json['event_date'] as String),
      location: json['location'] as String?,
      targetAudience: json['target_audience'] as String? ?? 'general',
      isAllDay: json['is_all_day'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'event_date': eventDate.toIso8601String(),
      'location': location,
      'target_audience': targetAudience,
      'is_all_day': isAllDay,
    };
  }
}
