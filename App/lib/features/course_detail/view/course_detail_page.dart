import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/network_service.dart';
import '../../../core/services/ad_service.dart';
import '../../../core/services/reward_ad_manager.dart';

class CourseDetailPage extends StatefulWidget {
  final String courseId;
  const CourseDetailPage({super.key, required this.courseId});

  @override
  State<CourseDetailPage> createState() => _CourseDetailPageState();
}

class _CourseDetailPageState extends State<CourseDetailPage> {
  Future<void> _enrollOrAccessCourse() async {
    final hasInternet = await NetworkService.instance.isConnected();
    if (!hasInternet) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Please enable your internet connection to access this content.')));
      }
      return;
    }

    final hasReward = await RewardAdManager.instance.hasActiveReward(widget.courseId);
    if (!hasReward) {
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (c) => AlertDialog(
            title: const Text('Ad Required'),
            content: const Text('course में enroll/access करने के लिए एक reward video ad देखना आवश्यक है।'),
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

    _accessCourse();
  }

  void _showRewardedAdAndGrantAccess() {
    AdService.instance.showRewardedAdWithCallback(
      () async {
        await RewardAdManager.instance.grantReward(widget.courseId);
        _accessCourse();
      },
      () {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
              content: Text('Ad closed early. Access not granted.')));
        }
      },
    );
  }

  void _accessCourse() {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Course access granted for 24 hours!')));
      // TODO: Navigate to course content player
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Course Detail'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.play_circle_fill_rounded, size: 80, color: Colors.blue),
            const SizedBox(height: 24),
            const Text('Sample Course', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 48),
            FilledButton.icon(
              onPressed: _enrollOrAccessCourse,
              icon: const Icon(Icons.play_arrow_rounded),
              label: const Text('Enroll / Continue Course'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
