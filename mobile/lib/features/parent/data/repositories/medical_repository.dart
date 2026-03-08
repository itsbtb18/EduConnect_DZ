import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_response.dart';
import '../../../../core/network/dio_client.dart';
import '../models/medical_model.dart';

/// Repository handling all infirmerie/medical API calls for parents.
class MedicalRepository {
  final DioClient _dioClient;

  MedicalRepository(this._dioClient);

  /// Fetch the medical summary for a student (parent view).
  Future<MedicalSummary> getMedicalSummary(String studentId) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.medicalSummary(studentId),
      );
      return MedicalSummary.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Fetch vaccinations for a student.
  Future<List<VaccinationRecord>> getVaccinations(String studentId) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.parentVaccinations(studentId),
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => VaccinationRecord.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Fetch infirmery messages for a student.
  Future<List<InfirmeryMessage>> getMessages(String studentId) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.parentMessages(studentId),
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => InfirmeryMessage.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  /// Submit a medical update request (parent updates child's medical info).
  Future<void> submitMedicalUpdate({
    required String studentId,
    required Map<String, dynamic> updateData,
  }) async {
    try {
      await _dioClient.dio.post(
        ApiEndpoints.parentMedicalUpdate(studentId),
        data: updateData,
      );
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }
}
