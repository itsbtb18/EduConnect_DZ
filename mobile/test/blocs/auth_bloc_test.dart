import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:ilmi_mobile/core/di/injection.dart';
import 'package:ilmi_mobile/features/auth/data/models/user_model.dart';
import 'package:ilmi_mobile/features/auth/data/repositories/auth_repository.dart';
import 'package:ilmi_mobile/features/auth/presentation/bloc/auth_bloc.dart';

// ── Mocks ───────────────────────────────────────────────────────────────────

class MockAuthRepository extends Mock implements AuthRepository {}

// ── Fixtures ────────────────────────────────────────────────────────────────

final _user = User(
  id: 'u1',
  email: 'ali@school.dz',
  firstName: 'Ali',
  lastName: 'Bouzid',
  role: 'teacher',
  isActive: true,
);

final _contexts = [
  UserContext(
    contextId: 'u1_s1_TEACHER',
    type: 'SCHOOL',
    role: 'TEACHER',
    schoolId: 's1',
    schoolName: 'Lycée Test',
  ),
];

final _authResult = AuthResult(user: _user, contexts: _contexts);

// ── Tests ───────────────────────────────────────────────────────────────────

void main() {
  late MockAuthRepository mockAuthRepo;

  setUp(() {
    mockAuthRepo = MockAuthRepository();
    // Register mock before AuthBloc construction (it resolves via getIt).
    getIt.registerLazySingleton<AuthRepository>(() => mockAuthRepo);
  });

  tearDown(() async {
    await getIt.reset();
  });

  group('AuthBloc', () {
    test('initial state is AuthInitial', () {
      final bloc = AuthBloc();
      expect(bloc.state, AuthInitial());
      bloc.close();
    });

    // ── AuthCheckRequested ──────────────────────────────────────────────

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthAuthenticated] when session is valid',
      setUp: () {
        when(() => mockAuthRepo.isLoggedIn()).thenAnswer((_) async => true);
        when(() => mockAuthRepo.getMe()).thenAnswer((_) async => _user);
      },
      build: () => AuthBloc(),
      act: (bloc) => bloc.add(AuthCheckRequested()),
      expect: () => [
        AuthLoading(),
        AuthAuthenticated(_user, contexts: _user.contexts),
      ],
    );

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthUnauthenticated] when not logged in',
      setUp: () {
        when(() => mockAuthRepo.isLoggedIn()).thenAnswer((_) async => false);
      },
      build: () => AuthBloc(),
      act: (bloc) => bloc.add(AuthCheckRequested()),
      expect: () => [AuthLoading(), AuthUnauthenticated()],
    );

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthUnauthenticated] on check error',
      setUp: () {
        when(() => mockAuthRepo.isLoggedIn()).thenThrow(Exception('fail'));
      },
      build: () => AuthBloc(),
      act: (bloc) => bloc.add(AuthCheckRequested()),
      expect: () => [AuthLoading(), AuthUnauthenticated()],
    );

    // ── AuthLoginRequested ──────────────────────────────────────────────

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthAuthenticated] on successful login',
      setUp: () {
        when(
          () => mockAuthRepo.login(
            phoneNumber: any(named: 'phoneNumber'),
            password: any(named: 'password'),
          ),
        ).thenAnswer((_) async => _authResult);
      },
      build: () => AuthBloc(),
      act: (bloc) => bloc.add(
        const AuthLoginRequested(
          phoneNumber: '0551234567',
          password: 'pass123',
        ),
      ),
      expect: () => [
        AuthLoading(),
        AuthAuthenticated(_authResult.user, contexts: _authResult.contexts),
      ],
    );

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthOtpVerificationRequired] when OTP needed',
      setUp: () {
        when(
          () => mockAuthRepo.login(
            phoneNumber: any(named: 'phoneNumber'),
            password: any(named: 'password'),
          ),
        ).thenThrow(
          const AuthOtpRequired(
            requiresOtp: true,
            requiresTotp: false,
            tempToken: 'temp-123',
          ),
        );
      },
      build: () => AuthBloc(),
      act: (bloc) => bloc.add(
        const AuthLoginRequested(
          phoneNumber: '0551234567',
          password: 'pass123',
        ),
      ),
      expect: () => [
        AuthLoading(),
        const AuthOtpVerificationRequired(
          requiresOtp: true,
          requiresTotp: false,
          tempToken: 'temp-123',
        ),
      ],
    );

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthError] on login failure',
      setUp: () {
        when(
          () => mockAuthRepo.login(
            phoneNumber: any(named: 'phoneNumber'),
            password: any(named: 'password'),
          ),
        ).thenThrow(Exception('Invalid credentials'));
      },
      build: () => AuthBloc(),
      act: (bloc) => bloc.add(
        const AuthLoginRequested(phoneNumber: '0000000000', password: 'wrong'),
      ),
      expect: () => [AuthLoading(), isA<AuthError>()],
    );

    // ── AuthPinLoginRequested ───────────────────────────────────────────

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthAuthenticated] on successful PIN login',
      setUp: () {
        when(
          () => mockAuthRepo.pinLogin(
            phone: any(named: 'phone'),
            pin: any(named: 'pin'),
          ),
        ).thenAnswer((_) async => _authResult);
      },
      build: () => AuthBloc(),
      act: (bloc) => bloc.add(
        const AuthPinLoginRequested(phone: '0551234567', pin: '1234'),
      ),
      expect: () => [
        AuthLoading(),
        AuthAuthenticated(_authResult.user, contexts: _authResult.contexts),
      ],
    );

    // ── AuthVerifyOtpRequested ──────────────────────────────────────────

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthAuthenticated] on OTP verification success',
      setUp: () {
        when(
          () => mockAuthRepo.verifyOtp(
            tempToken: any(named: 'tempToken'),
            code: any(named: 'code'),
          ),
        ).thenAnswer((_) async => _authResult);
      },
      build: () => AuthBloc(),
      act: (bloc) => bloc.add(
        const AuthVerifyOtpRequested(tempToken: 'temp-123', code: '654321'),
      ),
      expect: () => [
        AuthLoading(),
        AuthAuthenticated(_authResult.user, contexts: _authResult.contexts),
      ],
    );

    // ── AuthLogoutRequested ─────────────────────────────────────────────

    blocTest<AuthBloc, AuthState>(
      'emits [AuthUnauthenticated] on logout',
      setUp: () {
        when(() => mockAuthRepo.logout()).thenAnswer((_) async {});
      },
      build: () => AuthBloc(),
      act: (bloc) => bloc.add(AuthLogoutRequested()),
      expect: () => [AuthUnauthenticated()],
      verify: (_) {
        verify(() => mockAuthRepo.logout()).called(1);
      },
    );
  });
}
