import 'dart:async';

import 'package:flutter/material.dart';
import '../storage/secure_storage_service.dart';
import 'biometric_service.dart';

/// Manages app lock: inactivity timeout, biometric/PIN unlock.
class AppLockManager extends ChangeNotifier {
  final SecureStorageService _storage;
  final BiometricService _biometricService;

  static const String _pinKey = 'app_lock_pin';
  static const String _lockEnabledKey = 'app_lock_enabled';
  static const String _biometricEnabledKey = 'biometric_enabled';
  static const Duration inactivityTimeout = Duration(minutes: 5);

  bool _isLocked = false;
  Timer? _inactivityTimer;
  DateTime? _lastActivityTime;

  bool get isLocked => _isLocked;

  AppLockManager(this._storage, this._biometricService);

  /// Initialize lock state - call on app start.
  Future<void> initialize() async {
    final enabled = await isLockEnabled();
    if (enabled) {
      _isLocked = true;
      notifyListeners();
    }
  }

  /// Check if app lock is enabled.
  Future<bool> isLockEnabled() async {
    final val = await _storage.readGeneric(_lockEnabledKey);
    return val == 'true';
  }

  /// Check if biometric unlock is enabled.
  Future<bool> isBiometricEnabled() async {
    final val = await _storage.readGeneric(_biometricEnabledKey);
    return val == 'true';
  }

  /// Enable app lock with a PIN.
  Future<void> enableLock(String pin) async {
    await _storage.writeGeneric(_pinKey, pin);
    await _storage.writeGeneric(_lockEnabledKey, 'true');
    _startInactivityTimer();
  }

  /// Disable app lock.
  Future<void> disableLock() async {
    await _storage.deleteGeneric(_pinKey);
    await _storage.writeGeneric(_lockEnabledKey, 'false');
    await _storage.writeGeneric(_biometricEnabledKey, 'false');
    _cancelInactivityTimer();
    _isLocked = false;
    notifyListeners();
  }

  /// Enable or disable biometric unlock.
  Future<void> setBiometricEnabled(bool enabled) async {
    await _storage.writeGeneric(_biometricEnabledKey, enabled.toString());
  }

  /// Verify PIN.
  Future<bool> verifyPin(String pin) async {
    final storedPin = await _storage.readGeneric(_pinKey);
    if (storedPin == pin) {
      _unlock();
      return true;
    }
    return false;
  }

  /// Attempt biometric unlock.
  Future<bool> unlockWithBiometric() async {
    final biometricEnabled = await isBiometricEnabled();
    if (!biometricEnabled) return false;

    final success = await _biometricService.authenticate(
      reason: 'Déverrouillez l\'application',
    );
    if (success) {
      _unlock();
    }
    return success;
  }

  /// Lock the app.
  void lock() {
    _isLocked = true;
    _cancelInactivityTimer();
    notifyListeners();
  }

  /// Record user activity (call on user interaction).
  void recordActivity() {
    _lastActivityTime = DateTime.now();
    _resetInactivityTimer();
  }

  /// Called when app goes to background.
  void onAppPaused() {
    _lastActivityTime = DateTime.now();
    _cancelInactivityTimer();
  }

  /// Called when app comes to foreground.
  Future<void> onAppResumed() async {
    final enabled = await isLockEnabled();
    if (!enabled) return;

    if (_lastActivityTime != null) {
      final elapsed = DateTime.now().difference(_lastActivityTime!);
      if (elapsed >= inactivityTimeout) {
        lock();
        return;
      }
    }
    _startInactivityTimer();
  }

  void _unlock() {
    _isLocked = false;
    _lastActivityTime = DateTime.now();
    _startInactivityTimer();
    notifyListeners();
  }

  void _startInactivityTimer() {
    _cancelInactivityTimer();
    _inactivityTimer = Timer(inactivityTimeout, () async {
      final enabled = await isLockEnabled();
      if (enabled) lock();
    });
  }

  void _resetInactivityTimer() {
    if (_inactivityTimer?.isActive == true) {
      _startInactivityTimer();
    }
  }

  void _cancelInactivityTimer() {
    _inactivityTimer?.cancel();
    _inactivityTimer = null;
  }

  @override
  void dispose() {
    _cancelInactivityTimer();
    super.dispose();
  }
}
