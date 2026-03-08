import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/medical_model.dart';
import '../../data/repositories/medical_repository.dart';

// ── Events ──────────────────────────────────────────────────────────────────

abstract class MedicalEvent extends Equatable {
  const MedicalEvent();
  @override
  List<Object?> get props => [];
}

class LoadMedicalSummary extends MedicalEvent {
  final String studentId;
  const LoadMedicalSummary({required this.studentId});
  @override
  List<Object?> get props => [studentId];
}

class LoadVaccinations extends MedicalEvent {
  final String studentId;
  const LoadVaccinations({required this.studentId});
  @override
  List<Object?> get props => [studentId];
}

class LoadInfirmeryMessages extends MedicalEvent {
  final String studentId;
  const LoadInfirmeryMessages({required this.studentId});
  @override
  List<Object?> get props => [studentId];
}

class SubmitMedicalUpdate extends MedicalEvent {
  final String studentId;
  final Map<String, dynamic> updateData;
  const SubmitMedicalUpdate({
    required this.studentId,
    required this.updateData,
  });
  @override
  List<Object?> get props => [studentId, updateData];
}

// ── States ──────────────────────────────────────────────────────────────────

abstract class MedicalState extends Equatable {
  const MedicalState();
  @override
  List<Object?> get props => [];
}

class MedicalInitial extends MedicalState {}

class MedicalLoading extends MedicalState {}

class MedicalSummaryLoaded extends MedicalState {
  final MedicalSummary summary;
  const MedicalSummaryLoaded(this.summary);
  @override
  List<Object?> get props => [summary];
}

class VaccinationsLoaded extends MedicalState {
  final List<VaccinationRecord> vaccinations;
  const VaccinationsLoaded(this.vaccinations);
  @override
  List<Object?> get props => [vaccinations];
}

class InfirmeryMessagesLoaded extends MedicalState {
  final List<InfirmeryMessage> messages;
  const InfirmeryMessagesLoaded(this.messages);
  @override
  List<Object?> get props => [messages];
}

class MedicalUpdateSubmitted extends MedicalState {}

class MedicalError extends MedicalState {
  final String message;
  const MedicalError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── BLoC ────────────────────────────────────────────────────────────────────

class MedicalBloc extends Bloc<MedicalEvent, MedicalState> {
  final MedicalRepository _repo = getIt<MedicalRepository>();

  MedicalBloc() : super(MedicalInitial()) {
    on<LoadMedicalSummary>(_onLoadSummary);
    on<LoadVaccinations>(_onLoadVaccinations);
    on<LoadInfirmeryMessages>(_onLoadMessages);
    on<SubmitMedicalUpdate>(_onSubmitUpdate);
  }

  Future<void> _onLoadSummary(
    LoadMedicalSummary event,
    Emitter<MedicalState> emit,
  ) async {
    emit(MedicalLoading());
    try {
      final summary = await _repo.getMedicalSummary(event.studentId);
      emit(MedicalSummaryLoaded(summary));
    } catch (e) {
      emit(MedicalError(e.toString()));
    }
  }

  Future<void> _onLoadVaccinations(
    LoadVaccinations event,
    Emitter<MedicalState> emit,
  ) async {
    emit(MedicalLoading());
    try {
      final vaccinations = await _repo.getVaccinations(event.studentId);
      emit(VaccinationsLoaded(vaccinations));
    } catch (e) {
      emit(MedicalError(e.toString()));
    }
  }

  Future<void> _onLoadMessages(
    LoadInfirmeryMessages event,
    Emitter<MedicalState> emit,
  ) async {
    emit(MedicalLoading());
    try {
      final messages = await _repo.getMessages(event.studentId);
      emit(InfirmeryMessagesLoaded(messages));
    } catch (e) {
      emit(MedicalError(e.toString()));
    }
  }

  Future<void> _onSubmitUpdate(
    SubmitMedicalUpdate event,
    Emitter<MedicalState> emit,
  ) async {
    emit(MedicalLoading());
    try {
      await _repo.submitMedicalUpdate(
        studentId: event.studentId,
        updateData: event.updateData,
      );
      emit(MedicalUpdateSubmitted());
    } catch (e) {
      emit(MedicalError(e.toString()));
    }
  }
}
