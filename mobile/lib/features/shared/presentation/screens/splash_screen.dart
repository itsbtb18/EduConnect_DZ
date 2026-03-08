import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/context/context_cubit.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';

/// Splash screen — checks authentication state and routes accordingly
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  static String _homePathForRole(String role) => switch (role) {
    'student' => '/student',
    'teacher' => '/teacher',
    'parent' => '/parent',
    'admin' ||
    'superadmin' ||
    'super_admin' ||
    'director' ||
    'accountant' => '/teacher',
    _ => '/student',
  };

  @override
  void initState() {
    super.initState();
    // Check auth status after a brief delay for splash UX
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) {
        context.read<AuthBloc>().add(AuthCheckRequested());
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          // Load contexts into ContextCubit
          final contextCubit = context.read<ContextCubit>();
          contextCubit.loadContexts(state.contexts);

          // Navigate based on context count
          if (state.contexts.length > 1) {
            final ctxState = contextCubit.state;
            // If previously active context was restored, go to its home
            if (ctxState.active != null) {
              final role = ctxState.active!.routeRole;
              context.go(_homePathForRole(role));
            } else {
              context.go('/context-selector');
            }
          } else {
            final role = state.contexts.isNotEmpty
                ? state.contexts.first.routeRole
                : state.user.role.toLowerCase();
            context.go(_homePathForRole(role));
          }
        } else if (state is AuthUnauthenticated) {
          context.go('/login');
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.primary,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                'assets/images/ilmi-logo.png',
                width: 200,
                height: 80,
                fit: BoxFit.contain,
              ),
              const SizedBox(height: 24),
              Text(
                'ILMI',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Algeria',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(color: Colors.white70),
              ),
              const SizedBox(height: 48),
              const SizedBox(
                width: 32,
                height: 32,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 3,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
