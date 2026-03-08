import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../context/context_cubit.dart';
import '../context/context_selector_screen.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/pin_login_screen.dart';
import '../../features/student/presentation/screens/student_home_screen.dart';
import '../../features/student/presentation/screens/grades_screen.dart';
import '../../features/student/presentation/screens/schedule_screen.dart';
import '../../features/student/presentation/screens/homework_screen.dart';
import '../../features/student/presentation/screens/resources_screen.dart';
import '../../features/student/presentation/screens/student_id_card_screen.dart';
import '../../features/teacher/presentation/screens/teacher_home_screen.dart';
import '../../features/teacher/presentation/screens/attendance_marking_screen.dart';
import '../../features/teacher/presentation/screens/grade_entry_screen.dart';
import '../../features/teacher/presentation/screens/homework_management_screen.dart';
import '../../features/parent/presentation/screens/parent_home_screen.dart';
import '../../features/parent/presentation/screens/child_grades_screen.dart';
import '../../features/parent/presentation/screens/child_attendance_screen.dart';
import '../../features/parent/presentation/screens/medical_summary_screen.dart';
import '../../features/parent/presentation/screens/vaccinations_screen.dart';
import '../../features/parent/presentation/screens/infirmery_messages_screen.dart';
import '../../features/parent/presentation/screens/medical_update_request_screen.dart';
import '../../features/shared/presentation/screens/splash_screen.dart';
import '../../features/shared/presentation/screens/profile_screen.dart';
import '../../features/shared/presentation/screens/announcements_screen.dart';
import '../../features/shared/presentation/screens/chat_screen.dart';
import '../../features/shared/presentation/screens/chatbot_screen.dart';
import '../../features/shared/presentation/screens/notifications_screen.dart';
import '../../features/student/presentation/screens/library_catalog_screen.dart';
import '../../features/student/presentation/screens/library_book_detail_screen.dart';
import '../../features/student/presentation/screens/library_my_borrows_screen.dart';
import '../../features/parent/presentation/screens/library_child_borrows_screen.dart';
import '../../features/student/presentation/screens/resource_browser_screen.dart';
import '../../features/student/presentation/screens/exam_bank_screen.dart';
import '../../features/student/presentation/screens/quiz_list_screen.dart';
import '../../features/student/presentation/screens/quiz_taking_screen.dart';
import '../../features/student/presentation/screens/student_progress_screen.dart';
import '../../features/student/presentation/screens/student_canteen_screen.dart';
import '../../features/student/presentation/screens/student_transport_screen.dart';
import '../../features/student/gamification/presentation/screens/gamification_dashboard_screen.dart';
import '../../features/student/gamification/presentation/screens/badges_screen.dart';
import '../../features/student/gamification/presentation/screens/challenges_screen.dart';
import '../../features/student/gamification/presentation/screens/leaderboard_screen.dart';
import '../../features/student/gamification/presentation/bloc/gamification_cubit.dart';
import '../../features/teacher/presentation/screens/teacher_quiz_dashboard_screen.dart';
import '../../features/teacher/presentation/screens/textbook_screen.dart';
import '../../features/teacher/presentation/screens/resource_screen.dart';
import '../../features/teacher/presentation/screens/payslip_screen.dart';
import '../../features/teacher/presentation/screens/communication_screen.dart';
import '../../features/teacher/presentation/screens/exam_management_screen.dart';
import '../../features/parent/presentation/screens/parent_elearning_progress_screen.dart';
import '../../features/parent/presentation/screens/parent_finance_screen.dart';
import '../../features/parent/presentation/screens/absence_justification_screen.dart';
import '../../features/parent/presentation/screens/report_card_screen.dart';
import '../../features/parent/presentation/screens/canteen_screen.dart';
import '../../features/parent/presentation/screens/transport_screen.dart';
import '../../features/parent/presentation/screens/preferences_screen.dart';
import '../../features/student/presentation/screens/student_dashboard.dart';
import '../../features/teacher/presentation/screens/teacher_dashboard.dart';
import '../../features/parent/presentation/screens/parent_dashboard.dart';
import '../../features/trainer/presentation/screens/trainer_home_screen.dart';
import '../../features/trainer/presentation/screens/trainer_dashboard.dart';
import '../../features/trainer/presentation/screens/trainer_attendance_screen.dart';
import '../../features/trainer/presentation/screens/trainer_evaluations_screen.dart';
import '../../features/trainer/presentation/screens/trainer_schedule_screen.dart';
import '../../features/trainer/presentation/screens/trainer_homework_screen.dart';
import '../../features/trainer/presentation/screens/trainer_cancel_session_screen.dart';
import '../../features/trainer/presentation/screens/trainer_hours_screen.dart';
import '../../features/trainer/presentation/screens/trainer_journal_screen.dart';
import '../../features/trainee/presentation/screens/trainee_home_screen.dart';
import '../../features/trainee/presentation/screens/trainee_dashboard.dart';
import '../../features/trainee/presentation/screens/trainee_formations_screen.dart';
import '../../features/trainee/presentation/screens/trainee_schedule_screen.dart';
import '../../features/trainee/presentation/screens/trainee_results_screen.dart';
import '../../features/trainee/presentation/screens/trainee_payments_screen.dart';
import '../../features/parent/presentation/screens/parent_formation_dashboard.dart';

