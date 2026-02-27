import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/network/api_response.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../models/user_model.dart';

/// Repository handling all authentication-related API calls
class AuthRepository {
  final DioClient _dioClient;
  final SecureStorageService _storage;

  AuthRepository(this._dioClient, this._storage);

  /// Login with phone number and password
  Future<LoginResponse> login({
    required String phoneNumber,
    required String password,
  }) async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.login,
        data: {'phone_number': phoneNumber, 'password': password},
      );

      final loginResponse = LoginResponse.fromJson(response.data);

      // Store tokens and user info
      await _storage.saveTokens(
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
      );
      await _storage.saveUserInfo(
        userId: loginResponse.user.id,
        role: loginResponse.user.role,
        schoolId: loginResponse.user.schoolId,
      );

      return loginResponse;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Login with phone + PIN (for young students)
  Future<LoginResponse> pinLogin({
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
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
      );
      await _storage.saveUserInfo(
        userId: loginResponse.user.id,
        role: loginResponse.user.role,
        schoolId: loginResponse.user.schoolId,
      );

      return loginResponse;
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

  /// Logout — clear stored tokens
  Future<void> logout() async {
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
