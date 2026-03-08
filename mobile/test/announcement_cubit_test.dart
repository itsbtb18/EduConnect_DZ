import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get_it/get_it.dart';
import 'package:mocktail/mocktail.dart';

import 'package:ilmi_mobile/features/shared/data/models/announcement_model.dart';
import 'package:ilmi_mobile/features/shared/data/repositories/announcement_repository.dart';
import 'package:ilmi_mobile/features/shared/presentation/bloc/announcement_cubit.dart';

// ── Mocks ───────────────────────────────────────────────────────────────────

class MockAnnouncementRepository extends Mock
    implements AnnouncementRepository {}

// ── Fixtures ────────────────────────────────────────────────────────────────

final _testAnnouncements = [
  Announcement(
    id: 'ann-1',
    title: 'Test Announcement',
    body: 'This is a test announcement',
    targetAudience: 'ALL',
    isPinned: false,
    isUrgent: false,
    viewsCount: 10,
    createdAt: DateTime(2025, 1, 15),
  ),
  Announcement(
    id: 'ann-2',
    title: 'Urgent Announcement',
    body: 'This is urgent',
    targetAudience: 'PARENTS',
    isPinned: true,
    isUrgent: true,
    viewsCount: 25,
    createdAt: DateTime(2025, 1, 16),
  ),
];

// ── Tests ───────────────────────────────────────────────────────────────────

void main() {
  late MockAnnouncementRepository mockRepo;

  setUp(() async {
    mockRepo = MockAnnouncementRepository();
    final getIt = GetIt.instance;
    await getIt.reset();
    getIt.registerSingleton<AnnouncementRepository>(mockRepo);
  });

  tearDown(() async {
    await GetIt.instance.reset();
  });

  group('AnnouncementState equality', () {
    test('AnnouncementInitial instances are equal', () {
      expect(AnnouncementInitial(), equals(AnnouncementInitial()));
    });

    test('AnnouncementLoading instances are equal', () {
      expect(AnnouncementLoading(), equals(AnnouncementLoading()));
    });

    test('AnnouncementLoaded compares by announcements list', () {
      expect(
        AnnouncementLoaded(_testAnnouncements),
        equals(AnnouncementLoaded(_testAnnouncements)),
      );
    });

    test('AnnouncementError compares by message', () {
      expect(
        const AnnouncementError('Erreur réseau'),
        equals(const AnnouncementError('Erreur réseau')),
      );
      expect(
        const AnnouncementError('A'),
        isNot(equals(const AnnouncementError('B'))),
      );
    });
  });

  group('AnnouncementCubit', () {
    blocTest<AnnouncementCubit, AnnouncementState>(
      'emits [Loading, Loaded] when loadAnnouncements succeeds',
      setUp: () {
        when(
          () => mockRepo.getAnnouncements(
            targetAudience: any(named: 'targetAudience'),
          ),
        ).thenAnswer((_) async => _testAnnouncements);
      },
      build: () => AnnouncementCubit(),
      act: (cubit) => cubit.loadAnnouncements(),
      expect: () => [
        isA<AnnouncementLoading>(),
        isA<AnnouncementLoaded>().having(
          (s) => s.announcements.length,
          'count',
          2,
        ),
      ],
    );

    blocTest<AnnouncementCubit, AnnouncementState>(
      'emits [Loading, Error] when loadAnnouncements fails',
      setUp: () {
        when(
          () => mockRepo.getAnnouncements(
            targetAudience: any(named: 'targetAudience'),
          ),
        ).thenThrow(Exception('Network error'));
      },
      build: () => AnnouncementCubit(),
      act: (cubit) => cubit.loadAnnouncements(),
      expect: () => [
        isA<AnnouncementLoading>(),
        isA<AnnouncementError>().having(
          (s) => s.message,
          'message',
          contains('Network error'),
        ),
      ],
    );

    blocTest<AnnouncementCubit, AnnouncementState>(
      'passes targetAudience filter to repository',
      setUp: () {
        when(
          () => mockRepo.getAnnouncements(targetAudience: 'PARENTS'),
        ).thenAnswer((_) async => [_testAnnouncements[1]]);
      },
      build: () => AnnouncementCubit(),
      act: (cubit) => cubit.loadAnnouncements(targetAudience: 'PARENTS'),
      verify: (_) {
        verify(
          () => mockRepo.getAnnouncements(targetAudience: 'PARENTS'),
        ).called(1);
      },
    );

    blocTest<AnnouncementCubit, AnnouncementState>(
      'emits [Loading, Loaded] with empty list when no announcements',
      setUp: () {
        when(
          () => mockRepo.getAnnouncements(
            targetAudience: any(named: 'targetAudience'),
          ),
        ).thenAnswer((_) async => []);
      },
      build: () => AnnouncementCubit(),
      act: (cubit) => cubit.loadAnnouncements(),
      expect: () => [
        isA<AnnouncementLoading>(),
        isA<AnnouncementLoaded>().having(
          (s) => s.announcements,
          'empty list',
          isEmpty,
        ),
      ],
    );
  });
}
