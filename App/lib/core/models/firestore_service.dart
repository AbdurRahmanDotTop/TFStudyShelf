// TF Study Shelf — Firestore Service
// Central service for all Firebase Firestore operations

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../network/api_service.dart';
import '../di/injection.dart';
import 'book.dart';
import 'book_qna.dart';

class FirestoreService {
  static final FirestoreService instance = FirestoreService._();
  FirestoreService._();

  final _db = FirebaseFirestore.instance;
  final _auth = FirebaseAuth.instance;

  String? get _uid => _auth.currentUser?.uid;

  // ─── Books ──────────────────────────────────────────



  /// One-time fetch all published books
  Future<List<FirestoreBook>> getBooks() async {
    try {
      final dio = getIt<ApiService>();
      
      // Fetch categories to map category IDs to names
      final categories = await getCategories();
      final categoryMap = {for (var c in categories) c.id: c.name};

      List<FirestoreBook> allBooks = [];
      int page = 1;
      bool hasMore = true;

      while (hasMore) {
        final response = await dio.getBooks(params: {'page': page, 'limit': 50});
        if (response.statusCode == 200 && response.data['success'] == true) {
          final List data = response.data['data'];
          
          final books = data.map((json) {
            String categoryName = 'General';
            if (json['categoryIds'] != null && (json['categoryIds'] as List).isNotEmpty) {
              final String catId = (json['categoryIds'] as List).first;
              categoryName = categoryMap[catId] ?? 'General';
            }

            return FirestoreBook(
              id: json['id'],
              title: json['title'] ?? 'Untitled',
              author: json['author'] ?? 'Unknown',
              description: json['description'],
              url: json['cover_image_url'],
              pdfDriveId: json['pdf_google_drive_id'],
              category: categoryName,
              status: json['status'] ?? 'published',
              language: json['language'] ?? 'English',
              pages: json['page_count'] ?? 0,
              createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
            );
          }).toList();
          
          allBooks.addAll(books);
          
          final meta = response.data['meta'];
          if (meta != null && meta['hasMore'] == true) {
            page++;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      return allBooks;
    } catch (_) {
      return [];
    }
  }

  /// Get single book by ID
  Future<FirestoreBook?> getBook(String id) async {
    try {
      final dio = getIt<ApiService>();
      final response = await dio.getBook(id);
      if (response.statusCode == 200 && response.data['success'] == true) {
        final json = response.data['data'];
        
        String categoryName = 'General';
        if (json['categories'] != null && (json['categories'] as List).isNotEmpty) {
          categoryName = json['categories'][0]['name'] ?? 'General';
        }

        return FirestoreBook(
          id: json['id'],
          title: json['title'] ?? 'Untitled',
          author: json['author'] ?? 'Unknown',
          description: json['description'],
          url: json['cover_image_url'],
          pdfDriveId: json['pdf_google_drive_id'],
          category: categoryName,
          status: json['status'] ?? 'published',
          language: json['language'] ?? 'English',
          pages: json['page_count'] ?? 0,
          createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
        );
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Get book Questions and Answers
  Future<List<BookQnA>> getBookQnAs(String bookId) async {
    try {
      final dio = getIt<ApiService>();
      
      List<BookQnA> allQnAs = [];
      int page = 1;
      bool hasMore = true;

      while (hasMore) {
        final response = await dio.getQuestions(bookId, params: {'page': page, 'limit': 50});
        if (response.statusCode == 200 && response.data['success'] == true) {
          final List data = response.data['data'];
          allQnAs.addAll(data.map((json) => BookQnA.fromApiJson(json)).toList());
          
          final meta = response.data['meta'];
          if (meta != null && meta['hasMore'] == true) {
            page++;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      return allQnAs;
    } catch (_) {
      return [];
    }
  }

  // ─── Categories ─────────────────────────────────────

  Future<List<FirestoreCategory>> getCategories() async {
    try {
      final dio = getIt<ApiService>();
      final response = await dio.getCategories();
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List data = response.data['data'];
        return data.map((json) => FirestoreCategory.fromApiJson(json)).toList();
      }
      return FirestoreCategory.defaults;
    } catch (_) {
      return FirestoreCategory.defaults;
    }
  }

  // ─── User Progress ──────────────────────────────────

  /// Get user's reading progress for a book (0.0 - 1.0)
  Future<double> getBookProgress(String bookId) async {
    if (_uid == null) return 0.0;
    try {
      final doc = await _db
          .collection('users')
          .doc(_uid)
          .collection('progress')
          .doc(bookId)
          .get();
      if (!doc.exists) return 0.0;
      return (doc.data()?['progress'] as num?)?.toDouble() ?? 0.0;
    } catch (_) {
      return 0.0;
    }
  }

  /// Update user's reading progress for a book
  Future<void> updateBookProgress(String bookId, double progress,
      {int? currentPage}) async {
    if (_uid == null) return;
    await _db
        .collection('users')
        .doc(_uid)
        .collection('progress')
        .doc(bookId)
        .set({
      'bookId': bookId,
      'progress': progress,
      'currentPage': currentPage ?? 0,
      'lastRead': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  /// Stream all progress entries for current user
  Stream<List<UserProgress>> progressStream() {
    if (_uid == null) return const Stream.empty();
    return _db
        .collection('users')
        .doc(_uid)
        .collection('progress')
        .orderBy('lastRead', descending: true)
        .snapshots()
        .map((snap) =>
            snap.docs.map((d) => UserProgress.fromDoc(d)).toList());
  }

  /// Get "Continue Reading" book (last read with progress < 1.0)
  Future<({FirestoreBook? book, double progress})>
      getContinueReading() async {
    if (_uid == null) return (book: null, progress: 0.0);
    try {
      final progressSnap = await _db
          .collection('users')
          .doc(_uid)
          .collection('progress')
          .orderBy('lastRead', descending: true)
          .limit(5)
          .get();

      for (final doc in progressSnap.docs) {
        final progress =
            (doc.data()['progress'] as num?)?.toDouble() ?? 0.0;
        if (progress > 0.0 && progress < 1.0) {
          final bookId = doc.data()['bookId'] as String;
          final book = await getBook(bookId);
          if (book != null) return (book: book, progress: progress);
        }
      }
      return (book: null, progress: 0.0);
    } catch (_) {
      return (book: null, progress: 0.0);
    }
  }

  // ─── User Shelf (saved books) ────────────────────────

  Future<void> addToShelf(String bookId) async {
    if (_uid == null) return;
    await _db
        .collection('users')
        .doc(_uid)
        .collection('shelf')
        .doc(bookId)
        .set({'bookId': bookId, 'addedAt': FieldValue.serverTimestamp()});
  }

  Future<void> removeFromShelf(String bookId) async {
    if (_uid == null) return;
    await _db
        .collection('users')
        .doc(_uid)
        .collection('shelf')
        .doc(bookId)
        .delete();
  }

  Stream<List<String>> shelfBookIdsStream() {
    if (_uid == null) return const Stream.empty();
    return _db
        .collection('users')
        .doc(_uid)
        .collection('shelf')
        .snapshots()
        .map((snap) =>
            snap.docs.map((d) => d.data()['bookId'] as String).toList());
  }

  // ─── User Profile ────────────────────────────────────

  Future<void> saveUserProfile(Map<String, dynamic> data) async {
    if (_uid == null) return;
    await _db
        .collection('users')
        .doc(_uid)
        .set(data, SetOptions(merge: true));
  }

  Future<Map<String, dynamic>?> getUserProfile() async {
    if (_uid == null) return null;
    try {
      final doc = await _db.collection('users').doc(_uid).get();
      return doc.data();
    } catch (_) {
      return null;
    }
  }

  Stream<DocumentSnapshot> userProfileStream() {
    if (_uid == null) return const Stream.empty();
    return _db.collection('users').doc(_uid).snapshots();
  }

  // ─── Stats ────────────────────────────────────────────

  Future<Map<String, int>> getUserStats() async {
    if (_uid == null) return {};
    try {
      final progressSnap = await _db
          .collection('users')
          .doc(_uid)
          .collection('progress')
          .get();
      final shelfSnap = await _db
          .collection('users')
          .doc(_uid)
          .collection('shelf')
          .get();

      int booksCompleted =
          progressSnap.docs.where((d) => (d.data()['progress'] as num?) == 1.0).length;
      int booksInProgress =
          progressSnap.docs.where((d) {
        final p = (d.data()['progress'] as num?)?.toDouble() ?? 0.0;
        return p > 0.0 && p < 1.0;
      }).length;

      return {
        'booksRead': booksCompleted,
        'booksInProgress': booksInProgress,
        'shelfCount': shelfSnap.docs.length,
        'totalProgress': progressSnap.docs.length,
      };
    } catch (_) {
      return {};
    }
  }
}

// ─── Models ───────────────────────────────────────────

class FirestoreBook {
  final String id;
  final String title;
  final String author;
  final String? description;
  final String? emoji;
  final String? url;
  final String? pdfDriveId;
  final String category;
  final String status;
  final String language;
  final int pages;
  final DateTime? createdAt;

  const FirestoreBook({
    required this.id,
    required this.title,
    required this.author,
    this.description,
    this.emoji,
    this.url,
    this.pdfDriveId,
    this.category = 'General',
    this.status = 'published',
    this.language = 'English',
    this.pages = 0,
    this.createdAt,
  });

  factory FirestoreBook.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    return FirestoreBook(
      id: doc.id,
      title: d['title'] as String? ?? 'Untitled',
      author: d['author'] as String? ?? 'Unknown',
      description: d['description'] as String?,
      emoji: d['emoji'] as String?,
      url: d['url'] as String?,
      pdfDriveId: d['pdf_drive_id'] as String?,
      category: d['category'] as String? ?? 'General',
      status: d['status'] as String? ?? 'published',
      language: d['language'] as String? ?? 'English',
      pages: (d['pages'] as num?)?.toInt() ?? 0,
      createdAt: d['createdAt'] != null
          ? DateTime.tryParse(d['createdAt'] as String)
          : null,
    );
  }

  /// Convert to legacy Book model for compatibility
  Book toBook() => Book(
        id: id,
        title: title,
        author: author,
        description: description,
        coverUrl: url,
        totalPages: pages,
        categoryId: category,
        createdAt: createdAt ?? DateTime.now(),
      );
}

class FirestoreCategory {
  final String id;
  final String name;
  final String emoji;
  final String? description;

  const FirestoreCategory({
    required this.id,
    required this.name,
    required this.emoji,
    this.description,
  });

  factory FirestoreCategory.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    return FirestoreCategory(
      id: doc.id,
      name: d['name'] as String? ?? 'Unknown',
      emoji: d['emoji'] as String? ?? '📚',
      description: d['description'] as String?,
    );
  }

  factory FirestoreCategory.fromApiJson(Map<String, dynamic> json) {
    return FirestoreCategory(
      id: json['id'],
      name: json['name'] ?? 'Unknown',
      emoji: json['emoji'] ?? '📚',
      description: json['description'],
    );
  }

  static List<FirestoreCategory> get defaults => const [
        FirestoreCategory(id: 'science', name: 'Science', emoji: '🔬'),
        FirestoreCategory(id: 'physics', name: 'Physics', emoji: '⚡'),
        FirestoreCategory(id: 'math', name: 'Mathematics', emoji: '📐'),
        FirestoreCategory(id: 'cs', name: 'Computer Science', emoji: '💻'),
        FirestoreCategory(id: 'chemistry', name: 'Chemistry', emoji: '⚗️'),
        FirestoreCategory(id: 'biology', name: 'Biology', emoji: '🧬'),
        FirestoreCategory(id: 'education', name: 'Education', emoji: '🎓'),
        FirestoreCategory(id: 'selfhelp', name: 'Self Help', emoji: '💡'),
        FirestoreCategory(id: 'history', name: 'History', emoji: '🏛️'),
      ];
}

class UserProgress {
  final String bookId;
  final double progress;
  final int currentPage;
  final DateTime? lastRead;

  const UserProgress({
    required this.bookId,
    required this.progress,
    required this.currentPage,
    this.lastRead,
  });

  factory UserProgress.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    return UserProgress(
      bookId: d['bookId'] as String? ?? doc.id,
      progress: (d['progress'] as num?)?.toDouble() ?? 0.0,
      currentPage: (d['currentPage'] as num?)?.toInt() ?? 0,
      lastRead: (d['lastRead'] as Timestamp?)?.toDate(),
    );
  }
}
