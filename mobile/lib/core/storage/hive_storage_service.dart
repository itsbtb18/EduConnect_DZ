import 'package:hive_flutter/hive_flutter.dart';

import '../constants/app_constants.dart';

/// Hive-backed local storage service for offline caching of API responses.
///
/// Used by [ConnectivityInterceptor] to serve cached data when the device
/// is offline. Each entry is stored with a timestamp so stale data can be
/// evicted based on [AppConstants.cacheExpiry].
class HiveStorageService {
  static const String _cacheBoxName = 'api_cache';
  static const String _timestampBoxName = 'api_cache_timestamps';

  late Box<String> _cacheBox;
  late Box<int> _timestampBox;

  /// Open Hive boxes — call once during app initialization.
  Future<void> init() async {
    _cacheBox = await Hive.openBox<String>(_cacheBoxName);
    _timestampBox = await Hive.openBox<int>(_timestampBoxName);
  }

  // ── Cache a response ──────────────────────────────────────────────────────

  Future<void> cacheResponse(String key, String jsonString) async {
    await _cacheBox.put(key, jsonString);
    await _timestampBox.put(key, DateTime.now().millisecondsSinceEpoch);
  }

  // ── Retrieve a cached response (null if missing or expired) ───────────────

  Future<String?> getCachedResponse(String key) async {
    final json = _cacheBox.get(key);
    if (json == null) return null;

    // Check staleness
    final timestamp = _timestampBox.get(key);
    if (timestamp != null) {
      final cachedAt = DateTime.fromMillisecondsSinceEpoch(timestamp);
      if (DateTime.now().difference(cachedAt) > AppConstants.cacheExpiry) {
        // Expired — clean up
        await _cacheBox.delete(key);
        await _timestampBox.delete(key);
        return null;
      }
    }

    return json;
  }

  // ── Remove a specific entry ───────────────────────────────────────────────

  Future<void> removeCachedResponse(String key) async {
    await _cacheBox.delete(key);
    await _timestampBox.delete(key);
  }

  // ── Clear the entire cache ────────────────────────────────────────────────

  Future<void> clearAll() async {
    await _cacheBox.clear();
    await _timestampBox.clear();
  }

  // ── Evict all entries older than [AppConstants.cacheExpiry] ────────────────

  Future<void> evictStale() async {
    final now = DateTime.now();
    final keysToRemove = <String>[];

    for (final key in _timestampBox.keys.cast<String>()) {
      final ts = _timestampBox.get(key);
      if (ts != null) {
        final cachedAt = DateTime.fromMillisecondsSinceEpoch(ts);
        if (now.difference(cachedAt) > AppConstants.cacheExpiry) {
          keysToRemove.add(key);
        }
      }
    }

    for (final key in keysToRemove) {
      await _cacheBox.delete(key);
      await _timestampBox.delete(key);
    }
  }
}
