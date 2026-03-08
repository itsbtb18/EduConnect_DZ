import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:bloc_test/bloc_test.dart';

import 'package:ilmi_mobile/core/network/connectivity_cubit.dart';
import 'package:ilmi_mobile/features/shared/presentation/widgets/offline_banner.dart';

// ── Mocks ───────────────────────────────────────────────────────────────────

class MockConnectivityCubit extends MockCubit<ConnectivityState>
    implements ConnectivityCubit {}

// ── Tests ───────────────────────────────────────────────────────────────────

void main() {
  late MockConnectivityCubit mockConnectivity;

  setUp(() {
    mockConnectivity = MockConnectivityCubit();
  });

  Widget buildWidget({required Widget child}) {
    return MaterialApp(
      home: BlocProvider<ConnectivityCubit>.value(
        value: mockConnectivity,
        child: Scaffold(body: OfflineBanner(child: child)),
      ),
    );
  }

  group('OfflineBanner', () {
    testWidgets('shows no banner when online', (tester) async {
      when(() => mockConnectivity.state).thenReturn(
        const ConnectivityState(isOnline: true, pendingSyncCount: 0),
      );

      await tester.pumpWidget(buildWidget(child: const Text('Content')));

      expect(find.text('Content'), findsOneWidget);
      expect(find.text('Mode hors ligne'), findsNothing);
    });

    testWidgets('shows banner with text when offline', (tester) async {
      when(() => mockConnectivity.state).thenReturn(
        const ConnectivityState(isOnline: false, pendingSyncCount: 0),
      );

      await tester.pumpWidget(buildWidget(child: const Text('Content')));
      await tester.pump(const Duration(milliseconds: 350));

      expect(find.text('Content'), findsOneWidget);
      expect(find.textContaining('Mode hors ligne'), findsOneWidget);
    });

    testWidgets('shows pending sync count when offline', (tester) async {
      when(() => mockConnectivity.state).thenReturn(
        const ConnectivityState(isOnline: false, pendingSyncCount: 3),
      );

      await tester.pumpWidget(buildWidget(child: const Text('Content')));
      await tester.pump(const Duration(milliseconds: 350));

      expect(find.textContaining('3 en attente'), findsOneWidget);
    });

    testWidgets('hides banner when connectivity restored', (tester) async {
      final offlineState = const ConnectivityState(
        isOnline: false,
        pendingSyncCount: 1,
      );
      final onlineState = const ConnectivityState(
        isOnline: true,
        pendingSyncCount: 0,
      );

      when(() => mockConnectivity.state).thenReturn(offlineState);
      whenListen(
        mockConnectivity,
        Stream.fromIterable([offlineState, onlineState]),
      );

      await tester.pumpWidget(buildWidget(child: const Text('Content')));
      await tester.pumpAndSettle();

      // After settling to online state, "Mode hors ligne" should be gone
      expect(find.text('Mode hors ligne'), findsNothing);
    });
  });
}
