import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/grade_model.dart';
import '../../data/models/homework_model.dart';
import '../../data/models/academic_model.dart';
import '../../data/repositories/grade_repository.dart';
import '../../data/repositories/homework_repository.dart';
import '../../data/repositories/academic_repository.dart';

// ── Events ──────────────────────────────────────────────────────────────────

abstract class StudentEvent extends Equatable {
  const StudentEvent();
  @override
  List<Object?> get props => [];
}

class StudentLoadGrades extends StudentEvent {
  final String? subjectId;
  final String? semesterId;
  const StudentLoadGrades({this.subjectId, this.semesterId});
  @override
  List<Object?> get props => [subjectId, semesterId];
}

class StudentLoadHomework extends StudentEvent {
  final String? status;
  const StudentLoadHomework({this.status});
  @override
  List<Object?> get props => [status];
}

class StudentLoadSchedule extends StudentEvent {}

class StudentLoadSubjects extends StudentEvent {}

// ── States ──────────────────────────────────────────────────────────────────

abstract class StudentState extends Equatable {
  const StudentState();
  @override
  List<Object?> get props => [];
}

class StudentInitial extends StudentState {}

class StudentLoading extends StudentState {}

class StudentGradesLoaded extends StudentState {
  final List<Grade> grades;
  const StudentGradesLoaded(this.grades);
  @override
  List<Object?> get props => [grades];
}

class StudentHomeworkLoaded extends StudentState {
  final List<HomeworkTask> tasks;
  const StudentHomeworkLoaded(this.tasks);
  @override
  List<Object?> get props => [tasks];
}

class StudentScheduleLoaded extends StudentState {
  final List<ScheduleSlot> slots;
  const StudentScheduleLoaded(this.slots);
  @override
  List<Object?> get props => [slots];
}

class StudentError extends StudentState {
  final String message;
  const StudentError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── BLoC ────────────────────────────────────────────────────────────────────

class StudentBloc extends Bloc<StudentEvent, StudentState> {
  final GradeRepository _gradeRepo = getIt<GradeRepository>();
  final HomeworkRepository _homeworkRepo = getIt<HomeworkRepository>();
  final AcademicRepository _academicRepo = getIt<AcademicRepository>();

  StudentBloc() : super(StudentInitial()) {
    on<StudentLoadGrades>(_onLoadGrades);
    on<StudentLoadHomework>(_onLoadHomework);
    on<StudentLoadSchedule>(_onLoadSchedule);
  }

  Future<void> _onLoadGrades(
    StudentLoadGrades event,
    Emitter<StudentState> emit,
  ) async {
    emit(StudentLoading());
    try {
      final grades = await _gradeRepo.getGrades(
        subjectId: event.subjectId,
        semesterId: event.semesterId,
      );
      emit(StudentGradesLoaded(grades));
    } catch (e) {
      emit(StudentError(e.toString()));
    }
  }

  Future<void> _onLoadHomework(
    StudentLoadHomework event,
    Emitter<StudentState> emit,
  ) async {
    emit(StudentLoading());
    try {
      final tasks = await _homeworkRepo.getTasks();
      emit(StudentHomeworkLoaded(tasks));
    } catch (e) {
      emit(StudentError(e.toString()));
    }
  }

  Future<void> _onLoadSchedule(
    StudentLoadSchedule event,
    Emitter<StudentState> emit,
  ) async {
    emit(StudentLoading());
    try {
      final slots = await _academicRepo.getSchedule();
      emit(StudentScheduleLoaded(slots));
    } catch (e) {
      emit(StudentError(e.toString()));
    }
  }
}
