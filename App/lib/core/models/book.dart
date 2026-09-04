/// TF Study Shelf — Book Data Model
class Book {
  final String id;
  final String title;
  final String author;
  final String? description;
  final String? coverUrl;
  final String? pdfDriveId;
  final String? categoryId;
  final String? subjectId;
  final String difficulty;
  final int totalChapters;
  final int totalPages;
  final double rating;
  final int ratingCount;
  final bool isPublished;
  final bool isFeatured;
  final List<String> tags;
  final List<String> examTags;
  final DateTime? publishedAt;
  final DateTime createdAt;

  const Book({
    required this.id,
    required this.title,
    required this.author,
    this.description,
    this.coverUrl,
    this.pdfDriveId,
    this.categoryId,
    this.subjectId,
    this.difficulty = 'medium',
    this.totalChapters = 0,
    this.totalPages = 0,
    this.rating = 0.0,
    this.ratingCount = 0,
    this.isPublished = true,
    this.isFeatured = false,
    this.tags = const [],
    this.examTags = const [],
    this.publishedAt,
    required this.createdAt,
  });

  factory Book.fromJson(Map<String, dynamic> json) {
    return Book(
      id: json['id'] as String,
      title: json['title'] as String,
      author: json['author'] as String,
      description: json['description'] as String?,
      coverUrl: json['cover_url'] as String?,
      pdfDriveId: json['pdf_drive_id'] as String?,
      categoryId: json['category_id'] as String?,
      subjectId: json['subject_id'] as String?,
      difficulty: json['difficulty'] as String? ?? 'medium',
      totalChapters: json['total_chapters'] as int? ?? 0,
      totalPages: json['total_pages'] as int? ?? 0,
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      ratingCount: json['rating_count'] as int? ?? 0,
      isPublished: json['is_published'] as bool? ?? true,
      isFeatured: json['is_featured'] as bool? ?? false,
      tags: (json['tags'] as List<dynamic>?)?.cast<String>() ?? [],
      examTags: (json['exam_tags'] as List<dynamic>?)?.cast<String>() ?? [],
      publishedAt: json['published_at'] != null
          ? DateTime.tryParse(json['published_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'author': author,
        'description': description,
        'cover_url': coverUrl,
        'pdf_drive_id': pdfDriveId,
        'category_id': categoryId,
        'subject_id': subjectId,
        'difficulty': difficulty,
        'total_chapters': totalChapters,
        'total_pages': totalPages,
        'rating': rating,
        'rating_count': ratingCount,
        'is_published': isPublished,
        'is_featured': isFeatured,
        'tags': tags,
        'exam_tags': examTags,
        'published_at': publishedAt?.toIso8601String(),
        'created_at': createdAt.toIso8601String(),
      };

  Book copyWith({
    String? title,
    String? author,
    String? description,
    String? coverUrl,
    bool? isFeatured,
  }) {
    return Book(
      id: id,
      title: title ?? this.title,
      author: author ?? this.author,
      description: description ?? this.description,
      coverUrl: coverUrl ?? this.coverUrl,
      pdfDriveId: pdfDriveId,
      categoryId: categoryId,
      subjectId: subjectId,
      difficulty: difficulty,
      totalChapters: totalChapters,
      totalPages: totalPages,
      rating: rating,
      ratingCount: ratingCount,
      isPublished: isPublished,
      isFeatured: isFeatured ?? this.isFeatured,
      tags: tags,
      examTags: examTags,
      publishedAt: publishedAt,
      createdAt: createdAt,
    );
  }

  // ── Demo data ──────────────────────────────────
  static List<Book> get demoBooks => [
        Book(
          id: '1',
          title: 'Fundamentals of Physics',
          author: 'David Halliday',
          description:
              'The most comprehensive introduction to physics, covering mechanics, thermodynamics, electromagnetism, optics, and modern physics.',
          difficulty: 'hard',
          totalChapters: 45,
          totalPages: 1248,
          rating: 4.8,
          ratingCount: 1240,
          isFeatured: true,
          tags: ['physics', 'science', 'engineering'],
          examTags: ['JEE', 'NEET'],
          createdAt: DateTime(2024, 1, 1),
        ),
        Book(
          id: '2',
          title: 'Atomic Habits',
          author: 'James Clear',
          description:
              'An easy and proven way to build good habits and break bad ones.',
          difficulty: 'easy',
          totalChapters: 20,
          totalPages: 320,
          rating: 4.9,
          ratingCount: 3210,
          isFeatured: true,
          tags: ['self-help', 'habits', 'productivity'],
          examTags: [],
          createdAt: DateTime(2024, 1, 5),
        ),
        Book(
          id: '3',
          title: 'Introduction to Algorithms',
          author: 'Thomas H. Cormen',
          description:
              'The classic reference for computer science algorithms, data structures, and complexity analysis.',
          difficulty: 'hard',
          totalChapters: 35,
          totalPages: 1292,
          rating: 4.7,
          ratingCount: 980,
          isFeatured: false,
          tags: ['algorithms', 'cs', 'programming'],
          examTags: ['GATE'],
          createdAt: DateTime(2024, 1, 10),
        ),
        Book(
          id: '4',
          title: 'Organic Chemistry',
          author: 'Paula Bruice',
          description:
              'A modern approach to organic chemistry with emphasis on understanding mechanisms.',
          difficulty: 'medium',
          totalChapters: 28,
          totalPages: 1200,
          rating: 4.5,
          ratingCount: 760,
          isFeatured: false,
          tags: ['chemistry', 'organic', 'science'],
          examTags: ['NEET', 'JEE'],
          createdAt: DateTime(2024, 1, 15),
        ),
        Book(
          id: '5',
          title: 'Calculus: Early Transcendentals',
          author: 'James Stewart',
          description:
              'The most widely-used calculus textbook, covering single-variable and multivariable calculus.',
          difficulty: 'medium',
          totalChapters: 18,
          totalPages: 1344,
          rating: 4.6,
          ratingCount: 1120,
          isFeatured: true,
          tags: ['math', 'calculus', 'science'],
          examTags: ['JEE', 'GATE'],
          createdAt: DateTime(2024, 1, 20),
        ),
        Book(
          id: '6',
          title: 'Python Crash Course',
          author: 'Eric Matthes',
          description:
              'A hands-on, project-based introduction to programming with Python.',
          difficulty: 'easy',
          totalChapters: 20,
          totalPages: 544,
          rating: 4.7,
          ratingCount: 2100,
          isFeatured: false,
          tags: ['python', 'programming', 'cs'],
          examTags: [],
          createdAt: DateTime(2024, 1, 25),
        ),
        Book(
          id: '7',
          title: 'NCERT Physics Part I',
          author: 'NCERT',
          description:
              'Standard textbook for Class XII Physics as prescribed by NCERT.',
          difficulty: 'medium',
          totalChapters: 8,
          totalPages: 280,
          rating: 4.4,
          ratingCount: 4500,
          isFeatured: true,
          tags: ['physics', 'ncert', 'school'],
          examTags: ['JEE', 'NEET', 'CBSE'],
          createdAt: DateTime(2024, 2, 1),
        ),
        Book(
          id: '8',
          title: 'The Art of Thinking Clearly',
          author: 'Rolf Dobelli',
          description:
              'A catalogue of the most common thinking errors, and how to avoid them.',
          difficulty: 'easy',
          totalChapters: 99,
          totalPages: 384,
          rating: 4.3,
          ratingCount: 890,
          isFeatured: false,
          tags: ['psychology', 'thinking', 'self-help'],
          examTags: [],
          createdAt: DateTime(2024, 2, 5),
        ),
      ];
}
