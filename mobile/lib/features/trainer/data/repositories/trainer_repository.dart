import 'package:dio/dio.dart';
import '../datasources/trainer_remote_datasource.dart';
import '../models/formation_models.dart';

/// Repository wrapping trainer datasource with model conversion + error handling.
class TrainerRepository {
  final TrainerRemoteDatasource _ds;

  TrainerRepository(this._ds);

  Future<FormationDashboardStats> getDashboard() async {
    try {
      final data = await _ds.getDashboard();
      return FormationDashboardStats.fromJson(data);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement dashboard',
      );
    }
  }

  Future<List<TrainingGroup>> getMyGroups() async {
    try {
      final data = await _ds.getMyGroups();
      final results =
          data['results'] as List<dynamic>? ?? <dynamic>[];
      return results
          .map((e) => TrainingGroup.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement groupes',
      );
    }
  }

  Future<List<TrainingSession>> getSessions({
    String? groupId,
    String? date,
    String? status,
  }) async {
    try {
      final data = await _ds.getSessions(
        groupId: groupId,
        date: date,
        status: status,
      );
      final results =
          data['results'] as List<dynamic>? ?? <dynamic>[];
      return results
          .map((e) => TrainingSession.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement séances',
      );
    }
  }

  Future<void> cancelSession({
    required String sessionId,
    required String reason,
  }) async {
    try {
      await _ds.cancelSession(sessionId: sessionId, reason: reason);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur annulation séance',
      );
    }
  }

  Future<void> requestReplacement({
    required String sessionId,
    required String reason,
  }) async {
    try {
      await _ds.requestReplacement(sessionId: sessionId, reason: reason);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur demande remplacement',
      );
    }
  }

  Future<List<SessionAttendance>> getSessionAttendance({
    required String sessionId,
  }) async {
    try {
      final data = await _ds.getSessionAttendance(sessionId: sessionId);
      final results =
          data['results'] as List<dynamic>? ?? <dynamic>[];
      return results
          .map((e) => SessionAttendance.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement présences',
      );
    }
  }

  Future<void> bulkMarkAttendance({
    required String sessionId,
    required List<Map<String, dynamic>> records,
  }) async {
    try {
      await _ds.bulkMarkAttendance(sessionId: sessionId, records: records);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur marquage présences',
      );
    }
  }

  Future<List<TrainingEnrollment>> getGroupEnrollments({
    required String groupId,
  }) async {
    try {
      final data = await _ds.getGroupEnrollments(groupId: groupId);
      final results =
          data['results'] as List<dynamic>? ?? <dynamic>[];
      return results
          .map((e) => TrainingEnrollment.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement apprenants',
      );
    }
  }

  Future<List<PlacementTest>> getPlacementTests({String? groupId}) async {
    try {
      final data = await _ds.getPlacementTests(groupId: groupId);
      final results =
          data['results'] as List<dynamic>? ?? <dynamic>[];
      return results
          .map((e) => PlacementTest.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['detail'] ?? 'Erreur chargement tests');
    }
  }

  Future<void> createPlacementTest({required Map<String, dynamic> data}) async {
    try {
      await _ds.createPlacementTest(data: data);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['detail'] ?? 'Erreur création test');
    }
  }

  Future<void> validatePlacementTest({required String id}) async {
    try {
      await _ds.validatePlacementTest(id: id);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['detail'] ?? 'Erreur validation test');
    }
  }

  Future<List<LevelPassage>> getLevelPassages() async {
    try {
      final data = await _ds.getLevelPassages();
      final results =
          data['results'] as List<dynamic>? ?? <dynamic>[];
      return results
          .map((e) => LevelPassage.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement passages',
      );
    }
  }

  Future<TrainerSalaryConfig?> getMySalaryConfig() async {
    try {
      final data = await _ds.getMySalaryConfig();
      final results = data['results'] as List<dynamic>? ?? [];
      if (results.isEmpty) return null;
      return TrainerSalaryConfig.fromJson(
        results.first as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement salaire',
      );
    }
  }

  Future<Map<String, dynamic>> getHomework({String? groupId}) async {
    try {
      return await _ds.getHomework(groupId: groupId);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement devoirs',
      );
    }
  }

  Future<void> createHomework({required Map<String, dynamic> data}) async {
    try {
      await _ds.createHomework(data: data);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['detail'] ?? 'Erreur création devoir');
    }
  }

  Future<Map<String, dynamic>> getResources() async {
    try {
      return await _ds.getResources();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement ressources',
      );
    }
  }

  Future<void> createResource({required Map<String, dynamic> data}) async {
    try {
      await _ds.createResource(data: data);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur création ressource',
      );
    }
  }
}
