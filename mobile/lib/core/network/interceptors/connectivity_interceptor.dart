import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';

import '../../storage/hive_storage_service.dart';

/// Connectivity-aware interceptor
///
/// **Online**  → forwards request normally; caches successful GET responses.
/// **Offline** → for GET requests returns a cached response if available;
///              for non-GET requests throws a user-friendly [DioException].
class ConnectivityInterceptor extends Interceptor {
  final Connectivity _connectivity;
  final HiveStorageService _cacheStorage;

  ConnectivityInterceptor({
    required HiveStorageService cacheStorage,
    Connectivity? connectivity,
  }) : _cacheStorage = cacheStorage,
       _connectivity = connectivity ?? Connectivity();

  /// ── REQUEST: check connectivity before sending ───────────────────────────
  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final results = await _connectivity.checkConnectivity();
    final isOffline = results.contains(ConnectivityResult.none);

    if (isOffline) {
      if (options.method == 'GET') {
        // Try to serve from cache
        final cacheKey = _buildCacheKey(options);
        final cached = await _cacheStorage.getCachedResponse(cacheKey);

        if (cached != null) {
          return handler.resolve(
            Response(
              requestOptions: options,
              data: jsonDecode(cached),
              statusCode: 200,
              statusMessage: 'OK (from cache)',
            ),
          );
        }
      }

      // No cache available or non-GET request → reject with friendly message
      return handler.reject(
        DioException(
          requestOptions: options,
          type: DioExceptionType.connectionError,
          message: 'Pas de connexion Internet. Veuillez vérifier votre réseau.',
        ),
      );
    }

    // Online → proceed normally
    handler.next(options);
  }

  /// ── RESPONSE: cache successful GET responses ─────────────────────────────
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) async {
    if (response.requestOptions.method == 'GET' &&
        response.statusCode != null &&
        response.statusCode! >= 200 &&
        response.statusCode! < 300) {
      final cacheKey = _buildCacheKey(response.requestOptions);
      try {
        final encoded = jsonEncode(response.data);
        await _cacheStorage.cacheResponse(cacheKey, encoded);
      } catch (_) {
        // Caching is best-effort; don't block the response
      }
    }
    handler.next(response);
  }

  /// Build a deterministic cache key from method + full URI
  String _buildCacheKey(RequestOptions options) {
    return '${options.method}:${options.uri}';
  }
}