/// Application router with role-based redirect guards.
class AppRouter {
  AppRouter._();

  // Maps each role to its home path.
  static const Map<String, String> _roleHomePaths = {
    'student': '/student',
    'teacher': '/teacher',
    'parent': '/parent',
    'admin': '/teacher',
    'superadmin': '/teacher',
    'super_admin': '/teacher',
    'director': '/teacher',
    'accountant': '/teacher',
    'driver': '/teacher',
    'trainer': '/trainer',
    'trainee': '/trainee',
  };

  static String _homePathForRole(String? role) =>
      _roleHomePaths[role?.toLowerCase()] ?? '/login';

  /// URL prefixes each role is allowed to visit.
  static List<String> _allowedPrefixes(String role) {
    const shared = [
      '/profile',
      '/announcements',
      '/chat',
      '/notifications',
      '/chatbot',
      '/context-selector',
    ];
    return switch (role) {
      'student' => ['/student', ...shared],
      'teacher' => ['/teacher', ...shared],
      'parent' => ['/parent', ...shared],
      'trainer' => ['/trainer', ...shared],
      'trainee' => ['/trainee', ...shared],
      'admin' || 'superadmin' || 'super_admin' || 'director' || 'accountant' =>
        ['/student', '/teacher', '/parent', '/trainer', '/trainee', ...shared],
      _ => shared,
    };
  }

  /// Creates a [GoRouter] wired to the given [authBloc] for redirect logic.
  static GoRouter router(
    AuthBloc authBloc,
    ContextCubit contextCubit,
  ) => GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,

    // ── Global redirect guard ───────────────────────────────────────
    redirect: (BuildContext context, GoRouterState state) {
      final authState = authBloc.state;
      final isAuthenticated = authState is AuthAuthenticated;
      final currentPath = state.matchedLocation;

      const publicPaths = ['/', '/login', '/pin-login'];
      final isPublicRoute = publicPaths.contains(currentPath);

      // 1) Not authenticated & not on a public page → go to login
      if (!isAuthenticated && !isPublicRoute) return '/login';

      // 2) Authenticated & on public page → route based on context
      if (isAuthenticated && isPublicRoute) {
        final ctxState = contextCubit.state;
        // Multi-context user without active context → selector
        if (ctxState.hasMultiple && ctxState.active == null) {
          return '/context-selector';
        }
        // Use active context role, fall back to user primary role
        final role = ctxState.active?.routeRole ?? authState.user.role;
        return _homePathForRole(role);
      }

      // 3) Context-selector page — always allowed when authenticated
      if (isAuthenticated && currentPath == '/context-selector') {
        return null;
      }

      // 4) Authenticated but accessing wrong role's routes → redirect
      if (isAuthenticated) {
        final ctxState = contextCubit.state;
        final role =
            ctxState.active?.routeRole ?? authState.user.role.toLowerCase();

        // Multi-context users can access all their context roles' routes
        final allowedRoles = ctxState.hasMultiple
            ? ctxState.contexts.map((c) => c.routeRole).toSet()
            : {role};

        final allowed = allowedRoles
            .expand((r) => _allowedPrefixes(r))
            .toSet()
            .toList();

        if (!allowed.any((p) => currentPath.startsWith(p))) {
          return _homePathForRole(role);
        }
      }

      return null; // no redirect
    },

