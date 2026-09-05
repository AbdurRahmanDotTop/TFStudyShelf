import 'package:cloud_firestore/cloud_firestore.dart';

class BookQnA {
  final String id;
  final String question;
  final String answer;
  final DateTime? createdAt;

  const BookQnA({
    required this.id,
    required this.question,
    required this.answer,
    this.createdAt,
  });

  factory BookQnA.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>? ?? {};
    return BookQnA(
      id: doc.id,
      question: d['question'] as String? ?? '',
      answer: d['answer'] as String? ?? '',
      createdAt: (d['createdAt'] as Timestamp?)?.toDate(),
    );
  }

  factory BookQnA.fromApiJson(Map<String, dynamic> json) {
    return BookQnA(
      id: json['id'],
      question: json['question_text'] ?? json['question'] ?? '',
      answer: json['answer'] ?? '',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }
}
