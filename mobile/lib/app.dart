import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'l10n/generated/app_localizations.dart';

import 'core/di/injection.dart';
import 'core/theme/app_theme.dart';
import 'core/constants/app_constants.dart';
import 'core/router/app_router.dart';
import 'core/context/context_cubit.dart';
import 'core/locale/locale_cubit.dart';
import 'core/network/connectivity_cubit.dart';
import 'core/network/sync_queue_service.dart';
import 'features/shared/presentation/widgets/offline_banner.dart';
import 'core/security/app_lock_manager.dart';
import 'core/security/lock_screen.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/student/presentation/bloc/student_bloc.dart';
import 'features/teacher/presentation/bloc/teacher_bloc.dart';
import 'features/parent/presentation/bloc/parent_bloc.dart';
import 'features/shared/presentation/bloc/announcement_cubit.dart';
import 'features/shared/presentation/bloc/chat_bloc.dart';
import 'features/shared/presentation/bloc/notification_cubit.dart';
import 'features/shared/presentation/bloc/chatbot_cubit.dart';

class IlmiApp extends StatefulWidget {
  const IlmiApp({super.key});

  @override
  State<IlmiApp> createState() => _IlmiAppState();
}

class _IlmiAppState extends State<IlmiApp> with WidgetsBindingObserver {
  final AppLockManager _appLockManager = getIt<AppLockManager>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _appLockManager.initialize();
    _appLockManager.addListener(_onLockStateChanged);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _appLockManager.removeListener(_onLockStateChanged);
    super.dispose();
  }

  void _onLockStateChanged() {
    if (mounted) setState(() {});
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _appLockManager.onAppPaused();
    } else if (state == AppLifecycleState.resumed) {
      _appLockManager.onAppResumed();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(375, 812),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        final authBloc = AuthBloc();
        final contextCubit = ContextCubit();

        final localeCubit = LocaleCubit()..load();

        return MultiBlocProvider(
          providers: [
            BlocProvider(create: (_) => authBloc),
            BlocProvider(create: (_) => contextCubit),
            BlocProvider(create: (_) => localeCubit),
            BlocProvider(create: (_) => StudentBloc()),
            BlocProvider(create: (_) => TeacherBloc()),
            BlocProvider(create: (_) => ParentBloc()),
            BlocProvider(create: (_) => AnnouncementCubit()),
            BlocProvider(create: (_) => ChatBloc()),
            BlocProvider(create: (_) => NotificationCubit()),
            BlocProvider(create: (_) => ChatbotCubit()),
            BlocProvider(
              create: (_) => ConnectivityCubit(getIt<SyncQueueService>()),
            ),
          ],
          child: BlocBuilder<LocaleCubit, LocaleState>(
            builder: (context, localeState) {
              return Directionality(
                textDirection: localeState.locale.languageCode == 'ar'
                    ? TextDirection.rtl
                    : TextDirection.ltr,
                child: Stack(
                  children: [
                    MaterialApp.router(
                      title: AppConstants.appName,
                      debugShowCheckedModeBanner: false,

                      // Theme
                      theme: AppTheme.lightTheme,
                      darkTheme: AppTheme.darkTheme,
                      themeMode: ThemeMode.system,

                      // Localization (French, Arabic)
                      localizationsDelegates: const [
                        S.delegate,
                        GlobalMaterialLocalizations.delegate,
                        GlobalWidgetsLocalizations.delegate,
                        GlobalCupertinoLocalizations.delegate,
                      ],
                      supportedLocales: S.supportedLocales,
                      locale: localeState.locale,

                      // Routing
                      routerConfig: AppRouter.router(authBloc, contextCubit),

                      // Wrap every page with the offline banner
                      builder: (context, child) {
                        return OfflineBanner(
                          child: child ?? const SizedBox.shrink(),
                        );
                      },
                    ),
                    // Lock screen overlay
                    if (_appLockManager.isLocked) const LockScreen(),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}
