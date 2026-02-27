import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/theme/app_theme.dart';
import 'core/constants/app_constants.dart';
import 'core/router/app_router.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/student/presentation/bloc/student_bloc.dart';
import 'features/teacher/presentation/bloc/teacher_bloc.dart';
import 'features/parent/presentation/bloc/parent_bloc.dart';

class EduConnectApp extends StatelessWidget {
  const EduConnectApp({super.key});

  @override
  Widget build(BuildContext context) {
    final authBloc = AuthBloc();

    return ScreenUtilInit(
      designSize: const Size(375, 812),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return MultiBlocProvider(
          providers: [
            BlocProvider(create: (_) => authBloc),
            BlocProvider(create: (_) => StudentBloc()),
            BlocProvider(create: (_) => TeacherBloc()),
            BlocProvider(create: (_) => ParentBloc()),
          ],
          child: MaterialApp.router(
            title: AppConstants.appName,
            debugShowCheckedModeBanner: false,

            // Theme
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: ThemeMode.system,

            // Localization (French, Arabic, English)
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('fr', 'DZ'), // French (Algeria) - primary
              Locale('ar', 'DZ'), // Arabic (Algeria)
              Locale('en'), // English
            ],
            locale: const Locale('fr', 'DZ'),

            // Routing
            routerConfig: AppRouter.router(authBloc),
          ),
        );
      },
    );
  }
}
