import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get_it/get_it.dart';

import 'package:ilmi_mobile/core/security/app_lock_manager.dart';
import 'package:ilmi_mobile/core/security/biometric_service.dart';

/// Security settings screen — manage app lock, biometric, PIN.
class SecuritySettingsScreen extends StatefulWidget {
  const SecuritySettingsScreen({super.key});

  @override
  State<SecuritySettingsScreen> createState() => _SecuritySettingsScreenState();
}

class _SecuritySettingsScreenState extends State<SecuritySettingsScreen> {
  final _appLock = GetIt.instance<AppLockManager>();
  final _biometric = GetIt.instance<BiometricService>();

  bool _lockEnabled = false;
  bool _biometricEnabled = false;
  bool _biometricAvailable = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final lockEnabled = await _appLock.isLockEnabled();
    final bioEnabled = await _appLock.isBiometricEnabled();
    final bioAvailable = await _biometric.isAvailable();

    if (mounted) {
      setState(() {
        _lockEnabled = lockEnabled;
        _biometricEnabled = bioEnabled;
        _biometricAvailable = bioAvailable;
      });
    }
  }

  Future<void> _toggleLock(bool enabled) async {
    if (enabled) {
      // Show PIN setup dialog
      final pin = await _showPinSetupDialog();
      if (pin != null && pin.length >= 4) {
        await _appLock.enableLock(pin);
        setState(() => _lockEnabled = true);
      }
    } else {
      await _appLock.disableLock();
      setState(() {
        _lockEnabled = false;
        _biometricEnabled = false;
      });
    }
  }

  Future<void> _toggleBiometric(bool enabled) async {
    if (enabled) {
      // Test biometric first
      final success = await _biometric.authenticate(
        reason: 'Confirmez l\'activation de l\'authentification biométrique',
      );
      if (success) {
        await _appLock.setBiometricEnabled(true);
        setState(() => _biometricEnabled = true);
      }
    } else {
      await _appLock.setBiometricEnabled(false);
      setState(() => _biometricEnabled = false);
    }
  }

  Future<String?> _showPinSetupDialog() async {
    final controller = TextEditingController();
    final confirmController = TextEditingController();

    return showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        String? error;
        return StatefulBuilder(
          builder: (ctx, setDialogState) {
            return AlertDialog(
              title: const Text('Configurer le code PIN'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: controller,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: 6,
                    decoration: InputDecoration(
                      labelText: 'Code PIN (4-6 chiffres)',
                      counterText: '',
                      errorText: error,
                    ),
                  ),
                  SizedBox(height: 12.h),
                  TextField(
                    controller: confirmController,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: 6,
                    decoration: const InputDecoration(
                      labelText: 'Confirmer le code PIN',
                      counterText: '',
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Annuler'),
                ),
                ElevatedButton(
                  onPressed: () {
                    if (controller.text.length < 4) {
                      setDialogState(() => error = 'Minimum 4 chiffres');
                      return;
                    }
                    if (controller.text != confirmController.text) {
                      setDialogState(
                        () => error = 'Les codes ne correspondent pas',
                      );
                      return;
                    }
                    Navigator.pop(ctx, controller.text);
                  },
                  child: const Text('Confirmer'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sécurité')),
      body: ListView(
        children: [
          // App Lock Section
          Padding(
            padding: EdgeInsets.all(16.w),
            child: Text(
              'Verrouillage de l\'application',
              style: TextStyle(
                fontSize: 14.sp,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
          SwitchListTile(
            title: const Text('Code PIN'),
            subtitle: const Text(
              'Protégez l\'accès à l\'application avec un code PIN',
            ),
            secondary: const Icon(Icons.lock_outline),
            value: _lockEnabled,
            onChanged: _toggleLock,
          ),
          if (_lockEnabled && _biometricAvailable)
            SwitchListTile(
              title: const Text('Empreinte digitale / Face ID'),
              subtitle: const Text(
                'Déverrouillez rapidement avec la biométrie',
              ),
              secondary: const Icon(Icons.fingerprint),
              value: _biometricEnabled,
              onChanged: _toggleBiometric,
            ),

          const Divider(),

          // Info Section
          Padding(
            padding: EdgeInsets.all(16.w),
            child: Text(
              'Protection des données',
              style: TextStyle(
                fontSize: 14.sp,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
          const ListTile(
            leading: Icon(Icons.security),
            title: Text('Chiffrement des données'),
            subtitle: Text('Vos données sensibles sont chiffrées localement'),
            trailing: Icon(Icons.check_circle, color: Colors.green),
          ),
          const ListTile(
            leading: Icon(Icons.no_photography_outlined),
            title: Text('Protection anti-capture'),
            subtitle: Text(
              'Les captures d\'écran sont bloquées sur les pages sensibles',
            ),
            trailing: Icon(Icons.check_circle, color: Colors.green),
          ),
          const ListTile(
            leading: Icon(Icons.timer_outlined),
            title: Text('Déconnexion automatique'),
            subtitle: Text(
              'L\'application se verrouille après 5 minutes d\'inactivité',
            ),
            trailing: Icon(Icons.check_circle, color: Colors.green),
          ),
        ],
      ),
    );
  }
}
