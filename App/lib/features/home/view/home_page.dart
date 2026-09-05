import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/firestore_service.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../../core/widgets/firestore_book_cover.dart';
import '../../../core/widgets/ad_banner_widget.dart';

/// Home Page — Real Firestore data, live streams
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _fs = FirestoreService.instance;

  List<FirestoreBook> _books = [];
  List<FirestoreCategory> _categories = FirestoreCategory.defaults;
  FirestoreBook? _continueBook;
  double _continueProgress = 0.0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() => _loading = true);

    final results = await Future.wait([
      _fs.getBooks(),
      _fs.getCategories(),
      _fs.getContinueReading(),
    ]);

    final books = results[0] as List<FirestoreBook>;
    final cats = results[1] as List<FirestoreCategory>;
    final continueData = results[2] as ({FirestoreBook? book, double progress});

    if (mounted) {
      setState(() {
        _books = books;
        _categories = cats.isNotEmpty ? cats : FirestoreCategory.defaults;
        _continueBook = continueData.book;
        _continueProgress = continueData.progress;
        _loading = false;
      });
    }
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
  }

  String _userName() {
    final user = FirebaseAuth.instance.currentUser;
    if (user?.displayName != null && user!.displayName!.isNotEmpty) {
      return user.displayName!.split(' ').first;
    }
    if (user?.email != null) return user!.email!.split('@').first;
    return '';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: CustomScrollView(
          slivers: [
            // ── App Bar ──────────────────────────────────
            SliverAppBar(
              floating: true,
              snap: true,
              title: const AppLogoWidget(),
              actions: [
                IconButton(
                  icon: const Icon(Icons.search_rounded),
                  onPressed: () => context.go('/explore'),
                  tooltip: 'Search',
                ),
                IconButton(
                  icon: const Icon(Icons.notifications_outlined),
                  onPressed: () {},
                  tooltip: 'Notifications',
                ),
              ],
            ),

            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: AppTheme.spaceMd),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  const SizedBox(height: AppTheme.spaceMd),

                  // ── Hero Card ──────────────────────────
                  _HeroCard(
                    greeting: _greeting(),
                    userName: _userName(),
                  ),
                  const SizedBox(height: AppTheme.spaceXl),

                  if (_loading) ...[
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32),
                        child: CircularProgressIndicator(),
                      ),
                    ),
                  ] else ...[
                    // ── Continue Reading ────────────────────
                    if (_continueBook != null) ...[
                      const SectionHeader(title: 'Continue Reading'),
                      const SizedBox(height: AppTheme.spaceSm),
                      _ContinueReadingCard(
                        book: _continueBook!,
                        progress: _continueProgress,
                        onTap: () => context.push('/book/${_continueBook!.id}'),
                      ),
                      const SizedBox(height: AppTheme.spaceXl),
                    ],

                    // ── Categories ──────────────────────────
                    SectionHeader(
                      title: 'Browse Categories',
                      onSeeAll: () => context.go('/explore'),
                    ),
                    const SizedBox(height: AppTheme.spaceSm),
                    SizedBox(
                      height: 96,
                      child: _categories.isEmpty
                          ? const Center(child: Text('No categories yet'))
                          : ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: _categories.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(width: AppTheme.spaceSm),
                              itemBuilder: (context, i) => _CategoryChip(
                                category: _categories[i],
                                onTap: () => context.go(
                                    '/explore?category=${_categories[i].name}'),
                              ),
                            ),
                    ),
                    const SizedBox(height: AppTheme.spaceXl),

                    // ── Study Tools ─────────────────────────
                    const SectionHeader(title: 'Study Tools'),
                    const SizedBox(height: AppTheme.spaceSm),
                    GridView.count(
                      crossAxisCount: 2,
                      childAspectRatio: 2.2,
                      crossAxisSpacing: AppTheme.spaceSm,
                      mainAxisSpacing: AppTheme.spaceSm,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      children: [
                        _StudyToolTile(
                          icon: Icons.quiz_rounded,
                          title: 'Quizzes',
                          subtitle: 'Test yourself',
                          color: const Color(0xFF6C63FF),
                          onTap: () => context.go('/study'),
                        ),
                        _StudyToolTile(
                          icon: Icons.style_rounded,
                          title: 'Flashcards',
                          subtitle: 'Quick review',
                          color: const Color(0xFF43A047),
                          onTap: () => context.go('/study'),
                        ),
                        _StudyToolTile(
                          icon: Icons.help_outline_rounded,
                          title: 'Q&A',
                          subtitle: 'Short answers',
                          color: const Color(0xFFFF7043),
                          onTap: () => context.go('/study'),
                        ),
                        _StudyToolTile(
                          icon: Icons.collections_bookmark_rounded,
                          title: 'My Shelf',
                          subtitle: 'Saved books',
                          color: const Color(0xFF0288D1),
                          onTap: () => context.go('/shelf'),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppTheme.spaceXl),
                    
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: AppTheme.spaceSm),
                      child: AdBannerWidget(),
                    ),
                    const SizedBox(height: AppTheme.spaceMd),

                    // ── Recently Added ──────────────────────
                    if (_books.isNotEmpty) ...[
                      SectionHeader(
                        title: 'Recently Added',
                        onSeeAll: () => context.go('/explore'),
                      ),
                      const SizedBox(height: AppTheme.spaceSm),
                      SizedBox(
                        height: 200,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _books.length.clamp(0, 6),
                          separatorBuilder: (_, __) =>
                              const SizedBox(width: AppTheme.spaceSm),
                          itemBuilder: (context, i) {
                            final book = _books[i];
                            return _BookThumbnail(
                              book: book,
                              onTap: () => context.push('/book/${book.id}'),
                            );
                          },
                        ),
                      ),
                    ] else ...[
                      Container(
                        padding: const EdgeInsets.all(AppTheme.spaceLg),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius:
                              BorderRadius.circular(AppTheme.radiusLg),
                          border: Border.all(
                              color: Theme.of(context).dividerColor),
                        ),
                        child: Column(
                          children: [
                            const Text('📚', style: TextStyle(fontSize: 40)),
                            const SizedBox(height: AppTheme.spaceSm),
                            Text(
                              'No books yet',
                              style: AppTypography.labelLarge,
                            ),
                            Text(
                              'Admin panel se books add karein',
                              style: AppTypography.bodySmall.copyWith(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurface
                                      .withValues(alpha: 0.5)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],

                  SizedBox(
                      height: AppTheme.space2Xl +
                          MediaQuery.of(context).padding.bottom),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Sub-widgets ──────────────────────────────────────────

class _HeroCard extends StatelessWidget {
  final String greeting;
  final String userName;
  const _HeroCard({required this.greeting, required this.userName});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spaceLg),
      decoration: BoxDecoration(
        gradient: AppColors.gradientPrimary,
        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$greeting${userName.isNotEmpty ? ", $userName" : ""} 👋',
            style: AppTypography.headline.copyWith(color: Colors.white),
          ),
          const SizedBox(height: AppTheme.spaceXs),
          Text(
            'Your free digital library and study companion.',
            style: AppTypography.bodyMedium
                .copyWith(color: Colors.white.withValues(alpha: 0.8)),
          ),
          const SizedBox(height: AppTheme.spaceLg),
          Wrap(
            spacing: AppTheme.spaceSm,
            runSpacing: AppTheme.spaceXs,
            children: [
              ElevatedButton.icon(
                onPressed: () => GoRouter.of(context).go('/explore'),
                icon: const Icon(Icons.explore_rounded, size: 18),
                label: const Text('Explore Books'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.primaryDark,
                ),
              ),
              OutlinedButton.icon(
                onPressed: () => GoRouter.of(context).go('/study'),
                icon: const Icon(Icons.school_rounded, size: 18),
                label: const Text('Study'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: BorderSide(color: Colors.white.withValues(alpha: 0.5)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ContinueReadingCard extends StatelessWidget {
  final FirestoreBook book;
  final double progress;
  final VoidCallback onTap;
  const _ContinueReadingCard({
    required this.book,
    required this.progress,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: theme.dividerColor),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spaceMd),
          child: Row(
            children: [
              SizedBox(
                width: 56,
                height: 72,
                child: FirestoreBookCover(
                  book: book,
                  fontSize: 24,
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                ),
              ),
              const SizedBox(width: AppTheme.spaceMd),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(book.title,
                        style: AppTypography.labelLarge,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    Text(book.author,
                        style: AppTypography.bodySmall.copyWith(
                            color: theme.colorScheme.onSurface
                                .withValues(alpha: 0.5))),
                    const SizedBox(height: AppTheme.spaceSm),
                    LinearProgressIndicator(
                      value: progress,
                      backgroundColor:
                          AppColors.accent.withValues(alpha: 0.15),
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
              const SizedBox(width: AppTheme.spaceSm),
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.accentSubtle,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.play_arrow_rounded,
                    color: AppColors.accent),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final FirestoreCategory category;
  final VoidCallback onTap;
  const _CategoryChip({required this.category, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppTheme.radiusMd),
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              border: Border.all(color: Theme.of(context).dividerColor),
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            ),
            child: Center(
              child: Text(category.emoji, style: const TextStyle(fontSize: 26)),
            ),
          ),
          const SizedBox(height: 4),
          Text(category.name,
              style: AppTypography.labelSmall,
              maxLines: 1,
              overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}

class _BookThumbnail extends StatelessWidget {
  final FirestoreBook book;
  final VoidCallback onTap;
  const _BookThumbnail({required this.book, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 130,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 150,
              width: 130,
              child: FirestoreBookCover(
                book: book,
                fontSize: 40,
                borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              book.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.labelSmall,
            ),
            Text(
              book.author,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.bodySmall.copyWith(
                  color: Theme.of(context)
                      .colorScheme
                      .onSurface
                      .withValues(alpha: 0.5)),
            ),
          ],
        ),
      ),
    );
  }
}

class _StudyToolTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _StudyToolTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        child: Padding(
          padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spaceMd, vertical: AppTheme.spaceSm),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: AppTheme.spaceSm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(title, style: AppTypography.labelMedium),
                    Text(subtitle,
                        style: AppTypography.bodySmall.copyWith(
                          color: Theme.of(context)
                              .colorScheme
                              .onSurface
                              .withValues(alpha: 0.5),
                        )),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
