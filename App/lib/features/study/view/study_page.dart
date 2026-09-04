import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/content_models.dart';

/// Study Page — Quizzes, Flashcards, Q&A tabs
class StudyPage extends StatefulWidget {
  const StudyPage({super.key});

  @override
  State<StudyPage> createState() => _StudyPageState();
}

class _StudyPageState extends State<StudyPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Study Hub'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.quiz_rounded), text: 'Quiz'),
            Tab(icon: Icon(Icons.style_rounded), text: 'Flashcards'),
            Tab(icon: Icon(Icons.help_outline_rounded), text: 'Q&A'),
          ],
          labelColor: AppColors.accent,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppColors.accent,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _QuizTab(),
          _FlashcardsTab(),
          _QATab(),
        ],
      ),
    );
  }
}

// ── Quiz Tab ─────────────────────────────────────────

class _QuizTab extends StatefulWidget {
  const _QuizTab();

  @override
  State<_QuizTab> createState() => _QuizTabState();
}

class _QuizTabState extends State<_QuizTab> {
  bool _quizStarted = false;
  int _current = 0;
  int? _selected;
  int _score = 0;
  bool _showResult = false;

  final _questions = [
    {
      'q': "Newton's First Law is also known as the law of:",
      'options': ['Acceleration', 'Inertia', 'Gravity', 'Momentum'],
      'answer': 1,
    },
    {
      'q': 'What is the SI unit of force?',
      'options': ['Pascal', 'Joule', 'Newton', 'Watt'],
      'answer': 2,
    },
    {
      'q': 'Which of these is a scalar quantity?',
      'options': ['Force', 'Velocity', 'Speed', 'Acceleration'],
      'answer': 2,
    },
    {
      'q': 'The rate of change of displacement is called:',
      'options': ['Speed', 'Acceleration', 'Velocity', 'Distance'],
      'answer': 2,
    },
    {
      'q': 'Energy cannot be created or destroyed — this is:',
      'options': [
        'Newton\'s 2nd Law',
        'Conservation of Momentum',
        'Conservation of Energy',
        'Ohm\'s Law'
      ],
      'answer': 2,
    },
  ];

  void _selectAnswer(int index) {
    if (_selected != null) return;
    setState(() => _selected = index);
    if (index == _questions[_current]['answer'] as int) {
      _score++;
    }
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) {
        if (_current < _questions.length - 1) {
          setState(() {
            _current++;
            _selected = null;
          });
        } else {
          setState(() => _showResult = true);
        }
      }
    });
  }

  void _restart() => setState(() {
        _current = 0;
        _selected = null;
        _score = 0;
        _showResult = false;
        _quizStarted = false;
      });

  @override
  Widget build(BuildContext context) {
    if (!_quizStarted) return _StartScreen(onStart: () => setState(() => _quizStarted = true));
    if (_showResult) return _ResultScreen(score: _score, total: _questions.length, onRetry: _restart);
    return _QuizQuestion(
      question: _questions[_current],
      current: _current,
      total: _questions.length,
      selected: _selected,
      onSelect: _selectAnswer,
    );
  }
}

