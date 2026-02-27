import 'package:dio/dio.dart';

import '../../constants/app_constants.dart';
import '../../storage/secure_storage_service.dart';

/// JWT authentication interceptor.
///
/// • Attaches the access token to every request (except public endpoints).
/// • On 401, attempts a single token refresh then retries the original request.
/// • Uses [QueuedInterceptor] so concurrent 401s share a single refresh cycle.
class AuthInterceptor extends QueuedInterceptor {
  final SecureStorageService _storage;
  final Dio _dio;

  AuthInterceptor(this._storage, this._dio);

  // Paths that must NOT receive an Authorization header.
  static const _publicPaths = ['/login', '/pin-login', '/token/refresh'];

  bool _isPublic(String path) => _publicPaths.any((p) => path.contains(p));

  // ── Attach access token ───────────────────────────────────────────────────

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (_isPublic(options.path)) return handler.next(options);

    final accessToken = await _storage.getAccessToken();
    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
    handler.next(options);
  }

  // ── Handle 401 → refresh & retry ─────────────────────────────────────────

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode != 401) return handler.next(err);

    // Don't try to refresh if we're already on the refresh endpoint.
    if (_isPublic(err.requestOptions.path)) return handler.next(err);

    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) return handler.next(err);

      // Use a bare Dio (no interceptors) to avoid infinite loops.
      final refreshDio = Dio(BaseOptions(baseUrl: AppConstants.baseUrl));
      final response = await refreshDio.post(
        '/accounts/token/refresh/',
        data: {'refresh': refreshToken},
      );

      if (response.statusCode == 200) {
        final newAccessToken = response.data['access'] as String;
        await _storage.saveAccessToken(newAccessToken);

        // Retry the original request with the fresh token.
        final opts = err.requestOptions;
        opts.headers['Authorization'] = 'Bearer $newAccessToken';
        final retryResponse = await _dio.fetch(opts);
        return handler.resolve(retryResponse);
      }
    } catch (_) {
      // Refresh itself failed → force logout.
      await _storage.clearTokens();
    }

    handler.next(err);
  }
}
