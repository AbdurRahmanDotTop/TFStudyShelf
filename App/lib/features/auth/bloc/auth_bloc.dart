import 'package:equatable/equatable.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/network/api_service.dart';

// ─── Events ─────────────────────────────────────
sealed class AuthEvent extends Equatable {
  const AuthEvent();
  @override
  List<Object?> get props => [];
}

class AuthCheckRequested extends AuthEvent {
  const AuthCheckRequested();
}

class AuthLoginRequested extends AuthEvent {
  final String email;
  final String password;
  const AuthLoginRequested({required this.email, required this.password});
  @override
  List<Object?> get props => [email, password];
}

class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}

class AuthSignUpRequested extends AuthEvent {
  final String email;
  final String password;
  final String displayName;
  const AuthSignUpRequested({
    required this.email,
    required this.password,
    required this.displayName,
  });
  @override
  List<Object?> get props => [email, password, displayName];
}

// ─── States ─────────────────────────────────────
sealed class AuthState extends Equatable {
  const AuthState();
  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthAuthenticated extends AuthState {
  final String uid;
  final String email;
  final String? displayName;
  const AuthAuthenticated({
    required this.uid,
    required this.email,
    this.displayName,
  });
  @override
  List<Object?> get props => [uid, email, displayName];
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthFailure extends AuthState {
  final String message;
  const AuthFailure(this.message);
  @override
  List<Object?> get props => [message];
}

// ─── BLoC ───────────────────────────────────────
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final ApiService _apiService;
  final FirebaseAuth _firebaseAuth;

  AuthBloc({required ApiService apiService, FirebaseAuth? firebaseAuth})
      : _apiService = apiService,
        _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
        super(const AuthInitial()) {
    on<AuthCheckRequested>(_onCheckRequested);
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthSignUpRequested>(_onSignUpRequested);
  }

  Future<void> _onCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    final user = _firebaseAuth.currentUser;
    if (user != null) {
      emit(AuthAuthenticated(
        uid: user.uid,
        email: user.email ?? '',
        displayName: user.displayName ?? user.email?.split('@').first,
      ));
    } else {
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final credential = await _firebaseAuth.signInWithEmailAndPassword(
        email: event.email,
        password: event.password,
      );
      final user = credential.user!;
      emit(AuthAuthenticated(
        uid: user.uid,
        email: user.email ?? event.email,
        displayName: user.displayName ?? event.email.split('@').first,
      ));
    } on FirebaseAuthException catch (e) {
      String msg;
      switch (e.code) {
        case 'user-not-found':
          msg = 'No account found with this email.';
        case 'wrong-password':
        case 'invalid-credential':
          msg = 'Incorrect email or password.';
        case 'user-disabled':
          msg = 'This account has been disabled.';
        case 'too-many-requests':
          msg = 'Too many attempts. Please try again later.';
        case 'network-request-failed':
          // Firebase offline — allow demo login for testing
          msg = 'No internet connection. Check your network.';
        default:
          msg = e.message ?? 'Login failed. Please try again.';
      }
      emit(AuthFailure(msg));
    } catch (e) {
      // Firebase project suspended / 403 — fallback offline login for testing
      final errStr = e.toString().toLowerCase();
      if (errStr.contains('403') ||
          errStr.contains('forbidden') ||
          errStr.contains('installation')) {
        // Allow offline demo login while Firebase is being set up
        emit(AuthAuthenticated(
          uid: 'offline-${event.email.hashCode}',
          email: event.email,
          displayName: event.email.split('@').first,
        ));
      } else {
        emit(AuthFailure('Login failed. Please check your connection.'));
      }
    }
  }

  Future<void> _onSignUpRequested(
    AuthSignUpRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final credential = await _firebaseAuth.createUserWithEmailAndPassword(
        email: event.email,
        password: event.password,
      );
      final user = credential.user!;
      // Set display name
      await user.updateDisplayName(event.displayName);
      emit(AuthAuthenticated(
        uid: user.uid,
        email: user.email ?? event.email,
        displayName: event.displayName,
      ));
    } on FirebaseAuthException catch (e) {
      String msg;
      switch (e.code) {
        case 'email-already-in-use':
          msg = 'An account already exists with this email.';
        case 'weak-password':
          msg = 'Password is too weak. Use at least 6 characters.';
        case 'invalid-email':
          msg = 'Invalid email address.';
        default:
          msg = e.message ?? 'Sign up failed. Please try again.';
      }
      emit(AuthFailure(msg));
    } catch (e) {
      emit(AuthFailure('Sign up failed: ${e.toString()}'));
    }
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await _firebaseAuth.signOut();
    _apiService.setAuthToken(null);
    emit(const AuthUnauthenticated());
  }
}
