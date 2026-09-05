import 'package:flutter/material.dart';
import '../models/firestore_service.dart';
import '../theme/app_colors.dart';

/// A reusable widget to display the cover of a FirestoreBook.
/// It attempts to load the image from [book.url]. If the image fails to load or the URL is empty,
/// it falls back to a gradient background with the book's emoji or the first letter of its title.
class FirestoreBookCover extends StatelessWidget {
  final FirestoreBook book;
  final double fontSize;
  final BorderRadius? borderRadius;

  const FirestoreBookCover({
    super.key,
    required this.book,
    this.fontSize = 40,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    if (book.url != null && book.url!.isNotEmpty) {
      return ClipRRect(
        borderRadius: borderRadius ?? BorderRadius.zero,
        child: Image.network(
          book.url!,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildFallback(),
        ),
      );
    }
    return _buildFallback();
  }

  Widget _buildFallback() {
    final displayChar = book.emoji ??
        (book.title.isNotEmpty ? book.title[0].toUpperCase() : '?');

    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.gradientPrimary,
        borderRadius: borderRadius,
      ),
      child: Center(
        child: Text(
          displayChar,
          style: TextStyle(
            color: Colors.white,
            fontSize: fontSize,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}
