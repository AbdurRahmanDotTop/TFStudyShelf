import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/firestore_service.dart';
import '../../../core/widgets/ad_banner_widget.dart';
import '../../../core/widgets/firestore_book_cover.dart';

/// Explore Page — Real Firestore books, live search & filter
class ExplorePage extends StatefulWidget {
  const ExplorePage({super.key});

  @override
  State<ExplorePage> createState() => _ExplorePageState();
}

class _ExplorePageState extends State<ExplorePage> {
  final _searchController = TextEditingController();
  final _fs = FirestoreService.instance;

  String _selectedCategory = 'All';
  String _sortBy = 'Newest';
  bool _isGridView = true;
  String _query = '';

  List<FirestoreBook> _allBooks = [];
  List<FirestoreCategory> _categories = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
    _searchController.addListener(() {
      setState(() => _query = _searchController.text);
    });
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final results = await Future.wait([
      _fs.getBooks(),
      _fs.getCategories(),
    ]);
    if (mounted) {
      setState(() {
        _allBooks = results[0] as List<FirestoreBook>;
        _categories = results[1] as List<FirestoreCategory>;
        _loading = false;
      });
    }
  }

  List<FirestoreBook> get _filteredBooks {
    var books = List<FirestoreBook>.from(_allBooks);

    if (_query.isNotEmpty) {
      books = books
          .where((b) =>
              b.title.toLowerCase().contains(_query.toLowerCase()) ||
              b.author.toLowerCase().contains(_query.toLowerCase()) ||
              b.category.toLowerCase().contains(_query.toLowerCase()))
          .toList();
    }

    if (_selectedCategory != 'All') {
      books = books
          .where((b) =>
              b.category.toLowerCase() == _selectedCategory.toLowerCase())
          .toList();
    }

    switch (_sortBy) {
      case 'A-Z':
        books.sort((a, b) => a.title.compareTo(b.title));
      case 'Z-A':
        books.sort((a, b) => b.title.compareTo(a.title));
      case 'Newest':
        books.sort((a, b) => (b.createdAt ?? DateTime(0))
            .compareTo(a.createdAt ?? DateTime(0)));
      default:
        break;
    }
    return books;
  }

  List<String> get _categoryFilters {
    final cats = ['All', ..._categories.map((c) => c.name)];
    // also add any unique categories from books not in categories list
    for (final b in _allBooks) {
      if (!cats.contains(b.category)) cats.add(b.category);
    }
    return cats;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredBooks;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Explore'),
        actions: [
          IconButton(
            icon: Icon(_isGridView ? Icons.list_rounded : Icons.grid_view_rounded),
            onPressed: () => setState(() => _isGridView = !_isGridView),
            tooltip: _isGridView ? 'List view' : 'Grid view',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: Column(
          children: [
            // ── Search Bar ────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(
                  AppTheme.spaceMd, AppTheme.spaceSm,
                  AppTheme.spaceMd, AppTheme.spaceSm),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search books, topics, authors...',
                  prefixIcon: const Icon(Icons.search_rounded),
                  suffixIcon: _query.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _query = '');
                          },
                        )
                      : null,
                  filled: true,
                  border: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(AppTheme.radiusFull),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),

            // ── Category Filter ───────────────────────────
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spaceMd),
                itemCount: _categoryFilters.length,
                separatorBuilder: (_, __) =>
                    const SizedBox(width: AppTheme.spaceXs),
                itemBuilder: (context, i) {
                  final cat = _categoryFilters[i];
                  final selected = cat == _selectedCategory;
                  return FilterChip(
                    label: Text(cat),
                    selected: selected,
                    onSelected: (_) =>
                        setState(() => _selectedCategory = cat),
                    selectedColor: AppColors.primaryDark,
                    labelStyle: AppTypography.labelSmall.copyWith(
                      color: selected ? Colors.white : null,
                    ),
                    checkmarkColor: Colors.white,
                  );
                },
              ),
            ),

            // ── Sort + Result count ───────────────────────
            if (!_loading)
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spaceMd, vertical: 6),
                child: Row(
                  children: [
                    Text(
                      '${filtered.length} books found',
                      style: AppTypography.bodySmall.copyWith(
                          color: Theme.of(context)
                              .colorScheme
                              .onSurface
                              .withValues(alpha: 0.6)),
                    ),
                    const Spacer(),
                    DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _sortBy,
                        isDense: true,
                        items: ['Newest', 'A-Z', 'Z-A']
                            .map((s) => DropdownMenuItem(
                                value: s, child: Text(s)))
                            .toList(),
                        onChanged: (v) =>
                            setState(() => _sortBy = v ?? 'Newest'),
                      ),
                    ),
                  ],
                ),
              ),

            const Padding(
              padding: EdgeInsets.only(bottom: AppTheme.spaceSm),
              child: AdBannerWidget(),
            ),
            const Divider(height: 1),

            // ── Book Grid / List ──────────────────────────
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text('📭',
                                  style: TextStyle(fontSize: 48)),
                              const SizedBox(height: 12),
                              Text(
                                _allBooks.isEmpty
                                    ? 'No books yet\nAdd books from admin panel'
                                    : 'No results for "$_query"',
                                textAlign: TextAlign.center,
                                style: AppTypography.bodyMedium,
                              ),
                            ],
                          ),
                        )
                      : _isGridView
                          ? _buildGrid(filtered)
                          : _buildList(filtered),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGrid(List<FirestoreBook> books) {
    return GridView.builder(
      padding: const EdgeInsets.all(AppTheme.spaceMd),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.60,
        crossAxisSpacing: AppTheme.spaceSm,
        mainAxisSpacing: AppTheme.spaceSm,
      ),
      itemCount: books.length,
      itemBuilder: (context, i) => _BookGridCard(
        book: books[i],
        onTap: () => context.push('/book/${books[i].id}'),
      ),
    );
  }

  Widget _buildList(List<FirestoreBook> books) {
    return ListView.separated(
      padding: const EdgeInsets.all(AppTheme.spaceMd),
      itemCount: books.length,
      separatorBuilder: (_, __) =>
          const SizedBox(height: AppTheme.spaceSm),
      itemBuilder: (context, i) => _BookListCard(
        book: books[i],
        onTap: () => context.push('/book/${books[i].id}'),
      ),
    );
  }
}

