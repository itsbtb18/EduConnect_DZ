import 'dart:ui';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ── State ───────────────────────────────────────────────────────────────────

class LocaleState extends Equatable {
  final Locale locale;

  const LocaleState({required this.locale});

  bool get isArabic => locale.languageCode == 'ar';

  @override
  List<Object?> get props => [locale];
}

// ── Cubit ───────────────────────────────────────────────────────────────────

class LocaleCubit extends Cubit<LocaleState> {
  static const _key = 'language';

  LocaleCubit() : super(const LocaleState(locale: Locale('fr', 'DZ')));

  /// Load saved locale from SharedPreferences.
  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString(_key) ?? 'fr';
    emit(LocaleState(locale: _localeFrom(code)));
  }

  /// Switch locale and persist.
  Future<void> setLocale(String languageCode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, languageCode);
    emit(LocaleState(locale: _localeFrom(languageCode)));
  }

  Locale _localeFrom(String code) {
    switch (code) {
      case 'ar':
        return const Locale('ar', 'DZ');
      default:
        return const Locale('fr', 'DZ');
    }
  }
}
