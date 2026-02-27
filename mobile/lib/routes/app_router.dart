import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/pin_login_screen.dart';
import '../features/student/screens/student_home_screen.dart';
import '../features/teacher/screens/teacher_home_screen.dart';
import '../features/parent/screens/parent_home_screen.dart';
import '../features/shared/screens/splash_screen.dart';
import '../features/shared/screens/profile_screen.dart';
import '../features/student/screens/grades_screen.dart';
import '../features/student/screens/schedule_screen.dart';
import '../features/student/screens/homework_screen.dart';
import '../features/shared/screens/announcements_screen.dart';
import '../features/shared/screens/chat_screen.dart';
import '../features/shared/screens/notifications_screen.dart';

/// Application router using GoRouter for declarative navigation
class AppRouter {
  AppRouter._();

  static final router = GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    routes: [
      // Splash / loading
      GoRoute(
        path: '/',
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),

      // Auth routes
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

      // Student shell route with bottom navigation
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
        ],
      ),

      // Teacher shell route
      ShellRoute(
        builder: (context, state, child) => TeacherHomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/teacher',
            name: 'teacherHome',
            builder: (context, state) => const _TeacherDashboard(),
          ),
        ],
      ),

      // Parent shell route
      ShellRoute(
        builder: (context, state, child) => ParentHomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/parent',
            name: 'parentHome',
            builder: (context, state) => const _ParentDashboard(),
          ),
        ],
      ),

      // Shared routes
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
}

// Placeholder dashboard widgets — will be replaced with actual dashboards
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
