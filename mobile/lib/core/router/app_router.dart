import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/pin_login_screen.dart';
import '../../features/student/presentation/screens/student_home_screen.dart';
import '../../features/student/presentation/screens/grades_screen.dart';
import '../../features/student/presentation/screens/schedule_screen.dart';
import '../../features/student/presentation/screens/homework_screen.dart';
import '../../features/student/presentation/screens/resources_screen.dart';
import '../../features/teacher/presentation/screens/teacher_home_screen.dart';
import '../../features/teacher/presentation/screens/attendance_marking_screen.dart';
import '../../features/teacher/presentation/screens/grade_entry_screen.dart';
import '../../features/teacher/presentation/screens/homework_management_screen.dart';
import '../../features/parent/presentation/screens/parent_home_screen.dart';
import '../../features/parent/presentation/screens/child_grades_screen.dart';
import '../../features/parent/presentation/screens/child_attendance_screen.dart';
import '../../features/shared/presentation/screens/splash_screen.dart';
import '../../features/shared/presentation/screens/profile_screen.dart';
import '../../features/shared/presentation/screens/announcements_screen.dart';
import '../../features/shared/presentation/screens/chat_screen.dart';
import '../../features/shared/presentation/screens/notifications_screen.dart';

/// Application router with role-based route guards.
///
/// Guard logic:
///   - Unauthenticated users → redirected to `/login`
///   - Authenticated users hitting `/login` → redirected to their role home
///   - Users trying to access another role's routes → redirected to own home
class AppRouter {
  AppRouter._();

  /// Role → home path mapping
  static const Map<String, String> _roleHomePaths = {
    'student': '/student',
    'teacher': '/teacher',
    'parent': '/parent',
    'admin': '/teacher', // admins share teacher dashboard for now
    'superadmin': '/teacher',
  };

  static String _homePathForRole(String? role) =>
      _roleHomePaths[role?.toLowerCase()] ?? '/login';

  static GoRouter router(AuthBloc authBloc) => GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,

    // ── Global redirect guard ───────────────────────────────────────
    redirect: (BuildContext context, GoRouterState state) {
      final authState = authBloc.state;
      final isAuthenticated = authState is AuthAuthenticated;
      final currentPath = state.matchedLocation;

      // Public routes that don't require auth
      const publicPaths = ['/', '/login', '/pin-login'];
      final isPublicRoute = publicPaths.contains(currentPath);

      // 1) Not authenticated & not on a public page → go to login
      if (!isAuthenticated && !isPublicRoute) {
        return '/login';
      }

      // 2) Authenticated & on login/splash → go to role home
      if (isAuthenticated && isPublicRoute) {
        return _homePathForRole(authState.user.role);
      }

      // 3) Authenticated but accessing wrong role's routes → redirect
      if (isAuthenticated) {
        final role = authState.user.role.toLowerCase();
        final allowed = _allowedPrefixes(role);
        final isAllowed = allowed.any((p) => currentPath.startsWith(p));

        if (!isAllowed) {
          return _homePathForRole(role);
        }
      }

      // No redirect needed
      return null;
    },

    // ── Route definitions ─────────────────────────────────────────────
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

      // ── Student routes ──────────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => StudentHomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/student',
            name: 'studentHome',
            builder: (context, state) => const _StudentDashboard(),
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
        ],
      ),

      // ── Teacher routes ──────────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => TeacherHomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/teacher',
            name: 'teacherHome',
            builder: (context, state) => const _TeacherDashboard(),
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
        ],
      ),

      // ── Parent routes ───────────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => ParentHomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/parent',
            name: 'parentHome',
            builder: (context, state) => const _ParentDashboard(),
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
        ],
      ),

      // ── Shared routes (all authenticated roles) ─────────────────────
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
        path: '/notifications',
        name: 'notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
    ],
  );

  /// Returns the URL prefixes a given role is allowed to access.
  static List<String> _allowedPrefixes(String role) {
    switch (role) {
      case 'student':
        return [
          '/student',
          '/profile',
          '/announcements',
          '/chat',
          '/notifications',
        ];
      case 'teacher':
      case 'admin':
      case 'superadmin':
        return [
          '/teacher',
          '/profile',
          '/announcements',
          '/chat',
          '/notifications',
        ];
      case 'parent':
        return [
          '/parent',
          '/profile',
          '/announcements',
          '/chat',
          '/notifications',
        ];
      default:
        return [];
    }
  }
}

// ── Placeholder dashboard widgets ───────────────────────────────────────────

class _StudentDashboard extends StatelessWidget {
  const _StudentDashboard();
  @override
  Widget build(BuildContext context) =>
      const Center(child: Text('Student Dashboard'));
}

class _TeacherDashboard extends StatelessWidget {
  const _TeacherDashboard();
  @override
  Widget build(BuildContext context) =>
      const Center(child: Text('Teacher Dashboard'));
}

class _ParentDashboard extends StatelessWidget {
  const _ParentDashboard();
  @override
  Widget build(BuildContext context) =>
      const Center(child: Text('Parent Dashboard'));
}
