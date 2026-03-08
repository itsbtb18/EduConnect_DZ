import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/announcement_model.dart';
import '../../data/repositories/announcement_repository.dart';

// ── States ──────────────────────────────────────────────────────────────────

abstract class AnnouncementState extends Equatable {
  const AnnouncementState();
  @override
  List<Object?> get props => [];
}

class AnnouncementInitial extends AnnouncementState {}

class AnnouncementLoading extends AnnouncementState {}

class AnnouncementLoaded extends AnnouncementState {
  final List<Announcement> announcements;
  const AnnouncementLoaded(this.announcements);
  @override
  List<Object?> get props => [announcements];
}

class AnnouncementError extends AnnouncementState {
  final String message;
  const AnnouncementError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── Cubit ───────────────────────────────────────────────────────────────────

class AnnouncementCubit extends Cubit<AnnouncementState> {
  final AnnouncementRepository _repo = getIt<AnnouncementRepository>();

  AnnouncementCubit() : super(AnnouncementInitial());

  Future<void> loadAnnouncements({String? targetAudience}) async {
    emit(AnnouncementLoading());
    try {
      final list = await _repo.getAnnouncements(targetAudience: targetAudience);
      emit(AnnouncementLoaded(list));
    } catch (e) {
      emit(AnnouncementError(e.toString()));
    }
  }
}
