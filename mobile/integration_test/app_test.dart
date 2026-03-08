import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:ilmi_mobile/main.dart' as app;

/// End-to-end integration test scaffolding.
///
/// This test verifies the app boots successfully and key screens render.
/// To run:  flutter test integration_test/app_test.dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('App Launch Tests', () {
    testWidgets('app starts and shows login screen', (tester) async {
      // Boot the full app (requires DI, Hive, etc. to be initialized)
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Login screen should appear for unauthenticated user
      expect(
        find.textContaining('ILMI'),
        findsWidgets,
        reason: 'App branding should be visible on login',
      );
    });
  });
}
