import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/book.dart';
import '../../../core/models/content_models.dart';
import '../../../core/widgets/ad_banner_widget.dart';

/// In-App Book Reader — chapter text with font/spacing controls
class ReaderPage extends StatefulWidget {
  final String bookId;
  const ReaderPage({super.key, required this.bookId});

  State<ReaderPage> createState() => _ReaderPageState();
}

class _ReaderPageState extends State<ReaderPage> {
  String _bookTitle = 'Loading...';

  @override
  void initState() {
    super.initState();
    _loadBook();
  }

  Future<void> _loadBook() async {
    final book = await FirestoreService.instance.getBook(widget.bookId);
    if (mounted && book != null) {
      setState(() {
        _bookTitle = book.title;
      });
    } else if (mounted) {
      setState(() {
        _bookTitle = 'Book Title';
      });
    }
  }

  List<Chapter> get _chapters => Chapter.demoChapters(widget.bookId);

  int _currentChapter = 0;
  double _fontSize = 16.0;
  double _lineHeight = 1.7;
  bool _showControls = true;
  bool _nightMode = false;

  static const _sampleContent = '''
Learning is a fundamental process that allows us to acquire new knowledge, skills, behaviors, and values. It is the foundation upon which all human progress is built. From the earliest stages of childhood, we are constantly absorbing information from our environment, making connections, and building mental models of how the world works.

The process of reading, in particular, has been one of the most powerful tools for human development. Through books, we can access the accumulated wisdom of centuries past, explore ideas from great thinkers across cultures, and develop our own capacity for critical thought.

Research in cognitive science has shown that deep reading — the kind that involves sustained attention and reflective thinking — actually reshapes neural pathways in our brains. This is fundamentally different from the quick scanning we do online. Deep reading promotes empathy, analytical thinking, and the ability to understand complex arguments.

When we engage with a text, we are not passively receiving information. We are actively constructing meaning, making inferences, and connecting new ideas to our existing knowledge. This active engagement is what makes reading such a powerful tool for learning.

The best readers are strategic readers. They know when to slow down and carefully analyze a difficult passage, and when they can read more quickly. They ask questions as they read, make predictions, and monitor their own comprehension.

As you work through this material, take time to reflect on what you are reading. Ask yourself: What is the main idea here? How does this connect to what I already know? What questions does this raise for me? This kind of active engagement will help you get much more out of your reading.

The chapters ahead will guide you through core concepts with carefully constructed explanations and examples. Each section builds on the previous, so it is important to ensure you have a solid understanding before moving forward.

Take notes, highlight important passages, and don't hesitate to re-read sections that are unclear. Learning is not a linear process — sometimes we need to revisit material multiple times before it truly sinks in.
''';

  void _toggleControls() => setState(() => _showControls = !_showControls);

