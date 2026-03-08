import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/network/sync_queue_service.dart';
import '../../../shared/data/models/communication_model.dart';
import '../../data/repositories/attendance_repository.dart';

// ── Events ──────────────────────────────────────────────────────────────────

abstract class TeacherEvent extends Equatable {
  const TeacherEvent();
  @override
  List<Object?> get props => [];
}

class TeacherLoadAttendance extends TeacherEvent {
  final String? classroomId;
  final String? date;
  const TeacherLoadAttendance({this.classroomId, this.date});
  @override
  List<Object?> get props => [classroomId, date];
}

class TeacherMarkAttendance extends TeacherEvent {
  final String classroomId;
  final String date;
  final List<Map<String, String>> records;
  const TeacherMarkAttendance({
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
  final List<AttendanceRecord> records;
  const TeacherAttendanceLoaded(this.records);
  @override
  List<Object?> get props => [records];
}

class TeacherAttendanceMarked extends TeacherState {}

class TeacherAttendanceQueued extends TeacherState {
  final int pendingCount;
  const TeacherAttendanceQueued(this.pendingCount);
  @override
  List<Object?> get props => [pendingCount];
}

class TeacherError extends TeacherState {
  final String message;
  const TeacherError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── BLoC ────────────────────────────────────────────────────────────────────

class TeacherBloc extends Bloc<TeacherEvent, TeacherState> {
  final AttendanceRepository _attendanceRepo = getIt<AttendanceRepository>();
  final SyncQueueService _syncQueue = getIt<SyncQueueService>();

  TeacherBloc() : super(TeacherInitial()) {
    on<TeacherLoadAttendance>(_onLoadAttendance);
    on<TeacherMarkAttendance>(_onMarkAttendance);
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

  Future<void> _onMarkAttendance(
    TeacherMarkAttendance event,
    Emitter<TeacherState> emit,
  ) async {
    emit(TeacherLoading());

    // Check connectivity first.
    bool offline = false;
    try {
      final result = await Connectivity().checkConnectivity();
      offline = result.contains(ConnectivityResult.none);
    } catch (_) {
      // Assume online if connectivity check fails (e.g., on web or in tests)
    }

    if (offline) {
      // Queue for later sync.
      await _syncQueue.enqueue(
        method: 'POST',
        path: '/attendance/mark/',
        body: {
          'classroom': event.classroomId,
          'date': event.date,
          'records': event.records,
        },
        label: 'Présence ${event.classroomId} — ${event.date}',
      );
      emit(TeacherAttendanceQueued(_syncQueue.pendingCount));
      return;
    }

    try {
      await _attendanceRepo.markAttendance(
        classroomId: event.classroomId,
        date: event.date,
        records: event.records,
      );
      emit(TeacherAttendanceMarked());
    } catch (e) {
      emit(TeacherError(e.toString()));
    }
  }
}
