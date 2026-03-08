import 'package:flutter/material.dart';

/// Teaching resource model matching Django academics.Resource
class TeachingResource {
  final String id;
  final String title;
  final String? description;
  final String subjectId;
  final String? subjectName;
  final String? chapter;
  final String resourceType; // pdf, video, image, link, presentation
  final String? fileUrl;
  final String? externalLink;
  final int downloadCount;
  final int version;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const TeachingResource({
    required this.id,
    required this.title,
    this.description,
    required this.subjectId,
    this.subjectName,
    this.chapter,
    this.resourceType = 'pdf',
    this.fileUrl,
    this.externalLink,
    this.downloadCount = 0,
    this.version = 1,
    this.createdAt,
    this.updatedAt,
  });

  factory TeachingResource.fromJson(Map<String, dynamic> json) =>
      TeachingResource(
        id: json['id'] as String,
        title: json['title'] as String,
        description: json['description'] as String?,
        subjectId: json['subject'] as String? ?? '',
        subjectName: json['subject_name'] as String?,
        chapter: json['chapter'] as String?,
        resourceType: json['resource_type'] as String? ?? 'pdf',
        fileUrl: json['file'] as String? ?? json['file_url'] as String?,
        externalLink:
            json['external_link'] as String? ?? json['url'] as String?,
        downloadCount: json['download_count'] as int? ?? 0,
        version: json['version'] as int? ?? 1,
        createdAt: json['created_at'] != null
            ? DateTime.parse(json['created_at'] as String)
            : null,
        updatedAt: json['updated_at'] != null
            ? DateTime.parse(json['updated_at'] as String)
            : null,
      );

  String get typeLabel => switch (resourceType) {
    'pdf' => 'PDF',
    'video' => 'Vidéo',
    'image' => 'Image',
    'link' => 'Lien',
    'presentation' => 'Présentation',
    _ => resourceType,
  };

  IconData get typeIcon => switch (resourceType) {
    'pdf' => Icons.picture_as_pdf,
    'video' => Icons.videocam,
    'image' => Icons.image,
    'link' => Icons.link,
    'presentation' => Icons.slideshow,
    _ => Icons.insert_drive_file,
  };
}
