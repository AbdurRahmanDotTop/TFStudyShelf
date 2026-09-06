import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/firestore_service.dart';
import '../../../core/models/book_qna.dart';
import 'dart:convert';
import '../../../core/services/download_service.dart';
import '../../../core/services/network_service.dart';
import '../../../core/services/ad_service.dart';
import '../../../core/network/api_service.dart';
import '../../../core/services/reward_ad_manager.dart';

/// Book Detail Page — Real Firestore data, save to shelf, reading progress
class BookDetailPage extends StatefulWidget {
  final String bookId;
  const BookDetailPage({super.key, required this.bookId});

  @override
  State<BookDetailPage> createState() => _BookDetailPageState();
}

class _BookDetailPageState extends State<BookDetailPage> {
  final _fs = FirestoreService.instance;
  FirestoreBook? _book;
  double _progress = 0.0;
  bool _isSaved = false;
  bool _loading = true;
  bool _savingShelf = false;
  bool _isDownloading = false;
  double? _downloadProgress;
  List<BookQnA> _qnaList = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final results = await Future.wait([
      _fs.getBook(widget.bookId),
      _fs.getBookProgress(widget.bookId),
      _fs.shelfBookIdsStream().first.catchError((_) => <String>[]),
      _fs.getBookQnAs(widget.bookId),
    ]);

