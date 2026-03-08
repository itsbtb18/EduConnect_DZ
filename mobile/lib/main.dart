import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'app.dart';
import 'core/di/injection.dart';
import 'core/network/sync_queue_service.dart';
import 'core/storage/hive_storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock orientation to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Initialize Hive for local storage & offline caching
  await Hive.initFlutter();

  // Initialize dependency injection
  await configureDependencies();

  // Initialize Hive cache storage
  await getIt<HiveStorageService>().init();

  // Initialize offline sync queue
  await getIt<SyncQueueService>().init();

  // Initialize Firebase for push notifications & analytics
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase initialization skipped: $e');
  }

  runApp(const IlmiApp());
}
