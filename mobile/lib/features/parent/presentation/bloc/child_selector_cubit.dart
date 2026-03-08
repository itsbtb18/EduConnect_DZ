import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/child_model.dart';
import '../../data/repositories/child_repository.dart';

// ── State ───────────────────────────────────────────────────────────────────

abstract class ChildSelectorState extends Equatable {
  const ChildSelectorState();
  @override
  List<Object?> get props => [];
}

class ChildSelectorInitial extends ChildSelectorState {}

class ChildSelectorLoading extends ChildSelectorState {}

class ChildSelectorLoaded extends ChildSelectorState {
  final List<ChildProfile> children;
  final ChildProfile? selected;

  const ChildSelectorLoaded({required this.children, this.selected});

  /// Group children by school for multi-school display.
  Map<String, List<ChildProfile>> get bySchool {
    final map = <String, List<ChildProfile>>{};
    for (final c in children) {
      final key = c.schoolName ?? 'Établissement';
      map.putIfAbsent(key, () => []).add(c);
    }
    return map;
  }

  @override
  List<Object?> get props => [children, selected];
}

class ChildSelectorError extends ChildSelectorState {
  final String message;
  const ChildSelectorError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── Cubit ───────────────────────────────────────────────────────────────────

class ChildSelectorCubit extends Cubit<ChildSelectorState> {
  final ChildRepository _repo = getIt<ChildRepository>();

  ChildSelectorCubit() : super(ChildSelectorInitial());

  Future<void> loadChildren() async {
    emit(ChildSelectorLoading());
    try {
      final children = await _repo.getMyChildren();
      emit(
        ChildSelectorLoaded(
          children: children,
          selected: children.isNotEmpty ? children.first : null,
        ),
      );
    } catch (e) {
      emit(ChildSelectorError(e.toString()));
    }
  }

  void selectChild(ChildProfile child) {
    final current = state;
    if (current is ChildSelectorLoaded) {
      emit(ChildSelectorLoaded(children: current.children, selected: child));
    }
  }
}
