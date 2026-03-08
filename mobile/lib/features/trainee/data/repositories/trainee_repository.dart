import 'package:dio/dio.dart';
import '../datasources/trainee_remote_datasource.dart';
import 'package:ilmi_mobile/features/trainer/data/models/formation_models.dart';

/// Repository wrapping trainee datasource with model conversion + error handling.
class TraineeRepository {
  final TraineeRemoteDatasource _ds;

  TraineeRepository(this._ds);

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

  Future<List<TrainingEnrollment>> getMyEnrollments() async {
    try {
      final data = await _ds.getMyEnrollments();
      final results = data['results'] as List<dynamic>? ?? <dynamic>[];
      return results
          .map((e) => TrainingEnrollment.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement inscriptions',
      );
    }
  }

  Future<List<TrainingSession>> getMySessions({
    String? date,
    String? weekStart,
  }) async {
    try {
      final data = await _ds.getMySessions(date: date, weekStart: weekStart);
      final results = data['results'] as List<dynamic>? ?? <dynamic>[];
      return results
          .map((e) => TrainingSession.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement séances',
      );
    }
  }

  Future<List<Certificate>> getMyCertificates() async {
    try {
      final data = await _ds.getMyCertificates();
      final results = data['results'] as List<dynamic>? ?? <dynamic>[];
      return results
          .map((e) => Certificate.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement certificats',
      );
    }
  }

  Future<List<PlacementTest>> getMyPlacementTests() async {
    try {
      final data = await _ds.getMyPlacementTests();
      final results = data['results'] as List<dynamic>? ?? <dynamic>[];
      return results
          .map((e) => PlacementTest.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['detail'] ?? 'Erreur chargement tests');
    }
  }

  Future<List<LearnerPayment>> getMyPayments() async {
    try {
      final data = await _ds.getMyPayments();
      final results = data['results'] as List<dynamic>? ?? <dynamic>[];
      return results
          .map((e) => LearnerPayment.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement paiements',
      );
    }
  }

  Future<List<SessionAttendance>> getMyAttendance({
    String? enrollmentId,
  }) async {
    try {
      final data = await _ds.getMyAttendance(enrollmentId: enrollmentId);
      final results = data['results'] as List<dynamic>? ?? <dynamic>[];
      return results
          .map((e) => SessionAttendance.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement présences',
      );
    }
  }

  Future<List<LevelPassage>> getMyLevelPassages() async {
    try {
      final data = await _ds.getMyLevelPassages();
      final results = data['results'] as List<dynamic>? ?? <dynamic>[];
      return results
          .map((e) => LevelPassage.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['detail'] ?? 'Erreur chargement passages',
      );
    }
  }
}
