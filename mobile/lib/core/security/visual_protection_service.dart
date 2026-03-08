import 'package:flutter/services.dart';

/// Visual protection: prevent screenshots and hide content in app switcher.
class VisualProtectionService {
  bool _isProtected = false;

  bool get isProtected => _isProtected;

  /// Enable secure mode: prevents screenshots and hides app content in recents.
  /// On Android: sets FLAG_SECURE on the window.
  /// On iOS: uses UITextField secure text trick.
  Future<void> enableProtection() async {
    if (_isProtected) return;
    try {
      // Flutter 3.x approach: use platform channel or SystemChrome
      // FLAG_SECURE prevents screenshots and hides in recent apps
      await const MethodChannel(
        'com.ilmi.security',
      ).invokeMethod('enableSecureMode');
      _isProtected = true;
    } on MissingPluginException {
      // Platform channel not set up yet — use fallback
      _isProtected = false;
    }
  }

  /// Disable secure mode.
  Future<void> disableProtection() async {
    if (!_isProtected) return;
    try {
      await const MethodChannel(
        'com.ilmi.security',
      ).invokeMethod('disableSecureMode');
      _isProtected = false;
    } on MissingPluginException {
      _isProtected = false;
    }
  }

  /// Toggle based on whether sensitive content is visible.
  Future<void> setProtection(bool enabled) async {
    if (enabled) {
      await enableProtection();
    } else {
      await disableProtection();
    }
  }
}
