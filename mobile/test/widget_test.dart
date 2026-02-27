import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:educonnect_mobile/features/shared/widgets/grade_card.dart';
import 'package:educonnect_mobile/features/shared/widgets/attendance_calendar.dart';
import 'package:educonnect_mobile/features/shared/widgets/child_switcher.dart';
import 'package:educonnect_mobile/core/utils/validators.dart';

void main() {
  group('GradeCard Widget', () {
    testWidgets('renders subject name and score', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GradeCard(
              subjectName: 'Mathematics',
              average: 15.5,
              coefficient: 4,
            ),
          ),
        ),
      );

      expect(find.text('Mathematics'), findsOneWidget);
      expect(find.text('15.5'), findsOneWidget);
      expect(find.text('Coefficient: 4'), findsOneWidget);
    });

    testWidgets('shows trend badge when previousAverage is given', (
      tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GradeCard(
              subjectName: 'Physics',
              average: 14.0,
              coefficient: 3,
              previousAverage: 12.0,
            ),
          ),
        ),
      );

      expect(find.text('+2.0'), findsOneWidget);
    });

    testWidgets('invokes onTap callback', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GradeCard(
              subjectName: 'Arabic',
              average: 16.0,
              coefficient: 5,
              onTap: () => tapped = true,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Arabic'));
      expect(tapped, isTrue);
    });
  });

  group('AttendanceCalendar Widget', () {
    testWidgets('renders day numbers', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: AttendanceCalendar(
                year: 2025,
                month: 1,
                dayStatuses: const {1: 'present', 5: 'absent', 10: 'late'},
              ),
            ),
          ),
        ),
      );

      // January has 31 days
      expect(find.text('1'), findsOneWidget);
      expect(find.text('15'), findsOneWidget);
      expect(find.text('31'), findsOneWidget);
    });

    testWidgets('renders legend items', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: AttendanceCalendar(
                year: 2025,
                month: 3,
                dayStatuses: const {},
              ),
            ),
          ),
        ),
      );

      expect(find.text('Present'), findsOneWidget);
      expect(find.text('Absent'), findsOneWidget);
      expect(find.text('Late'), findsOneWidget);
      expect(find.text('Excused'), findsOneWidget);
    });
  });

  group('ChildSwitcher Widget', () {
    testWidgets('renders single child info', (tester) async {
      final children = [
        ChildInfo(
          id: '1',
          firstName: 'Ahmed',
          lastName: 'Benali',
          classroom: '3AM-A',
        ),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ChildSwitcher(
              children: children,
              selectedChildId: '1',
              onChildSelected: (_) {},
            ),
          ),
        ),
      );

      expect(find.text('Ahmed Benali'), findsOneWidget);
      expect(find.text('3AM-A'), findsOneWidget);
    });

    testWidgets('renders multiple children as scrollable list', (tester) async {
      final children = [
        ChildInfo(
          id: '1',
          firstName: 'Ahmed',
          lastName: 'B',
          classroom: '3AM-A',
        ),
        ChildInfo(
          id: '2',
          firstName: 'Fatima',
          lastName: 'B',
          classroom: '1AM-B',
        ),
      ];

      String? selected;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ChildSwitcher(
              children: children,
              selectedChildId: '1',
              onChildSelected: (id) => selected = id,
            ),
          ),
        ),
      );

      expect(find.text('Ahmed B'), findsOneWidget);
      expect(find.text('Fatima B'), findsOneWidget);

      await tester.tap(find.text('Fatima B'));
      expect(selected, '2');
    });
  });

  group('AppValidators', () {
    test('email rejects empty', () {
      expect(AppValidators.email(''), isNotNull);
      expect(AppValidators.email(null), isNotNull);
    });

    test('email accepts valid addresses', () {
      expect(AppValidators.email('test@school.dz'), isNull);
      expect(AppValidators.email('admin@edu.com'), isNull);
    });

    test('email rejects invalid addresses', () {
      expect(AppValidators.email('not-email'), isNotNull);
      expect(AppValidators.email('@no-local.com'), isNotNull);
    });

    test('password enforces rules', () {
      expect(AppValidators.password(''), isNotNull);
      expect(AppValidators.password('short1'), isNotNull);
      expect(AppValidators.password('nonnumber'), isNotNull);
      expect(AppValidators.password('12345678'), isNotNull);
      expect(AppValidators.password('Valid1234'), isNull);
    });

    test('phone validates Algerian numbers', () {
      expect(AppValidators.phone('0551234567'), isNull);
      expect(AppValidators.phone('0661234567'), isNull);
      expect(AppValidators.phone('+213551234567'), isNull);
      expect(AppValidators.phone('1234'), isNotNull);
      expect(AppValidators.phone('0123456789'), isNotNull);
    });

    test('gradeScore validates 0-20 range', () {
      expect(AppValidators.gradeScore('15'), isNull);
      expect(AppValidators.gradeScore('0'), isNull);
      expect(AppValidators.gradeScore('20'), isNull);
      expect(AppValidators.gradeScore('21'), isNotNull);
      expect(AppValidators.gradeScore('-1'), isNotNull);
      expect(AppValidators.gradeScore('abc'), isNotNull);
    });

    test('required rejects blanks', () {
      expect(AppValidators.required(''), isNotNull);
      expect(AppValidators.required('   '), isNotNull);
      expect(AppValidators.required('value'), isNull);
    });
  });
}
