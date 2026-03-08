import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../constants/app_constants.dart';
import '../security/certificate_pinner.dart';
import '../storage/hive_storage_service.dart';
import '../storage/secure_storage_service.dart';
import 'interceptors/auth_interceptor.dart';
import 'interceptors/connectivity_interceptor.dart';
import 'interceptors/logging_interceptor.dart';

/// Configured Dio HTTP client for the ILMI API.
///
/// Interceptor pipeline (in order):
/// 1. [ConnectivityInterceptor] – offline detection & cached GET fallback
/// 2. Device fingerprint interceptor – adds X-Device-ID header
/// 3. [AuthInterceptor] – JWT injection & 401 refresh-then-retry
/// 4. [LoggingInterceptor] – structured debug logging (debug builds only)
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
      ConnectivityInterceptor(cacheStorage),
      _DeviceFingerprintInterceptor(),
      AuthInterceptor(secureStorage, _dio),
      if (kDebugMode) LoggingInterceptor(),
    ]);

    // Apply certificate pinning (skipped in debug mode)
    CertificatePinner.apply(_dio, isDebug: kDebugMode);
  }
}

/// Interceptor that adds device identification header to all requests.
class _DeviceFingerprintInterceptor extends Interceptor {
  String? _cachedDeviceId;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    try {
      _cachedDeviceId ??= await _getDeviceId();
      if (_cachedDeviceId != null) {
        options.headers['X-Device-ID'] = _cachedDeviceId;
      }
    } catch (_) {
      // Non-critical — continue without device ID
    }
    handler.next(options);
  }

  Future<String> _getDeviceId() async {
    final deviceInfo = DeviceInfoPlugin();
    if (Platform.isAndroid) {
      final android = await deviceInfo.androidInfo;
      return '${android.brand}_${android.model}_${android.id}';
    } else if (Platform.isIOS) {
      final ios = await deviceInfo.iosInfo;
      return ios.identifierForVendor ?? '${ios.name}_${ios.model}';
    }
    return 'unknown';
  }
}
