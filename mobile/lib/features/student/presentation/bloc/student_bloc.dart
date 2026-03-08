import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/storage/hive_storage_service.dart';
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

class StudentLoadHomework extends StudentEvent {}

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

class StudentSubjectsLoaded extends StudentState {
  final List<Subject> subjects;
  const StudentSubjectsLoaded(this.subjects);
  @override
  List<Object?> get props => [subjects];
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
  final HiveStorageService _cache = getIt<HiveStorageService>();

  StudentBloc() : super(StudentInitial()) {
    on<StudentLoadGrades>(_onLoadGrades);
    on<StudentLoadHomework>(_onLoadHomework);
    on<StudentLoadSchedule>(_onLoadSchedule);
    on<StudentLoadSubjects>(_onLoadSubjects);
  }

  Future<void> _onLoadGrades(
    StudentLoadGrades event,
    Emitter<StudentState> emit,
  ) async {
    // Serve cached data instantly, then refresh.
    final cacheKey = 'grades_${event.subjectId}_${event.semesterId}';
    final cached = _cache.getDomainSync('grades', cacheKey);
    if (cached != null) {
      final grades = (cached as List)
          .map((e) => Grade.fromJson(e as Map<String, dynamic>))
          .toList();
      emit(StudentGradesLoaded(grades));
    } else {
      emit(StudentLoading());
    }

    try {
      final grades = await _gradeRepo.getGrades(
        subjectId: event.subjectId,
        semesterId: event.semesterId,
      );
      await _cache.cacheDomain(
        'grades',
        cacheKey,
        grades.map((g) => g.toJson()).toList(),
      );
      emit(StudentGradesLoaded(grades));
    } catch (e) {
      // Only emit error if we had no cached data.
      if (cached == null) emit(StudentError(e.toString()));
    }
  }

  Future<void> _onLoadHomework(
    StudentLoadHomework event,
    Emitter<StudentState> emit,
  ) async {
    final cached = _cache.getDomainSync('homework', 'tasks');
    if (cached != null) {
      final tasks = (cached as List)
          .map((e) => HomeworkTask.fromJson(e as Map<String, dynamic>))
          .toList();
      emit(StudentHomeworkLoaded(tasks));
    } else {
      emit(StudentLoading());
    }

    try {
      final tasks = await _homeworkRepo.getTasks();
      await _cache.cacheDomain(
        'homework',
        'tasks',
        tasks.map((t) => t.toJson()).toList(),
      );
      emit(StudentHomeworkLoaded(tasks));
    } catch (e) {
      if (cached == null) emit(StudentError(e.toString()));
    }
  }

  Future<void> _onLoadSchedule(
    StudentLoadSchedule event,
    Emitter<StudentState> emit,
  ) async {
    final cached = _cache.getDomainSync('schedule', 'slots');
    if (cached != null) {
      final slots = (cached as List)
          .map((e) => ScheduleSlot.fromJson(e as Map<String, dynamic>))
          .toList();
      emit(StudentScheduleLoaded(slots));
    } else {
      emit(StudentLoading());
    }

    try {
      final slots = await _academicRepo.getSchedule();
      await _cache.cacheDomain(
        'schedule',
        'slots',
        slots.map((s) => s.toJson()).toList(),
        ttl: const Duration(hours: 6),
      );
      emit(StudentScheduleLoaded(slots));
    } catch (e) {
      if (cached == null) emit(StudentError(e.toString()));
    }
  }

  Future<void> _onLoadSubjects(
    StudentLoadSubjects event,
    Emitter<StudentState> emit,
  ) async {
    final cached = _cache.getDomainSync('subjects', 'list');
    if (cached != null) {
      final subjects = (cached as List)
          .map((e) => Subject.fromJson(e as Map<String, dynamic>))
          .toList();
      emit(StudentSubjectsLoaded(subjects));
    } else {
      emit(StudentLoading());
    }

    try {
      final subjects = await _academicRepo.getSubjects();
      await _cache.cacheDomain(
        'subjects',
        'list',
        subjects.map((s) => s.toJson()).toList(),
      );
      emit(StudentSubjectsLoaded(subjects));
    } catch (e) {
      if (cached == null) emit(StudentError(e.toString()));
    }
  }
}
