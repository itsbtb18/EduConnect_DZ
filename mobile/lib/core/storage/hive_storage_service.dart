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
  static const _domainBox = 'domain_cache';
  static const _domainTsBox = 'domain_cache_timestamps';

  late Box<String> _cache;
  late Box<int> _timestamps;
  late Box<String> _domain;
  late Box<int> _domainTs;

  /// Must be called once after `Hive.initFlutter()`.
  Future<void> init() async {
    _cache = await Hive.openBox<String>(_cacheBox);
    _timestamps = await Hive.openBox<int>(_timestampBox);
    _domain = await Hive.openBox<String>(_domainBox);
    _domainTs = await Hive.openBox<int>(_domainTsBox);
  }

  // ── API response cache (auto-managed by ConnectivityInterceptor) ──────

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
    await _domain.clear();
    await _domainTs.clear();
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

  // ── Domain cache with custom TTL ──────────────────────────────────────

  /// Store domain data with a specific TTL.
  ///
  /// [category] groups related entries (e.g. 'grades', 'schedule').
  /// [key] identifies the specific item within that category.
  Future<void> cacheDomain(
    String category,
    String key,
    dynamic data, {
    Duration? ttl,
  }) async {
    final fullKey = '$category::$key';
    final encoded = data is String ? data : jsonEncode(data);
    await _domain.put(fullKey, encoded);

    // Store TTL-aware timestamp. If no TTL, entry never auto-expires.
    final expiresAt = ttl != null
        ? DateTime.now().millisecondsSinceEpoch + ttl.inMilliseconds
        : 0; // 0 = never expires
    await _domainTs.put(fullKey, expiresAt);
  }

  /// Retrieve domain data. Returns null if missing or TTL-expired.
  dynamic getDomainSync(String category, String key) {
    final fullKey = '$category::$key';
    final json = _domain.get(fullKey);
    if (json == null) return null;

    final expiresAt = _domainTs.get(fullKey) ?? 0;
    if (expiresAt > 0 && DateTime.now().millisecondsSinceEpoch > expiresAt) {
      // Expired — leave cleanup to evictStaleDomain; return null.
      return null;
    }

    return jsonDecode(json);
  }

  /// Async version of [getDomainSync].
  Future<dynamic> getDomain(String category, String key) async {
    return getDomainSync(category, key);
  }

  /// Remove all entries in a domain category.
  Future<void> clearDomain(String category) async {
    final prefix = '$category::';
    final keys = _domain.keys
        .where((k) => k.toString().startsWith(prefix))
        .toList();
    for (final key in keys) {
      await _domain.delete(key);
      await _domainTs.delete(key);
    }
  }

  /// Evict expired domain entries.
  Future<void> evictStaleDomain() async {
    final now = DateTime.now().millisecondsSinceEpoch;
    for (final key in _domainTs.keys.toList()) {
      final expiresAt = _domainTs.get(key) ?? 0;
      if (expiresAt > 0 && now > expiresAt) {
        await _domain.delete(key);
        await _domainTs.delete(key);
      }
    }
  }
}
