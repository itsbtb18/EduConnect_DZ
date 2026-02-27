import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';

/// Raw network calls for teacher-facing endpoints:
/// attendance marking, grade entry, homework management.
class TeacherRemoteDatasource {
  final DioClient _dioClient;

  TeacherRemoteDatasource(this._dioClient);

  // ── Attendance ────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getAttendanceRecords({
    String? classroomId,
    String? studentId,
    String? date,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.attendance,
      queryParameters: {
        'classroom': ?classroomId,
        'student': ?studentId,
        'date': ?date,
        'page': page,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> markAttendance({
    required String classroomId,
    required String date,
    required List<Map<String, String>> records,
  }) async {
    await _dioClient.dio.post(
      ApiEndpoints.attendance,
      data: {'classroom': classroomId, 'date': date, 'records': records},
    );
  }

  // ── Grade entry ───────────────────────────────────────────────────────────

  Future<void> submitGrade({
    required String studentId,
    required String subjectId,
    required String examTypeId,
    required double score,
    String? comment,
  }) async {
    await _dioClient.dio.post(
      ApiEndpoints.grades,
      data: {
        'student': studentId,
        'subject': subjectId,
        'exam_type': examTypeId,
        'score': score,
        'comment': ?comment,
      },
    );
  }

  Future<Map<String, dynamic>> getExamTypes() async {
    final response = await _dioClient.dio.get(ApiEndpoints.examTypes);
    return response.data as Map<String, dynamic>;
  }

  // ── Homework management ───────────────────────────────────────────────────

  Future<void> createHomework({required Map<String, dynamic> data}) async {
    await _dioClient.dio.post(ApiEndpoints.homework, data: data);
  }

  Future<void> updateHomework({
    required String id,
    required Map<String, dynamic> data,
  }) async {
    await _dioClient.dio.patch('${ApiEndpoints.homework}$id/', data: data);
  }

  Future<Map<String, dynamic>> getSubmissions({
    required String homeworkId,
    int page = 1,
  }) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.submissions,
      queryParameters: {'homework': homeworkId, 'page': page},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> gradeSubmission({
    required String submissionId,
    required double score,
    String? feedback,
  }) async {
    await _dioClient.dio.patch(
      '${ApiEndpoints.submissions}$submissionId/',
      data: {'score': score, 'feedback': ?feedback},
    );
  }

  // ── Absence excuses ──────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getAbsenceExcuses({int page = 1}) async {
    final response = await _dioClient.dio.get(
      ApiEndpoints.absenceExcuses,
      queryParameters: {'page': page},
    );
    return response.data as Map<String, dynamic>;
  }
}