class _StartScreen extends StatelessWidget {
  final VoidCallback onStart;
  const _StartScreen({required this.onStart});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spaceXl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                gradient: AppColors.gradientPrimary,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.quiz_rounded,
                  color: Colors.white, size: 48),
            ),
            const SizedBox(height: AppTheme.spaceLg),
            Text('Physics Quiz', style: AppTypography.displaySmall),
            const SizedBox(height: AppTheme.spaceSm),
            Text(
              '5 multiple-choice questions\nTest your knowledge of physics fundamentals',
              style: AppTypography.bodyLarge.copyWith(
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.6),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppTheme.spaceXl),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onStart,
                child: const Text('Start Quiz'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuizQuestion extends StatelessWidget {
  final Map<String, dynamic> question;
  final int current;
  final int total;
  final int? selected;
  final ValueChanged<int> onSelect;

  const _QuizQuestion({
    required this.question,
    required this.current,
    required this.total,
    required this.selected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final options = question['options'] as List<String>;
    final answer = question['answer'] as int;

    return Padding(
      padding: const EdgeInsets.all(AppTheme.spaceLg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Progress
          Row(
            children: [
              Text('${current + 1} / $total', style: AppTypography.labelMedium),
              const SizedBox(width: AppTheme.spaceSm),
              Expanded(
                child: LinearProgressIndicator(
                  value: (current + 1) / total,
                  color: AppColors.accent,
                  backgroundColor: AppColors.accentSubtle,
                  minHeight: 6,
                  borderRadius: BorderRadius.circular(AppTheme.radiusFull),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.space2Xl),
          // Question
          Text('Question ${current + 1}',
              style: AppTypography.labelMedium
                  .copyWith(color: AppColors.accent)),
          const SizedBox(height: AppTheme.spaceSm),
          Text(question['q'] as String, style: AppTypography.titleLarge),
          const SizedBox(height: AppTheme.spaceXl),
          // Options
          ...List.generate(options.length, (i) {
            Color? bg;
            Color? border;
            if (selected != null) {
              if (i == answer) {
                bg = AppColors.success.withValues(alpha: 0.1);
                border = AppColors.success;
              } else if (i == selected && selected != answer) {
                bg = AppColors.error.withValues(alpha: 0.1);
                border = AppColors.error;
              }
            }
            return Padding(
              padding: const EdgeInsets.only(bottom: AppTheme.spaceSm),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                decoration: BoxDecoration(
                  color: bg ?? Theme.of(context).colorScheme.surface,
                  border: Border.all(
                      color: border ??
                          Theme.of(context).dividerColor,
                      width: border != null ? 2 : 1),
                  borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                ),
                child: InkWell(
                  onTap: () => onSelect(i),
                  borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                  child: Padding(
                    padding: const EdgeInsets.all(AppTheme.spaceMd),
                    child: Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: selected != null && i == answer
                                ? AppColors.success
                                : selected != null && i == selected
                                    ? AppColors.error
                                    : AppColors.accentSubtle,
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              ['A', 'B', 'C', 'D'][i],
                              style: TextStyle(
                                color: selected != null &&
                                        (i == answer || i == selected)
                                    ? Colors.white
                                    : AppColors.accent,
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: AppTheme.spaceMd),
                        Expanded(
                          child: Text(options[i],
                              style: AppTypography.bodyMedium),
                        ),
                        if (selected != null && i == answer)
                          const Icon(Icons.check_circle_rounded,
                              color: AppColors.success)
                        else if (selected != null && i == selected)
                          const Icon(Icons.cancel_rounded,
                              color: AppColors.error),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _ResultScreen extends StatelessWidget {
  final int score;
  final int total;
  final VoidCallback onRetry;
  const _ResultScreen(
      {required this.score, required this.total, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final pct = score / total;
    final emoji = pct >= 0.8 ? '🎉' : pct >= 0.5 ? '👍' : '📚';
    final msg = pct >= 0.8
        ? 'Excellent work!'
        : pct >= 0.5
            ? 'Good effort!'
            : 'Keep practising!';
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spaceXl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 80)),
            const SizedBox(height: AppTheme.spaceMd),
            Text(msg, style: AppTypography.displaySmall),
            const SizedBox(height: AppTheme.spaceSm),
            Text(
              'You scored $score out of $total',
              style: AppTypography.bodyLarge.copyWith(
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.6),
              ),
            ),
            const SizedBox(height: AppTheme.spaceLg),
            SizedBox(
              width: 120,
              height: 120,
              child: Stack(
                children: [
                  CircularProgressIndicator(
                    value: pct,
                    strokeWidth: 10,
                    color: AppColors.accent,
                    backgroundColor:
                        AppColors.accent.withValues(alpha: 0.15),
                  ),
                  Center(
                    child: Text(
                      '${(pct * 100).toInt()}%',
                      style: AppTypography.headline,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppTheme.space2Xl),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                  onPressed: onRetry, child: const Text('Try Again')),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Flashcards Tab ───────────────────────────────────

class _FlashcardsTab extends StatefulWidget {
  const _FlashcardsTab();

  @override
  State<_FlashcardsTab> createState() => _FlashcardsTabState();
}

class _FlashcardsTabState extends State<_FlashcardsTab>
    with SingleTickerProviderStateMixin {
  final _cards = Flashcard.demoFlashcards;
  int _index = 0;
  bool _flipped = false;
  late AnimationController _flipController;
  late Animation<double> _flipAnim;

  @override
  void initState() {
    super.initState();
    _flipController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _flipAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _flipController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _flipController.dispose();
    super.dispose();
  }

  void _flip() {
    if (_flipped) {
      _flipController.reverse();
    } else {
      _flipController.forward();
    }
    setState(() => _flipped = !_flipped);
  }

  void _next() {
    if (_index < _cards.length - 1) {
      _flipController.reset();
      setState(() {
        _index++;
        _flipped = false;
      });
    }
  }

  void _prev() {
    if (_index > 0) {
      _flipController.reset();
      setState(() {
        _index--;
        _flipped = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final card = _cards[_index];
    return Padding(
      padding: const EdgeInsets.all(AppTheme.spaceXl),
      child: Column(
        children: [
          // Progress dots
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              _cards.length,
              (i) => AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: _index == i ? 20 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: _index == i
                      ? AppColors.accent
                      : AppColors.accent.withValues(alpha: 0.25),
                  borderRadius:
                      BorderRadius.circular(AppTheme.radiusFull),
                ),
              ),
            ),
          ),
          const SizedBox(height: AppTheme.spaceMd),
          Text('${_index + 1} of ${_cards.length}',
              style: AppTypography.bodySmall.copyWith(
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.5),
              )),
          const SizedBox(height: AppTheme.spaceLg),

          // Flip card
          Expanded(
            child: GestureDetector(
              onTap: _flip,
              child: AnimatedBuilder(
                animation: _flipAnim,
                builder: (_, __) {
                  final isFront = _flipAnim.value < 0.5;
                  return Transform(
                    transform: Matrix4.identity()
                      ..setEntry(3, 2, 0.001)
                      ..rotateY(_flipAnim.value * 3.14159),
                    alignment: Alignment.center,
                    child: Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: isFront
                            ? AppColors.gradientPrimary
                            : const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [Color(0xFF1A1A1A), Color(0xFF2A2A2A)],
                              ),
                        borderRadius:
                            BorderRadius.circular(AppTheme.radiusXl),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.accent.withValues(alpha: 0.2),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Stack(
                        children: [
                          Center(
                            child: Padding(
                              padding: const EdgeInsets.all(AppTheme.spaceXl),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    isFront ? 'FRONT' : 'BACK',
                                    style: TextStyle(
                                      color: Colors.white
                                          .withValues(alpha: 0.5),
                                      fontSize: 11,
                                      letterSpacing: 2,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  const SizedBox(height: AppTheme.spaceLg),
                                  Transform(
                                    transform: isFront
                                        ? Matrix4.identity()
                                        : (Matrix4.identity()
                                          ..rotateY(3.14159)),
                                    alignment: Alignment.center,
                                    child: Text(
                                      isFront ? card.front : card.back,
                                      style: isFront
                                          ? AppTypography.headline.copyWith(
                                              color: Colors.white)
                                          : AppTypography.bodyLarge.copyWith(
                                              color: Colors.white,
                                              height: 1.6),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 16,
                            right: 16,
                            child: Icon(
                              Icons.touch_app_rounded,
                              color: Colors.white.withValues(alpha: 0.4),
                              size: 20,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: AppTheme.spaceLg),

          // Tap hint
          Text('Tap card to flip',
              style: AppTypography.bodySmall.copyWith(
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.4),
              )),
          const SizedBox(height: AppTheme.spaceMd),

          // Navigation
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              OutlinedButton.icon(
                onPressed: _index > 0 ? _prev : null,
                icon: const Icon(Icons.arrow_back_rounded, size: 16),
                label: const Text('Prev'),
              ),
              const SizedBox(width: AppTheme.spaceLg),
              ElevatedButton.icon(
                onPressed: _index < _cards.length - 1 ? _next : null,
                icon: const Text('Next'),
                label: const Icon(Icons.arrow_forward_rounded, size: 16),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Q&A Tab ──────────────────────────────────────────

class _QATab extends StatelessWidget {
  const _QATab();

  @override
  Widget build(BuildContext context) {
    final questions = Question.demoQuestions;
    return ListView.separated(
      padding: const EdgeInsets.all(AppTheme.spaceMd),
      itemCount: questions.length,
      separatorBuilder: (_, __) =>
          const SizedBox(height: AppTheme.spaceSm),
      itemBuilder: (context, i) => _ExpandableQA(q: questions[i]),
    );
  }
}

class _ExpandableQA extends StatefulWidget {
  final Question q;
  const _ExpandableQA({required this.q});

  @override
  State<_ExpandableQA> createState() => _ExpandableQAState();
}

class _ExpandableQAState extends State<_ExpandableQA> {
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: () => setState(() => _open = !_open),
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spaceMd),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.accentSubtle,
                      borderRadius:
                          BorderRadius.circular(AppTheme.radiusFull),
                    ),
                    child: Text('Q',
                        style: AppTypography.labelSmall
                            .copyWith(color: AppColors.accent)),
                  ),
                  const SizedBox(width: AppTheme.spaceSm),
                  Expanded(
                    child: Text(widget.q.questionText,
                        style: AppTypography.labelMedium),
                  ),
                  Icon(
                    _open
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    color: Theme.of(context)
                        .colorScheme
                        .onSurface
                        .withValues(alpha: 0.4),
                  ),
                ],
              ),
              AnimatedCrossFade(
                firstChild: const SizedBox.shrink(),
                secondChild: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: AppTheme.spaceMd),
                    Container(
                      padding: const EdgeInsets.all(AppTheme.spaceMd),
                      decoration: BoxDecoration(
                        color: AppColors.accentSubtle,
                        borderRadius:
                            BorderRadius.circular(AppTheme.radiusSm),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.accent,
                              borderRadius: BorderRadius.circular(
                                  AppTheme.radiusFull),
                            ),
                            child: Text('A',
                                style: AppTypography.labelSmall
                                    .copyWith(color: Colors.white)),
                          ),
                          const SizedBox(width: AppTheme.spaceSm),
                          Expanded(
                            child: Text(
                              widget.q.answerText,
                              style: AppTypography.bodyMedium
                                  .copyWith(height: 1.6),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                crossFadeState: _open
                    ? CrossFadeState.showSecond
                    : CrossFadeState.showFirst,
                duration: const Duration(milliseconds: 250),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
