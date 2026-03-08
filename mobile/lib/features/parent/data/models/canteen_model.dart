/// Canteen menu/meal models for parent view
class CanteenMenu {
  final String id;
  final String title;
  final String periodType; // WEEKLY, MONTHLY, TRIMESTER
  final DateTime startDate;
  final DateTime endDate;
  final String? notes;
  final List<CanteenMenuItem> items;

  const CanteenMenu({
    required this.id,
    required this.title,
    this.periodType = 'WEEKLY',
    required this.startDate,
    required this.endDate,
    this.notes,
    this.items = const [],
  });

  factory CanteenMenu.fromJson(Map<String, dynamic> json) {
    return CanteenMenu(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      periodType: json['period_type'] as String? ?? 'WEEKLY',
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: DateTime.parse(json['end_date'] as String),
      notes: json['notes'] as String?,
      items:
          (json['items'] as List<dynamic>?)
              ?.map((e) => CanteenMenuItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class CanteenMenuItem {
  final String id;
  final DateTime? date;
  final String? dayOfWeek; // SUN, MON, TUE, WED, THU
  final String? starter;
  final String? mainCourse;
  final String? sideDish;
  final String? dessert;
  final String? allergens;
  final bool suitableForDiabetic;
  final bool suitableForCeliac;
  final int? caloriesApprox;

  const CanteenMenuItem({
    required this.id,
    this.date,
    this.dayOfWeek,
    this.starter,
    this.mainCourse,
    this.sideDish,
    this.dessert,
    this.allergens,
    this.suitableForDiabetic = false,
    this.suitableForCeliac = false,
    this.caloriesApprox,
  });

  String get dayLabel => switch (dayOfWeek) {
    'SUN' => 'Dimanche',
    'MON' => 'Lundi',
    'TUE' => 'Mardi',
    'WED' => 'Mercredi',
    'THU' => 'Jeudi',
    'FRI' => 'Vendredi',
    'SAT' => 'Samedi',
    _ => dayOfWeek ?? '',
  };

  factory CanteenMenuItem.fromJson(Map<String, dynamic> json) {
    return CanteenMenuItem(
      id: json['id'] as String,
      date: json['date'] != null
          ? DateTime.parse(json['date'] as String)
          : null,
      dayOfWeek: json['day_of_week'] as String?,
      starter: json['starter'] as String?,
      mainCourse: json['main_course'] as String?,
      sideDish: json['side_dish'] as String?,
      dessert: json['dessert'] as String?,
      allergens: json['allergens'] as String?,
      suitableForDiabetic: json['suitable_for_diabetic'] as bool? ?? false,
      suitableForCeliac: json['suitable_for_celiac'] as bool? ?? false,
      caloriesApprox: json['calories_approx'] as int?,
    );
  }
}
