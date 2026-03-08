import 'package:equatable/equatable.dart';

import '../../data/models/user_model.dart';

/// States for the AuthBloc.
abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthAuthenticated extends AuthState {
  final User user;
  final List<UserContext> contexts;

  const AuthAuthenticated(this.user, {this.contexts = const []});

  @override
  List<Object?> get props => [user, contexts];
}

class AuthUnauthenticated extends AuthState {}

/// Multi-step login: OTP or TOTP verification required.
class AuthOtpVerificationRequired extends AuthState {
  final bool requiresOtp;
  final bool requiresTotp;
  final String tempToken;

  const AuthOtpVerificationRequired({
    this.requiresOtp = false,
    this.requiresTotp = false,
    required this.tempToken,
  });

  @override
  List<Object?> get props => [requiresOtp, requiresTotp, tempToken];
}

class AuthError extends AuthState {
  final String message;

  const AuthError(this.message);

  @override
  List<Object?> get props => [message];
}
