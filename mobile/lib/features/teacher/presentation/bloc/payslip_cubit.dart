import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/payslip_model.dart';
import '../../data/repositories/payslip_repository.dart';

// ── States ──────────────────────────────────────────────────────────────────

abstract class PayslipState extends Equatable {
  const PayslipState();
  @override
  List<Object?> get props => [];
}

class PayslipInitial extends PayslipState {}

class PayslipLoading extends PayslipState {}

class PayslipLoaded extends PayslipState {
  final List<PaySlip> payslips;
  const PayslipLoaded(this.payslips);
  @override
  List<Object?> get props => [payslips];
}

class PayslipPdfReady extends PayslipState {
  final String pdfUrl;
  const PayslipPdfReady(this.pdfUrl);
  @override
  List<Object?> get props => [pdfUrl];
}

class PayslipError extends PayslipState {
  final String message;
  const PayslipError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── Cubit ───────────────────────────────────────────────────────────────────

class PayslipCubit extends Cubit<PayslipState> {
  final PayslipRepository _repo = getIt<PayslipRepository>();

  PayslipCubit() : super(PayslipInitial());

  Future<void> loadPayslips({int? year}) async {
    emit(PayslipLoading());
    try {
      final payslips = await _repo.getMyPayslips(year: year);
      emit(PayslipLoaded(payslips));
    } catch (e) {
      emit(PayslipError(e.toString()));
    }
  }

  Future<void> downloadPdf(String id) async {
    try {
      final url = await _repo.getPayslipPdfUrl(id);
      emit(PayslipPdfReady(url));
    } catch (e) {
      emit(PayslipError(e.toString()));
    }
  }
}
