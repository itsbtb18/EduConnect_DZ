import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get_it/get_it.dart';

import 'app_lock_manager.dart';
import 'biometric_service.dart';

/// Full-screen lock overlay requiring PIN or biometric to unlock.
class LockScreen extends StatefulWidget {
  const LockScreen({super.key});

  @override
  State<LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends State<LockScreen> {
  final _pinController = TextEditingController();
  final _appLock = GetIt.instance<AppLockManager>();
  final _biometric = GetIt.instance<BiometricService>();
  String? _error;
  bool _biometricAvailable = false;

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  Future<void> _checkBiometric() async {
    final available = await _biometric.isAvailable();
    final enabled = await _appLock.isBiometricEnabled();
    if (mounted) {
      setState(() => _biometricAvailable = available && enabled);
      if (_biometricAvailable) {
        _attemptBiometric();
      }
    }
  }

  Future<void> _attemptBiometric() async {
    final success = await _appLock.unlockWithBiometric();
    if (!success && mounted) {
      setState(() => _error = 'Échec de l\'authentification biométrique');
    }
  }

  Future<void> _submitPin() async {
    final pin = _pinController.text;
    if (pin.length < 4) {
      setState(() => _error = 'Le code PIN doit contenir au moins 4 chiffres');
      return;
    }
    final success = await _appLock.verifyPin(pin);
    if (!success && mounted) {
      setState(() => _error = 'Code PIN incorrect');
      _pinController.clear();
    }
  }

  @override
  void dispose() {
    _pinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 32.w),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.lock_outline,
                  size: 64.sp,
                  color: Theme.of(context).colorScheme.primary,
                ),
                SizedBox(height: 24.h),
                Text(
                  'Application verrouillée',
                  style: TextStyle(
                    fontSize: 22.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8.h),
                Text(
                  'Entrez votre code PIN pour continuer',
                  style: TextStyle(fontSize: 14.sp, color: Colors.grey[600]),
                ),
                SizedBox(height: 32.h),

                // PIN input
                SizedBox(
                  width: 200.w,
                  child: TextField(
                    controller: _pinController,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: 6,
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 24.sp, letterSpacing: 8),
                    decoration: InputDecoration(
                      counterText: '',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      hintText: '••••',
                    ),
                    onSubmitted: (_) => _submitPin(),
                  ),
                ),

                if (_error != null) ...[
                  SizedBox(height: 12.h),
                  Text(
                    _error!,
                    style: TextStyle(color: Colors.red, fontSize: 13.sp),
                  ),
                ],

                SizedBox(height: 24.h),

                // Submit button
                SizedBox(
                  width: 200.w,
                  child: ElevatedButton(
                    onPressed: _submitPin,
                    child: const Text('Déverrouiller'),
                  ),
                ),

                // Biometric button
                if (_biometricAvailable) ...[
                  SizedBox(height: 16.h),
                  TextButton.icon(
                    onPressed: _attemptBiometric,
                    icon: const Icon(Icons.fingerprint),
                    label: const Text('Utiliser l\'empreinte'),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
