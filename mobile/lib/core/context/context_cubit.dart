import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../features/auth/data/models/user_model.dart';
import '../di/injection.dart';
import '../security/biometric_service.dart';
import '../storage/secure_storage_service.dart';

// ── State ───────────────────────────────────────────────────────────────────

class ContextState extends Equatable {
  final List<UserContext> contexts;
  final UserContext? active;

  const ContextState({this.contexts = const [], this.active});

  bool get hasMultiple => contexts.length > 1;
  bool get hasSingle => contexts.length == 1;
  bool get isEmpty => contexts.isEmpty;

  ContextState copyWith({List<UserContext>? contexts, UserContext? active}) {
    return ContextState(
      contexts: contexts ?? this.contexts,
      active: active ?? this.active,
    );
  }

  @override
  List<Object?> get props => [contexts, active];
}

// ── Cubit ───────────────────────────────────────────────────────────────────

class ContextCubit extends Cubit<ContextState> {
  final SecureStorageService _storage = getIt<SecureStorageService>();
  final BiometricService _biometric = getIt<BiometricService>();

  /// Roles that require biometric verification before context switch.
  static const _sensitiveRoles = {'admin', 'super_admin', 'school_admin', 'accountant', 'trainer'};

  ContextCubit() : super(const ContextState());

  /// Load contexts from a list (e.g. after login or getMe).
  /// Auto-restores previously active context or selects single context.
  Future<void> loadContexts(List<UserContext> contexts) async {
    if (contexts.isEmpty) {
      emit(const ContextState());
      return;
    }

    // Try to restore last active context
    final savedId = await _storage.getActiveContextId();
    UserContext? active;
    if (savedId != null) {
      active = contexts.where((c) => c.contextId == savedId).firstOrNull;
    }

    // Auto-select if single context
    active ??= contexts.length == 1 ? contexts.first : null;

    if (active != null) {
      await _storage.saveActiveContextId(active.contextId);
      // Also update role/school in storage for backward compatibility
      await _storage.saveUserInfo(
        userId: (await _storage.getUserId()) ?? '',
        role: active.routeRole,
        schoolId: active.schoolId,
      );
    }

    // Persist contexts
    await _storage.saveContextsJson(contexts.map((c) => c.toJson()).toList());

    emit(ContextState(contexts: contexts, active: active));
  }

  /// Switch to a different context.
  /// Requires biometric confirmation for sensitive roles.
  Future<bool> switchContext(UserContext context) async {
    // Check if the target context is a sensitive role
    final targetRole = context.routeRole.toLowerCase();
    if (_sensitiveRoles.contains(targetRole)) {
      final bioAvailable = await _biometric.isAvailable();
      if (bioAvailable) {
        final authenticated = await _biometric.authenticate(
          reason: 'Confirmez votre identité pour accéder au profil $targetRole',
        );
        if (!authenticated) return false;
      }
    }

    await _storage.saveActiveContextId(context.contextId);
    await _storage.saveUserInfo(
      userId: (await _storage.getUserId()) ?? '',
      role: context.routeRole,
      schoolId: context.schoolId,
    );
    emit(state.copyWith(active: context));
    return true;
  }

  /// Clear all contexts (logout).
  void clear() {
    emit(const ContextState());
  }
}
