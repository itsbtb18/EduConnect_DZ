import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/exam_model.dart';
import '../../data/repositories/exam_management_repository.dart';

// ── States ──────────────────────────────────────────────────────────────────

abstract class ExamManagementState extends Equatable {
  const ExamManagementState();
  @override
  List<Object?> get props => [];
}

class ExamManagementInitial extends ExamManagementState {}

class ExamManagementLoading extends ExamManagementState {}

class ExamTypesLoaded extends ExamManagementState {
  final List<ExamConfig> examTypes;
  const ExamTypesLoaded(this.examTypes);
  @override
  List<Object?> get props => [examTypes];
}

class GradesSaved extends ExamManagementState {}

class GradesSubmitted extends ExamManagementState {}

class WorkflowStatusLoaded extends ExamManagementState {
  final GradeWorkflowStatus status;
  const WorkflowStatusLoaded(this.status);
  @override
  List<Object?> get props => [status];
}

class CsvPreviewLoaded extends ExamManagementState {
  final CsvPreviewResult preview;
  const CsvPreviewLoaded(this.preview);
  @override
  List<Object?> get props => [preview];
}

class CsvConfirmed extends ExamManagementState {}

class ExamManagementError extends ExamManagementState {
  final String message;
  const ExamManagementError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── Cubit ───────────────────────────────────────────────────────────────────

class ExamManagementCubit extends Cubit<ExamManagementState> {
  final ExamManagementRepository _repo = getIt<ExamManagementRepository>();

  ExamManagementCubit() : super(ExamManagementInitial());

  Future<void> loadExamTypes({
    String? classroomId,
    String? subjectId,
    int? trimester,
  }) async {
    emit(ExamManagementLoading());
    try {
      final types = await _repo.getExamTypes(
        classroomId: classroomId,
        subjectId: subjectId,
        trimester: trimester,
      );
      emit(ExamTypesLoaded(types));
    } catch (e) {
      emit(ExamManagementError(e.toString()));
    }
  }

  Future<void> createExamType(ExamConfig config) async {
    emit(ExamManagementLoading());
    try {
      await _repo.createExamType(config);
      emit(GradesSaved());
    } catch (e) {
      emit(ExamManagementError(e.toString()));
    }
  }

  Future<void> bulkEnterGrades({
    required String examTypeId,
    required List<Map<String, dynamic>> grades,
  }) async {
    emit(ExamManagementLoading());
    try {
      await _repo.bulkEnterGrades(examTypeId: examTypeId, grades: grades);
      emit(GradesSaved());
    } catch (e) {
      emit(ExamManagementError(e.toString()));
    }
  }

  Future<void> submitGrades(String examTypeId) async {
    emit(ExamManagementLoading());
    try {
      await _repo.submitGrades(examTypeId);
      emit(GradesSubmitted());
    } catch (e) {
      emit(ExamManagementError(e.toString()));
    }
  }

  Future<void> loadWorkflowStatus(String examTypeId) async {
    emit(ExamManagementLoading());
    try {
      final status = await _repo.getWorkflowStatus(examTypeId);
      emit(WorkflowStatusLoaded(status));
    } catch (e) {
      emit(ExamManagementError(e.toString()));
    }
  }

  Future<void> previewCsv(String filePath) async {
    emit(ExamManagementLoading());
    try {
      final preview = await _repo.csvPreview(filePath);
      emit(CsvPreviewLoaded(preview));
    } catch (e) {
      emit(ExamManagementError(e.toString()));
    }
  }

  Future<void> confirmCsv(String previewId) async {
    emit(ExamManagementLoading());
    try {
      await _repo.csvConfirm(previewId);
      emit(CsvConfirmed());
    } catch (e) {
      emit(ExamManagementError(e.toString()));
    }
  }
}
