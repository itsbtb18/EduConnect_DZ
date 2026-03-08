import 'dart:async';
import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:logger/logger.dart';

final _log = Logger(printer: PrettyPrinter(methodCount: 0));

/// A queued mutation that will be replayed when connectivity returns.
///
/// Stored as JSON in Hive so it survives app restarts.
class PendingRequest {
  final String id;
  final String method; // POST, PUT, PATCH, DELETE
  final String path;
  final Map<String, dynamic>? body;
  final DateTime createdAt;
  final String label; // human-readable description (e.g. "Attendance 3A")

  PendingRequest({
    required this.id,
    required this.method,
    required this.path,
    this.body,
    required this.createdAt,
    required this.label,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'method': method,
    'path': path,
    'body': body,
    'createdAt': createdAt.toIso8601String(),
    'label': label,
  };

  factory PendingRequest.fromJson(Map<String, dynamic> json) => PendingRequest(
    id: json['id'] as String,
    method: json['method'] as String,
    path: json['path'] as String,
    body: json['body'] as Map<String, dynamic>?,
    createdAt: DateTime.parse(json['createdAt'] as String),
    label: json['label'] as String,
  );
}

/// Offline-first sync queue.
///
/// When the device is offline, mutations (attendance, grade drafts, chat
/// messages) are persisted to Hive. When connectivity returns the queue is
/// drained in FIFO order.
class SyncQueueService {
  static const _boxName = 'sync_queue';

  late Box<String> _box;
  final Dio _dio;

  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  bool _syncing = false;

  /// Callback invoked after the queue changes (item added or drained).
  void Function(int pendingCount)? onQueueChanged;

  SyncQueueService(this._dio);

  /// Open the Hive box. Call once during app bootstrap (after Hive.initFlutter).
  Future<void> init() async {
    _box = await Hive.openBox<String>(_boxName);

    // Auto-drain when connectivity comes back.
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final online = !results.contains(ConnectivityResult.none);
      if (online) drainQueue();
    });
  }

  /// Number of pending mutations waiting for connectivity.
  int get pendingCount => _box.length;

  /// All pending items (oldest first).
  List<PendingRequest> get pending {
    return _box.values
        .map(
          (raw) =>
              PendingRequest.fromJson(jsonDecode(raw) as Map<String, dynamic>),
        )
        .toList();
  }

  /// Enqueue a mutation. Returns the generated request id.
  Future<String> enqueue({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    required String label,
  }) async {
    final id = '${DateTime.now().millisecondsSinceEpoch}_${path.hashCode}';
    final req = PendingRequest(
      id: id,
      method: method,
      path: path,
      body: body,
      createdAt: DateTime.now(),
      label: label,
    );
    await _box.put(id, jsonEncode(req.toJson()));
    onQueueChanged?.call(pendingCount);
    return id;
  }

  /// Attempt to drain the queue (FIFO). Stops on first failure.
  Future<void> drainQueue() async {
    if (_syncing || _box.isEmpty) return;
    _syncing = true;

    try {
      final keys = _box.keys.toList();
      for (final key in keys) {
        final raw = _box.get(key);
        if (raw == null) continue;

        final req = PendingRequest.fromJson(
          jsonDecode(raw) as Map<String, dynamic>,
        );

        try {
          await _dio.request(
            req.path,
            data: req.body,
            options: Options(method: req.method),
          );
          await _box.delete(key);
          _log.i('Synced: ${req.label}');
        } on DioException catch (e) {
          if (e.type == DioExceptionType.connectionError ||
              e.type == DioExceptionType.connectionTimeout) {
            // Still offline — stop draining.
            break;
          }
          // Server-side error (4xx/5xx) — drop the request to avoid
          // infinite retries of a permanently invalid payload.
          _log.w('Dropped failed sync item: ${req.label} — ${e.message}');
          await _box.delete(key);
        }
      }
    } finally {
      _syncing = false;
      onQueueChanged?.call(pendingCount);
    }
  }

  void dispose() {
    _connectivitySub?.cancel();
  }
}
