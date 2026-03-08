import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';

/// Service for biometric authentication (fingerprint / face ID).
class BiometricService {
  final LocalAuthentication _auth = LocalAuthentication();

  /// Check if device supports biometric authentication.
  Future<bool> isAvailable() async {
    try {
      final canAuth = await _auth.canCheckBiometrics;
      final isDeviceSupported = await _auth.isDeviceSupported();
      return canAuth && isDeviceSupported;
    } on PlatformException {
      return false;
    }
  }

  /// Get list of available biometric types.
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _auth.getAvailableBiometrics();
    } on PlatformException {
      return [];
    }
  }

  /// Authenticate using biometrics.
  /// Returns true if authentication was successful.
  Future<bool> authenticate({
    String reason = 'Veuillez vous authentifier pour accéder à l\'application',
  }) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false, // Allow PIN/pattern fallback
          useErrorDialogs: true,
        ),
      );
    } on PlatformException {
      return false;
    }
  }
}
