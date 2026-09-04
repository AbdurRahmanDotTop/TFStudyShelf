import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/splash/view/splash_page.dart';
import '../../features/onboarding/view/onboarding_page.dart';
import '../../features/auth/view/login_page.dart';
import '../../features/auth/view/signup_page.dart';
import '../../features/home/view/home_page.dart';
import '../../features/explore/view/explore_page.dart';
import '../../features/book_detail/view/book_detail_page.dart';
import '../../features/reader/view/reader_page.dart';
import '../../features/reader/view/pdf_reader_page.dart';
import '../../features/study/view/study_page.dart';
import '../../features/shelf/view/shelf_page.dart';
import '../../features/profile/view/profile_page.dart';
import '../widgets/app_shell.dart';

/// App Router — all routes for TF Study Shelf
class AppRouter {
  AppRouter._();

  static final router = GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: false,
    routes: [
      // ── Splash ──────────────────────────────────
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashPage(),
      ),

      // ── Onboarding ──────────────────────────────
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingPage(),
      ),

      // ── Auth ────────────────────────────────────
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignUpPage(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordPage(),
      ),

      // ── Main App Shell (bottom nav) ──────────────
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            pageBuilder: (context, state) => _noTransitionPage(
              state: state,
              child: const HomePage(),
            ),
          ),
          GoRoute(
            path: '/explore',
            pageBuilder: (context, state) => _noTransitionPage(
              state: state,
              child: const ExplorePage(),
            ),
          ),
          GoRoute(
            path: '/study',
            pageBuilder: (context, state) => _noTransitionPage(
              state: state,
              child: const StudyPage(),
            ),
          ),
          GoRoute(
            path: '/shelf',
            pageBuilder: (context, state) => _noTransitionPage(
              state: state,
              child: const ShelfPage(),
            ),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) => _noTransitionPage(
              state: state,
              child: const ProfilePage(),
            ),
          ),
        ],
      ),

      // ── Detail pages (outside shell) ────────────
      GoRoute(
        path: '/book/:id',
        builder: (context, state) => BookDetailPage(
          bookId: state.pathParameters['id'] ?? '',
        ),
      ),
      GoRoute(
        path: '/reader/:id',
        builder: (context, state) => ReaderPage(
          bookId: state.pathParameters['id'] ?? '',
        ),
      ),
      GoRoute(
        path: '/pdf-reader',
        builder: (context, state) => PdfReaderPage(
          title: state.uri.queryParameters['title'] ?? 'PDF Reader',
          path: state.uri.queryParameters['path'] ?? '',
        ),
      ),
    ],

    // ── Error page ────────────────────────────────
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('404', style: TextStyle(fontSize: 64, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text('Page not found: ${state.uri}'),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/home'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );

  static NoTransitionPage<void> _noTransitionPage({
    required GoRouterState state,
    required Widget child,
  }) {
    return NoTransitionPage<void>(
      key: state.pageKey,
      child: child,
    );
  }
}
