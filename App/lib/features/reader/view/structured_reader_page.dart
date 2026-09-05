import 'package:flutter/material.dart';
import 'package:tf_study_shelf/core/models/content_models.dart';
import 'package:tf_study_shelf/core/models/content_block.dart';
import 'package:tf_study_shelf/core/network/api_service.dart';
import 'package:tf_study_shelf/core/services/download_service.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import 'dart:convert';
import 'dart:io';

class StructuredReaderPage extends StatefulWidget {
  final String bookId;
  final String title;

  const StructuredReaderPage({
    super.key,
    required this.bookId,
    required this.title,
  });

  @override
  State<StructuredReaderPage> createState() => _StructuredReaderPageState();
}

class _StructuredReaderPageState extends State<StructuredReaderPage> {
  bool _isLoading = true;
  String _error = '';
  List<Chapter> _chapters = [];
  int _currentChapterIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadChapters();
  }

  Future<void> _loadChapters() async {
    try {
      setState(() {
        _isLoading = true;
        _error = '';
      });

      // 1. Try to load from offline cache first
      final cachedJson = await DownloadService.instance.getOfflineChapters(widget.bookId);
      if (cachedJson != null) {
        final List<dynamic> data = jsonDecode(cachedJson);
        _chapters = data.map((e) => Chapter.fromJson(e)).toList();
      } else {
        // 2. Fetch from network
        final api = ApiService();
        final res = await api.getChapters(widget.bookId);
        if (res.statusCode == 200) {
          final List<dynamic> data = res.data;
          _chapters = data.map((e) => Chapter.fromJson(e)).toList();
          
          // Optionally save to cache here or rely on DownloadService
        } else {
          throw Exception('Failed to load chapters: ${res.statusCode}');
        }
      }

      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _nextChapter() {
    if (_currentChapterIndex < _chapters.length - 1) {
      setState(() {
        _currentChapterIndex++;
      });
    }
  }

  void _prevChapter() {
    if (_currentChapterIndex > 0) {
      setState(() {
        _currentChapterIndex--;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: Text(widget.title),
        centerTitle: true,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error.isNotEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text('Error loading content', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(_error),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadChapters,
              child: const Text('Retry'),
            )
          ],
        ),
      );
    }

    if (_chapters.isEmpty) {
      return const Center(child: Text('No content available for this book.'));
    }

    final chapter = _chapters[_currentChapterIndex];
    final blocks = chapter.parsedContent;

    return Column(
      children: [
        // Chapter Header
        Container(
          padding: const EdgeInsets.all(16),
          color: Theme.of(context).colorScheme.primaryContainer,
          width: double.infinity,
          child: Text(
            'Chapter ${chapter.chapterNumber}: ${chapter.title}',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Theme.of(context).colorScheme.onPrimaryContainer,
            ),
          ),
        ),
        
        // Chapter Content
        Expanded(
          child: blocks.isEmpty
              ? const Center(child: Text('This chapter is empty.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: blocks.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: _buildBlock(blocks[index]),
                    );
                  },
                ),
        ),

        // Navigation Footer
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 5,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton.icon(
                onPressed: _currentChapterIndex > 0 ? _prevChapter : null,
                icon: const Icon(Icons.arrow_back),
                label: const Text('Previous'),
              ),
              Text(
                '${_currentChapterIndex + 1} / ${_chapters.length}',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              TextButton.icon(
                onPressed: _currentChapterIndex < _chapters.length - 1 ? _nextChapter : null,
                icon: const Icon(Icons.arrow_forward),
                label: const Text('Next'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBlock(ContentBlock block) {
    if (block is ParagraphBlock) {
      return Text(
        block.content,
        style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.6),
      );
    } else if (block is HeadingBlock) {
      TextStyle? style;
      if (block.level == 1) style = Theme.of(context).textTheme.headlineMedium;
      else if (block.level == 2) style = Theme.of(context).textTheme.titleLarge;
      else style = Theme.of(context).textTheme.titleMedium;
      
      return Padding(
        padding: const EdgeInsets.only(top: 8.0),
        child: Text(
          block.content,
          style: style?.copyWith(fontWeight: FontWeight.bold),
        ),
      );
    } else if (block is ImageBlock) {
      return CachedNetworkImage(
        imageUrl: block.url,
        placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
        errorWidget: (context, url, error) => Container(
          padding: const EdgeInsets.all(16),
          color: Colors.grey[200],
          child: const Center(child: Icon(Icons.broken_image, color: Colors.grey)),
        ),
      );
    } else if (block is VideoBlock) {
      return _VideoPlayerWidget(url: block.url);
    } else if (block is PdfBlock) {
      return Container(
        height: 400,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(8),
        ),
        // Just show a button to open PDF in a full reader to avoid nested scroll issues
        child: Center(
          child: ElevatedButton.icon(
            icon: const Icon(Icons.picture_as_pdf),
            label: const Text('Open PDF Reference'),
            onPressed: () {
              // TODO: Navigate to PDF view
            },
          ),
        ),
      );
    }
    return const SizedBox.shrink();
  }
}

class _VideoPlayerWidget extends StatefulWidget {
  final String url;
  const _VideoPlayerWidget({required this.url});

  @override
  State<_VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<_VideoPlayerWidget> {
  YoutubePlayerController? _ytController;

  @override
  void initState() {
    super.initState();
    final videoId = YoutubePlayer.convertUrlToId(widget.url);
    if (videoId != null) {
      _ytController = YoutubePlayerController(
        initialVideoId: videoId,
        flags: const YoutubePlayerFlags(
          autoPlay: false,
          mute: false,
        ),
      );
    }
  }

  @override
  void dispose() {
    _ytController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_ytController != null) {
      return YoutubePlayer(
        controller: _ytController!,
        showVideoProgressIndicator: true,
      );
    }
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.grey[200],
      child: const Center(child: Text('Video placeholder (Non-YouTube)')),
    );
  }
}
