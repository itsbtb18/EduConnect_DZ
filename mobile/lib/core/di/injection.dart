import 'package:get_it/get_it.dart';

import '../network/dio_client.dart';
import '../storage/hive_storage_service.dart';
import '../storage/secure_storage_service.dart';

// Auth feature
import '../../features/auth/data/datasources/auth_remote_datasource.dart';
import '../../features/auth/data/repositories/auth_repository.dart';

// Student feature
import '../../features/student/data/datasources/student_remote_datasource.dart';
import '../../features/student/data/repositories/academic_repository.dart';
import '../../features/student/data/repositories/grade_repository.dart';
import '../../features/student/data/repositories/homework_repository.dart';

// Teacher feature
import '../../features/teacher/data/datasources/teacher_remote_datasource.dart';
import '../../features/teacher/data/repositories/attendance_repository.dart';

// Parent feature
import '../../features/parent/data/datasources/parent_remote_datasource.dart';
import '../../features/parent/data/repositories/finance_repository.dart';

// Shared feature
import '../../features/shared/data/datasources/shared_remote_datasource.dart';
import '../../features/shared/data/repositories/announcement_repository.dart';
import '../../features/shared/data/repositories/chat_repository.dart';
import '../../features/shared/data/repositories/notification_repository.dart';

final getIt = GetIt.instance;

/// Configure all dependency injections.
///
/// Registration order:
///   1. Core services  (storage, network)
///   2. Datasources    (remote API callers)
///   3. Repositories   (business logic wrappers)
///   4. BLoCs are NOT registered here — they are created via BlocProvider
Future<void> configureDependencies() async {
  // ── 1. Core services ──────────────────────────────────────────────────────

  getIt.registerLazySingleton<SecureStorageService>(
    () => SecureStorageService(),
  );

  getIt.registerLazySingleton<HiveStorageService>(() => HiveStorageService());

  getIt.registerLazySingleton<DioClient>(
    () => DioClient(
      secureStorage: getIt<SecureStorageService>(),
      cacheStorage: getIt<HiveStorageService>(),
    ),
  );

  // ── 2. Datasources ───────────────────────────────────────────────────────

  getIt.registerLazySingleton<AuthRemoteDatasource>(
    () => AuthRemoteDatasource(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<StudentRemoteDatasource>(
    () => StudentRemoteDatasource(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<TeacherRemoteDatasource>(
    () => TeacherRemoteDatasource(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<ParentRemoteDatasource>(
    () => ParentRemoteDatasource(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<SharedRemoteDatasource>(
    () => SharedRemoteDatasource(getIt<DioClient>()),
  );

  // ── 3. Repositories ──────────────────────────────────────────────────────

  getIt.registerLazySingleton<AuthRepository>(
    () => AuthRepository(getIt<DioClient>(), getIt<SecureStorageService>()),
  );

  getIt.registerLazySingleton<AcademicRepository>(
    () => AcademicRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<GradeRepository>(
    () => GradeRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<HomeworkRepository>(
    () => HomeworkRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<AttendanceRepository>(
    () => AttendanceRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<FinanceRepository>(
    () => FinanceRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<AnnouncementRepository>(
    () => AnnouncementRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<ChatRepository>(
    () => ChatRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<NotificationRepository>(
    () => NotificationRepository(getIt<DioClient>()),
  );
}
