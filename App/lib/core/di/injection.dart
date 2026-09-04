import 'package:get_it/get_it.dart';
import '../network/api_service.dart';
import '../../features/auth/bloc/auth_bloc.dart';
import '../../features/theme/cubit/theme_cubit.dart';

final GetIt getIt = GetIt.instance;

/// Configure dependency injection
Future<void> configureDependencies() async {
  // ─── Core Services ────────────────────────────
  getIt.registerLazySingleton<ApiService>(() => ApiService());

  // ─── BLoCs & Cubits ───────────────────────────
  getIt.registerFactory<ThemeCubit>(() => ThemeCubit());
  getIt.registerFactory<AuthBloc>(
    () => AuthBloc(apiService: getIt<ApiService>()),
  );
}
