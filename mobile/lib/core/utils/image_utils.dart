import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';

/// Image compression and profile image caching utilities.
class ImageUtils {
  ImageUtils._();

  /// Compress an image file before upload.
  ///
  /// Returns a new file with the compressed JPEG result.
  /// Targets a max dimension of [maxDimension] and JPEG [quality] (0-100).
  static Future<File> compressImage(
    File source, {
    int maxDimension = 1024,
    int quality = 75,
  }) async {
    final dir = await getTemporaryDirectory();
    final name = 'compressed_${DateTime.now().millisecondsSinceEpoch}.jpg';
    final targetPath = '${dir.path}/$name';

    final result = await FlutterImageCompress.compressAndGetFile(
      source.absolute.path,
      targetPath,
      minWidth: maxDimension,
      minHeight: maxDimension,
      quality: quality,
      format: CompressFormat.jpeg,
    );

    if (result == null) return source;
    return File(result.path);
  }

  /// Profile image cache directory.
  static Future<Directory> get _profileCacheDir async {
    final dir = await getApplicationSupportDirectory();
    final cacheDir = Directory('${dir.path}/profile_images');
    if (!await cacheDir.exists()) {
      await cacheDir.create(recursive: true);
    }
    return cacheDir;
  }

  /// Cache a profile image locally. Returns the local file path.
  static Future<String> cacheProfileImage(
    String userId,
    Uint8List imageBytes,
  ) async {
    final dir = await _profileCacheDir;
    final file = File('${dir.path}/$userId.jpg');
    await file.writeAsBytes(imageBytes);
    return file.path;
  }

  /// Retrieve a cached profile image. Returns null if not cached.
  static Future<File?> getCachedProfileImage(String userId) async {
    final dir = await _profileCacheDir;
    final file = File('${dir.path}/$userId.jpg');
    if (await file.exists()) return file;
    return null;
  }

  /// Clear the entire profile image cache.
  static Future<void> clearProfileCache() async {
    final dir = await _profileCacheDir;
    if (await dir.exists()) {
      await dir.delete(recursive: true);
    }
  }
}
