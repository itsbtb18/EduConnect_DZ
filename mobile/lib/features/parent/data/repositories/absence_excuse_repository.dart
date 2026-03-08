import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/absence_excuse_model.dart';

/// Repository for absence excuse operations.
class AbsenceExcuseRepository {
  final DioClient _dioClient;

  AbsenceExcuseRepository(this._dioClient);

  /// Submit an absence excuse with optional photo attachment.
  Future<AbsenceExcuse> submitExcuse({
    required String attendanceRecordId,
    required String justificationText,
    String? attachmentPath,
  }) async {
    final formData = FormData.fromMap({
      'attendance_record': attendanceRecordId,
      'justification_text': justificationText,
      if (attachmentPath != null)
        'attachment': await MultipartFile.fromFile(attachmentPath),
    });
    final response = await _dioClient.dio.post(
      ApiEndpoints.parentExcuses,
      data: formData,
    );
    return AbsenceExcuse.fromJson(response.data as Map<String, dynamic>);
  }

  /// Get list of submitted excuses for the parent.
  Future<List<AbsenceExcuse>> getMyExcuses() async {
    final response = await _dioClient.dio.get(ApiEndpoints.parentExcuses);
    final results =
        response.data['results'] as List<dynamic>? ??
        (response.data is List ? response.data as List<dynamic> : []);
    return results
        .map((e) => AbsenceExcuse.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