    // ── Route tree ────────────────────────────────────────────────────
    routes: [
      // Splash
      GoRoute(
        path: '/',
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),

      // Auth
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/pin-login',
        name: 'pinLogin',
        builder: (context, state) => const PinLoginScreen(),
      ),

      // Context selector (multi-role)
      GoRoute(
        path: '/context-selector',
        name: 'contextSelector',
        builder: (context, state) => const ContextSelectorScreen(),
      ),

      // ── Student ─────────────────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => StudentHomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/student',
            name: 'studentHome',
            builder: (context, state) => const StudentDashboard(),
          ),
          GoRoute(
            path: '/student/grades',
            name: 'studentGrades',
            builder: (context, state) => const GradesScreen(),
          ),
          GoRoute(
            path: '/student/schedule',
            name: 'studentSchedule',
            builder: (context, state) => const ScheduleScreen(),
          ),
          GoRoute(
            path: '/student/homework',
            name: 'studentHomework',
            builder: (context, state) => const HomeworkScreen(),
          ),
          GoRoute(
            path: '/student/resources',
            name: 'studentResources',
            builder: (context, state) => const ResourcesScreen(),
          ),
          GoRoute(
            path: '/student/id-card',
            name: 'studentIdCard',
            builder: (context, state) => const StudentIdCardScreen(),
          ),
          GoRoute(
            path: '/student/library',
            name: 'studentLibrary',
            builder: (context, state) => const LibraryCatalogScreen(),
          ),
          GoRoute(
            path: '/student/library/book',
            name: 'studentLibraryBook',
            builder: (context, state) {
              final bookId = state.uri.queryParameters['bookId'] ?? '';
              return LibraryBookDetailScreen(bookId: bookId);
            },
          ),
          GoRoute(
            path: '/student/library/my-borrows',
            name: 'studentMyBorrows',
            builder: (context, state) => const LibraryMyBorrowsScreen(),
          ),
          GoRoute(
            path: '/student/elearning',
            name: 'studentElearning',
            builder: (context, state) => const ResourceBrowserScreen(),
          ),
          GoRoute(
            path: '/student/elearning/exams',
            name: 'studentExamBank',
            builder: (context, state) => const ExamBankScreen(),
          ),
          GoRoute(
            path: '/student/elearning/quizzes',
            name: 'studentQuizList',
            builder: (context, state) => const QuizListScreen(),
          ),
          GoRoute(
            path: '/student/elearning/quiz',
            name: 'studentQuizTaking',
            builder: (context, state) {
              final quizId = state.uri.queryParameters['quizId'] ?? '';
              return QuizTakingScreen(quizId: quizId);
            },
          ),
          GoRoute(
            path: '/student/elearning/progress',
            name: 'studentProgress',
            builder: (context, state) => const StudentProgressScreen(),
          ),
          GoRoute(
            path: '/student/canteen',
            name: 'studentCanteen',
            builder: (context, state) => const StudentCanteenScreen(),
          ),
          GoRoute(
            path: '/student/transport',
            name: 'studentTransport',
            builder: (context, state) => const StudentTransportScreen(),
          ),
          GoRoute(
            path: '/student/gamification',
            name: 'studentGamification',
            builder: (context, state) => BlocProvider(
              create: (_) => GamificationCubit()..loadAll(),
              child: const GamificationDashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/student/gamification/badges',
            name: 'studentBadges',
            builder: (context, state) => BlocProvider(
              create: (_) => GamificationCubit()..loadAll(),
              child: const BadgesScreen(),
            ),
          ),
          GoRoute(
            path: '/student/gamification/challenges',
            name: 'studentChallenges',
            builder: (context, state) => BlocProvider(
              create: (_) => GamificationCubit()..loadAll(),
              child: const ChallengesScreen(),
            ),
          ),
          GoRoute(
            path: '/student/gamification/leaderboard',
            name: 'studentLeaderboard',
            builder: (context, state) => BlocProvider(
              create: (_) => GamificationCubit()..loadAll(),
              child: const LeaderboardScreen(),
            ),
          ),
        ],
      ),

      // ── Teacher ─────────────────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => TeacherHomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/teacher',
            name: 'teacherHome',
            builder: (context, state) => const TeacherDashboard(),
          ),
          GoRoute(
            path: '/teacher/attendance',
            name: 'teacherAttendance',
            builder: (context, state) => const AttendanceMarkingScreen(),
          ),
          GoRoute(
            path: '/teacher/grades',
            name: 'teacherGrades',
            builder: (context, state) => const GradeEntryScreen(),
          ),
          GoRoute(
            path: '/teacher/homework',
            name: 'teacherHomework',
            builder: (context, state) => const HomeworkManagementScreen(),
          ),
          GoRoute(
            path: '/teacher/elearning',
            name: 'teacherElearning',
            builder: (context, state) => const TeacherQuizDashboardScreen(),
          ),
          GoRoute(
            path: '/teacher/textbook',
            name: 'teacherTextbook',
            builder: (context, state) => const TextbookScreen(),
          ),
          GoRoute(
            path: '/teacher/resources',
            name: 'teacherResources',
            builder: (context, state) => const ResourceScreen(),
          ),
          GoRoute(
            path: '/teacher/payslip',
            name: 'teacherPayslip',
            builder: (context, state) => const PayslipScreen(),
          ),
          GoRoute(
            path: '/teacher/communication',
            name: 'teacherCommunication',
            builder: (context, state) => const CommunicationScreen(),
          ),
          GoRoute(
            path: '/teacher/exams',
            name: 'teacherExams',
            builder: (context, state) => const ExamManagementScreen(),
          ),
        ],
      ),

      // ── Parent ──────────────────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => ParentHomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/parent',
            name: 'parentHome',
            builder: (context, state) => const ParentDashboard(),
          ),
          GoRoute(
            path: '/parent/grades',
            name: 'parentGrades',
            builder: (context, state) => const ChildGradesScreen(),
          ),
          GoRoute(
            path: '/parent/attendance',
            name: 'parentAttendance',
            builder: (context, state) => const ChildAttendanceScreen(),
          ),
          GoRoute(
            path: '/parent/medical',
            name: 'parentMedical',
            builder: (context, state) {
              final studentId = state.uri.queryParameters['studentId'] ?? '';
              return MedicalSummaryScreen(studentId: studentId);
            },
          ),
          GoRoute(
            path: '/parent/vaccinations',
            name: 'parentVaccinations',
            builder: (context, state) {
              final studentId = state.uri.queryParameters['studentId'] ?? '';
              return VaccinationsScreen(studentId: studentId);
            },
          ),
          GoRoute(
            path: '/parent/medical-messages',
            name: 'parentMedicalMessages',
            builder: (context, state) {
              final studentId = state.uri.queryParameters['studentId'] ?? '';
              return InfirmeryMessagesScreen(studentId: studentId);
            },
          ),
          GoRoute(
            path: '/parent/medical-update',
            name: 'parentMedicalUpdate',
            builder: (context, state) {
              final studentId = state.uri.queryParameters['studentId'] ?? '';
              return MedicalUpdateRequestScreen(studentId: studentId);
            },
          ),
          GoRoute(
            path: '/parent/library',
            name: 'parentLibrary',
            builder: (context, state) {
              final studentId = state.uri.queryParameters['studentId'] ?? '';
              return LibraryChildBorrowsScreen(studentId: studentId);
            },
          ),
          GoRoute(
            path: '/parent/elearning',
            name: 'parentElearning',
            builder: (context, state) {
              final studentId = state.uri.queryParameters['studentId'] ?? '';
              return ParentElearningProgressScreen(studentId: studentId);
            },
          ),
          GoRoute(
            path: '/parent/finance',
            name: 'parentFinance',
            builder: (context, state) => const ParentFinanceScreen(),
          ),
          GoRoute(
            path: '/parent/absence-excuses',
            name: 'parentAbsenceExcuses',
            builder: (context, state) => const AbsenceJustificationScreen(),
          ),
          GoRoute(
            path: '/parent/report-cards',
            name: 'parentReportCards',
            builder: (context, state) => const ReportCardScreen(),
          ),
          GoRoute(
            path: '/parent/canteen',
            name: 'parentCanteen',
            builder: (context, state) => const CanteenScreen(),
          ),
          GoRoute(
            path: '/parent/transport',
            name: 'parentTransport',
            builder: (context, state) => const TransportScreen(),
          ),
          GoRoute(
            path: '/parent/preferences',
            name: 'parentPreferences',
            builder: (context, state) => const PreferencesScreen(),
          ),
          GoRoute(
            path: '/parent/formation',
            name: 'parentFormation',
            builder: (context, state) => const ParentFormationDashboard(),
          ),
        ],
      ),

      // ── Trainer (formateur) ─────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => TrainerHomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/trainer',
            name: 'trainerHome',
            builder: (context, state) => const TrainerDashboard(),
          ),
          GoRoute(
            path: '/trainer/attendance',
            name: 'trainerAttendance',
            builder: (context, state) => const TrainerAttendanceScreen(),
          ),
          GoRoute(
            path: '/trainer/evaluations',
            name: 'trainerEvaluations',
            builder: (context, state) => const TrainerEvaluationsScreen(),
          ),
          GoRoute(
            path: '/trainer/schedule',
            name: 'trainerSchedule',
            builder: (context, state) => const TrainerScheduleScreen(),
          ),
          GoRoute(
            path: '/trainer/homework',
            name: 'trainerHomework',
            builder: (context, state) => const TrainerHomeworkScreen(),
          ),
          GoRoute(
            path: '/trainer/cancel-session',
            name: 'trainerCancelSession',
            builder: (context, state) => const TrainerCancelSessionScreen(),
          ),
          GoRoute(
            path: '/trainer/hours',
            name: 'trainerHours',
            builder: (context, state) => const TrainerHoursScreen(),
          ),
          GoRoute(
            path: '/trainer/journal',
            name: 'trainerJournal',
            builder: (context, state) => const TrainerJournalScreen(),
          ),
        ],
      ),

      // ── Trainee (apprenant) ─────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => TraineeHomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/trainee',
            name: 'traineeHome',
            builder: (context, state) => const TraineeDashboard(),
          ),
          GoRoute(
            path: '/trainee/formations',
            name: 'traineeFormations',
            builder: (context, state) => const TraineeFormationsScreen(),
          ),
          GoRoute(
            path: '/trainee/schedule',
            name: 'traineeSchedule',
            builder: (context, state) => const TraineeScheduleScreen(),
          ),
          GoRoute(
            path: '/trainee/results',
            name: 'traineeResults',
            builder: (context, state) => const TraineeResultsScreen(),
          ),
          GoRoute(
            path: '/trainee/payments',
            name: 'traineePayments',
            builder: (context, state) => const TraineePaymentsScreen(),
          ),
        ],
      ),

      // ── Shared routes ───────────────────────────────────────────────
      GoRoute(
        path: '/profile',
        name: 'profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/announcements',
        name: 'announcements',
        builder: (context, state) => const AnnouncementsScreen(),
      ),
      GoRoute(
        path: '/chat',
        name: 'chat',
        builder: (context, state) => const ChatScreen(),
      ),
      GoRoute(
        path: '/chatbot',
        name: 'chatbot',
        builder: (context, state) => const ChatbotScreen(),
      ),
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
    ],
  );
}
