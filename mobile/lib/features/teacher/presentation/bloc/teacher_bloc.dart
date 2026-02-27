import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/repositories/attendance_repository.dart';

// ── Events ──────────────────────────────────────────────────────────────────

abstract class TeacherEvent extends Equatable {
  const TeacherEvent();
  @override
  List<Object?> get props => [];
}

class TeacherLoadAttendance extends TeacherEvent {
  final String classroomId;
  final String date;
  const TeacherLoadAttendance({required this.classroomId, required this.date});
  @override
  List<Object?> get props => [classroomId, date];
}

class TeacherSubmitAttendance extends TeacherEvent {
  final String classroomId;
  final String date;
  final List<Map<String, String>> records;
  const TeacherSubmitAttendance({
    required this.classroomId,
    required this.date,
    required this.records,
  });
  @override
  List<Object?> get props => [classroomId, date, records];
}

// ── States ──────────────────────────────────────────────────────────────────

abstract class TeacherState extends Equatable {
  const TeacherState();
  @override
  List<Object?> get props => [];
}

class TeacherInitial extends TeacherState {}

class TeacherLoading extends TeacherState {}

class TeacherAttendanceLoaded extends TeacherState {
  final List<dynamic> records;
  const TeacherAttendanceLoaded(this.records);
  @override
  List<Object?> get props => [records];
}

class TeacherAttendanceSubmitted extends TeacherState {}

class TeacherError extends TeacherState {
  final String message;
  const TeacherError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── BLoC ────────────────────────────────────────────────────────────────────

class TeacherBloc extends Bloc<TeacherEvent, TeacherState> {
  final AttendanceRepository _attendanceRepo = getIt<AttendanceRepository>();

  TeacherBloc() : super(TeacherInitial()) {
    on<TeacherLoadAttendance>(_onLoadAttendance);
    on<TeacherSubmitAttendance>(_onSubmitAttendance);
  }

  Future<void> _onLoadAttendance(
    TeacherLoadAttendance event,
    Emitter<TeacherState> emit,
  ) async {
    emit(TeacherLoading());
    try {
      final records = await _attendanceRepo.getRecords(
        classroomId: event.classroomId,
        date: event.date,
      );
      emit(TeacherAttendanceLoaded(records));
    } catch (e) {
      emit(TeacherError(e.toString()));
    }
  }

  Future<void> _onSubmitAttendance(
    TeacherSubmitAttendance event,
    Emitter<TeacherState> emit,
  ) async {
    emit(TeacherLoading());
    try {
      await _attendanceRepo.markAttendance(
        classroomId: event.classroomId,
        date: event.date,
        records: event.records,
      );
      emit(TeacherAttendanceSubmitted());
    } catch (e) {
      emit(TeacherError(e.toString()));
    }
  }
}
