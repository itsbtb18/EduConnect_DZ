import 'package:intl/intl.dart';

/// Date formatting and utility helpers for the EduConnect app.
class AppDateUtils {
  AppDateUtils._();

  static final _dateFormat = DateFormat('dd/MM/yyyy');
  static final _timeFormat = DateFormat('HH:mm');
  static final _dateTimeFormat = DateFormat('dd/MM/yyyy HH:mm');
  static final _monthYearFormat = DateFormat('MMMM yyyy');
  static final _dayMonthFormat = DateFormat('dd MMM');

  /// Format as dd/MM/yyyy.
  static String formatDate(DateTime date) => _dateFormat.format(date);

  /// Format as HH:mm.
  static String formatTime(DateTime date) => _timeFormat.format(date);

  /// Format as dd/MM/yyyy HH:mm.
  static String formatDateTime(DateTime date) => _dateTimeFormat.format(date);

  /// Format as "MMMM yyyy" (e.g., "January 2025").
  static String formatMonthYear(DateTime date) => _monthYearFormat.format(date);

  /// Format as "dd MMM" (e.g., "15 Jan").
  static String formatDayMonth(DateTime date) => _dayMonthFormat.format(date);

  /// Returns a human-readable relative time string.
  static String formatRelative(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()}w ago';

    return formatDate(date);
  }

  /// Returns the Algerian academic year label for a given date.
  /// e.g., "2024/2025" for dates between Sep 2024 and Aug 2025.
  static String academicYearLabel(DateTime date) {
    final year = date.month >= 9 ? date.year : date.year - 1;
    return '$year/${year + 1}';
  }

  /// Returns the trimester (1, 2, or 3) for a given date in the Algerian system.
  /// T1: Sep–Dec, T2: Jan–Mar, T3: Apr–Jun.
  static int trimesterForDate(DateTime date) {
    if (date.month >= 9 && date.month <= 12) return 1;
    if (date.month >= 1 && date.month <= 3) return 2;
    if (date.month >= 4 && date.month <= 6) return 3;
    // Summer months default to T3
    return 3;
  }

  /// Checks if two dates are on the same calendar day.
  static bool isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  /// Returns the start of the week (Saturday for Algeria).
  static DateTime startOfWeek(DateTime date) {
    // Algeria: Saturday is first day of week
    final diff = (date.weekday - DateTime.saturday) % 7;
    return DateTime(date.year, date.month, date.day - diff);
  }

  /// Returns the number of days in a given month.
  static int daysInMonth(int year, int month) {
    return DateTime(year, month + 1, 0).day;
  }

  /// Returns true if the given date is a weekend in Algeria (Friday/Saturday).
  static bool isWeekend(DateTime date) {
    return date.weekday == DateTime.friday || date.weekday == DateTime.saturday;
  }

  /// Parse an ISO 8601 date string, returning null on failure.
  static DateTime? tryParseIso(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return null;
    return DateTime.tryParse(dateStr);
  }
}
