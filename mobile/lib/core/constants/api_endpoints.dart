/// API endpoint paths
class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const String login = '/accounts/login/';
  static const String pinLogin = '/accounts/pin-login/';
  static const String tokenRefresh = '/accounts/token/refresh/';
  static const String me = '/accounts/me/';
  static const String changePassword = '/accounts/change-password/';
  static const String updateFcmToken = '/accounts/update-fcm-token/';
  static const String users = '/accounts/users/';
  static const String verifyOtp = '/accounts/verify-otp/';
  static const String verifyTotp = '/accounts/verify-totp/';
  static const String totpSetup = '/accounts/totp/setup/';
  static const String devices = '/accounts/devices/';
  static const String sessions = '/accounts/sessions/';
  static const String logout = '/accounts/logout/';

  // Schools
  static const String schools = '/schools/schools/';
  static const String academicYears = '/schools/academic-years/';
  static const String semesters = '/schools/semesters/';

  // Academics
  static const String levels = '/academics/levels/';
  static const String classrooms = '/academics/classrooms/';
  static const String subjects = '/academics/subjects/';
  static const String teacherAssignments = '/academics/assignments/';
  static const String schedule = '/academics/schedule/';
  static const String lessons = '/academics/lessons/';
  static const String resources = '/academics/resources/';

  // Student card
  static String studentCard(String studentId) =>
      '/academics/students/$studentId/card/';
  static String studentQrCode(String studentId) =>
      '/academics/students/$studentId/qr-code/';

  // Grades
  static const String examTypes = '/grades/exam-types/';
  static const String grades = '/grades/grades/';
  static const String reportCards = '/grades/report-cards/';

  // Homework
  static const String homework = '/homework/tasks/';
  static const String submissions = '/homework/submissions/';

  // Announcements
  static const String announcements = '/announcements/announcements/';
  static const String events = '/announcements/events/';

  // Attendance
  static const String attendance = '/attendance/records/';
  static const String absenceExcuses = '/attendance/excuses/';

  // Chat
  static const String conversations = '/chat/conversations/';
  static const String messages = '/chat/messages/';

  // Finance
  static const String fees = '/finance/fee-structures/';
  static const String feeStructures = '/finance/fee-structures/';
  static const String payments = '/finance/payments/';

  // Notifications
  static const String notifications = '/notifications/notifications/';

  // AI Chatbot
  static const String chatbot = '/ai/query/';
  static const String chatSessions = '/ai/sessions/';

  // Infirmerie (parent endpoints)
  static String medicalSummary(String studentId) =>
      '/infirmerie/parent/$studentId/medical-summary/';
  static String parentVaccinations(String studentId) =>
      '/infirmerie/parent/$studentId/vaccinations/';
  static String parentMessages(String studentId) =>
      '/infirmerie/parent/$studentId/messages/';
  static String parentMedicalUpdate(String studentId) =>
      '/infirmerie/parent/$studentId/medical-update/';

  // Library
  static const String libraryBooks = '/library/books/';
  static const String libraryLoans = '/library/loans/';
  static const String libraryMyLoans = '/library/my-loans/';
  static const String libraryReservations = '/library/reservations/';

  // E-Learning
  static const String elearningResources = '/elearning/resources/';
  static const String elearningExams = '/elearning/exams/';
  static const String elearningQuizzes = '/elearning/quizzes/';
  static const String elearningMyAttempts = '/elearning/my-attempts/';
  static const String elearningProgress = '/elearning/progress/';
  static const String elearningAnalytics = '/elearning/analytics/';

  // Payroll (teacher)
  static const String payslipsMy = '/finance/payslips/my/';
  static const String payslips = '/finance/payslips/';
  static String payslipPdf(String id) => '/finance/payslips/$id/pdf/';

  // Chat rooms / broadcast
  static const String chatRooms = '/chat/rooms/';
  static String chatRoomMessages(String roomId) =>
      '/chat/rooms/$roomId/messages/';
  static const String chatContacts = '/chat/conversations/contacts/';

  // Grades workflow
  static const String gradesBulkEnter = '/grades/bulk-enter/';
  static const String gradesSubmit = '/grades/submit/';
  static const String gradesList = '/grades/list/';
  static const String gradesWorkflowStatus = '/grades/workflow-status/';
  static const String gradesCsvPreview = '/grades/csv-import/preview/';
  static const String gradesCsvConfirm = '/grades/csv-import/confirm/';

  // Homework extras
  static String homeworkCorrected(String id) => '/homework/$id/corrected/';
  static const String homeworkStats = '/homework/stats/';
  static const String homeworkCalendar = '/homework/calendar/';

  // Parent — children
  static const String myChildren = '/academics/my-children/';

  // Parent — canteen
  static const String parentMenus = '/canteen/parent/menus/';

  // Parent — transport
  static const String parentTransportInfo = '/transport/parent-info/';
  static const String parentGpsTrack = '/transport/gps/track/';

  // Parent — absence excuse
  static const String parentExcuses = '/attendance/excuses/';
  static const String parentAttendanceMy = '/attendance/my/';

  // Parent — report cards
  static String studentAverages(String studentId) =>
      '/grades/students/$studentId/averages/';
  static const String reportCardsList = '/grades/report-cards/';
  static String reportCardPdf(String id) => '/grades/report-cards/$id/pdf/';

  // Parent — finance summary
  static String paymentsSummary(String studentId) =>
      '/finance/payments/summary/?student=$studentId';
  static String paymentReceipt(String paymentId) =>
      '/finance/payments/$paymentId/receipt/';

  // Gamification (student)
  static const String gamificationProfile =
      '/gamification/gamification/my-profile/';
  static const String gamificationPoints =
      '/gamification/gamification/my-points/';
  static const String gamificationBadges = '/gamification/gamification/badges/';
  static const String gamificationMyBadges =
      '/gamification/gamification/my-badges/';
  static const String gamificationChallenges =
      '/gamification/gamification/challenges/';
  static const String gamificationMyChallenges =
      '/gamification/gamification/my-challenges/';
  static const String gamificationJoinChallenge =
      '/gamification/gamification/join-challenge/';
  static const String gamificationLeaderboard =
      '/gamification/gamification/leaderboard/';

  // Student canteen + transport (reuse parent endpoints)
  static const String studentMenus = '/canteen/parent/menus/';
  static const String studentTransportInfo = '/transport/parent-info/';

  // ── Formation (Training Center) ─────────────────────────────────────────
  static const String formationDashboard = '/formation/dashboard/';
  static const String departments = '/formation/departments/';
  static const String formations = '/formation/formations/';
  static const String trainingGroups = '/formation/groups/';
  static const String trainingSessions = '/formation/sessions/';
  static const String trainingEnrollments = '/formation/enrollments/';
  static const String sessionAttendance = '/formation/attendance/';
  static const String sessionAttendanceBulk =
      '/formation/attendance/bulk_mark/';
  static const String placementTests = '/formation/placement-tests/';
  static const String levelPassages = '/formation/level-passages/';
  static const String certificates = '/formation/certificates/';
  static const String checkConflicts = '/formation/check-conflicts/';
  static const String formationFeeStructures = '/formation/fee-structures/';
  static const String formationPayments = '/formation/payments/';
  static const String formationDiscounts = '/formation/discounts/';
  static const String formationLearnerDiscounts =
      '/formation/learner-discounts/';
  static const String trainerSalaryConfigs = '/formation/salary-configs/';
  static const String trainerPayslips = '/formation/payslips/';
  static const String formationFinanceStats = '/formation/finance/stats/';
  static String trainerPayslipPdf(String id) => '/formation/payslips/$id/pdf/';
  static String certificatePdf(String id) => '/formation/certificates/$id/pdf/';
  static String placementTestValidate(String id) =>
      '/formation/placement-tests/$id/validate/';
  static String levelPassageDecide(String id) =>
      '/formation/level-passages/$id/decide/';
  static String sessionCancel(String id) => '/formation/sessions/$id/';
  static String trainerPayslipGenerate = '/formation/payslips/generate/';
}