    if (mounted) {
      setState(() {
        _book = results[0] as FirestoreBook?;
        _progress = results[1] as double;
        final shelfIds = results[2] as List<String>;
        _isSaved = shelfIds.contains(widget.bookId);
        _qnaList = results[3] as List<BookQnA>;
        _loading = false;
      });
    }
  }

  Future<void> _toggleShelf() async {
    setState(() => _savingShelf = true);
    if (_isSaved) {
      await _fs.removeFromShelf(widget.bookId);
    } else {
      await _fs.addToShelf(widget.bookId);
    }
    if (mounted) {
      setState(() {
        _isSaved = !_isSaved;
        _savingShelf = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content:
            Text(_isSaved ? '✅ Saved to shelf' : '🗑️ Removed from shelf'),
        duration: const Duration(seconds: 2),
      ));
    }
  }

  List<dynamic>? _fetchedChapters;

  Future<void> _openBook() async {
    final hasReward = await RewardAdManager.instance.hasActiveReward(widget.bookId);
    if (!hasReward) {
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (c) => AlertDialog(
            title: const Text('Ad Required'),
            content: const Text('इस book को पढ़ने के लिए आपको एक short video ad देखना होगा। Ad देखने के बाद आप इस book को पढ़ सकेंगे।'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(c),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () {
                  Navigator.pop(c);
                  _showRewardedAdAndGrantAccess();
                },
                child: const Text('Watch Ad'),
              ),
            ],
          ),
        );
      }
      return;
    }

    _showReadingModeDialog();
  }

  void _showRewardedAdAndGrantAccess() {
    AdService.instance.showRewardedAdWithCallback(
      () async {
        await RewardAdManager.instance.grantReward(widget.bookId);
        _showReadingModeDialog();
      },
      () {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
              content: Text('Ad closed early. Access not granted.')));
        }
      },
    );
  }

  Future<void> _showReadingModeDialog() async {
    if (mounted) {
      showDialog(
        context: context,
        builder: (c) => AlertDialog(
          title: const Text('Read Book'),
          content: const Text('Do you want to read online or offline?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(c);
                _handleOnlineReading();
              },
              child: const Text('Online'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(c);
                _handleOfflineReading();
              },
              child: const Text('Offline'),
            ),
          ],
        ),
      );
    }
  }

  Future<void> _handleOnlineReading() async {
    final hasInternet = await NetworkService.instance.isConnected();
    if (!hasInternet) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Please enable your internet connection to access this content.')));
      }
      return;
    }

    if (_progress == 0.0) {
      await _fs.updateBookProgress(widget.bookId, 0.05);
      if (mounted) setState(() => _progress = 0.05);
    }

    _startStructuredReading();
  }

  Future<void> _handleOfflineReading() async {
    final offlineChapters = await DownloadService.instance.getOfflineChapters(widget.bookId);
    if (offlineChapters != null) {
      if (_progress == 0.0) {
        await _fs.updateBookProgress(widget.bookId, 0.05);
        if (mounted) setState(() => _progress = 0.05);
      }
      _startStructuredReading();
      return;
    }

    final hasInternet = await NetworkService.instance.isConnected();
    if (!hasInternet) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Please enable your internet connection to access this content.')));
      }
      return;
    }

    if (_progress == 0.0) {
      await _fs.updateBookProgress(widget.bookId, 0.05);
      if (mounted) setState(() => _progress = 0.05);
    }

    _startDownload();
  }

  Future<void> _startDownload() async {
    if (mounted) {
      setState(() {
        _isDownloading = true;
        _downloadProgress = null; // Indeterminate
      });
    }
    try {
      final res = await ApiService().getChapters(widget.bookId);
      if (res.statusCode == 200 && res.data != null) {
        dynamic responseData = res.data;
        List<dynamic> dataList = [];
        if (responseData is Map && responseData.containsKey('data')) {
          dataList = responseData['data'] as List<dynamic>;
        } else if (responseData is List) {
          dataList = responseData;
        }
        await DownloadService.instance.saveOfflineChapters(widget.bookId, jsonEncode(dataList));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to download chapters.')));
      }
    }
    
    if (mounted) {
      setState(() => _isDownloading = false);
      _startStructuredReading();
    }
  }

  void _startStructuredReading() {
    context.push(Uri(
      path: '/structured-reader',
      queryParameters: {'bookId': widget.bookId, 'title': _book!.title},
    ).toString());
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_loading) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_book == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Book Not Found')),
        body: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('📭', style: TextStyle(fontSize: 48)),
              SizedBox(height: 12),
              Text('This book was not found in the database'),
            ],
          ),
        ),
      );
    }

    final book = _book!;

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, _) => [
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            stretch: true,
            leading: IconButton(
              icon: Container(
                decoration: const BoxDecoration(
                    color: Colors.black26, shape: BoxShape.circle),
                padding: const EdgeInsets.all(6),
                child:
                    const Icon(Icons.arrow_back_rounded, color: Colors.white),
              ),
              onPressed: () => context.pop(),
            ),
            actions: [
              IconButton(
                icon: Container(
                  decoration: const BoxDecoration(
                      color: Colors.black26, shape: BoxShape.circle),
                  padding: const EdgeInsets.all(6),
                  child: _savingShelf
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : Icon(
                          _isSaved
                              ? Icons.bookmark_rounded
                              : Icons.bookmark_border_rounded,
                          color: Colors.white,
                        ),
                ),
                onPressed: _savingShelf ? null : _toggleShelf,
                tooltip: _isSaved ? 'Remove from shelf' : 'Save to shelf',
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(gradient: AppColors.gradientPrimary),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 60),
                      if (book.url != null && book.url!.isNotEmpty)
                        Container(
                          height: 160,
                          decoration: BoxDecoration(
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 5))
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                            child: Image.network(book.url!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Text(book.emoji ?? book.title[0].toUpperCase(), style: const TextStyle(fontSize: 80))),
                          ),
                        )
                      else
                        Text(book.emoji ?? book.title[0].toUpperCase(),
                            style: const TextStyle(fontSize: 80)),
                      const SizedBox(height: 8),
                      if (book.pages > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius:
                                BorderRadius.circular(AppTheme.radiusFull),
                          ),
                          child: Text('${book.pages} pages',
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 12)),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(AppTheme.spaceLg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title + Author
              Text(book.title,
                  style: AppTypography.headline,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis),
              const SizedBox(height: 4),
              Text(book.author,
                  style: AppTypography.bodyMedium.copyWith(
                      color: theme.colorScheme.onSurface
                          .withValues(alpha: 0.6))),
              const SizedBox(height: AppTheme.spaceMd),

              // Category + Language chips
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  _Chip(label: book.category, color: theme.colorScheme.primary),
                  _Chip(label: book.language, color: Colors.blue),
                  if (book.status == 'published')
                    const _Chip(label: '✅ Published', color: Colors.green),
                ],
              ),
              const SizedBox(height: AppTheme.spaceLg),

              // Reading Progress (if any)
              if (_progress > 0) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Reading Progress', style: AppTypography.labelMedium),
                    Text('${(_progress * 100).toInt()}%',
                        style: AppTypography.labelMedium
                            .copyWith(color: AppColors.accent)),
                  ],
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: _progress,
                  backgroundColor: AppColors.accent.withValues(alpha: 0.15),
                  color: AppColors.accent,
                  minHeight: 6,
                  borderRadius: BorderRadius.circular(AppTheme.radiusFull),
                ),
                const SizedBox(height: AppTheme.spaceLg),
              ],

              // Description
              if (book.description != null && book.description!.isNotEmpty) ...[
                Text('About this Book', style: AppTypography.labelLarge),
                const SizedBox(height: AppTheme.spaceSm),
                Text(book.description!,
                    style: AppTypography.bodyMedium.copyWith(
                        color: theme.colorScheme.onSurface
                            .withValues(alpha: 0.75),
                        height: 1.6)),
                const SizedBox(height: AppTheme.spaceLg),
              ],

              // Details
              _DetailRow(icon: Icons.menu_book_rounded,
                  label: 'Pages', value: book.pages > 0 ? '${book.pages}' : 'N/A'),
              _DetailRow(icon: Icons.language_rounded,
                  label: 'Language', value: book.language),
              _DetailRow(icon: Icons.category_rounded,
                  label: 'Category', value: book.category),
              if (book.createdAt != null)
                _DetailRow(icon: Icons.calendar_today_rounded,
                    label: 'Added', value: _formatDate(book.createdAt!)),

              const SizedBox(height: AppTheme.spaceXl),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _isDownloading ? null : _openBook,
                      icon: _isDownloading 
                        ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: theme.colorScheme.onPrimary))
                        : const Icon(Icons.menu_book_rounded),
                      label: Text(
                          _isDownloading ? 'Downloading...' 
                          : _progress > 0 ? 'Continue Reading' : 'Start Reading'),
                      style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  OutlinedButton.icon(
                    onPressed: _savingShelf ? null : _toggleShelf,
                    icon: Icon(_isSaved
                        ? Icons.bookmark_remove_rounded
                        : Icons.bookmark_add_rounded),
                    label: Text(_isSaved ? 'Saved' : 'Save'),
                    style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                            vertical: 14, horizontal: 20)),
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.spaceXl),

              // Q&A Section
              if (_qnaList.isNotEmpty) ...[
                const Divider(height: 48, thickness: 1),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primaryDark.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.help_outline_rounded, color: AppColors.primaryDark, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Text('Questions & Answers', style: AppTypography.titleLarge),
                  ],
                ),
                const SizedBox(height: AppTheme.spaceLg),
                ..._qnaList.map((q) => Container(
                      margin: const EdgeInsets.only(bottom: AppTheme.spaceMd),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surface,
                        border: Border.all(color: theme.colorScheme.outline.withOpacity(0.15)),
                        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.3),
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(AppTheme.radiusLg)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Q: ', style: AppTypography.labelMedium.copyWith(color: AppColors.primaryDark, fontWeight: FontWeight.w900)),
                                Expanded(child: Text(q.question, style: AppTypography.labelMedium.copyWith(fontWeight: FontWeight.w600))),
                              ],
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('A: ', style: AppTypography.bodyMedium.copyWith(color: AppColors.accent, fontWeight: FontWeight.w900)),
                                Expanded(child: Text(q.answer, style: AppTypography.bodyMedium.copyWith(
                                  color: theme.colorScheme.onSurface.withOpacity(0.85),
                                  height: 1.5,
                                ))),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )),
              ],
              
              SizedBox(height: MediaQuery.of(context).padding.bottom + 24),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  const _Chip({super.key, required this.label, required this.color});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppTheme.radiusFull),
      ),
      child: Text(label,
          style: AppTypography.labelSmall.copyWith(color: color, fontSize: 11)),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _DetailRow(
      {super.key, required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon,
              size: 18,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.5)),
          const SizedBox(width: 10),
          Text(label,
              style: AppTypography.bodyMedium.copyWith(
                  color:
                      theme.colorScheme.onSurface.withValues(alpha: 0.6))),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value,
              style: AppTypography.labelSmall,
              textAlign: TextAlign.right,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
