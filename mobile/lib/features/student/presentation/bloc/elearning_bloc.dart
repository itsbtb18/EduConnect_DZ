import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/elearning_model.dart';
import '../../data/repositories/elearning_repository.dart';

// ═══════════════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════════════

abstract class ElearningEvent extends Equatable {
  const ElearningEvent();
  @override
  List<Object?> get props => [];
}

class LoadResources extends ElearningEvent {
  final String? query;
  final String? type;
  final String? subject;
  const LoadResources({this.query, this.type, this.subject});
  @override
  List<Object?> get props => [query, type, subject];
}

class LoadExams extends ElearningEvent {
  final String? query;
  final String? type;
  final int? year;
  const LoadExams({this.query, this.type, this.year});
  @override
  List<Object?> get props => [query, type, year];
}

class LoadQuizzes extends ElearningEvent {
  const LoadQuizzes();
}

class LoadQuizDetail extends ElearningEvent {
  final String quizId;
  const LoadQuizDetail(this.quizId);
  @override
  List<Object?> get props => [quizId];
}

class SubmitQuiz extends ElearningEvent {
  final String quizId;
  final Map<String, dynamic> answers;
  const SubmitQuiz(this.quizId, this.answers);
  @override
  List<Object?> get props => [quizId, answers];
}

class LoadMyAttempts extends ElearningEvent {
  const LoadMyAttempts();
}

class LoadProgress extends ElearningEvent {
  final String? studentId;
  const LoadProgress({this.studentId});
  @override
  List<Object?> get props => [studentId];
}

class ToggleFavourite extends ElearningEvent {
  final String resourceId;
  const ToggleFavourite(this.resourceId);
  @override
  List<Object?> get props => [resourceId];
}

// ═══════════════════════════════════════════════════════════════════════
// STATES
// ═══════════════════════════════════════════════════════════════════════

abstract class ElearningState extends Equatable {
  const ElearningState();
  @override
  List<Object?> get props => [];
}

class ElearningInitial extends ElearningState {}

class ElearningLoading extends ElearningState {}

class ResourcesLoaded extends ElearningState {
  final List<DigitalResource> resources;
  const ResourcesLoaded(this.resources);
  @override
  List<Object?> get props => [resources];
}

class ExamsLoaded extends ElearningState {
  final List<ExamBankItem> exams;
  const ExamsLoaded(this.exams);
  @override
  List<Object?> get props => [exams];
}

class QuizzesLoaded extends ElearningState {
  final List<Quiz> quizzes;
  const QuizzesLoaded(this.quizzes);
  @override
  List<Object?> get props => [quizzes];
}

class QuizDetailLoaded extends ElearningState {
  final Quiz quiz;
  const QuizDetailLoaded(this.quiz);
  @override
  List<Object?> get props => [quiz];
}

class QuizSubmitted extends ElearningState {
  final QuizAttempt attempt;
  const QuizSubmitted(this.attempt);
  @override
  List<Object?> get props => [attempt];
}

class AttemptsLoaded extends ElearningState {
  final List<QuizAttempt> attempts;
  const AttemptsLoaded(this.attempts);
  @override
  List<Object?> get props => [attempts];
}

class ProgressLoaded extends ElearningState {
  final List<StudentProgress> progressList;
  const ProgressLoaded(this.progressList);
  @override
  List<Object?> get props => [progressList];
}

class ElearningError extends ElearningState {
  final String message;
  const ElearningError(this.message);
  @override
  List<Object?> get props => [message];
}

// ═══════════════════════════════════════════════════════════════════════
// BLOC
// ═══════════════════════════════════════════════════════════════════════

class ElearningBloc extends Bloc<ElearningEvent, ElearningState> {
  final ElearningRepository _repo = getIt<ElearningRepository>();

  ElearningBloc() : super(ElearningInitial()) {
    on<LoadResources>(_onLoadResources);
    on<LoadExams>(_onLoadExams);
    on<LoadQuizzes>(_onLoadQuizzes);
    on<LoadQuizDetail>(_onLoadQuizDetail);
    on<SubmitQuiz>(_onSubmitQuiz);
    on<LoadMyAttempts>(_onLoadMyAttempts);
    on<LoadProgress>(_onLoadProgress);
    on<ToggleFavourite>(_onToggleFavourite);
  }

  Future<void> _onLoadResources(
    LoadResources event,
    Emitter<ElearningState> emit,
  ) async {
    emit(ElearningLoading());
    try {
      final resources = await _repo.getResources(
        query: event.query,
        type: event.type,
        subject: event.subject,
      );
      emit(ResourcesLoaded(resources));
    } catch (e) {
      emit(ElearningError(e.toString()));
    }
  }

  Future<void> _onLoadExams(
    LoadExams event,
    Emitter<ElearningState> emit,
  ) async {
    emit(ElearningLoading());
    try {
      final exams = await _repo.getExams(
        query: event.query,
        type: event.type,
        year: event.year,
      );
      emit(ExamsLoaded(exams));
    } catch (e) {
      emit(ElearningError(e.toString()));
    }
  }

  Future<void> _onLoadQuizzes(
    LoadQuizzes event,
    Emitter<ElearningState> emit,
  ) async {
    emit(ElearningLoading());
    try {
      final quizzes = await _repo.getQuizzes();
      emit(QuizzesLoaded(quizzes));
    } catch (e) {
      emit(ElearningError(e.toString()));
    }
  }

  Future<void> _onLoadQuizDetail(
    LoadQuizDetail event,
    Emitter<ElearningState> emit,
  ) async {
    emit(ElearningLoading());
    try {
      final quiz = await _repo.getQuiz(event.quizId);
      emit(QuizDetailLoaded(quiz));
    } catch (e) {
      emit(ElearningError(e.toString()));
    }
  }

  Future<void> _onSubmitQuiz(
    SubmitQuiz event,
    Emitter<ElearningState> emit,
  ) async {
    emit(ElearningLoading());
    try {
      final attempt = await _repo.submitQuiz(event.quizId, event.answers);
      emit(QuizSubmitted(attempt));
    } catch (e) {
      emit(ElearningError(e.toString()));
    }
  }

  Future<void> _onLoadMyAttempts(
    LoadMyAttempts event,
    Emitter<ElearningState> emit,
  ) async {
    emit(ElearningLoading());
    try {
      final attempts = await _repo.getMyAttempts();
      emit(AttemptsLoaded(attempts));
    } catch (e) {
      emit(ElearningError(e.toString()));
    }
  }

  Future<void> _onLoadProgress(
    LoadProgress event,
    Emitter<ElearningState> emit,
  ) async {
    emit(ElearningLoading());
    try {
      final progressList = await _repo.getProgress(studentId: event.studentId);
      emit(ProgressLoaded(progressList));
    } catch (e) {
      emit(ElearningError(e.toString()));
    }
  }

  Future<void> _onToggleFavourite(
    ToggleFavourite event,
    Emitter<ElearningState> emit,
  ) async {
    try {
      await _repo.toggleFavourite(event.resourceId);
      // Reload resources after toggle
      add(const LoadResources());
    } catch (e) {
      emit(ElearningError(e.toString()));
    }
  }
}
