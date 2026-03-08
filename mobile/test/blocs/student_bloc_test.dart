import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:ilmi_mobile/core/di/injection.dart';
import 'package:ilmi_mobile/core/storage/hive_storage_service.dart';
import 'package:ilmi_mobile/features/student/data/models/grade_model.dart';
import 'package:ilmi_mobile/features/student/data/models/homework_model.dart';
import 'package:ilmi_mobile/features/student/data/models/academic_model.dart';
import 'package:ilmi_mobile/features/student/data/repositories/grade_repository.dart';
import 'package:ilmi_mobile/features/student/data/repositories/homework_repository.dart';
import 'package:ilmi_mobile/features/student/data/repositories/academic_repository.dart';
import 'package:ilmi_mobile/features/student/presentation/bloc/student_bloc.dart';

// ── Mocks ───────────────────────────────────────────────────────────────────

class MockGradeRepository extends Mock implements GradeRepository {}

class MockHomeworkRepository extends Mock implements HomeworkRepository {}

class MockAcademicRepository extends Mock implements AcademicRepository {}

class MockHiveStorageService extends Mock implements HiveStorageService {}

// ── Fixtures ────────────────────────────────────────────────────────────────

final _grades = [
  Grade(
    id: 'g1',
    studentId: 's1',
    subjectId: 'sub1',
    subjectName: 'Maths',
    examTypeId: 'et1',
    examTypeName: 'Devoir 1',
    score: 17.5,
    maxScore: 20.0,
  ),
];

final _tasks = [
  HomeworkTask(
    id: 'h1',
    title: 'Exercice Math',
    description: 'Page 42',
    subjectId: 'sub1',
    subjectName: 'Maths',
    dueDate: DateTime(2025, 2, 15),
    createdAt: DateTime(2025, 2, 10),
  ),
];

final _subjects = [
  Subject(id: 'sub1', name: 'Mathématiques'),
  Subject(id: 'sub2', name: 'Physique'),
];

final _slots = [
  ScheduleSlot(
    id: 'sl1',
    dayOfWeek: 0,
    startTime: '08:00',
    endTime: '09:00',
    subjectId: 'sub1',
    subjectName: 'Maths',
    teacherName: 'M. Ahmed',
    classroomName: '3A',
  ),
];

// ── Tests ───────────────────────────────────────────────────────────────────