// ── Book Grid Card ─────────────────────────────────────────

class _BookGridCard extends StatelessWidget {
  final FirestoreBook book;
  final VoidCallback onTap;
  const _BookGridCard({required this.book, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          border: Border.all(color: theme.dividerColor.withValues(alpha: 0.5)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover
            Expanded(
              child: SizedBox(
                width: double.infinity,
                child: FirestoreBookCover(
                  book: book,
                  fontSize: 44,
                  borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(AppTheme.radiusMd)),
                ),
              ),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    book.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.labelSmall,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    book.author,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.bodySmall.copyWith(
                        color: theme.colorScheme.onSurface
                            .withValues(alpha: 0.5)),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primaryDark.withValues(alpha: 0.12),
                      borderRadius:
                          BorderRadius.circular(AppTheme.radiusFull),
                    ),
                    child: Text(
                      book.category,
                      style: AppTypography.labelSmall.copyWith(
                          color: AppColors.primaryDark, fontSize: 10),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Book List Card ─────────────────────────────────────────

class _BookListCard extends StatelessWidget {
  final FirestoreBook book;
  final VoidCallback onTap;
  const _BookListCard({required this.book, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppTheme.radiusMd),
      child: Container(
        padding: const EdgeInsets.all(AppTheme.spaceMd),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          border: Border.all(color: theme.dividerColor.withValues(alpha: 0.5)),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 56,
              height: 72,
              child: FirestoreBookCover(
                book: book,
                fontSize: 26,
                borderRadius: BorderRadius.circular(AppTheme.radiusSm),
              ),
            ),
            const SizedBox(width: AppTheme.spaceMd),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(book.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.labelMedium),
                  const SizedBox(height: 2),
                  Text(book.author,
                      style: AppTypography.bodySmall.copyWith(
                          color: theme.colorScheme.onSurface
                              .withValues(alpha: 0.5))),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color:
                              AppColors.primaryDark.withValues(alpha: 0.12),
                          borderRadius:
                              BorderRadius.circular(AppTheme.radiusFull),
                        ),
                        child: Text(book.category,
                            style: AppTypography.labelSmall.copyWith(
                                color: AppColors.primaryDark, fontSize: 10)),
                      ),
                      if (book.pages > 0) ...[
                        const SizedBox(width: 6),
                        Text('${book.pages}p',
                            style: AppTypography.bodySmall.copyWith(
                                color: theme.colorScheme.onSurface
                                    .withValues(alpha: 0.4))),
                      ],
                    ],
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
