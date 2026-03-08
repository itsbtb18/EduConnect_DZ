import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get_it/get_it.dart';

import '../../../../core/storage/secure_storage_service.dart';

/// Notification settings with silent mode support.
/// Parents & students can control which notifications they receive.
class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() =>
      _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState
    extends State<NotificationSettingsScreen> {
  final _storage = GetIt.instance<SecureStorageService>();

  // Preference keys
  static const _prefix = 'notif_pref_';
  static const _silentModeKey = '${_prefix}silent_mode';
  static const _silentStartKey = '${_prefix}silent_start';
  static const _silentEndKey = '${_prefix}silent_end';
  static const _gradesKey = '${_prefix}grades';
  static const _attendanceKey = '${_prefix}attendance';
  static const _homeworkKey = '${_prefix}homework';
  static const _announcementsKey = '${_prefix}announcements';
  static const _chatKey = '${_prefix}chat';
  static const _financeKey = '${_prefix}finance';

  bool _silentMode = false;
  TimeOfDay _silentStart = const TimeOfDay(hour: 22, minute: 0);
  TimeOfDay _silentEnd = const TimeOfDay(hour: 7, minute: 0);
  bool _grades = true;
  bool _attendance = true;
  bool _homework = true;
  bool _announcements = true;
  bool _chat = true;
  bool _finance = true;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final silentMode = await _storage.readGeneric(_silentModeKey);
    final silentStart = await _storage.readGeneric(_silentStartKey);
    final silentEnd = await _storage.readGeneric(_silentEndKey);
    final grades = await _storage.readGeneric(_gradesKey);
    final attendance = await _storage.readGeneric(_attendanceKey);
    final homework = await _storage.readGeneric(_homeworkKey);
    final announcements = await _storage.readGeneric(_announcementsKey);
    final chat = await _storage.readGeneric(_chatKey);
    final finance = await _storage.readGeneric(_financeKey);

    if (mounted) {
      setState(() {
        _silentMode = silentMode == 'true';
        if (silentStart != null) {
          final parts = silentStart.split(':');
          _silentStart = TimeOfDay(
            hour: int.parse(parts[0]),
            minute: int.parse(parts[1]),
          );
        }
        if (silentEnd != null) {
          final parts = silentEnd.split(':');
          _silentEnd = TimeOfDay(
            hour: int.parse(parts[0]),
            minute: int.parse(parts[1]),
          );
        }
        _grades = grades != 'false';
        _attendance = attendance != 'false';
        _homework = homework != 'false';
        _announcements = announcements != 'false';
        _chat = chat != 'false';
        _finance = finance != 'false';
      });
    }
  }

  Future<void> _savePref(String key, String value) async {
    await _storage.writeGeneric(key, value);
  }

  Future<void> _pickTime(bool isStart) async {
    final initial = isStart ? _silentStart : _silentEnd;
    final picked = await showTimePicker(context: context, initialTime: initial);
    if (picked == null) return;

    final formatted =
        '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';

    setState(() {
      if (isStart) {
        _silentStart = picked;
        _savePref(_silentStartKey, formatted);
      } else {
        _silentEnd = picked;
        _savePref(_silentEndKey, formatted);
      }
    });
  }

  String _formatTime(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: ListView(
        children: [
          // Silent Mode Section
          Padding(
            padding: EdgeInsets.all(16.w),
            child: Text(
              'Mode silencieux',
              style: TextStyle(
                fontSize: 14.sp,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
          SwitchListTile(
            title: const Text('Activer le mode silencieux'),
            subtitle: const Text(
              'Suspendre les notifications pendant les heures définies',
            ),
            secondary: const Icon(Icons.do_not_disturb_on_outlined),
            value: _silentMode,
            onChanged: (val) {
              setState(() => _silentMode = val);
              _savePref(_silentModeKey, val.toString());
            },
          ),
          if (_silentMode) ...[
            ListTile(
              leading: const Icon(Icons.schedule),
              title: const Text('Début'),
              trailing: Text(
                _formatTime(_silentStart),
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w500),
              ),
              onTap: () => _pickTime(true),
            ),
            ListTile(
              leading: const Icon(Icons.schedule),
              title: const Text('Fin'),
              trailing: Text(
                _formatTime(_silentEnd),
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w500),
              ),
              onTap: () => _pickTime(false),
            ),
          ],

          const Divider(),

          // Notification categories
          Padding(
            padding: EdgeInsets.all(16.w),
            child: Text(
              'Catégories de notifications',
              style: TextStyle(
                fontSize: 14.sp,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
          SwitchListTile(
            title: const Text('Notes & résultats'),
            secondary: const Icon(Icons.grade_outlined),
            value: _grades,
            onChanged: (val) {
              setState(() => _grades = val);
              _savePref(_gradesKey, val.toString());
            },
          ),
          SwitchListTile(
            title: const Text('Absences & retards'),
            secondary: const Icon(Icons.event_busy_outlined),
            value: _attendance,
            onChanged: (val) {
              setState(() => _attendance = val);
              _savePref(_attendanceKey, val.toString());
            },
          ),
          SwitchListTile(
            title: const Text('Devoirs'),
            secondary: const Icon(Icons.assignment_outlined),
            value: _homework,
            onChanged: (val) {
              setState(() => _homework = val);
              _savePref(_homeworkKey, val.toString());
            },
          ),
          SwitchListTile(
            title: const Text('Annonces'),
            secondary: const Icon(Icons.campaign_outlined),
            value: _announcements,
            onChanged: (val) {
              setState(() => _announcements = val);
              _savePref(_announcementsKey, val.toString());
            },
          ),
          SwitchListTile(
            title: const Text('Messages'),
            secondary: const Icon(Icons.chat_outlined),
            value: _chat,
            onChanged: (val) {
              setState(() => _chat = val);
              _savePref(_chatKey, val.toString());
            },
          ),
          SwitchListTile(
            title: const Text('Paiements & finances'),
            secondary: const Icon(Icons.payment_outlined),
            value: _finance,
            onChanged: (val) {
              setState(() => _finance = val);
              _savePref(_financeKey, val.toString());
            },
          ),
        ],
      ),
    );
  }
}