void main() {
  late MockGradeRepository mockGradeRepo;
  late MockHomeworkRepository mockHomeworkRepo;
  late MockAcademicRepository mockAcademicRepo;
  late MockHiveStorageService mockCache;

  setUp(() {
    mockGradeRepo = MockGradeRepository();
    mockHomeworkRepo = MockHomeworkRepository();
    mockAcademicRepo = MockAcademicRepository();
    mockCache = MockHiveStorageService();

    getIt.registerLazySingleton<GradeRepository>(() => mockGradeRepo);
    getIt.registerLazySingleton<HomeworkRepository>(() => mockHomeworkRepo);
    getIt.registerLazySingleton<AcademicRepository>(() => mockAcademicRepo);
    getIt.registerLazySingleton<HiveStorageService>(() => mockCache);
  });

  tearDown(() async {
    await getIt.reset();
  });

  group('StudentBloc', () {
    test('initial state is StudentInitial', () {
      final bloc = StudentBloc();
      expect(bloc.state, StudentInitial());
      bloc.close();
    });

    // ── Grades: no cache → loading → loaded from API ────────────────────

    blocTest<StudentBloc, StudentState>(
      'grade load: emits [StudentLoading, StudentGradesLoaded] when no cache',
      setUp: () {
        when(() => mockCache.getDomainSync('grades', any())).thenReturn(null);
        when(
          () => mockGradeRepo.getGrades(
            subjectId: any(named: 'subjectId'),
            semesterId: any(named: 'semesterId'),
          ),
        ).thenAnswer((_) async => _grades);
        when(
          () => mockCache.cacheDomain('grades', any(), any()),
        ).thenAnswer((_) async {});
      },
      build: () => StudentBloc(),
      act: (bloc) => bloc.add(const StudentLoadGrades()),
      expect: () => [StudentLoading(), StudentGradesLoaded(_grades)],
    );

    // ── Grades: cache hit → cached data first → then fresh data ─────────

    blocTest<StudentBloc, StudentState>(
      'grade load: emits cached grades first, then refreshed grades',
      setUp: () {
        final cachedJson = _grades.map((g) => g.toJson()).toList();
        when(
          () => mockCache.getDomainSync('grades', any()),
        ).thenReturn(cachedJson);
        when(
          () => mockGradeRepo.getGrades(
            subjectId: any(named: 'subjectId'),
            semesterId: any(named: 'semesterId'),
          ),
        ).thenAnswer((_) async => _grades);
        when(
          () => mockCache.cacheDomain('grades', any(), any()),
        ).thenAnswer((_) async {});
      },
      build: () => StudentBloc(),
      act: (bloc) => bloc.add(const StudentLoadGrades()),
      expect: () => [
        // Cached + API return same data → bloc deduplicates equal consecutive states
        StudentGradesLoaded(_grades),
      ],
    );

    // ── Grades: API error with no cache → error state ───────────────────

    blocTest<StudentBloc, StudentState>(
      'grade load: emits error when API fails and no cache',
      setUp: () {
        when(() => mockCache.getDomainSync('grades', any())).thenReturn(null);
        when(
          () => mockGradeRepo.getGrades(
            subjectId: any(named: 'subjectId'),
            semesterId: any(named: 'semesterId'),
          ),
        ).thenThrow(Exception('Network error'));
      },
      build: () => StudentBloc(),
      act: (bloc) => bloc.add(const StudentLoadGrades()),
      expect: () => [StudentLoading(), isA<StudentError>()],
    );

    // ── Grades: API error with cache → silently uses cache ──────────────

    blocTest<StudentBloc, StudentState>(
      'grade load: still uses cache when API fails',
      setUp: () {
        final cachedJson = _grades.map((g) => g.toJson()).toList();
        when(
          () => mockCache.getDomainSync('grades', any()),
        ).thenReturn(cachedJson);
        when(
          () => mockGradeRepo.getGrades(
            subjectId: any(named: 'subjectId'),
            semesterId: any(named: 'semesterId'),
          ),
        ).thenThrow(Exception('Network error'));
      },
      build: () => StudentBloc(),
      act: (bloc) => bloc.add(const StudentLoadGrades()),
      // Only the cached data is emitted; no error.
      expect: () => [StudentGradesLoaded(_grades)],
    );

    // ── Homework ────────────────────────────────────────────────────────

    blocTest<StudentBloc, StudentState>(
      'homework load: emits [StudentLoading, StudentHomeworkLoaded]',
      setUp: () {
        when(
          () => mockCache.getDomainSync('homework', 'tasks'),
        ).thenReturn(null);
        when(() => mockHomeworkRepo.getTasks()).thenAnswer((_) async => _tasks);
        when(
          () => mockCache.cacheDomain('homework', 'tasks', any()),
        ).thenAnswer((_) async {});
      },
      build: () => StudentBloc(),
      act: (bloc) => bloc.add(StudentLoadHomework()),
      expect: () => [StudentLoading(), StudentHomeworkLoaded(_tasks)],
    );

    // ── Subjects ────────────────────────────────────────────────────────

    blocTest<StudentBloc, StudentState>(
      'subjects load: emits [StudentLoading, StudentSubjectsLoaded]',
      setUp: () {
        when(
          () => mockCache.getDomainSync('subjects', 'list'),
        ).thenReturn(null);
        when(
          () => mockAcademicRepo.getSubjects(
            classroomId: any(named: 'classroomId'),
          ),
        ).thenAnswer((_) async => _subjects);
        when(
          () => mockCache.cacheDomain('subjects', 'list', any()),
        ).thenAnswer((_) async {});
      },
      build: () => StudentBloc(),
      act: (bloc) => bloc.add(StudentLoadSubjects()),
      expect: () => [StudentLoading(), StudentSubjectsLoaded(_subjects)],
    );

    // ── Schedule ────────────────────────────────────────────────────────

    blocTest<StudentBloc, StudentState>(
      'schedule load: emits [StudentLoading, StudentScheduleLoaded]',
      setUp: () {
        when(
          () => mockCache.getDomainSync('schedule', 'slots'),
        ).thenReturn(null);
        when(
          () => mockAcademicRepo.getSchedule(
            classroomId: any(named: 'classroomId'),
          ),
        ).thenAnswer((_) async => _slots);
        when(
          () => mockCache.cacheDomain(
            'schedule',
            'slots',
            any(),
            ttl: any(named: 'ttl'),
          ),
        ).thenAnswer((_) async {});
      },
      build: () => StudentBloc(),
      act: (bloc) => bloc.add(StudentLoadSchedule()),
      expect: () => [StudentLoading(), StudentScheduleLoaded(_slots)],
    );
  });
}
