import 'dart:convert';

import 'package:hive_flutter/hive_flutter.dart';

import '../constants/app_constants.dart';

/// Hive-backed cache for offline API responses.
///
/// Each cached entry consists of a JSON string and a timestamp (epoch ms).
/// Entries older than [AppConstants.cacheExpiry] are treated as stale.
class HiveStorageService {
  static const _cacheBox = 'api_cache';
  static const _timestampBox = 'api_cache_timestamps';

  late Box<String> _cache;
  late Box<int> _timestamps;

  /// Must be called once after `Hive.initFlutter()`.
  Future<void> init() async {
    _cache = await Hive.openBox<String>(_cacheBox);
    _timestamps = await Hive.openBox<int>(_timestampBox);
  }

  /// Store a response body keyed by the request URL.
  Future<void> cacheResponse(String key, dynamic jsonData) async {
    final encoded = jsonData is String ? jsonData : jsonEncode(jsonData);
    await _cache.put(key, encoded);
    await _timestamps.put(key, DateTime.now().millisecondsSinceEpoch);
  }

  /// Retrieve a cached response if present **and** not expired.
  Future<dynamic> getCachedResponse(String key) async {
    final json = _cache.get(key);
    if (json == null) return null;

    final ts = _timestamps.get(key);
    if (ts == null) return null;

    final age = DateTime.now().millisecondsSinceEpoch - ts;
    if (age > AppConstants.cacheExpiry.inMilliseconds) {
      // Stale — remove and return nothing.
      await _cache.delete(key);
      await _timestamps.delete(key);
      return null;
    }

    return jsonDecode(json);
  }

  /// Wipe the entire cache.
  Future<void> clearAll() async {
    await _cache.clear();
    await _timestamps.clear();
  }

  /// Remove only entries older than [AppConstants.cacheExpiry].
  Future<void> evictStale() async {
    final now = DateTime.now().millisecondsSinceEpoch;
    final expiry = AppConstants.cacheExpiry.inMilliseconds;

    for (final key in _timestamps.keys.toList()) {
      final ts = _timestamps.get(key);
      if (ts != null && (now - ts) > expiry) {
        await _cache.delete(key);
        await _timestamps.delete(key);
      }
    }
  }
}
