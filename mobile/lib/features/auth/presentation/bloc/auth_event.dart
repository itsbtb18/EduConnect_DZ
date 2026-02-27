import 'package:equatable/equatable.dart';

/// Events for the authentication BLoC
abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

/// Check the current auth status on app start
class AuthCheckRequested extends AuthEvent {}

/// Login with phone number + password
class AuthLoginRequested extends AuthEvent {
  final String phoneNumber;
  final String password;

  const AuthLoginRequested({required this.phoneNumber, required this.password});

  @override
  List<Object?> get props => [phoneNumber, password];
}

/// Login with phone + PIN (young students)
class AuthPinLoginRequested extends AuthEvent {
  final String phone;
  final String pin;

  const AuthPinLoginRequested({required this.phone, required this.pin});

  @override
  List<Object?> get props => [phone, pin];
}

/// User requested logout
class AuthLogoutRequested extends AuthEvent {}
