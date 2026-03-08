import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/absence_excuse_model.dart';
import '../../data/repositories/absence_excuse_repository.dart';

// ── State ───────────────────────────────────────────────────────────────────

abstract class AbsenceExcuseState extends Equatable {
  const AbsenceExcuseState();
  @override
  List<Object?> get props => [];
}

class AbsenceExcuseInitial extends AbsenceExcuseState {}

class AbsenceExcuseLoading extends AbsenceExcuseState {}

class AbsenceExcuseListLoaded extends AbsenceExcuseState {
  final List<AbsenceExcuse> excuses;
  const AbsenceExcuseListLoaded(this.excuses);
  @override
  List<Object?> get props => [excuses];
}

class AbsenceExcuseSubmitting extends AbsenceExcuseState {}

class AbsenceExcuseSubmitted extends AbsenceExcuseState {
  final AbsenceExcuse excuse;
  const AbsenceExcuseSubmitted(this.excuse);
  @override
  List<Object?> get props => [excuse];
}

class AbsenceExcuseError extends AbsenceExcuseState {
  final String message;
  const AbsenceExcuseError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── Cubit ───────────────────────────────────────────────────────────────────

class AbsenceExcuseCubit extends Cubit<AbsenceExcuseState> {
  final AbsenceExcuseRepository _repo = getIt<AbsenceExcuseRepository>();

  AbsenceExcuseCubit() : super(AbsenceExcuseInitial());

  Future<void> loadExcuses() async {
    emit(AbsenceExcuseLoading());
    try {
      final excuses = await _repo.getMyExcuses();
      emit(AbsenceExcuseListLoaded(excuses));
    } catch (e) {
      emit(AbsenceExcuseError(e.toString()));
    }
  }

  Future<void> submitExcuse({
    required String attendanceRecordId,
    required String justificationText,
    String? attachmentPath,
  }) async {
    emit(AbsenceExcuseSubmitting());
    try {
      final excuse = await _repo.submitExcuse(
        attendanceRecordId: attendanceRecordId,
        justificationText: justificationText,
        attachmentPath: attachmentPath,
      );
      emit(AbsenceExcuseSubmitted(excuse));
    } catch (e) {
      emit(AbsenceExcuseError(e.toString()));
    }
  }
}
