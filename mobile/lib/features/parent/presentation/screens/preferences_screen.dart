import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../../core/locale/locale_cubit.dart';

/// Parent preferences — notifications, silent mode, language, dark mode.
class PreferencesScreen extends StatefulWidget {
  const PreferencesScreen({super.key});

  @override
  State<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends State<PreferencesScreen> {
  // Notification toggles
  bool _notifGrades = true;
  bool _notifAttendance = true;
  bool _notifHomework = true;
  bool _notifCanteen = true;
  bool _notifTransport = true;
  bool _notifAnnouncements = true;
  bool _notifFinance = true;

  // Silent mode
  bool _silentMode = false;
  TimeOfDay _silentStart = const TimeOfDay(hour: 22, minute: 0);
  TimeOfDay _silentEnd = const TimeOfDay(hour: 7, minute: 0);

  // Language
  String _language = 'fr'; // fr, ar

  // Dark mode
  bool _darkMode = false;

  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _notifGrades = prefs.getBool('notif_grades') ?? true;
      _notifAttendance = prefs.getBool('notif_attendance') ?? true;
      _notifHomework = prefs.getBool('notif_homework') ?? true;
      _notifCanteen = prefs.getBool('notif_canteen') ?? true;
      _notifTransport = prefs.getBool('notif_transport') ?? true;
      _notifAnnouncements = prefs.getBool('notif_announcements') ?? true;
      _notifFinance = prefs.getBool('notif_finance') ?? true;

      _silentMode = prefs.getBool('silent_mode') ?? false;
      _silentStart = TimeOfDay(
        hour: prefs.getInt('silent_start_h') ?? 22,
        minute: prefs.getInt('silent_start_m') ?? 0,
      );
      _silentEnd = TimeOfDay(
        hour: prefs.getInt('silent_end_h') ?? 7,
        minute: prefs.getInt('silent_end_m') ?? 0,
      );

      _language = prefs.getString('language') ?? 'fr';
      _darkMode = prefs.getBool('dark_mode') ?? false;
      _loading = false;
    });
  }

  Future<void> _saveBool(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
  }

  Future<void> _saveString(String key, String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, value);
  }

  Future<void> _saveInt(String key, int value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(key, value);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Préférences')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Préférences')),
      body: ListView(
        children: [
          // ─── Notifications ───────────────────────────
          _sectionHeader('Notifications'),
          _notifToggle('Notes & Bulletins', Icons.grade, _notifGrades, (v) {
            setState(() => _notifGrades = v);
            _saveBool('notif_grades', v);
          }),
          _notifToggle(
            'Présence & Absences',
            Icons.event_available,
            _notifAttendance,
            (v) {
              setState(() => _notifAttendance = v);
              _saveBool('notif_attendance', v);
            },
          ),
          _notifToggle('Devoirs', Icons.assignment, _notifHomework, (v) {
            setState(() => _notifHomework = v);
            _saveBool('notif_homework', v);
          }),
          _notifToggle('Cantine', Icons.restaurant, _notifCanteen, (v) {
            setState(() => _notifCanteen = v);
            _saveBool('notif_canteen', v);
          }),
          _notifToggle('Transport', Icons.directions_bus, _notifTransport, (v) {
            setState(() => _notifTransport = v);
            _saveBool('notif_transport', v);
          }),
          _notifToggle('Annonces', Icons.campaign, _notifAnnouncements, (v) {
            setState(() => _notifAnnouncements = v);
            _saveBool('notif_announcements', v);
          }),
          _notifToggle('Finance', Icons.payments, _notifFinance, (v) {
            setState(() => _notifFinance = v);
            _saveBool('notif_finance', v);
          }),

          // ─── Mode silencieux ─────────────────────────
          _sectionHeader('Mode silencieux'),
          SwitchListTile(
            title: const Text('Activer le mode silencieux'),
            subtitle: const Text(
              'Pas de notifications pendant la plage horaire',
            ),
            secondary: const Icon(Icons.do_not_disturb),
            value: _silentMode,
            onChanged: (v) {
              setState(() => _silentMode = v);
              _saveBool('silent_mode', v);
            },
          ),
          if (_silentMode) ...[
            ListTile(
              leading: const Icon(Icons.access_time),
              title: const Text('Début'),
              trailing: Text(_fmtTime(_silentStart)),
              onTap: () async {
                final t = await showTimePicker(
                  context: context,
                  initialTime: _silentStart,
                );
                if (t != null) {
                  setState(() => _silentStart = t);
                  _saveInt('silent_start_h', t.hour);
                  _saveInt('silent_start_m', t.minute);
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.access_time),
              title: const Text('Fin'),
              trailing: Text(_fmtTime(_silentEnd)),
              onTap: () async {
                final t = await showTimePicker(
                  context: context,
                  initialTime: _silentEnd,
                );
                if (t != null) {
                  setState(() => _silentEnd = t);
                  _saveInt('silent_end_h', t.hour);
                  _saveInt('silent_end_m', t.minute);
                }
              },
            ),
          ],

          // ─── Langue ──────────────────────────────────
          _sectionHeader('Langue'),
          ListTile(
            leading: const Text('🇫🇷', style: TextStyle(fontSize: 22)),
            title: const Text('Français'),
            trailing: Icon(
              _language == 'fr'
                  ? Icons.radio_button_checked
                  : Icons.radio_button_unchecked,
              color: _language == 'fr' ? Colors.indigo : Colors.grey,
            ),
            onTap: () {
              setState(() => _language = 'fr');
              _saveString('language', 'fr');
              context.read<LocaleCubit>().setLocale('fr');
            },
          ),
          ListTile(
            leading: const Text('🇩🇿', style: TextStyle(fontSize: 22)),
            title: const Text('العربية'),
            trailing: Icon(
              _language == 'ar'
                  ? Icons.radio_button_checked
                  : Icons.radio_button_unchecked,
              color: _language == 'ar' ? Colors.indigo : Colors.grey,
            ),
            onTap: () {
              setState(() => _language = 'ar');
              _saveString('language', 'ar');
              context.read<LocaleCubit>().setLocale('ar');
            },
          ),

          // ─── Apparence ───────────────────────────────
          _sectionHeader('Apparence'),
          SwitchListTile(
            title: const Text('Mode sombre'),
            subtitle: const Text('Adapter l\'affichage pour la nuit'),
            secondary: const Icon(Icons.dark_mode),
            value: _darkMode,
            onChanged: (v) {
              setState(() => _darkMode = v);
              _saveBool('dark_mode', v);
            },
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 4),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Colors.indigo.shade700,
        ),
      ),
    );
  }

  Widget _notifToggle(
    String label,
    IconData icon,
    bool value,
    ValueChanged<bool> onChanged,
  ) {
    return SwitchListTile(
      title: Text(label),
      secondary: Icon(icon, size: 20),
      value: value,
      onChanged: onChanged,
    );
  }

  String _fmtTime(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
}
