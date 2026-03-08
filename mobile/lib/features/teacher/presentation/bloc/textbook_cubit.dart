import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/textbook_model.dart';
import '../../data/repositories/textbook_repository.dart';

// ── States ──────────────────────────────────────────────────────────────────

abstract class TextbookState extends Equatable {
  const TextbookState();
  @override
  List<Object?> get props => [];
}

class TextbookInitial extends TextbookState {}

class TextbookLoading extends TextbookState {}

class TextbookLoaded extends TextbookState {
  final List<Lesson> lessons;
  const TextbookLoaded(this.lessons);
  @override
  List<Object?> get props => [lessons];
}

class TextbookSaving extends TextbookState {}

class TextbookSaved extends TextbookState {}

class TextbookError extends TextbookState {
  final String message;
  const TextbookError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── Cubit ───────────────────────────────────────────────────────────────────

class TextbookCubit extends Cubit<TextbookState> {
  final TextbookRepository _repo = getIt<TextbookRepository>();

  TextbookCubit() : super(TextbookInitial());

  Future<void> loadLessons({String? classroomId, String? subjectId}) async {
    emit(TextbookLoading());
    try {
      final lessons = await _repo.getLessons(
        classroomId: classroomId,
        subjectId: subjectId,
      );
      emit(TextbookLoaded(lessons));
    } catch (e) {
      emit(TextbookError(e.toString()));
    }
  }

  Future<void> createLesson(Map<String, dynamic> data) async {
    emit(TextbookSaving());
    try {
      await _repo.createLesson(data);
      emit(TextbookSaved());
    } catch (e) {
      emit(TextbookError(e.toString()));
    }
  }

  Future<void> updateLesson(String id, Map<String, dynamic> data) async {
    emit(TextbookSaving());
    try {
      await _repo.updateLesson(id, data);
      emit(TextbookSaved());
    } catch (e) {
      emit(TextbookError(e.toString()));
    }
  }

  Future<void> deleteLesson(String id) async {
    emit(TextbookSaving());
    try {
      await _repo.deleteLesson(id);
      emit(TextbookSaved());
    } catch (e) {
      emit(TextbookError(e.toString()));
    }
  }
}
