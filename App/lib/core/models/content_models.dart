/// TF Study Shelf — Chapter, Question, Quiz, Flashcard Models
import 'dart:convert';
import 'content_block.dart';

// ─── Chapter ─────────────────────────────────────────
class Chapter {
  final String id;
  final String bookId;
  final String title;
  final int chapterNumber;
  final String? content;
  final int wordCount;
  final int estimatedMinutes;

  List<ContentBlock> get parsedContent {
    if (content == null || content!.isEmpty) return [];
    try {
      final List<dynamic> jsonList = jsonDecode(content!);
      return jsonList.map((e) => ContentBlock.fromJson(e as Map<String, dynamic>)).toList();
    } catch (e) {
      return [];
    }
  }

  const Chapter({
    required this.id,
    required this.bookId,
    required this.title,
    required this.chapterNumber,
    this.content,
    this.wordCount = 0,
    this.estimatedMinutes = 0,
  });

  factory Chapter.fromJson(Map<String, dynamic> json) => Chapter(
        id: json['id'] as String,
        bookId: json['book_id'] as String,
        title: json['title'] as String,
        chapterNumber: json['chapter_number'] as int,
        content: json['content'] as String?,
        wordCount: json['word_count'] as int? ?? 0,
        estimatedMinutes: json['estimated_minutes'] as int? ?? 0,
      );

  static List<Chapter> demoChapters(String bookId) => List.generate(
        8,
        (i) => Chapter(
          id: '$bookId-ch-${i + 1}',
          bookId: bookId,
          title: [
            'Introduction',
            'Core Concepts',
            'Advanced Topics',
            'Practical Applications',
            'Problem Solving',
            'Review & Practice',
            'Case Studies',
            'Summary & Next Steps',
          ][i],
          chapterNumber: i + 1,
          wordCount: 3000 + i * 500,
          estimatedMinutes: 15 + i * 5,
        ),
      );
}

// ─── Question ────────────────────────────────────────
class Question {
  final String id;
  final String bookId;
  final String? chapterId;
  final String questionText;
  final String answerText;
  final String difficulty;
  final List<QuestionOption> options;

  const Question({
    required this.id,
    required this.bookId,
    this.chapterId,
    required this.questionText,
    required this.answerText,
    this.difficulty = 'medium',
    this.options = const [],
  });

  factory Question.fromJson(Map<String, dynamic> json) => Question(
        id: json['id'] as String,
        bookId: json['book_id'] as String,
        chapterId: json['chapter_id'] as String?,
        questionText: json['question_text'] as String,
        answerText: json['answer_text'] as String,
        difficulty: json['difficulty'] as String? ?? 'medium',
        options: (json['options'] as List<dynamic>?)
                ?.map((o) =>
                    QuestionOption.fromJson(o as Map<String, dynamic>))
                .toList() ??
            [],
      );

  static List<Question> get demoQuestions => [
        const Question(
          id: 'q1',
          bookId: '1',
          questionText: "What is Newton's first law of motion?",
          answerText:
              "An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction unless acted upon by an unbalanced force.",
          difficulty: 'easy',
        ),
        const Question(
          id: 'q2',
          bookId: '1',
          questionText: "Define kinetic energy and give its formula.",
          answerText:
              "Kinetic energy is the energy possessed by an object due to its motion. Formula: KE = ½mv², where m is mass (kg) and v is velocity (m/s).",
          difficulty: 'medium',
        ),
        const Question(
          id: 'q3',
          bookId: '1',
          questionText: "What is the principle of conservation of energy?",
          answerText:
              "Energy cannot be created or destroyed; it can only be transformed from one form to another. The total energy in a closed system remains constant.",
          difficulty: 'medium',
        ),
      ];
}

class QuestionOption {
  final String id;
  final String optionText;
  final bool isCorrect;

  const QuestionOption({
    required this.id,
    required this.optionText,
    required this.isCorrect,
  });

  factory QuestionOption.fromJson(Map<String, dynamic> json) => QuestionOption(
        id: json['id'] as String,
        optionText: json['option_text'] as String,
        isCorrect: json['is_correct'] as bool? ?? false,
      );
}

