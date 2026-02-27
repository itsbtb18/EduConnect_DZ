import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';

import '../../storage/hive_storage_service.dart';

/// Connectivity-aware interceptor.
///
/// • **GET requests while offline** → serves the last cached response.
/// • **Non-GET requests while offline** → immediately rejects.
/// • **Successful GET responses** → caches the body for later offline use.
class ConnectivityInterceptor extends Interceptor {
  final HiveStorageService _cache;

  ConnectivityInterceptor(this._cache);

  Future<bool> _isOffline() async {
    final result = await Connectivity().checkConnectivity();
    return result.contains(ConnectivityResult.none);
  }

  // ── Request phase ─────────────────────────────────────────────────────────

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (await _isOffline()) {
      if (options.method == 'GET') {
        // Try serving from cache.
        final cached = await _cache.getCachedResponse(options.uri.toString());
        if (cached != null) {
          return handler.resolve(
            Response(
              requestOptions: options,
              statusCode: 200,
              data: cached,
              statusMessage: 'OK (cached)',
            ),
          );
        }
      }

      // Non-GET or no cached data → reject right away.
      return handler.reject(
        DioException(
          requestOptions: options,
          type: DioExceptionType.connectionError,
          message: 'Pas de connexion Internet. Veuillez réessayer.',
        ),
      );
    }

    handler.next(options);
  }

  // ── Response phase – cache successful GETs ────────────────────────────────

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) async {
    if (response.requestOptions.method == 'GET' &&
        response.statusCode != null &&
        response.statusCode! >= 200 &&
        response.statusCode! < 300) {
      await _cache.cacheResponse(
        response.requestOptions.uri.toString(),
        response.data,
      );
    }
    handler.next(response);
  }
}
