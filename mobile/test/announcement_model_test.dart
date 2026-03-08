import 'package:flutter_test/flutter_test.dart';

import 'package:ilmi_mobile/features/shared/data/models/announcement_model.dart';

void main() {
  group('Announcement.fromJson', () {
    test('parses complete JSON correctly', () {
      final json = {
        'id': 'ann-1',
        'title': 'Test',
        'body': 'Hello world',
        'target_audience': 'PARENTS',
        'author_name': 'Director',
        'is_pinned': true,
        'is_urgent': false,
        'image_url': 'https://example.com/img.png',
        'views_count': 42,
        'publish_at': '2025-06-01T08:00:00Z',
        'published_at': '2025-06-01T08:00:00Z',
        'attachments': [
          {'id': 'att-1', 'file': '/media/test.pdf', 'file_name': 'test.pdf'},
        ],
        'created_at': '2025-01-15T10:30:00Z',
      };

      final announcement = Announcement.fromJson(json);

      expect(announcement.id, 'ann-1');
      expect(announcement.title, 'Test');
      expect(announcement.body, 'Hello world');
      expect(announcement.targetAudience, 'PARENTS');
      expect(announcement.authorName, 'Director');
      expect(announcement.isPinned, true);
      expect(announcement.isUrgent, false);
      expect(announcement.imageUrl, 'https://example.com/img.png');
      expect(announcement.viewsCount, 42);
      expect(announcement.attachments.length, 1);
      expect(announcement.attachments[0].fileName, 'test.pdf');
      expect(announcement.createdAt.year, 2025);
    });

    test('uses "content" field as fallback for body', () {
      final json = {
        'id': 'ann-2',
        'title': 'Legacy',
        'content': 'Old-style content field',
        'created_at': '2025-01-15T10:30:00Z',
      };

      final announcement = Announcement.fromJson(json);
      expect(announcement.body, 'Old-style content field');
    });

    test('defaults missing optional fields', () {
      final json = {
        'id': 'ann-3',
        'title': 'Minimal',
        'created_at': '2025-01-15T10:30:00Z',
      };

      final announcement = Announcement.fromJson(json);
      expect(announcement.body, '');
      expect(announcement.targetAudience, 'ALL');
      expect(announcement.authorName, isNull);
      expect(announcement.isPinned, false);
      expect(announcement.isUrgent, false);
      expect(announcement.imageUrl, isNull);
      expect(announcement.viewsCount, 0);
      expect(announcement.publishAt, isNull);
      expect(announcement.publishedAt, isNull);
      expect(announcement.attachments, isEmpty);
    });

    test('handles all target audiences', () {
      for (final audience in [
        'ALL',
        'PARENTS',
        'STUDENTS',
        'TEACHERS',
        'SPECIFIC_CLASS',
        'SPECIFIC_SECTION',
      ]) {
        final json = {
          'id': 'a-$audience',
          'title': 'Test',
          'target_audience': audience,
          'created_at': '2025-01-15T10:30:00Z',
        };
        final a = Announcement.fromJson(json);
        expect(a.targetAudience, audience);
      }
    });
  });

  group('Announcement.toJson', () {
    test('serialises required fields', () {
      final announcement = Announcement(
        id: 'ann-1',
        title: 'Test',
        body: 'Body text',
        targetAudience: 'PARENTS',
        isPinned: true,
        isUrgent: false,
        createdAt: DateTime(2025, 1, 15),
      );

      final json = announcement.toJson();
      expect(json['title'], 'Test');
      expect(json['body'], 'Body text');
      expect(json['target_audience'], 'PARENTS');
      expect(json['is_pinned'], true);
      expect(json['is_urgent'], false);
    });
  });

  group('AnnouncementAttachment.fromJson', () {
    test('parses attachment correctly', () {
      final json = {
        'id': 'att-1',
        'file': '/media/document.pdf',
        'file_name': 'homework.pdf',
      };

      final att = AnnouncementAttachment.fromJson(json);
      expect(att.id, 'att-1');
      expect(att.file, '/media/document.pdf');
      expect(att.fileName, 'homework.pdf');
    });

    test('handles null file_name', () {
      final json = {'id': 'att-2', 'file': '/media/unnamed.pdf'};

      final att = AnnouncementAttachment.fromJson(json);
      expect(att.fileName, isNull);
    });
  });

  group('SchoolEvent.fromJson', () {
    test('parses event correctly', () {
      final json = {
        'id': 'evt-1',
        'title': 'Parents Day',
        'description': 'Annual parents meeting',
        'event_date': '2025-03-20T09:00:00Z',
        'location': 'Main Hall',
        'target_audience': 'PARENTS',
        'is_all_day': false,
        'created_at': '2025-01-15T10:30:00Z',
      };

      final event = SchoolEvent.fromJson(json);
      expect(event.id, 'evt-1');
      expect(event.title, 'Parents Day');
      expect(event.description, 'Annual parents meeting');
      expect(event.eventDate.month, 3);
      expect(event.location, 'Main Hall');
      expect(event.isAllDay, false);
    });

    test('defaults missing optional fields', () {
      final json = {
        'id': 'evt-2',
        'title': 'Test',
        'event_date': '2025-03-20T09:00:00Z',
        'created_at': '2025-01-15T10:30:00Z',
      };

      final event = SchoolEvent.fromJson(json);
      expect(event.description, '');
      expect(event.location, isNull);
      expect(event.isAllDay, true);
    });
  });
}