// ─── Flashcard ───────────────────────────────────────
class Flashcard {
  final String id;
  final String setId;
  final String front;
  final String back;
  final int orderIndex;

  const Flashcard({
    required this.id,
    required this.setId,
    required this.front,
    required this.back,
    this.orderIndex = 0,
  });

  factory Flashcard.fromJson(Map<String, dynamic> json) => Flashcard(
        id: json['id'] as String,
        setId: json['set_id'] as String,
        front: json['front'] as String,
        back: json['back'] as String,
        orderIndex: json['order_index'] as int? ?? 0,
      );

  static List<Flashcard> get demoFlashcards => [
        const Flashcard(
            id: 'f1',
            setId: 's1',
            front: 'Newton\'s First Law',
            back:
                'An object at rest stays at rest, and an object in motion stays in motion, unless acted on by an external force.',
            orderIndex: 0),
        const Flashcard(
            id: 'f2',
            setId: 's1',
            front: 'Kinetic Energy Formula',
            back: 'KE = ½mv²\n\nm = mass (kg)\nv = velocity (m/s)',
            orderIndex: 1),
        const Flashcard(
            id: 'f3',
            setId: 's1',
            front: 'Potential Energy Formula',
            back: 'PE = mgh\n\nm = mass, g = gravity (9.8 m/s²), h = height',
            orderIndex: 2),
        const Flashcard(
            id: 'f4',
            setId: 's1',
            front: 'Ohm\'s Law',
            back: 'V = IR\n\nV = Voltage (V)\nI = Current (A)\nR = Resistance (Ω)',
            orderIndex: 3),
        const Flashcard(
            id: 'f5',
            setId: 's1',
            front: 'Speed of Light',
            back: 'c = 3 × 10⁸ m/s\n\n(in vacuum)',
            orderIndex: 4),
      ];
}

// ─── Category ────────────────────────────────────────
class Category {
  final String id;
  final String name;
  final String emoji;
  final String? description;
  final int bookCount;

  const Category({
    required this.id,
    required this.name,
    required this.emoji,
    this.description,
    this.bookCount = 0,
  });

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id'] as String,
        name: json['name'] as String,
        emoji: json['emoji'] as String? ?? '📚',
        description: json['description'] as String?,
        bookCount: json['book_count'] as int? ?? 0,
      );

  static List<Category> get demoCategories => const [
        Category(id: 'c1', name: 'Science', emoji: '🔬', bookCount: 24),
        Category(id: 'c2', name: 'Physics', emoji: '⚛️', bookCount: 18),
        Category(id: 'c3', name: 'Mathematics', emoji: '📐', bookCount: 31),
        Category(id: 'c4', name: 'Computer Science', emoji: '💻', bookCount: 22),
        Category(id: 'c5', name: 'Chemistry', emoji: '🧪', bookCount: 15),
        Category(id: 'c6', name: 'History', emoji: '🌍', bookCount: 12),
        Category(id: 'c7', name: 'Self Development', emoji: '🚀', bookCount: 20),
        Category(id: 'c8', name: 'Literature', emoji: '📖', bookCount: 9),
      ];
}

// ─── User Progress ────────────────────────────────────
class ReadingProgress {
  final String bookId;
  final String? lastChapterId;
  final int lastPage;
  final int totalPages;
  final double progressPercent;
  final DateTime lastReadAt;

  const ReadingProgress({
    required this.bookId,
    this.lastChapterId,
    this.lastPage = 0,
    this.totalPages = 0,
    this.progressPercent = 0.0,
    required this.lastReadAt,
  });

  factory ReadingProgress.fromJson(Map<String, dynamic> json) =>
      ReadingProgress(
        bookId: json['book_id'] as String,
        lastChapterId: json['last_chapter_id'] as String?,
        lastPage: json['last_page'] as int? ?? 0,
        totalPages: json['total_pages'] as int? ?? 0,
        progressPercent:
            (json['progress_percent'] as num?)?.toDouble() ?? 0.0,
        lastReadAt: DateTime.parse(json['last_read_at'] as String),
      );
}