  @override
  Widget build(BuildContext context) {
    final chapter = _chapters[_currentChapter];
    final bg = _nightMode ? const Color(0xFF1A1A1A) : Theme.of(context).scaffoldBackgroundColor;
    final textColor = _nightMode ? const Color(0xFFCCCCCC) : Theme.of(context).colorScheme.onSurface;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: _nightMode
          ? SystemUiOverlayStyle.light
          : SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: bg,
        body: GestureDetector(
          onTap: _toggleControls,
          child: Stack(
            children: [
              // ── Reading Content ─────────────────────
              SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(
                  AppTheme.spaceXl,
                  MediaQuery.of(context).padding.top + 80,
                  AppTheme.spaceXl,
                  120,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Chapter ${chapter.chapterNumber}: ${chapter.title}',
                      style: AppTypography.displaySmall.copyWith(
                        color: textColor,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spaceSm),
                    Row(
                      children: [
                        Icon(Icons.access_time_rounded,
                            size: 14,
                            color: textColor.withValues(alpha: 0.4)),
                        const SizedBox(width: 4),
                        Text(
                          '~${chapter.estimatedMinutes} min read',
                          style: AppTypography.bodySmall
                              .copyWith(color: textColor.withValues(alpha: 0.4)),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppTheme.spaceXl),
                    Text(
                      _sampleContent,
                      style: TextStyle(
                        fontSize: _fontSize,
                        height: _lineHeight,
                        color: textColor,
                        fontFamily: 'Manrope',
                      ),
                    ),
                    const SizedBox(height: AppTheme.spaceXl),
                    const AdBannerWidget(),
                  ],
                ),
              ),

              // ── Top bar ─────────────────────────────
              AnimatedSlide(
                offset: _showControls ? Offset.zero : const Offset(0, -1),
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOut,
                child: AnimatedOpacity(
                  opacity: _showControls ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 200),
                  child: Container(
                    decoration: BoxDecoration(
                      color: bg.withValues(alpha: 0.95),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    child: SafeArea(
                      bottom: false,
                      child: Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.arrow_back_rounded),
                            onPressed: () => context.pop(),
                          ),
                          Expanded(
                            child: Text(
                              _bookTitle,
                              style: AppTypography.labelLarge,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          IconButton(
                            icon: Icon(
                              _nightMode
                                  ? Icons.light_mode_rounded
                                  : Icons.dark_mode_rounded,
                            ),
                            onPressed: () =>
                                setState(() => _nightMode = !_nightMode),
                          ),
                          IconButton(
                            icon: const Icon(Icons.bookmark_outline_rounded),
                            onPressed: () {},
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // ── Bottom controls ──────────────────────
              AnimatedSlide(
                offset:
                    _showControls ? Offset.zero : const Offset(0, 1),
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOut,
                child: AnimatedOpacity(
                  opacity: _showControls ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 200),
                  child: Align(
                    alignment: Alignment.bottomCenter,
                    child: Container(
                      padding: EdgeInsets.fromLTRB(
                        AppTheme.spaceMd,
                        AppTheme.spaceSm,
                        AppTheme.spaceMd,
                        MediaQuery.of(context).padding.bottom +
                            AppTheme.spaceSm,
                      ),
                      decoration: BoxDecoration(
                        color: bg.withValues(alpha: 0.95),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 12,
                            offset: const Offset(0, -2),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Chapter navigation
                          Row(
                            mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,
                            children: [
                              TextButton.icon(
                                onPressed: _currentChapter > 0
                                    ? () => setState(
                                        () => _currentChapter--)
                                    : null,
                                icon: const Icon(
                                    Icons.arrow_back_ios_rounded,
                                    size: 14),
                                label: const Text('Prev'),
                              ),
                              Text(
                                'Ch ${_currentChapter + 1} / ${_chapters.length}',
                                style: AppTypography.labelMedium,
                              ),
                              TextButton.icon(
                                onPressed: _currentChapter <
                                        _chapters.length - 1
                                    ? () => setState(
                                        () => _currentChapter++)
                                    : null,
                                icon: const Text('Next'),
                                label: const Icon(
                                    Icons.arrow_forward_ios_rounded,
                                    size: 14),
                              ),
                            ],
                          ),
                          // Font size and line spacing
                          Row(
                            children: [
                              const Icon(Icons.text_fields_rounded,
                                  size: 16, color: AppColors.accent),
                              Expanded(
                                child: Slider(
                                  value: _fontSize,
                                  min: 12,
                                  max: 24,
                                  divisions: 12,
                                  activeColor: AppColors.accent,
                                  onChanged: (v) =>
                                      setState(() => _fontSize = v),
                                ),
                              ),
                              const Icon(Icons.format_line_spacing_rounded,
                                  size: 16, color: AppColors.accent),
                              Expanded(
                                child: Slider(
                                  value: _lineHeight,
                                  min: 1.3,
                                  max: 2.2,
                                  divisions: 9,
                                  activeColor: AppColors.accent,
                                  onChanged: (v) =>
                                      setState(() => _lineHeight = v),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
