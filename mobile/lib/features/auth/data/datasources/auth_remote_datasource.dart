import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';

/// Raw network calls for authentication endpoints.
class AuthRemoteDatasource {
  final DioClient _dioClient;

  AuthRemoteDatasource(this._dioClient);

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

  Future<Map<String, dynamic>> getMe() async {
    final response = await _dioClient.dio.get(ApiEndpoints.me);
    return response.data as Map<String, dynamic>;
  }

  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    await _dioClient.dio.post(
      ApiEndpoints.changePassword,
      data: {'old_password': oldPassword, 'new_password': newPassword},
    );
  }

  Future<void> updateFcmToken(String token) async {
    await _dioClient.dio.post(
      ApiEndpoints.updateFcmToken,
      data: {'fcm_token': token},
    );
  }
}
