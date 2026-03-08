import 'package:get_it/get_it.dart';

import '../network/dio_client.dart';
import '../network/sync_queue_service.dart';
import '../security/app_lock_manager.dart';
import '../security/biometric_service.dart';
import '../security/visual_protection_service.dart';
import '../storage/hive_storage_service.dart';
import '../storage/secure_storage_service.dart';
import '../../features/auth/data/datasources/auth_remote_datasource.dart';
import '../../features/auth/data/repositories/auth_repository.dart';
import '../../features/student/data/datasources/student_remote_datasource.dart';
import '../../features/student/data/repositories/academic_repository.dart';
import '../../features/student/data/repositories/grade_repository.dart';
import '../../features/student/data/repositories/homework_repository.dart';
import '../../features/teacher/data/datasources/teacher_remote_datasource.dart';
import '../../features/teacher/data/repositories/attendance_repository.dart';
import '../../features/parent/data/datasources/parent_remote_datasource.dart';
import '../../features/parent/data/repositories/finance_repository.dart';
import '../../features/parent/data/repositories/medical_repository.dart';
import '../../features/parent/data/repositories/child_repository.dart';
import '../../features/parent/data/repositories/absence_excuse_repository.dart';
import '../../features/parent/data/repositories/canteen_repository.dart';
import '../../features/parent/data/repositories/transport_repository.dart';
import '../../features/shared/data/datasources/shared_remote_datasource.dart';
import '../../features/shared/data/repositories/announcement_repository.dart';
import '../../features/shared/data/repositories/chat_repository.dart';
import '../../features/shared/data/repositories/notification_repository.dart';
import '../../features/student/data/repositories/library_repository.dart';
import '../../features/student/data/repositories/elearning_repository.dart';
import '../../features/teacher/data/repositories/textbook_repository.dart';
import '../../features/teacher/data/repositories/resource_repository.dart';
import '../../features/teacher/data/repositories/payslip_repository.dart';
import '../../features/teacher/data/repositories/chat_room_repository.dart';
import '../../features/teacher/data/repositories/exam_management_repository.dart';
import '../../features/student/gamification/data/repositories/gamification_repository.dart';
import '../../features/trainer/data/datasources/trainer_remote_datasource.dart';
import '../../features/trainer/data/repositories/trainer_repository.dart';
import '../../features/trainee/data/datasources/trainee_remote_datasource.dart';
import '../../features/trainee/data/repositories/trainee_repository.dart';

final getIt = GetIt.instance;

/// Configure all dependency injections.
Future<void> configureDependencies() async {
  // ── Core services ───────────────────────────────────────────────────────
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

  getIt.registerLazySingleton<SyncQueueService>(
    () => SyncQueueService(getIt<DioClient>().dio),
  );

  // ── Security services ──────────────────────────────────────────────────
  getIt.registerLazySingleton<BiometricService>(() => BiometricService());

  getIt.registerLazySingleton<AppLockManager>(
    () => AppLockManager(
      getIt<SecureStorageService>(),
      getIt<BiometricService>(),
    ),
  );

  getIt.registerLazySingleton<VisualProtectionService>(
    () => VisualProtectionService(),
  );

  // ── Datasources ─────────────────────────────────────────────────────────
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

  // ── Repositories ────────────────────────────────────────────────────────
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

  getIt.registerLazySingleton<MedicalRepository>(
    () => MedicalRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<ChildRepository>(
    () => ChildRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<AbsenceExcuseRepository>(
    () => AbsenceExcuseRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<CanteenRepository>(
    () => CanteenRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<TransportRepository>(
    () => TransportRepository(getIt<DioClient>()),
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

  getIt.registerLazySingleton<LibraryRepository>(
    () => LibraryRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<ElearningRepository>(
    () => ElearningRepository(getIt<DioClient>()),
  );

  // ── Teacher feature repositories ──────────────────────────────────────
  getIt.registerLazySingleton<TextbookRepository>(
    () => TextbookRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<ResourceRepository>(
    () => ResourceRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<PayslipRepository>(
    () => PayslipRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<ChatRoomRepository>(
    () => ChatRoomRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<ExamManagementRepository>(
    () => ExamManagementRepository(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<GamificationRepository>(
    () => GamificationRepository(getIt<DioClient>()),
  );

  // ── Training center (formation) repositories ────────────────────────
  getIt.registerLazySingleton<TrainerRemoteDatasource>(
    () => TrainerRemoteDatasource(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<TrainerRepository>(
    () => TrainerRepository(getIt<TrainerRemoteDatasource>()),
  );

  getIt.registerLazySingleton<TraineeRemoteDatasource>(
    () => TraineeRemoteDatasource(getIt<DioClient>()),
  );

  getIt.registerLazySingleton<TraineeRepository>(
    () => TraineeRepository(getIt<TraineeRemoteDatasource>()),
  );
}
