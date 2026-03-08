import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/network/api_response.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../models/user_model.dart';

/// Auth result returned after login: full User (from /me) + contexts.
class AuthResult {
  final User user;
  final List<UserContext> contexts;

  const AuthResult({required this.user, required this.contexts});
}

/// Intermediate result when login requires OTP/TOTP verification.
class AuthOtpRequired {
  final bool requiresOtp;
  final bool requiresTotp;
  final String tempToken;

  const AuthOtpRequired({
    this.requiresOtp = false,
    this.requiresTotp = false,
    required this.tempToken,
  });
}

/// Repository handling all authentication-related API calls.
class AuthRepository {
  final DioClient _dioClient;
  final SecureStorageService _storage;

  AuthRepository(this._dioClient, this._storage);

  /// Login with phone number and password.
  /// Returns AuthResult if login is complete, or throws AuthOtpRequired
  /// if OTP/TOTP verification is needed.
  Future<AuthResult> login({
    required String phoneNumber,
    required String password,
  }) async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.login,
        data: {'phone_number': phoneNumber, 'password': password},
      );

      final loginResponse = LoginResponse.fromJson(response.data);

      // Check if multi-step auth is required
      if (!loginResponse.isComplete) {
        throw AuthOtpRequired(
          requiresOtp: loginResponse.requiresOtp,
          requiresTotp: loginResponse.requiresTotp,
          tempToken: loginResponse.tempToken ?? '',
        );
      }

      // Store tokens
      await _storage.saveTokens(
        accessToken: loginResponse.accessToken!,
        refreshToken: loginResponse.refreshToken!,
      );

      // Fetch full user profile (now that we have a valid token)
      final user = await getMe();

      // Use contexts from /me (which includes the latest data)
      return AuthResult(user: user, contexts: user.contexts);
    } on AuthOtpRequired {
      rethrow;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Verify OTP code (SMS) to complete login.
  Future<AuthResult> verifyOtp({
    required String tempToken,
    required String code,
  }) async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.verifyOtp,
        data: {'temp_token': tempToken, 'code': code},
      );

      final loginResponse = LoginResponse.fromJson(response.data);

      await _storage.saveTokens(
        accessToken: loginResponse.accessToken!,
        refreshToken: loginResponse.refreshToken!,
      );

      final user = await getMe();
      return AuthResult(user: user, contexts: user.contexts);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Verify TOTP code (authenticator app) to complete login.
  Future<AuthResult> verifyTotp({
    required String tempToken,
    required String code,
  }) async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.verifyTotp,
        data: {'temp_token': tempToken, 'code': code},
      );

      final loginResponse = LoginResponse.fromJson(response.data);

      await _storage.saveTokens(
        accessToken: loginResponse.accessToken!,
        refreshToken: loginResponse.refreshToken!,
      );

      final user = await getMe();
      return AuthResult(user: user, contexts: user.contexts);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Login with phone + PIN (for young students)
  Future<AuthResult> pinLogin({
    required String phone,
    required String pin,
  }) async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.pinLogin,
        data: {'phone': phone, 'pin': pin},
      );

      final loginResponse = LoginResponse.fromJson(response.data);

      await _storage.saveTokens(
        accessToken: loginResponse.accessToken!,
        refreshToken: loginResponse.refreshToken!,
      );

      // Fetch full user profile
      final user = await getMe();

      return AuthResult(user: user, contexts: user.contexts);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Get current user profile
  Future<User> getMe() async {
    try {
      final response = await _dioClient.dio.get(ApiEndpoints.me);
      return User.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Change password
  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    try {
      await _dioClient.dio.post(
        ApiEndpoints.changePassword,
        data: {'old_password': oldPassword, 'new_password': newPassword},
      );
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Update FCM token for push notifications
  Future<void> updateFcmToken(String token) async {
    try {
      await _dioClient.dio.post(
        ApiEndpoints.updateFcmToken,
        data: {'fcm_token': token},
      );
    } catch (_) {
      // Non-critical, silently fail
    }
  }

  /// Logout — call backend + clear stored tokens
  Future<void> logout() async {
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken != null) {
        await _dioClient.dio.post(
          ApiEndpoints.logout,
          data: {'refresh': refreshToken},
        );
      }
    } catch (_) {
      // Non-critical — always clear tokens even if server call fails
    }
    await _storage.clearTokens();
  }

  /// Check if user is currently logged in
  Future<bool> isLoggedIn() async {
    return await _storage.isLoggedIn();
  }

  /// Get stored user role for routing
  Future<String?> getUserRole() async {
    return await _storage.getUserRole();
  }
}
