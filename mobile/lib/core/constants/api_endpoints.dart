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
}
