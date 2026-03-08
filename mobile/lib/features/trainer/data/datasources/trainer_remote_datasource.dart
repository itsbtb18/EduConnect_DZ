import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';

/// Raw network calls for trainer (formateur) endpoints.
class TrainerRemoteDatasource {
  final DioClient _dioClient;

  TrainerRemoteDatasource(this._dioClient);

  // ── Dashboard ─────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getDashboard() async {
    final response = await _dioClient.dio.get(ApiEndpoints.formationDashboard);
    return response.data as Map<String, dynamic>;
  }

  // ── Groups ────────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getMyGroups({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.trainingGroups,
      queryParameters: {'page': page, 'my': true},
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Sessions ──────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getSessions({
    String? groupId,
    String? date,
    String? status,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.trainingSessions,
      queryParameters: {
        'group': groupId,
        'date': date,
        'status': status,
        'page': page,
      }..removeWhere((_, v) => v == null),
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> cancelSession({
    required String sessionId,
    required String reason,
  }) async {
    await _dioClient.dio.patch(
      ApiEndpoints.sessionCancel(sessionId),
      data: {'status': 'CANCELLED', 'cancellation_reason': reason},
    );
  }

  Future<void> requestReplacement({
    required String sessionId,
    required String reason,
  }) async {
    await _dioClient.dio.post(
      '${ApiEndpoints.trainingSessions}$sessionId/request-replacement/',
      data: {'reason': reason},
    );
  }

  // ── Attendance ────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getSessionAttendance({
    required String sessionId,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.sessionAttendance,
      queryParameters: {'session': sessionId},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> bulkMarkAttendance({
    required String sessionId,
    required List<Map<String, dynamic>> records,
  }) async {
    await _dioClient.dio.post(
      ApiEndpoints.sessionAttendanceBulk,
      data: {'session': sessionId, 'records': records},
    );
  }

  // ── Enrollments (learners in a group) ─────────────────────────────────────
  Future<Map<String, dynamic>> getGroupEnrollments({
    required String groupId,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.trainingEnrollments,
      queryParameters: {'group': groupId, 'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Evaluations (placement tests) ────────────────────────────────────────
  Future<Map<String, dynamic>> getPlacementTests({
    String? groupId,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.placementTests,
      queryParameters: {'group': groupId, 'page': page}
        ..removeWhere((_, v) => v == null),
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> createPlacementTest({required Map<String, dynamic> data}) async {
    await _dioClient.dio.post(ApiEndpoints.placementTests, data: data);
  }

  Future<void> validatePlacementTest({required String id}) async {
    await _dioClient.dio.post(ApiEndpoints.placementTestValidate(id));
  }

  // ── Level passages ────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getLevelPassages({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.levelPassages,
      queryParameters: {'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> createLevelPassage({required Map<String, dynamic> data}) async {
    await _dioClient.dio.post(ApiEndpoints.levelPassages, data: data);
  }

  // ── Salary / Hours ────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getMySalaryConfig() async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.trainerSalaryConfigs,
      queryParameters: {'my': true},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getMyPayslips({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.trainerPayslips,
      queryParameters: {'my': true, 'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  // ── Homework / Resources (reuse existing endpoints) ───────────────────────
  Future<Map<String, dynamic>> getHomework({
    String? groupId,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      '/homework/tasks/',
      queryParameters: {'group': groupId, 'page': page}
        ..removeWhere((_, v) => v == null),
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> createHomework({required Map<String, dynamic> data}) async {
    await _dioClient.dio.post('/homework/tasks/', data: data);
  }

  Future<Map<String, dynamic>> getResources({int page = 1}) async {
    final response = await _dioClient.dio.get(
      '/academics/resources/',
      queryParameters: {'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> createResource({required Map<String, dynamic> data}) async {
    await _dioClient.dio.post('/academics/resources/', data: data);
  }
}
