import 'package:equatable/equatable.dart';

/// Events for the AuthBloc.
abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

/// Check stored tokens to restore a previous session.
class AuthCheckRequested extends AuthEvent {}

/// Standard phone-number + password login.
class AuthLoginRequested extends AuthEvent {
  final String phoneNumber;
  final String password;

  const AuthLoginRequested({required this.phoneNumber, required this.password});

  @override
  List<Object?> get props => [phoneNumber, password];
}

/// PIN login for young students.
class AuthPinLoginRequested extends AuthEvent {
  final String phone;
  final String pin;

  const AuthPinLoginRequested({required this.phone, required this.pin});

  @override
  List<Object?> get props => [phone, pin];
}

/// Logout the current user.
class AuthLogoutRequested extends AuthEvent {}
