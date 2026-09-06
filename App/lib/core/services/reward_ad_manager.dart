import 'package:shared_preferences/shared_preferences.dart';
import 'package:logger/logger.dart';

class RewardAdManager {
  static final RewardAdManager instance = RewardAdManager._();
  RewardAdManager._();

  final _logger = Logger();
  static const String _adKeyPrefix = 'ad_reward_';
  static const int _rewardDurationHours = 24;

  /// Checks if the user has an active reward for the given content ID (Book/Course).
  Future<bool> hasActiveReward(String contentId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final expiryTimeStr = prefs.getString('$_adKeyPrefix$contentId');
      
      if (expiryTimeStr == null) return false;

      final expiryTime = DateTime.parse(expiryTimeStr);
      return DateTime.now().isBefore(expiryTime);
    } catch (e) {
      _logger.e('Error checking reward status for $contentId: $e');
      return false;
    }
  }

  /// Grants a reward (access) for the given content ID for 24 hours.
  Future<void> grantReward(String contentId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final expiryTime = DateTime.now().add(const Duration(hours: _rewardDurationHours));
      
      await prefs.setString('$_adKeyPrefix$contentId', expiryTime.toIso8601String());
      _logger.i('Granted 24-hour reward access for content: $contentId. Expires at: $expiryTime');
    } catch (e) {
      _logger.e('Error granting reward for $contentId: $e');
    }
  }

  /// Resets (removes) the reward for testing purposes.
  Future<void> resetReward(String contentId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('$_adKeyPrefix$contentId');
  }
}
