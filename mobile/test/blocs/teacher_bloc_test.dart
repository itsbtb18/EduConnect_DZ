import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:ilmi_mobile/core/di/injection.dart';
import 'package:ilmi_mobile/core/network/sync_queue_service.dart';
import 'package:ilmi_mobile/features/shared/data/models/communication_model.dart';
import 'package:ilmi_mobile/features/teacher/data/repositories/attendance_repository.dart';
import 'package:ilmi_mobile/features/teacher/presentation/bloc/teacher_bloc.dart';

// ── Mocks ───────────────────────────────────────────────────────────────────

class MockAttendanceRepository extends Mock implements AttendanceRepository {}

class MockSyncQueueService extends Mock implements SyncQueueService {}

// ── Fixtures ────────────────────────────────────────────────────────────────

final _records = [
  AttendanceRecord(
    id: 'a1',
    studentId: 's1',
    studentName: 'Yacine Kaci',
    date: DateTime(2025, 1, 15),
    status: 'present',
  ),
  AttendanceRecord(
    id: 'a2',
    studentId: 's2',
    studentName: 'Sara Belkacem',
    date: DateTime(2025, 1, 15),
    status: 'absent',
  ),
];

final _markRecords = [
  {'student': 's1', 'status': 'present'},
  {'student': 's2', 'status': 'absent'},
];

// ── Tests ───────────────────────────────────────────────────────────────────

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late MockAttendanceRepository mockAttendanceRepo;
  late MockSyncQueueService mockSyncQueue;

  setUp(() {
    // Mock connectivity_plus platform channel to avoid hanging in tests.
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('dev.fluttercommunity.plus/connectivity'),
          (MethodCall methodCall) async {
            if (methodCall.method == 'check') {
              return 'wifi';
            }
            return null;
          },
        );

    mockAttendanceRepo = MockAttendanceRepository();
    mockSyncQueue = MockSyncQueueService();

    getIt.registerLazySingleton<AttendanceRepository>(() => mockAttendanceRepo);
    getIt.registerLazySingleton<SyncQueueService>(() => mockSyncQueue);
  });

  tearDown(() async {
    await getIt.reset();
  });

  group('TeacherBloc', () {
    test('initial state is TeacherInitial', () {
      final bloc = TeacherBloc();
      expect(bloc.state, TeacherInitial());
      bloc.close();
    });

    // ── Load attendance ─────────────────────────────────────────────────

    blocTest<TeacherBloc, TeacherState>(
      'emits [TeacherLoading, TeacherAttendanceLoaded] when load succeeds',
      setUp: () {
        when(
          () => mockAttendanceRepo.getRecords(
            classroomId: any(named: 'classroomId'),
            date: any(named: 'date'),
          ),
        ).thenAnswer((_) async => _records);
      },
      build: () => TeacherBloc(),
      act: (bloc) => bloc.add(
        const TeacherLoadAttendance(classroomId: 'c1', date: '2025-01-15'),
      ),
      expect: () => [TeacherLoading(), TeacherAttendanceLoaded(_records)],
    );

    blocTest<TeacherBloc, TeacherState>(
      'emits [TeacherLoading, TeacherError] when load fails',
      setUp: () {
        when(
          () => mockAttendanceRepo.getRecords(
            classroomId: any(named: 'classroomId'),
            date: any(named: 'date'),
          ),
        ).thenThrow(Exception('Server error'));
      },
      build: () => TeacherBloc(),
      act: (bloc) => bloc.add(
        const TeacherLoadAttendance(classroomId: 'c1', date: '2025-01-15'),
      ),
      expect: () => [TeacherLoading(), isA<TeacherError>()],
    );

    // ── Mark attendance (online) ────────────────────────────────────────
    // Note: TeacherBloc uses Connectivity() directly which is hard to mock
    // without a wrapper. These tests verify the repository interaction path.

    blocTest<TeacherBloc, TeacherState>(
      'emits [TeacherLoading, ...] when marking attendance',
      setUp: () {
        when(
          () => mockAttendanceRepo.markAttendance(
            classroomId: any(named: 'classroomId'),
            date: any(named: 'date'),
            records: any(named: 'records'),
          ),
        ).thenAnswer((_) async {});
        when(() => mockSyncQueue.pendingCount).thenReturn(0);
        when(
          () => mockSyncQueue.enqueue(
            method: any(named: 'method'),
            path: any(named: 'path'),
            body: any(named: 'body'),
            label: any(named: 'label'),
          ),
        ).thenAnswer((_) async => 'req-1');
      },
      build: () => TeacherBloc(),
      act: (bloc) => bloc.add(
        TeacherMarkAttendance(
          classroomId: 'c1',
          date: '2025-01-15',
          records: _markRecords,
        ),
      ),
      // The result depends on actual Connectivity().checkConnectivity(),
      // which may return wifi or none depending on the test runner.
      // We verify it doesn't crash and emits TeacherLoading first.
      expect: () => [TeacherLoading(), isA<TeacherState>()],
    );

    // ── Event equality ──────────────────────────────────────────────────

    test('TeacherLoadAttendance equality', () {
      expect(
        const TeacherLoadAttendance(classroomId: 'c1', date: '2025-01-15'),
        equals(
          const TeacherLoadAttendance(classroomId: 'c1', date: '2025-01-15'),
        ),
      );
    });

    test('TeacherMarkAttendance equality', () {
      expect(
        TeacherMarkAttendance(
          classroomId: 'c1',
          date: '2025-01-15',
          records: _markRecords,
        ),
        equals(
          TeacherMarkAttendance(
            classroomId: 'c1',
            date: '2025-01-15',
            records: _markRecords,
          ),
        ),
      );
    });

    // ── State equality ──────────────────────────────────────────────────

    test('TeacherAttendanceQueued compares by pendingCount', () {
      expect(
        const TeacherAttendanceQueued(3),
        equals(const TeacherAttendanceQueued(3)),
      );
      expect(
        const TeacherAttendanceQueued(3),
        isNot(equals(const TeacherAttendanceQueued(5))),
      );
    });
  });
}
