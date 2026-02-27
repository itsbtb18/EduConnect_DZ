import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../constants/app_constants.dart';
import '../storage/hive_storage_service.dart';
import '../storage/secure_storage_service.dart';
import 'interceptors/auth_interceptor.dart';
import 'interceptors/connectivity_interceptor.dart';
import 'interceptors/logging_interceptor.dart';

/// Configured Dio HTTP client for the EduConnect API
///
/// Interceptor pipeline (order matters):
///   1. [ConnectivityInterceptor] — offline detection + cached GET fallback
///   2. [AuthInterceptor]         — JWT injection + 401 refresh & retry
///   3. [LoggingInterceptor]      — structured request/response logging (debug)
class DioClient {
  late final Dio _dio;

  Dio get dio => _dio;

  DioClient({
    required SecureStorageService secureStorage,
    required HiveStorageService cacheStorage,
  }) {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        sendTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.addAll([
      // 1️⃣  Connectivity — serves cached data when offline
      ConnectivityInterceptor(cacheStorage: cacheStorage),

      // 2️⃣  Auth — Bearer token + silent refresh on 401
      AuthInterceptor(storage: secureStorage, dio: _dio),

      // 3️⃣  Logging — only in debug builds
      if (kDebugMode) LoggingInterceptor(),
    ]);
  }
}
