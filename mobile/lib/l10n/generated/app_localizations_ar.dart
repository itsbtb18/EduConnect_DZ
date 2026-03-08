// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class SAr extends S {
  SAr([String locale = 'ar']) : super(locale);

  @override
  String get appName => 'إلمي';

  @override
  String get appTagline => 'الجزائر';

  @override
  String get login => 'تسجيل الدخول';

  @override
  String get phoneNumber => 'رقم الهاتف';

  @override
  String get phoneHint => '0555 12 34 56';

  @override
  String get password => 'كلمة المرور';

  @override
  String get passwordHint => '••••••••';

  @override
  String get loginButton => 'تسجيل الدخول';

  @override
  String get pinLoginLink => 'تسجيل الدخول برمز PIN (تلاميذ)';

  @override
  String get errorPhoneRequired => 'يرجى إدخال رقم الهاتف';

  @override
  String get errorPhoneInvalid => 'رقم الهاتف غير صالح';

  @override
  String get errorPasswordRequired => 'يرجى إدخال كلمة المرور';

  @override
  String get errorPasswordShort =>
      'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل';

  @override
  String get pinLoginTitle => 'تسجيل دخول التلميذ';

  @override
  String get pinGreeting => 'مرحبا! 👋';

  @override
  String get pinInstructions => 'أدخل رقم هاتف ولي أمرك\nورمزك السري';

  @override
  String get pinPhoneHint => '05XX XXX XXX';

  @override
  String get pinCountryCode => '+213 ';

  @override
  String get pinPhoneError => 'أدخل رقم الهاتف';

  @override
  String get pinCode => 'الرمز السري';

  @override
  String get pinEnter => 'دخول';

  @override
  String get pinBackLink => '← العودة لتسجيل الدخول العادي';

  @override
  String get securityTitle => 'الأمان';

  @override
  String get appLockSection => 'قفل التطبيق';

  @override
  String get dataProtectionSection => 'حماية البيانات';

  @override
  String get pinLockOption => 'رمز PIN';

  @override
  String get pinLockDesc => 'احمِ الوصول للتطبيق برمز PIN';

  @override
  String get biometricOption => 'بصمة الإصبع / التعرف على الوجه';

  @override
  String get biometricDesc => 'افتح القفل بسرعة باستخدام المقاييس الحيوية';

  @override
  String get encryptionOption => 'تشفير البيانات';

  @override
  String get encryptionDesc => 'بياناتك الحساسة مشفرة محلياً';

  @override
  String get screenshotProtection => 'الحماية من لقطات الشاشة';

  @override
  String get screenshotDesc => 'لقطات الشاشة محظورة في الصفحات الحساسة';

  @override
  String get autoLogout => 'تسجيل الخروج التلقائي';

  @override
  String get autoLogoutDesc => 'يُقفل التطبيق بعد 5 دقائق من عدم النشاط';

  @override
  String get configurePinTitle => 'إعداد رمز PIN';

  @override
  String get pinInputLabel => 'رمز PIN (4-6 أرقام)';

  @override
  String get pinConfirmLabel => 'تأكيد رمز PIN';

  @override
  String get cancel => 'إلغاء';

  @override
  String get confirm => 'تأكيد';

  @override
  String get pinMinError => '4 أرقام كحد أدنى';

  @override
  String get pinMismatch => 'الرموز غير متطابقة';

  @override
  String get studentSpace => 'فضاء التلميذ';

  @override
  String get parentSpace => 'فضاء الولي';

  @override
  String get teacherSpace => 'فضاء الأستاذ';

  @override
  String get trainerSpace => 'فضاء المكوّن';

  @override
  String get traineeSpace => 'فضاء المتربّص';

  @override
  String get navHome => 'الرئيسية';

  @override
  String get navGrades => 'النقاط';

  @override
  String get navSchedule => 'الجدول';

  @override
  String get navHomework => 'الواجبات';

  @override
  String get navAttendance => 'الحضور';

  @override
  String get navHealth => 'الصحة';

  @override
  String get navPayments => 'المدفوعات';

  @override
  String get menuIdCard => 'بطاقة التعريف';

  @override
  String get menuELearning => 'التعلم الإلكتروني';

  @override
  String get menuLibrary => 'المكتبة';

  @override
  String get menuCanteen => 'المطعم';

  @override
  String get menuTransport => 'النقل';

  @override
  String get menuGamification => 'الألعاب التعليمية';

  @override
  String get menuAIChatbot => 'المساعد الذكي';

  @override
  String get menuProfile => 'ملفي الشخصي';

  @override
  String get menuReportCards => 'كشوف النقاط';

  @override
  String get menuJustifications => 'التبريرات';

  @override
  String get menuPreferences => 'التفضيلات';

  @override
  String get menuTextbook => 'دفتر النصوص';

  @override
  String get menuResources => 'الموارد البيداغوجية';

  @override
  String get menuPayslips => 'كشوف الرواتب';

  @override
  String get menuCommunication => 'التواصل';

  @override
  String get menuExams => 'الامتحانات والتقييمات';

  @override
  String get menuAnnouncements => 'الإعلانات';

  @override
  String get dashboard => 'لوحة القيادة';

  @override
  String get parentDashboard => 'لوحة قيادة الولي';

  @override
  String get trainerDashboard => 'لوحة قيادة المكوّن';

  @override
  String get todayClasses => 'حصص اليوم';

  @override
  String get recentGrades => 'آخر النقاط';

  @override
  String get pendingHomework => 'واجبات للتسليم';

  @override
  String get announcements => 'الإعلانات';

  @override
  String get noClassesToday => 'لا توجد حصص اليوم';

  @override
  String get noRecentGrades => 'لا توجد نقاط حديثة';

  @override
  String get noPendingHomework => 'لا توجد واجبات معلقة';

  @override
  String get noAnnouncements => 'لا توجد إعلانات';

  @override
  String get subject => 'المادة';

  @override
  String get today => 'اليوم';

  @override
  String get daysShort => ' ي';

  @override
  String get myGrades => 'نقاطي';

  @override
  String get noGrades => 'لا توجد نقاط متاحة';

  @override
  String get retry => 'إعادة المحاولة';

  @override
  String get exam => 'امتحان';

  @override
  String gradeCount(int count) {
    return '$count نقطة/نقاط';
  }

  @override
  String get scheduleTitle => 'جدول الحصص';

  @override
  String get dayView => 'يوم';

  @override
  String get weekView => 'أسبوع';

  @override
  String get noClassesDay => 'لا توجد حصص هذا اليوم';

  @override
  String get myHomework => 'واجباتي';

  @override
  String pendingTab(int count) {
    return 'للإنجاز ($count)';
  }

  @override
  String submittedTab(int count) {
    return 'مُسلَّم ($count)';
  }

  @override
  String overdueTab(int count) {
    return 'متأخر ($count)';
  }

  @override
  String get noPendingHW => 'لا توجد واجبات للإنجاز';

  @override
  String get noSubmittedHW => 'لا توجد واجبات مُسلَّمة';

  @override
  String get noOverdueHW => 'لا توجد واجبات متأخرة';

  @override
  String get overdue => 'متأخر';

  @override
  String get idCardTitle => 'بطاقة التعريف';

  @override
  String get idCardUserError => 'تعذر استرجاع معرف المستخدم.';

  @override
  String idCardLoadError(String error) {
    return 'خطأ أثناء تحميل البطاقة: $error';
  }

  @override
  String get canteenTitle => 'المطعم 🍽️';

  @override
  String get noMenuPublished => 'لا توجد قوائم طعام منشورة';

  @override
  String get noDetailsAvailable => 'لا توجد تفاصيل متاحة';

  @override
  String get transportTitle => 'النقل 🚌';

  @override
  String get noTransportAssigned => 'لا يوجد نقل مخصص';

  @override
  String get contactAdmin => 'اتصل بالإدارة لمزيد من المعلومات.';

  @override
  String get line => 'الخط';

  @override
  String get vehicle => 'المركبة';

  @override
  String get driver => 'السائق';

  @override
  String get neighborhood => 'الحي:';

  @override
  String get departure => 'الذهاب';

  @override
  String get returnTime => 'العودة';

  @override
  String get vehicleModel => 'الطراز';

  @override
  String get licensePlate => 'اللوحة';

  @override
  String get vehicleColor => 'اللون';

  @override
  String get libraryTitle => 'المكتبة';

  @override
  String get searchBookHint => 'البحث عن كتاب…';

  @override
  String get categoryAll => 'الكل';

  @override
  String get categoryFiction => 'رواية';

  @override
  String get categoryNonFiction => 'غير خيالي';

  @override
  String get categorySciences => 'علوم';

  @override
  String get categoryMath => 'رياضيات';

  @override
  String get categoryHistory => 'تاريخ';

  @override
  String get categoryGeography => 'جغرافيا';

  @override
  String get categoryLiterature => 'أدب';

  @override
  String get categoryReligion => 'ديانة';

  @override
  String get categoryArts => 'فنون';

  @override
  String get categoryTechnology => 'تكنولوجيا';

  @override
  String get categoryReference => 'مراجع';

  @override
  String get categoryPhilosophy => 'فلسفة';

  @override
  String get categoryLanguages => 'لغات';

  @override
  String get categorySports => 'رياضة';

  @override
  String get categoryOther => 'أخرى';

  @override
  String get noBooksFound => 'لم يتم العثور على كتب';

  @override
  String get myBorrows => 'إعاراتي';

  @override
  String get loansTab => 'الإعارات';

  @override
  String get reservationsTab => 'الحجوزات';

  @override
  String get noActiveLoans => 'لا توجد إعارات حالية';

  @override
  String get noReservations => 'لا توجد حجوزات';

  @override
  String get statusActive => 'نشط';

  @override
  String get statusOverdue => 'متأخر';

  @override
  String get statusReturned => 'مُعاد';

  @override
  String get myQuizzes => 'اختباراتي';

  @override
  String get noQuizzes => 'لا توجد اختبارات متاحة';

  @override
  String get quizClosed => 'مغلق';

  @override
  String get resourcesTitle => 'الموارد البيداغوجية';

  @override
  String get searchResourceHint => 'البحث عن مورد...';

  @override
  String get subjectAll => 'الكل';

  @override
  String get subjectMath => 'رياضيات';

  @override
  String get subjectPhysics => 'فيزياء';

  @override
  String get subjectNaturalSciences => 'علوم طبيعية';

  @override
  String get subjectArabic => 'اللغة العربية';

  @override
  String get subjectFrench => 'اللغة الفرنسية';

  @override
  String get subjectEnglish => 'الإنجليزية';

  @override
  String get subjectCS => 'إعلام آلي';

  @override
  String get noResourcesFound => 'لم يتم العثور على موارد';

  @override
  String get examBankTitle => 'بنك الامتحانات';

  @override
  String get examAll => 'الكل';

  @override
  String get examBEP => 'BEP';

  @override
  String get examBEM => 'BEM';

  @override
  String get examBAC => 'BAC';

  @override
  String get examExercise => 'تمرين';

  @override
  String get examDevoir => 'فرض';

  @override
  String get examBlanc => 'امتحان تجريبي';

  @override
  String get noExamsFound => 'لم يتم العثور على امتحانات';

  @override
  String get rewardsTitle => 'مكافآتي ⭐';

  @override
  String get myBadges => 'شاراتي';

  @override
  String get weeklyChallenges => 'تحديات الأسبوع';

  @override
  String get leaderboard => 'الترتيب';

  @override
  String get noChallengesThisWeek => 'لا توجد تحديات هذا الأسبوع';

  @override
  String get leaderboardUnavailable => 'الترتيب غير متاح';

  @override
  String get congratulations => 'تهانينا! 🎉';

  @override
  String badgeEarned(String badgeName) {
    return 'لقد حصلت على شارة\n\"$badgeName\"';
  }

  @override
  String get badgesTitle => 'شاراتي 🏅';

  @override
  String earnedBadges(int count) {
    return 'الشارات المحصّلة ($count)';
  }

  @override
  String lockedBadges(int count) {
    return 'شارات للفتح ($count)';
  }

  @override
  String get noBadgesAvailable => 'لا توجد شارات متاحة حالياً';

  @override
  String get leaderboardTitle => 'الترتيب 🏆';

  @override
  String get pointsUnit => ' نقطة';

  @override
  String get challengesTitle => 'التحديات 🎯';

  @override
  String get comeBackSoon => 'عد قريباً!';

  @override
  String get childGradesTitle => 'نقاط إبني';

  @override
  String get columnSubject => 'المادة';

  @override
  String get columnType => 'النوع';

  @override
  String get columnGrade => 'النقطة';

  @override
  String get columnAvg => 'المعدل';

  @override
  String overallAverage(String value) {
    return 'المعدل العام: $value / 20';
  }

  @override
  String get childAttendanceTitle => 'حضور إبني';

  @override
  String get monthJan => 'جانفي';

  @override
  String get monthFeb => 'فيفري';

  @override
  String get monthMar => 'مارس';

  @override
  String get monthApr => 'أفريل';

  @override
  String get monthMay => 'ماي';

  @override
  String get monthJun => 'جوان';

  @override
  String get monthJul => 'جويلية';

  @override
  String get monthAug => 'أوت';

  @override
  String get monthSep => 'سبتمبر';

  @override
  String get monthOct => 'أكتوبر';

  @override
  String get monthNov => 'نوفمبر';

  @override
  String get monthDec => 'ديسمبر';

  @override
  String get attendancePresent => 'الحضور';

  @override
  String get attendanceAbsent => 'الغيابات';

  @override
  String get attendanceLate => 'التأخرات';

  @override
  String get attendanceRate => 'النسبة';

  @override
  String get statusPresent => 'حاضر';

  @override
  String get statusAbsent => 'غائب';

  @override
  String get statusLate => 'متأخر';

  @override
  String get statusNA => 'غ/م';

  @override
  String get canteenParentTitle => 'المطعم';

  @override
  String get periodWeek => 'أسبوع';

  @override
  String get periodMonth => 'شهر';

  @override
  String get periodTrimester => 'فصل';

  @override
  String get mealStarter => '🥗 مقبّلات';

  @override
  String get mealMain => '🍖 الطبق الرئيسي';

  @override
  String get mealSide => '🥕 مرفقات';

  @override
  String get mealDessert => '🍰 تحلية';

  @override
  String allergenLabel(String list) {
    return 'مسببات الحساسية: $list';
  }

  @override
  String get diabeticLabel => 'مناسب لمرضى السكري ✓';

  @override
  String get celiacLabel => 'خالي من الغلوتين ✓';

  @override
  String get schoolTransportTitle => 'النقل المدرسي';

  @override
  String busEnRoute(String lineName) {
    return 'الحافلة في الطريق — $lineName';
  }

  @override
  String speed(String value) {
    return 'السرعة: $value كم/س';
  }

  @override
  String get noTransportInfo => 'لا توجد معلومات نقل متاحة';

  @override
  String get callDriver => 'اتصال';

  @override
  String get financeTitle => 'المالية والمدفوعات';

  @override
  String get financeSummary => 'الملخص المالي';

  @override
  String get totalFees => 'إجمالي المصاريف';

  @override
  String get paid => 'مدفوع';

  @override
  String get remaining => 'المتبقي';

  @override
  String get rate => 'النسبة';

  @override
  String get currencyDA => ' دج';

  @override
  String get absenceJustTitle => 'تبرير الغيابات';

  @override
  String get submitTab => 'تقديم';

  @override
  String get trackingTab => 'المتابعة';

  @override
  String get noAbsenceToJustify => 'لا توجد غيابات للتبرير';

  @override
  String get noJustificationSubmitted => 'لا توجد تبريرات مقدّمة';

  @override
  String get statusApproved => 'مقبول';

  @override
  String get statusRejected => 'مرفوض';

  @override
  String get statusPending => 'قيد الانتظار';

  @override
  String get justify => 'تبرير';

  @override
  String get preferencesTitle => 'التفضيلات';

  @override
  String get notificationsSection => 'الإشعارات';

  @override
  String get silentModeSection => 'الوضع الصامت';

  @override
  String get languageSection => 'اللغة';

  @override
  String get appearanceSection => 'المظهر';

  @override
  String get notifGrades => 'النقاط والكشوف';

  @override
  String get notifAttendance => 'الحضور والغياب';

  @override
  String get notifHomework => 'الواجبات';

  @override
  String get notifCanteen => 'المطعم';

  @override
  String get notifTransport => 'النقل';

  @override
  String get notifAnnouncements => 'الإعلانات';

  @override
  String get notifFinance => 'المالية';

  @override
  String get enableSilentMode => 'تفعيل الوضع الصامت';

  @override
  String get silentModeDesc => 'بدون إشعارات خلال الفترة الزمنية المحددة';

  @override
  String get silentStart => 'البداية';

  @override
  String get silentEnd => 'النهاية';

  @override
  String get languageFr => 'Français';

  @override
  String get languageAr => 'العربية';

  @override
  String get darkMode => 'الوضع الداكن';

  @override
  String get darkModeDesc => 'تعديل العرض للمشاهدة الليلية';

  @override
  String get teacherAppTitle => 'إلمي — الأستاذ';

  @override
  String get attendanceMarkingTitle => 'المناداة — الحضور';

  @override
  String get validate => 'تأكيد';

  @override
  String get classLabel => 'القسم';

  @override
  String get selectClass => 'اختر قسماً';

  @override
  String get noStudentsFound => 'لم يتم العثور على تلاميذ';

  @override
  String get attendanceSaved => 'تم تسجيل المناداة بنجاح';

  @override
  String errorMessage(String message) {
    return 'خطأ: $message';
  }

  @override
  String get gradeEntryTitle => 'إدخال النقاط';

  @override
  String get save => 'حفظ';

  @override
  String get subjectLabel => 'المادة';

  @override
  String get examTypeLabel => 'نوع الامتحان';

  @override
  String get gradeEntryHint => 'اختر قسماً ومادة ونوع الامتحان';

  @override
  String get hwManagementTitle => 'الواجبات والتمارين';

  @override
  String get myHomeworkTab => 'واجباتي';

  @override
  String get submissionsTab => 'التسليمات';

  @override
  String get statsTab => 'الإحصائيات';

  @override
  String get calendarTab => 'الرزنامة';

  @override
  String get newHomework => 'واجب جديد';

  @override
  String get noHomework => 'لا توجد واجبات';

  @override
  String get profileTitle => 'ملفي الشخصي';

  @override
  String get email => 'البريد الإلكتروني';

  @override
  String get phone => 'الهاتف';

  @override
  String get school => 'المدرسة';

  @override
  String get language => 'اللغة';

  @override
  String get changePassword => 'تغيير كلمة المرور';

  @override
  String get about => 'حول';

  @override
  String get logout => 'تسجيل الخروج';

  @override
  String get changePasswordSoon => 'تغيير كلمة المرور قريباً';

  @override
  String get messagesTitle => 'الرسائل';

  @override
  String get noConversations => 'لا توجد محادثات';

  @override
  String get noLastMessage => 'لا توجد رسالة';

  @override
  String get conversationTitle => 'المحادثة';

  @override
  String get noMessages => 'لا توجد رسائل';

  @override
  String get announcementsTitle => 'الإعلانات';

  @override
  String get noAnnouncementsYet => 'لا توجد إعلانات حالياً';

  @override
  String get notificationsTitle => 'الإشعارات';

  @override
  String get markAllRead => 'تعليم الكل كمقروء';

  @override
  String get noNotificationsYet => 'لا توجد إشعارات حالياً';

  @override
  String get edubot => 'إيديوبوت';

  @override
  String get newConversation => 'محادثة جديدة';

  @override
  String get edubotThinking => 'إيديوبوت يفكر...';

  @override
  String get daySunday => 'الأحد';

  @override
  String get dayMonday => 'الاثنين';

  @override
  String get dayTuesday => 'الثلاثاء';

  @override
  String get dayWednesday => 'الأربعاء';

  @override
  String get dayThursday => 'الخميس';

  @override
  String get trainerGroups => 'مجموعاتي';

  @override
  String get trainerSessions => 'الحصص';

  @override
  String get trainerMessages => 'الرسائل';

  @override
  String unmarkedSessions(int count) {
    return '$count حصة غير مسجلة';
  }

  @override
  String get attendanceToRecord => 'حضور للتسجيل';

  @override
  String get todaySessions => 'حصص اليوم';

  @override
  String get myGroups => 'مجموعاتي';

  @override
  String get traineeTrainings => 'التكوينات';

  @override
  String get traineeAttendance => 'الحضور';

  @override
  String get traineePayments => 'المدفوعات';

  @override
  String get nextSession => 'الحصة القادمة';

  @override
  String get myTrainings => 'تكويناتي';

  @override
  String pendingPayments(int count) {
    return '$count دفعة معلقة';
  }

  @override
  String get infirmaryTitle => 'رسائل المستوصف';

  @override
  String get medicalSummary => 'الملخص الطبي';
}
