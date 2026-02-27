import 'package:dio/dio.dart';

import '../../constants/app_constants.dart';
import '../../storage/secure_storage_service.dart';

/// JWT Authentication interceptor
///
/// - Injects Bearer access token into every request (except login/refresh)
/// - On 401: attempts token refresh, then retries the original request
/// - If refresh also fails: clears stored tokens (forces re-login)
class AuthInterceptor extends QueuedInterceptor {
  final SecureStorageService _storage;
  final Dio _dio;

  AuthInterceptor({required SecureStorageService storage, required Dio dio})
    : _storage = storage,
      _dio = dio;

  /// ── REQUEST: attach access token ──────────────────────────────────────────
  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth header for public endpoints
    final publicPaths = ['/login', '/pin-login', '/token/refresh'];
    final isPublic = publicPaths.any((p) => options.path.contains(p));

    if (!isPublic) {
      final accessToken = await _storage.getAccessToken();
      if (accessToken != null && accessToken.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $accessToken';
      }
    }
    handler.next(options);
  }

  /// ── ERROR: handle 401 with token refresh + retry ─────────────────────────
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode != 401) {
      return handler.next(err);
    }

    // Don't retry refresh endpoint itself
    if (err.requestOptions.path.contains('/token/refresh')) {
      await _storage.clearTokens();
      return handler.next(err);
    }

    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        await _storage.clearTokens();
        return handler.next(err);
      }

      // Call refresh endpoint with a fresh Dio instance (no interceptors)
      final refreshDio = Dio(BaseOptions(baseUrl: AppConstants.baseUrl));
      final response = await refreshDio.post(
        '/accounts/token/refresh/',
        data: {'refresh': refreshToken},
      );

      if (response.statusCode == 200) {
        final newAccess = response.data['access'] as String;
        await _storage.saveAccessToken(newAccess);

        // If the backend also rotates the refresh token:
        if (response.data.containsKey('refresh')) {
          await _storage.saveRefreshToken(response.data['refresh'] as String);
        }

        // Retry the original request with the new token
        final retryOptions = err.requestOptions;
        retryOptions.headers['Authorization'] = 'Bearer $newAccess';
        final retryResponse = await _dio.fetch(retryOptions);
        return handler.resolve(retryResponse);
      }
    } catch (_) {
      // Refresh failed → force logout
      await _storage.clearTokens();
    }

    handler.next(err);
  }
}
