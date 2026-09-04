import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:tf_study_shelf/core/router/app_router.dart';
import 'package:tf_study_shelf/features/auth/bloc/auth_bloc.dart';
import 'package:tf_study_shelf/features/theme/cubit/theme_cubit.dart';
import 'package:tf_study_shelf/core/network/api_service.dart';

void main() {
  testWidgets('App renders without crashing', (WidgetTester tester) async {
    final apiService = ApiService();
    await tester.pumpWidget(
      MultiBlocProvider(
        providers: [
          BlocProvider<ThemeCubit>(create: (_) => ThemeCubit()),
          BlocProvider<AuthBloc>(
            create: (_) => AuthBloc(apiService: apiService),
          ),
        ],
        child: MaterialApp.router(
          routerConfig: AppRouter.router,
        ),
      ),
    );
    // App should render without throwing
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
