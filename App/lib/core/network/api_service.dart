import 'package:dio/dio.dart';

/// HTTP API client using Dio
/// Handles auth headers, base URL, and error interceptors
class ApiService {
  late final Dio _dio;
  String? _authToken;

  // Cloudflare Worker API — free tier
  static const String _defaultBaseUrl = 'https://tf-api.tfstudyshelf.workers.dev/api/v1';

  ApiService() {
    const baseUrl = _defaultBaseUrl;

    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.addAll([
      _AuthInterceptor(this),
      _ErrorInterceptor(),
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (log) {
          // Using logger package in production
        },
      ),
    ]);
  }

  void setAuthToken(String? token) => _authToken = token;
  String? get authToken => _authToken;

  // ─── Public Endpoints ─────────────────────────

  Future<Response> getBooks({Map<String, dynamic>? params}) =>
      _dio.get('/books', queryParameters: params);

  Future<Response> getBook(String id) =>
      _dio.get('/books/$id');

  Future<Response> getChapters(String bookId) =>
      _dio.get('/books/$bookId/chapters');

  Future<Response> getQuestions(String bookId, {Map<String, dynamic>? params}) =>
      _dio.get('/books/$bookId/questions', queryParameters: params);

  Future<Response> getQuizzes(String bookId) =>
      _dio.get('/books/$bookId/quizzes');

  Future<Response> getQuiz(String id) =>
      _dio.get('/quizzes/$id');

  Future<Response> getFlashcards(String bookId) =>
      _dio.get('/books/$bookId/flashcards');

  Future<Response> getFlashcardSet(String id) =>
      _dio.get('/flashcard-sets/$id');

  Future<Response> getCategories() => _dio.get('/categories');

  Future<Response> getSubjects() => _dio.get('/subjects');

  Future<Response> search(Map<String, dynamic> params) =>
      _dio.get('/search', queryParameters: params);

  Future<Response> getConfig() => _dio.get('/config');

  // ─── User Endpoints (Authenticated) ───────────

  Future<Response> getUserProgress(String bookId) =>
      _dio.get('/user/progress/$bookId');

  Future<Response> updateProgress(String bookId, Map<String, dynamic> data) =>
      _dio.put('/user/progress/$bookId', data: data);

  Future<Response> getShelf() => _dio.get('/user/shelf');

  Future<Response> addToShelf(Map<String, dynamic> data) =>
      _dio.post('/user/shelf', data: data);

  Future<Response> getHighlights(String bookId) =>
      _dio.get('/user/highlights/$bookId');

  Future<Response> addHighlight(Map<String, dynamic> data) =>
      _dio.post('/user/highlights', data: data);

  Future<Response> getNotes(String bookId) =>
      _dio.get('/user/notes/$bookId');

  Future<Response> addNote(Map<String, dynamic> data) =>
      _dio.post('/user/notes', data: data);

  Future<Response> getBookmarks(String bookId) =>
      _dio.get('/user/bookmarks/$bookId');

  Future<Response> addBookmark(Map<String, dynamic> data) =>
      _dio.post('/user/bookmarks', data: data);

  Future<Response> submitQuiz(String quizId, Map<String, dynamic> data) =>
      _dio.post('/user/quiz-results/$quizId', data: data);

  Future<Response> backupData() => _dio.get('/user/backup');

  Future<Response> restoreData(Map<String, dynamic> data) =>
      _dio.post('/user/restore', data: data);
}

/// Auth interceptor — attaches Bearer token
class _AuthInterceptor extends Interceptor {
  final ApiService _apiService;

  _AuthInterceptor(this._apiService);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = _apiService.authToken;
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}

/// Error interceptor — transforms Dio errors into structured failures
class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final statusCode = err.response?.statusCode ?? 0;
    final data = err.response?.data;

    String message;
    if (data is Map && data['error'] is Map) {
      message = data['error']['message'] ?? 'An error occurred';
    } else if (statusCode == 401) {
      message = 'Please sign in to continue';
    } else if (statusCode == 403) {
      message = 'You don\'t have permission to do this';
    } else if (statusCode == 404) {
      message = 'Not found';
    } else if (statusCode == 429) {
      message = 'Too many requests. Please try again later';
    } else if (statusCode >= 500) {
      message = 'Server error. Please try again later';
    } else if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout) {
      message = 'Connection timed out. Check your internet connection';
    } else {
      message = 'Something went wrong. Please try again';
    }

    handler.next(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: message,
        message: message,
      ),
    );
  }
}
