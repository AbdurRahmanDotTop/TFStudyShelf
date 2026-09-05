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
  double _downloadProgress = 0.0;
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
    ]);

    if (mounted) {
      setState(() {
        _book = results[0] as FirestoreBook?;
        _progress = results[1] as double;
        final shelfIds = results[2] as List<String>;
        _isSaved = shelfIds.contains(widget.bookId);
        _loading = false;
      });
      
      _fs.getBookQnAs(widget.bookId).listen((qna) {
        if (mounted) setState(() => _qnaList = qna);
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
  bool _hasStructuredContent = false;
  List<dynamic> _fetchedChapters = [];

  Future<void> _openBook() async {
    setState(() => _isDownloading = true);
    
    // Check if we have structured chapters first
    try {
      final res = await ApiService().getChapters(widget.bookId);
      if (res.statusCode == 200 && (res.data as List).isNotEmpty) {
        _hasStructuredContent = true;
        _fetchedChapters = res.data;
      }
    } catch (e) {
      // Ignore
    }
    
    if (mounted) setState(() => _isDownloading = false);

    if (!_hasStructuredContent && (_book?.pdfDriveId == null || _book!.pdfDriveId!.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('⚠️ No content or PDF link available for this book')));
      return;
    }

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
            content: Text('Please turn on your internet connectivity to read this book online.')));
      }
      return;
    }

    if (_progress == 0.0) {
      await _fs.updateBookProgress(widget.bookId, 0.05);
      if (mounted) setState(() => _progress = 0.05);
    }

    if (_hasStructuredContent) {
      _startStructuredReading();
      return;
    }

    setState(() {
      _isDownloading = true;
      _downloadProgress = 0.0;
    });

    final directDownloadUrl = 'https://drive.google.com/uc?export=download&id=${_book!.pdfDriveId!}';
    final path = await DownloadService.instance.downloadPdfOnline(
      widget.bookId,
      directDownloadUrl,
      (received, total) {
        if (total != -1 && mounted) {
          setState(() {
            _downloadProgress = received / total;
          });
        }
      },
    );

    if (mounted) {
      setState(() => _isDownloading = false);
      if (path != null) {
        _startPdfReading(path);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Could not open book online. Opening in browser...')));
        launchUrl(Uri.parse('https://drive.google.com/file/d/${_book!.pdfDriveId!}/view'), mode: LaunchMode.externalApplication);
      }
    }
  }

  Future<void> _handleOfflineReading() async {
    if (_hasStructuredContent) {
      final offlineChapters = await DownloadService.instance.getOfflineChapters(widget.bookId);
      if (offlineChapters != null) {
        if (_progress == 0.0) {
          await _fs.updateBookProgress(widget.bookId, 0.05);
          if (mounted) setState(() => _progress = 0.05);
        }
        _startStructuredReading();
        return;
      }
    } else {
      final downloadedPath = await DownloadService.instance.getDownloadedPdfPath(widget.bookId);
      if (downloadedPath != null) {
        if (_progress == 0.0) {
          await _fs.updateBookProgress(widget.bookId, 0.05);
          if (mounted) setState(() => _progress = 0.05);
        }
        _startPdfReading(downloadedPath);
        return;
      }
    }

    final hasInternet = await NetworkService.instance.isConnected();
    if (!hasInternet) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Internet connection is required to download this book for offline reading.')));
      }
      return;
    }

    if (_progress == 0.0) {
      await _fs.updateBookProgress(widget.bookId, 0.05);
      if (mounted) setState(() => _progress = 0.05);
    }

    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (c) => AlertDialog(
          title: const Text('Download for Offline'),
          content: const Text('Watch a short video ad to download and read this book offline for 24 hours.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(c),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(c);
                _showRewardedAdAndDownload();
              },
              child: const Text('Watch Ad'),
            ),
          ],
        ),
      );
    }
  }

  void _showRewardedAdAndDownload() {
    setState(() {
      _isDownloading = true;
      _downloadProgress = 0.0;
    });
    
    AdService.instance.showRewardedAdWithCallback(
      () {
        // Reward earned, start download
        _startDownload();
      },
      () {
        // Ad closed
        if (!_isDownloading) return; // Means already downloading
        // If they closed early, we can check if reward was earned, 
        // but callback handles it. We'll just reset if it wasn't triggered.
        // Actually, we should trigger download ONLY in onUserEarnedReward.
        // If this runs and download hasn't started, we reset.
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted && _downloadProgress == 0.0) {
            setState(() => _isDownloading = false);
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                content: Text('Ad closed early. Download cancelled.')));
          }
        });
      },
    );
  }

  Future<void> _startDownload() async {
    if (_hasStructuredContent) {
      setState(() {
        _isDownloading = true;
        _downloadProgress = null; // Indeterminate
      });
      await DownloadService.instance.saveOfflineChapters(widget.bookId, jsonEncode(_fetchedChapters));
      
      // We could also download images here, but caching via CachedNetworkImage might be enough if viewed while downloading
      
      if (mounted) {
        setState(() => _isDownloading = false);
        _startStructuredReading();
      }
      return;
    }

    final directDownloadUrl = 'https://drive.google.com/uc?export=download&id=${_book!.pdfDriveId!}';
    final path = await DownloadService.instance.downloadPdf(
      widget.bookId,
      directDownloadUrl,
      (received, total) {
        if (total != -1 && mounted) {
          setState(() {
            _downloadProgress = received / total;
          });
        }
      },
    );

    if (mounted) {
      setState(() => _isDownloading = false);
      if (path != null) {
        _startPdfReading(path);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Could not download PDF directly. Opening in browser...')));
        launchUrl(Uri.parse('https://drive.google.com/file/d/${_book!.pdfDriveId!}/view'), mode: LaunchMode.externalApplication);
      }
    }
  }

  void _startPdfReading(String path) {
    context.push(Uri(
      path: '/pdf-reader',
      queryParameters: {'title': _book!.title, 'path': path},
    ).toString());
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
                  _Chip(label: book.category, color: AppColors.primaryDark),
                  _Chip(label: book.language, color: AppColors.accent),
                  if (book.status == 'published')
                    _Chip(label: '✅ Published', color: Colors.green),
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
                          _isDownloading ? 'Downloading ${(_downloadProgress * 100).toInt()}%' 
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
                Text('Questions & Answers', style: AppTypography.labelLarge),
                const SizedBox(height: AppTheme.spaceSm),
                ..._qnaList.map((q) => Container(
                      margin: const EdgeInsets.only(bottom: AppTheme.spaceMd),
                      padding: const EdgeInsets.all(AppTheme.spaceMd),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                        border: Border.all(color: theme.colorScheme.outline.withValues(alpha: 0.1)),
                        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Q: ', style: AppTypography.labelMedium.copyWith(color: AppColors.primaryDark)),
                              Expanded(child: Text(q.question, style: AppTypography.labelMedium)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('A: ', style: AppTypography.bodyMedium.copyWith(color: AppColors.accent, fontWeight: FontWeight.bold)),
                              Expanded(child: Text(q.answer, style: AppTypography.bodyMedium.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.8)))),
                            ],
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
  const _Chip({required this.label, required this.color});
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
      {required this.icon, required this.label, required this.value});

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
          const Spacer(),
          Text(value, style: AppTypography.labelSmall),
        ],
      ),
    );
  }
}
