import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/repositories/finance_repository.dart';

// ── Events ──────────────────────────────────────────────────────────────────

abstract class ParentEvent extends Equatable {
  const ParentEvent();
  @override
  List<Object?> get props => [];
}

class ParentLoadChildGrades extends ParentEvent {
  final String childId;
  const ParentLoadChildGrades(this.childId);
  @override
  List<Object?> get props => [childId];
}

class ParentLoadPayments extends ParentEvent {
  final String? childId;
  const ParentLoadPayments({this.childId});
  @override
  List<Object?> get props => [childId];
}

// ── States ──────────────────────────────────────────────────────────────────

abstract class ParentState extends Equatable {
  const ParentState();
  @override
  List<Object?> get props => [];
}

class ParentInitial extends ParentState {}

class ParentLoading extends ParentState {}

class ParentPaymentsLoaded extends ParentState {
  final List<dynamic> payments;
  const ParentPaymentsLoaded(this.payments);
  @override
  List<Object?> get props => [payments];
}

class ParentError extends ParentState {
  final String message;
  const ParentError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── BLoC ────────────────────────────────────────────────────────────────────

class ParentBloc extends Bloc<ParentEvent, ParentState> {
  final FinanceRepository _financeRepo = getIt<FinanceRepository>();

  ParentBloc() : super(ParentInitial()) {
    on<ParentLoadPayments>(_onLoadPayments);
  }

  Future<void> _onLoadPayments(
    ParentLoadPayments event,
    Emitter<ParentState> emit,
  ) async {
    emit(ParentLoading());
    try {
      final payments = await _financeRepo.getPayments(
        studentId: event.childId ?? '',
      );
      emit(ParentPaymentsLoaded(payments));
    } catch (e) {
      emit(ParentError(e.toString()));
    }
  }
}
