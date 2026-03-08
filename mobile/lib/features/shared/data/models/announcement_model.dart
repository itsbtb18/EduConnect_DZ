/// Announcement model matching the Django announcements app.
class Announcement {
  final String id;
  final String title;
  final String body;
  final String
  targetAudience; // ALL, PARENTS, STUDENTS, TEACHERS, SPECIFIC_SECTION, SPECIFIC_CLASS
  final String? authorName;
  final bool isPinned;
  final bool isUrgent;
  final String? imageUrl;
  final int viewsCount;
  final String? publishAt;
  final String? publishedAt;
  final List<AnnouncementAttachment> attachments;
  final DateTime createdAt;

  const Announcement({
    required this.id,
    required this.title,
    required this.body,
    this.targetAudience = 'ALL',
    this.authorName,
    this.isPinned = false,
    this.isUrgent = false,
    this.imageUrl,
    this.viewsCount = 0,
    this.publishAt,
    this.publishedAt,
    this.attachments = const [],
    required this.createdAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? json['content'] as String? ?? '',
      targetAudience: json['target_audience'] as String? ?? 'ALL',
      authorName: json['author_name'] as String?,
      isPinned: json['is_pinned'] as bool? ?? false,
      isUrgent: json['is_urgent'] as bool? ?? false,
      imageUrl: json['image_url'] as String?,
      viewsCount: json['views_count'] as int? ?? 0,
      publishAt: json['publish_at'] as String?,
      publishedAt: json['published_at'] as String?,
      attachments:
          (json['attachments'] as List?)
              ?.map(
                (e) =>
                    AnnouncementAttachment.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          [],
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'body': body,
      'target_audience': targetAudience,
      'is_pinned': isPinned,
      'is_urgent': isUrgent,
    };
  }
}

/// Attachment for an announcement
class AnnouncementAttachment {
  final String id;
  final String file;
  final String? fileName;

  const AnnouncementAttachment({
    required this.id,
    required this.file,
    this.fileName,
  });

  factory AnnouncementAttachment.fromJson(Map<String, dynamic> json) =>
      AnnouncementAttachment(
        id: json['id'] as String,
        file: json['file'] as String,
        fileName: json['file_name'] as String?,
      );
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
