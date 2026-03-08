import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../network/sync_queue_service.dart';

// ── State ───────────────────────────────────────────────────────────────────

class ConnectivityState extends Equatable {
  final bool isOnline;
  final int pendingSyncCount;

  const ConnectivityState({required this.isOnline, this.pendingSyncCount = 0});

  @override
  List<Object?> get props => [isOnline, pendingSyncCount];
}

// ── Cubit ───────────────────────────────────────────────────────────────────

/// Monitors device connectivity and exposes the sync queue count.
///
/// Widgets can show an offline banner via `BlocBuilder<ConnectivityCubit, …>`.
class ConnectivityCubit extends Cubit<ConnectivityState> {
  final SyncQueueService _syncQueue;

  StreamSubscription<List<ConnectivityResult>>? _sub;

  ConnectivityCubit(this._syncQueue)
    : super(const ConnectivityState(isOnline: true)) {
    _init();
  }

  Future<void> _init() async {
    // Seed with current state.
    final result = await Connectivity().checkConnectivity();
    _emitFrom(result);

    // Listen for changes.
    _sub = Connectivity().onConnectivityChanged.listen(_emitFrom);

    // Stay in sync with the queue.
    _syncQueue.onQueueChanged = (count) {
      emit(
        ConnectivityState(isOnline: state.isOnline, pendingSyncCount: count),
      );
    };
  }

  void _emitFrom(List<ConnectivityResult> results) {
    final online = !results.contains(ConnectivityResult.none);
    emit(
      ConnectivityState(
        isOnline: online,
        pendingSyncCount: _syncQueue.pendingCount,
      ),
    );
  }

  @override
  Future<void> close() {
    _sub?.cancel();
    return super.close();
  }
}
