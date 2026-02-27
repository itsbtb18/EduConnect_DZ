import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';

/// Remote datasource for all authentication-related API calls.
///
/// This is the single point of contact with the backend auth endpoints.
/// The [AuthRepository] delegates network calls here and adds business logic.
class AuthRemoteDatasource {
  final DioClient _dioClient;

  AuthRemoteDatasource(this._dioClient);

  /// POST /accounts/login/
  Future<Map<String, dynamic>> login({
    required String phoneNumber,
    required String password,
  }) async {
    final response = await _dioClient.dio.post(
      ApiEndpoints.login,
      data: {'phone_number': phoneNumber, 'password': password},
    );
    return response.data as Map<String, dynamic>;
  }

  /// POST /accounts/pin-login/
  Future<Map<String, dynamic>> pinLogin({
    required String phone,
    required String pin,
  }) async {
    final response = await _dioClient.dio.post(
      ApiEndpoints.pinLogin,
      data: {'phone': phone, 'pin': pin},
    );
    return response.data as Map<String, dynamic>;
  }

  /// GET /accounts/me/
  Future<Map<String, dynamic>> getMe() async {
    final response = await _dioClient.dio.get(ApiEndpoints.me);
    return response.data as Map<String, dynamic>;
  }

  /// POST /accounts/change-password/
  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    await _dioClient.dio.post(
      ApiEndpoints.changePassword,
      data: {'old_password': oldPassword, 'new_password': newPassword},
    );
  }

  /// POST /accounts/update-fcm-token/
  Future<void> updateFcmToken(String token) async {
    await _dioClient.dio.post(
      ApiEndpoints.updateFcmToken,
      data: {'fcm_token': token},
    );
  }

  /// POST /accounts/token/refresh/
  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    final response = await _dioClient.dio.post(
      ApiEndpoints.tokenRefresh,
      data: {'refresh': refreshToken},
    );
    return response.data as Map<String, dynamic>;
  }
}
