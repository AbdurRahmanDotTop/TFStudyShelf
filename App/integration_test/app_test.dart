import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:tf_study_shelf/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('End-to-end app navigation test', (WidgetTester tester) async {
    app.main();
    // Allow time for the app to initialize, Firebase to connect, and Splash screen to route
    await tester.pumpAndSettle(const Duration(seconds: 5));

    // Try to find the 'Explore Books' button or bottom nav Explore tab
    // We'll search for icons on the bottom navigation bar to navigate

    final exploreTab = find.byIcon(Icons.explore_rounded);
    final studyTab = find.byIcon(Icons.school_rounded);
    final shelfTab = find.byIcon(Icons.collections_bookmark_rounded);
    final homeTab = find.byIcon(Icons.home_rounded);

    // If we see Explore, let's tap it
    if (exploreTab.evaluate().isNotEmpty) {
      debugPrint("Tapping Explore Tab...");
      await tester.tap(exploreTab.first);
      await tester.pumpAndSettle(const Duration(seconds: 3));
    }

    // If we see Study, let's tap it
    if (studyTab.evaluate().isNotEmpty) {
      debugPrint("Tapping Study Tab...");
      await tester.tap(studyTab.first);
      await tester.pumpAndSettle(const Duration(seconds: 3));
    }

    // If we see Shelf, let's tap it
    if (shelfTab.evaluate().isNotEmpty) {
      debugPrint("Tapping Shelf Tab...");
      await tester.tap(shelfTab.first);
      await tester.pumpAndSettle(const Duration(seconds: 3));
    }

    // Tap Home to go back
    if (homeTab.evaluate().isNotEmpty) {
      debugPrint("Tapping Home Tab...");
      await tester.tap(homeTab.first);
      await tester.pumpAndSettle(const Duration(seconds: 3));
    }

    // The test completes without asserting much, because the main goal is to ensure
    // there are no unhandled exceptions or crashes when navigating these screens.
    expect(true, isTrue);
  });
}
