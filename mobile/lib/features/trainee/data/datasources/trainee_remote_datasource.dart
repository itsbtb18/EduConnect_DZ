import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';

/// Raw network calls for trainee (learner) endpoints.
class TraineeRemoteDatasource {
  final DioClient _dioClient;

  TraineeRemoteDatasource(this._dioClient);

  // ── Dashboard ─────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getDashboard() async {
    final response = await _dioClient.dio.get(ApiEndpoints.formationDashboard);
    return response.data as Map<String, dynamic>;
  }

  // ── My enrollments ────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getMyEnrollments({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.trainingEnrollments,
      queryParameters: {'my': true, 'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Sessions (my schedule) ────────────────────────────────────────────────
  Future<Map<String, dynamic>> getMySessions({
    String? date,
    String? weekStart,
    String? status,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.trainingSessions,
      queryParameters: {
        'my': true,
        'date': date,
        'week_start': weekStart,
        'status': status,
        'page': page,
      }..removeWhere((_, v) => v == null),
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Certificates ──────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getMyCertificates({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.certificates,
      queryParameters: {'my': true, 'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Placement tests ───────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getMyPlacementTests({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.placementTests,
      queryParameters: {'my': true, 'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Payments ──────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getMyPayments({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.formationPayments,
      queryParameters: {'my': true, 'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Attendance ────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getMyAttendance({
    String? enrollmentId,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.sessionAttendance,
      queryParameters: {'my': true, 'enrollment': enrollmentId, 'page': page}
        ..removeWhere((_, v) => v == null),
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Level passages ────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getMyLevelPassages({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.levelPassages,
      queryParameters: {'my': true, 'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Fee structures ────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getFeeStructures({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.formationFeeStructures,
      queryParameters: {'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Homework ──────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getMyHomework({int page = 1}) async {
    final response = await _dioClient.dio.get(
      '/homework/tasks/',
      queryParameters: {'my': true, 'page': page},
    );
    return response.data as Map<String, dynamic>;
  }
}
