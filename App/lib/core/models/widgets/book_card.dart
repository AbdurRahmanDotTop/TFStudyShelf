import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_theme.dart';
import '../../theme/app_typography.dart';
import '../book.dart';

/// Reusable book card widget — used in Home, Explore, Shelf
class BookCard extends StatelessWidget {
  final Book book;
  final VoidCallback? onTap;
  final bool showProgress;
  final double? progressValue;

  const BookCard({
    super.key,
    required this.book,
    this.onTap,
    this.showProgress = false,
    this.progressValue,
  });

  Color get _difficultyColor {
    switch (book.difficulty) {
      case 'easy':
        return AppColors.success;
      case 'hard':
        return AppColors.error;
      default:
        return AppColors.warning;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 145,
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          border: Border.all(color: theme.dividerColor),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover
            AspectRatio(
              aspectRatio: 0.75,
              child: _BookCover(book: book),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(AppTheme.spaceSm),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    book.title,
                    style: AppTypography.labelMedium,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    book.author,
                    style: AppTypography.bodySmall.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: AppTheme.spaceXs),
                  Row(
                    children: [
                      const Icon(Icons.star_rounded,
                          size: 13, color: AppColors.accent),
                      const SizedBox(width: 2),
                      Text(
                        book.rating.toStringAsFixed(1),
                        style: AppTypography.bodySmall,
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 5, vertical: 2),
                        decoration: BoxDecoration(
                          color:
                              _difficultyColor.withValues(alpha: 0.12),
                          borderRadius:
                              BorderRadius.circular(AppTheme.radiusSm),
                        ),
                        child: Text(
                          book.difficulty.toUpperCase(),
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: _difficultyColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (showProgress && progressValue != null) ...[
                    const SizedBox(height: AppTheme.spaceXs),
                    LinearProgressIndicator(
                      value: progressValue,
                      backgroundColor:
                          AppColors.accent.withValues(alpha: 0.15),
                      color: AppColors.accent,
                      minHeight: 3,
                      borderRadius:
                          BorderRadius.circular(AppTheme.radiusFull),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Book cover — gradient with initial letter (placeholder for real cover)
class _BookCover extends StatelessWidget {
  final Book book;

  const _BookCover({required this.book});

  @override
  Widget build(BuildContext context) {
    if (book.coverUrl != null) {
      return Image.network(
        book.coverUrl!,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _letterCover,
      );
    }
    return _letterCover;
  }

  Widget get _letterCover => Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientPrimary),
        child: Center(
          child: Text(
            book.title[0].toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 40,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      );
}

/// Large featured book card (horizontal scroll)
class FeaturedBookCard extends StatelessWidget {
  final Book book;
  final VoidCallback? onTap;

  const FeaturedBookCard({super.key, required this.book, this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 260,
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          border: Border.all(color: theme.dividerColor),
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          children: [
            SizedBox(
              width: 90,
              child: book.coverUrl != null
                  ? Image.network(book.coverUrl!,
                      fit: BoxFit.cover, height: double.infinity)
                  : Container(
                      decoration: const BoxDecoration(
                          gradient: AppColors.gradientPrimary),
                      child: Center(
                        child: Text(
                          book.title[0].toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 36,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(AppTheme.spaceMd),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (book.examTags.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.accentSubtle,
                          borderRadius:
                              BorderRadius.circular(AppTheme.radiusFull),
                        ),
                        child: Text(
                          book.examTags.first,
                          style: const TextStyle(
                            color: AppColors.accent,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    const SizedBox(height: AppTheme.spaceXs),
                    Text(
                      book.title,
                      style: AppTypography.labelLarge,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      book.author,
                      style: AppTypography.bodySmall.copyWith(
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withValues(alpha: 0.5),
                      ),
                    ),
                    const SizedBox(height: AppTheme.spaceSm),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded,
                            size: 14, color: AppColors.accent),
                        const SizedBox(width: 3),
                        Text(book.rating.toStringAsFixed(1),
                            style: AppTypography.bodySmall),
                        const SizedBox(width: AppTheme.spaceSm),
                        Text(
                          '${book.totalChapters} ch',
                          style: AppTypography.bodySmall.copyWith(
                            color: Theme.of(context)
                                .colorScheme
                                .onSurface
                                .withValues(alpha: 0.4),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
