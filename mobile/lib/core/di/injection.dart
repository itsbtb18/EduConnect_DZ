import 'package:get_it/get_it.dart';

import '../network/dio_client.dart';
import '../storage/secure_storage_service.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/academic_repository.dart';
import '../../data/repositories/grade_repository.dart';
import '../../data/repositories/homework_repository.dart';
import '../../data/repositories/attendance_repository.dart';
import '../../data/repositories/chat_repository.dart';
import '../../data/repositories/notification_repository.dart';
import '../../data/repositories/announcement_repository.dart';
import '../../data/repositories/finance_repository.dart';

final getIt = GetIt.instance;

/// Configure all dependency injections
Future<void> configureDependencies() async {
  // Core services
  getIt.registerLazySingleton<SecureStorageService>(
    () => SecureStorageService(),
  );

  getIt.registerLazySingleton<DioClient>(
    () => DioClient(getIt<SecureStorageService>()),
  );

  // Repositories
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

  getIt.registerLazySingleton<ChatRepository>(
    () => ChatRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<NotificationRepository>(
    () => NotificationRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<AnnouncementRepository>(
    () => AnnouncementRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<FinanceRepository>(
    () => FinanceRepository(getIt<DioClient>()),
  );
}
