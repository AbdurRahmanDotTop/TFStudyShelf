import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/firestore_service.dart';

/// Shelf Page — Real Firestore saved books + reading progress
class ShelfPage extends StatefulWidget {
  const ShelfPage({super.key});

  @override
  State<ShelfPage> createState() => _ShelfPageState();
}

class _ShelfPageState extends State<ShelfPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _fs = FirestoreService.instance;

  List<FirestoreBook> _savedBooks = [];
  List<UserProgress> _inProgress = [];
  List<FirestoreBook> _allBooks = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final allBooks = await _fs.getBooks();
      final shelfIds = await _fs.shelfBookIdsStream().first.catchError((_) => <String>[]);
      final progressSnap = await _fs.progressStream().first.catchError((_) => <UserProgress>[]);

      final saved = allBooks.where((b) => shelfIds.contains(b.id)).toList();
      final inProgress = progressSnap.where((p) => p.progress > 0 && p.progress < 1.0).toList();

      if (mounted) {
        setState(() {
          _allBooks = allBooks;
          _savedBooks = saved;
          _inProgress = inProgress;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = FirebaseAuth.instance.currentUser != null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Shelf'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadData,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelColor: AppColors.accent,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppColors.accent,
          tabs: const [
            Tab(text: 'Saved'),
            Tab(text: 'Reading'),
            Tab(text: 'All Books'),
          ],
        ),
      ),
      body: !isLoggedIn
          ? _buildLoginPrompt()
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildSavedTab(),
                    _buildReadingTab(),
                    _buildAllBooksTab(),
                  ],
                ),
    );
  }

  Widget _buildLoginPrompt() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('🔐', style: TextStyle(fontSize: 48)),
          const SizedBox(height: 12),
          Text('Login to see your shelf', style: AppTypography.labelLarge),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => context.go('/login'),
            child: const Text('Login'),
          ),
        ],
      ),
    );
  }

  Widget _buildSavedTab() {
    if (_savedBooks.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('📚', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            Text('No saved books yet', style: AppTypography.labelLarge),
            const SizedBox(height: 8),
            Text('Explore books and save them here',
                style: AppTypography.bodySmall),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/explore'),
              child: const Text('Explore Books'),
            ),
          ],
        ),
      );
    }
    return _buildBookGrid(_savedBooks);
  }

  Widget _buildReadingTab() {
    if (_inProgress.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('📖', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            Text('No books in progress', style: AppTypography.labelLarge),
            const SizedBox(height: 8),
            Text('Start reading a book to track progress',
                style: AppTypography.bodySmall),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(AppTheme.spaceMd),
      itemCount: _inProgress.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppTheme.spaceSm),
      itemBuilder: (context, i) {
        final p = _inProgress[i];
        final book = _allBooks.firstWhere(
          (b) => b.id == p.bookId,
          orElse: () => FirestoreBook(
              id: p.bookId, title: 'Unknown', author: 'Unknown'),
        );
        return _ProgressCard(
          book: book,
          progress: p.progress,
          onTap: () => context.push('/book/${book.id}'),
        );
      },
    );
  }

  Widget _buildAllBooksTab() {
    if (_allBooks.isEmpty) {
      return const Center(child: Text('No books available'));
    }
    return _buildBookGrid(_allBooks);
  }

  Widget _buildBookGrid(List<FirestoreBook> books) {
    return GridView.builder(
      padding: const EdgeInsets.all(AppTheme.spaceMd),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.60,
        crossAxisSpacing: AppTheme.spaceSm,
        mainAxisSpacing: AppTheme.spaceSm,
      ),
      itemCount: books.length,
      itemBuilder: (context, i) {
        final book = books[i];
        return GestureDetector(
          onTap: () => context.push('/book/${book.id}'),
          child: Container(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              border: Border.all(
                  color: Theme.of(context).dividerColor.withValues(alpha: 0.5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      gradient: AppColors.gradientPrimary,
                      borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(AppTheme.radiusMd)),
                    ),
                    child: Center(
                      child: Text(
                        book.emoji ?? book.title[0].toUpperCase(),
                        style: const TextStyle(fontSize: 44),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(book.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.labelSmall),
                      Text(book.author,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.bodySmall.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurface
                                  .withValues(alpha: 0.5))),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ProgressCard extends StatelessWidget {
  final FirestoreBook book;
  final double progress;
  final VoidCallback onTap;
  const _ProgressCard(
      {required this.book, required this.progress, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppTheme.radiusLg),
      child: Container(
        padding: const EdgeInsets.all(AppTheme.spaceMd),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          border: Border.all(color: theme.dividerColor),
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 72,
              decoration: BoxDecoration(
                gradient: AppColors.gradientPrimary,
                borderRadius: BorderRadius.circular(AppTheme.radiusSm),
              ),
              child: Center(
                child: Text(
                  book.emoji ?? book.title[0].toUpperCase(),
                  style: const TextStyle(fontSize: 26),
                ),
              ),
            ),
            const SizedBox(width: AppTheme.spaceMd),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(book.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.labelMedium),
                  Text(book.author,
                      style: AppTypography.bodySmall.copyWith(
                          color: theme.colorScheme.onSurface
                              .withValues(alpha: 0.5))),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: progress,
                    backgroundColor: AppColors.accent.withValues(alpha: 0.15),
                    color: AppColors.accent,
                    minHeight: 4,
                    borderRadius: BorderRadius.circular(AppTheme.radiusFull),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${(progress * 100).toInt()}% complete',
                    style: AppTypography.bodySmall.copyWith(
                        color: AppColors.accent,
                        fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded),
          ],
        ),
      ),
    );
  }
}
