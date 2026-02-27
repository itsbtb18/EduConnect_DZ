import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/finance_model.dart';
import '../../data/repositories/finance_repository.dart';

// ── Events ──────────────────────────────────────────────────────────────────

abstract class ParentEvent extends Equatable {
  const ParentEvent();
  @override
  List<Object?> get props => [];
}

class ParentLoadPayments extends ParentEvent {
  final String studentId;
  const ParentLoadPayments({required this.studentId});
  @override
  List<Object?> get props => [studentId];
}

class ParentLoadFees extends ParentEvent {}

class ParentLoadFinanceSummary extends ParentEvent {
  final String studentId;
  const ParentLoadFinanceSummary({required this.studentId});
  @override
  List<Object?> get props => [studentId];
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
  final List<Payment> payments;
  const ParentPaymentsLoaded(this.payments);
  @override
  List<Object?> get props => [payments];
}

class ParentFeesLoaded extends ParentState {
  final List<FeeStructure> fees;
  const ParentFeesLoaded(this.fees);
  @override
  List<Object?> get props => [fees];
}

class ParentFinanceSummaryLoaded extends ParentState {
  final FinanceSummary summary;
  const ParentFinanceSummaryLoaded(this.summary);
  @override
  List<Object?> get props => [summary];
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
    on<ParentLoadFees>(_onLoadFees);
    on<ParentLoadFinanceSummary>(_onLoadFinanceSummary);
  }

  Future<void> _onLoadPayments(
    ParentLoadPayments event,
    Emitter<ParentState> emit,
  ) async {
    emit(ParentLoading());
    try {
      final payments = await _financeRepo.getPayments(
        studentId: event.studentId,
      );
      emit(ParentPaymentsLoaded(payments));
    } catch (e) {
      emit(ParentError(e.toString()));
    }
  }

  Future<void> _onLoadFees(
    ParentLoadFees event,
    Emitter<ParentState> emit,
  ) async {
    emit(ParentLoading());
    try {
      final fees = await _financeRepo.getFees();
      emit(ParentFeesLoaded(fees));
    } catch (e) {
      emit(ParentError(e.toString()));
    }
  }

  Future<void> _onLoadFinanceSummary(
    ParentLoadFinanceSummary event,
    Emitter<ParentState> emit,
  ) async {
    emit(ParentLoading());
    try {
      final summary = await _financeRepo.getFinanceSummary(event.studentId);
      emit(ParentFinanceSummaryLoaded(summary));
    } catch (e) {
      emit(ParentError(e.toString()));
    }
  }
}
