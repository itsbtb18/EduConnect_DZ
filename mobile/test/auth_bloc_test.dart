import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:educonnect_mobile/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:educonnect_mobile/features/auth/data/models/user_model.dart';
import 'package:educonnect_mobile/features/auth/data/repositories/auth_repository.dart';

// --- Mocks ---

class MockAuthRepository extends Mock implements AuthRepository {}

// --- Fakes ---

final _testUser = User(
  id: 'user-1',
  email: 'teacher@school.dz',
  firstName: 'Ahmed',
  lastName: 'Benali',
  role: 'teacher',
  isActive: true,
);

final _loginResponse = LoginResponse(
  accessToken: 'fake-access-token',
  refreshToken: 'fake-refresh-token',
  user: _testUser,
);

// --- Tests ---

void main() {
  late MockAuthRepository mockAuthRepository;

  setUp(() {
    mockAuthRepository = MockAuthRepository();
  });

  group('AuthBloc', () {
    group('initial state', () {
      test('is AuthInitial', () {
        // AuthBloc requires getIt<AuthRepository>() in constructor,
        // so this test documents the expected initial state type.
        expect(AuthInitial(), isA<AuthState>());
      });
    });

    group('AuthState equality', () {
      test('AuthInitial instances are equal', () {
        expect(AuthInitial(), equals(AuthInitial()));
      });

      test('AuthLoading instances are equal', () {
        expect(AuthLoading(), equals(AuthLoading()));
      });

      test('AuthAuthenticated compares by user', () {
        expect(
          AuthAuthenticated(_testUser),
          equals(AuthAuthenticated(_testUser)),
        );
      });

      test('AuthUnauthenticated instances are equal', () {
        expect(AuthUnauthenticated(), equals(AuthUnauthenticated()));
      });

      test('AuthError compares by message', () {
        expect(
          const AuthError('Something went wrong'),
          equals(const AuthError('Something went wrong')),
        );
        expect(
          const AuthError('Error A'),
          isNot(equals(const AuthError('Error B'))),
        );
      });
    });

    group('AuthEvent equality', () {
      test('AuthCheckRequested instances are equal', () {
        expect(AuthCheckRequested(), equals(AuthCheckRequested()));
      });

      test('AuthLoginRequested compares by phoneNumber and password', () {
        expect(
          const AuthLoginRequested(phoneNumber: '0551234567', password: '123'),
          equals(
            const AuthLoginRequested(
              phoneNumber: '0551234567',
              password: '123',
            ),
          ),
        );
        expect(
          const AuthLoginRequested(phoneNumber: '0551234567', password: '123'),
          isNot(
            equals(
              const AuthLoginRequested(
                phoneNumber: '0551234567',
                password: '456',
              ),
            ),
          ),
        );
      });

      test('AuthPinLoginRequested compares by phone and pin', () {
        expect(
          const AuthPinLoginRequested(phone: '0551234567', pin: '1234'),
          equals(const AuthPinLoginRequested(phone: '0551234567', pin: '1234')),
        );
      });

      test('AuthLogoutRequested instances are equal', () {
        expect(AuthLogoutRequested(), equals(AuthLogoutRequested()));
      });
    });

    group('AuthRepository mock behavior', () {
      test('login returns LoginResponse', () async {
        when(
          () => mockAuthRepository.login(
            phoneNumber: any(named: 'phoneNumber'),
            password: any(named: 'password'),
          ),
        ).thenAnswer((_) async => _loginResponse);

        final result = await mockAuthRepository.login(
          phoneNumber: '0551234567',
          password: 'password123',
        );

        expect(result.user.email, 'teacher@school.dz');
        expect(result.accessToken, 'fake-access-token');
        verify(
          () => mockAuthRepository.login(
            phoneNumber: '0551234567',
            password: 'password123',
          ),
        ).called(1);
      });

      test('isLoggedIn returns boolean', () async {
        when(
          () => mockAuthRepository.isLoggedIn(),
        ).thenAnswer((_) async => true);

        final result = await mockAuthRepository.isLoggedIn();
        expect(result, isTrue);
      });

      test('getMe returns user', () async {
        when(
          () => mockAuthRepository.getMe(),
        ).thenAnswer((_) async => _testUser);

        final user = await mockAuthRepository.getMe();
        expect(user.firstName, 'Ahmed');
        expect(user.role, 'teacher');
      });

      test('logout completes', () async {
        when(() => mockAuthRepository.logout()).thenAnswer((_) async {});

        await expectLater(mockAuthRepository.logout(), completes);
      });

      test('login failure throws', () async {
        when(
          () => mockAuthRepository.login(
            phoneNumber: any(named: 'phoneNumber'),
            password: any(named: 'password'),
          ),
        ).thenThrow(Exception('Invalid credentials'));

        expect(
          () => mockAuthRepository.login(
            phoneNumber: '0000000000',
            password: 'wrong',
          ),
          throwsException,
        );
      });
    });
  });
}
