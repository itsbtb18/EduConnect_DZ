import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:ilmi_mobile/core/di/injection.dart';
import 'package:ilmi_mobile/features/parent/data/models/finance_model.dart';
import 'package:ilmi_mobile/features/parent/data/repositories/finance_repository.dart';
import 'package:ilmi_mobile/features/parent/presentation/bloc/parent_bloc.dart';

// ── Mocks ───────────────────────────────────────────────────────────────────

class MockFinanceRepository extends Mock implements FinanceRepository {}

// ── Fixtures ────────────────────────────────────────────────────────────────

final _fees = [
  FeeStructure(
    id: 'f1',
    name: 'Frais de scolarité',
    amount: 35000,
    academicYearName: '2024-2025',
  ),
  FeeStructure(
    id: 'f2',
    name: 'Frais de cantine',
    amount: 8000,
    academicYearName: '2024-2025',
  ),
];

final _payments = [
  Payment(
    id: 'p1',
    studentId: 's1',
    feeId: 'f1',
    feeName: 'Frais de scolarité',
    amount: 35000,
    status: 'completed',
    createdAt: DateTime(2025, 1, 10),
  ),
];

const _summary = FinanceSummary(
  totalFees: 43000,
  totalPaid: 35000,
  totalRemaining: 8000,
  pendingPayments: 1,
);

// ── Tests ───────────────────────────────────────────────────────────────────

void main() {
  late MockFinanceRepository mockFinanceRepo;

  setUp(() {
    mockFinanceRepo = MockFinanceRepository();
    getIt.registerLazySingleton<FinanceRepository>(() => mockFinanceRepo);
  });

  tearDown(() async {
    await getIt.reset();
  });

  group('ParentBloc', () {
    test('initial state is ParentInitial', () {
      final bloc = ParentBloc();
      expect(bloc.state, ParentInitial());
      bloc.close();
    });

    // ── Load payments ────────────────────────────────────────────────────

    blocTest<ParentBloc, ParentState>(
      'emits [ParentLoading, ParentPaymentsLoaded] on success',
      setUp: () {
        when(
          () => mockFinanceRepo.getPayments(studentId: any(named: 'studentId')),
        ).thenAnswer((_) async => _payments);
      },
      build: () => ParentBloc(),
      act: (bloc) => bloc.add(const ParentLoadPayments(studentId: 's1')),
      expect: () => [ParentLoading(), ParentPaymentsLoaded(_payments)],
    );

    blocTest<ParentBloc, ParentState>(
      'emits [ParentLoading, ParentError] when payments fail',
      setUp: () {
        when(
          () => mockFinanceRepo.getPayments(studentId: any(named: 'studentId')),
        ).thenThrow(Exception('Erreur réseau'));
      },
      build: () => ParentBloc(),
      act: (bloc) => bloc.add(const ParentLoadPayments(studentId: 's1')),
      expect: () => [ParentLoading(), isA<ParentError>()],
    );

    // ── Load fees ────────────────────────────────────────────────────────

    blocTest<ParentBloc, ParentState>(
      'emits [ParentLoading, ParentFeesLoaded] on success',
      setUp: () {
        when(() => mockFinanceRepo.getFees()).thenAnswer((_) async => _fees);
      },
      build: () => ParentBloc(),
      act: (bloc) => bloc.add(ParentLoadFees()),
      expect: () => [ParentLoading(), ParentFeesLoaded(_fees)],
    );

    // ── Load finance summary ─────────────────────────────────────────────

    blocTest<ParentBloc, ParentState>(
      'emits [ParentLoading, ParentFinanceSummaryLoaded] on success',
      setUp: () {
        when(
          () => mockFinanceRepo.getFinanceSummary(any()),
        ).thenAnswer((_) async => _summary);
      },
      build: () => ParentBloc(),
      act: (bloc) => bloc.add(const ParentLoadFinanceSummary(studentId: 's1')),
      expect: () => [
        ParentLoading(),
        const ParentFinanceSummaryLoaded(_summary),
      ],
    );

    blocTest<ParentBloc, ParentState>(
      'emits [ParentLoading, ParentError] when summary fails',
      setUp: () {
        when(
          () => mockFinanceRepo.getFinanceSummary(any()),
        ).thenThrow(Exception('fail'));
      },
      build: () => ParentBloc(),
      act: (bloc) => bloc.add(const ParentLoadFinanceSummary(studentId: 's1')),
      expect: () => [ParentLoading(), isA<ParentError>()],
    );

    // ── State equality ──────────────────────────────────────────────────

    test('ParentPaymentsLoaded compares by list', () {
      expect(
        ParentPaymentsLoaded(_payments),
        equals(ParentPaymentsLoaded(_payments)),
      );
    });

    test('ParentError compares by message', () {
      expect(const ParentError('err'), equals(const ParentError('err')));
    });
  });
}
