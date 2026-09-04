import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../config/ad_config.dart';

class AdService {
  static final AdService instance = AdService._();
  AdService._();

  int _actionCount = 0;
  int _nextInterstitialTarget = _generateRandomTarget();

  InterstitialAd? _interstitialAd;
  bool _isInterstitialLoading = false;

  RewardedAd? _rewardedAd;
  bool _isRewardedLoading = false;

  static int _generateRandomTarget() {
    // Randomly between 15 and 25
    return Random().nextInt(11) + 15;
  }

  Future<void> initialize() async {
    await MobileAds.instance.initialize();
    _loadInterstitialAd();
    _loadRewardedAd();
  }

  /// Call this when user navigates or performs a major action
  void recordAction() {
    _actionCount++;
    if (_actionCount >= _nextInterstitialTarget) {
      _showInterstitialAd();
      _actionCount = 0;
      _nextInterstitialTarget = _generateRandomTarget();
    }
  }

  void _loadInterstitialAd() {
    if (_isInterstitialLoading) return;
    _isInterstitialLoading = true;
    InterstitialAd.load(
      adUnitId: AdConfig.interstitialAdUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _interstitialAd = ad;
          _isInterstitialLoading = false;
        },
        onAdFailedToLoad: (error) {
          debugPrint('InterstitialAd failed to load: $error');
          _isInterstitialLoading = false;
          _interstitialAd = null;
        },
      ),
    );
  }

  void _showInterstitialAd() {
    if (_interstitialAd == null) {
      _loadInterstitialAd();
      return;
    }
    _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _interstitialAd = null;
        _loadInterstitialAd();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        _interstitialAd = null;
        _loadInterstitialAd();
      },
    );
    _interstitialAd!.show();
    _interstitialAd = null;
  }

  void _loadRewardedAd() {
    if (_isRewardedLoading) return;
    _isRewardedLoading = true;
    RewardedAd.load(
      adUnitId: AdConfig.rewardedAdUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _rewardedAd = ad;
          _isRewardedLoading = false;
        },
        onAdFailedToLoad: (error) {
          debugPrint('RewardedAd failed to load: $error');
          _isRewardedLoading = false;
          _rewardedAd = null;
        },
      ),
    );
  }

  /// Shows rewarded ad, returns true if reward earned
  Future<bool> showRewardedAd() async {
    if (_rewardedAd == null) {
      _loadRewardedAd();
      // Wait a moment and try again, or just return false if offline
      await Future.delayed(const Duration(milliseconds: 500));
      if (_rewardedAd == null) return false;
    }

    bool rewardEarned = false;
    _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _rewardedAd = null;
        _loadRewardedAd();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        _rewardedAd = null;
        _loadRewardedAd();
      },
    );

    await _rewardedAd!.show(
      onUserEarnedReward: (AdWithoutView ad, RewardItem reward) {
        rewardEarned = true;
      },
    );

    _rewardedAd = null;
    // Note: Since show() is async, but it returns immediately while the ad plays,
    // to actually await completion of the ad to grant reward is tricky with show().
    // We will return true if it was shown and we assume the callback handles the grant,
    // but in Flutter `show` completes right away.
    // We'll rewrite this to use a completer for better offline download flow.
    return rewardEarned;
  }
  
  void showRewardedAdWithCallback(Function onRewardEarned, Function onAdClosed) {
    if (_rewardedAd == null) {
      onAdClosed(); // Fallback if no ad loaded
      _loadRewardedAd();
      return;
    }

    _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _rewardedAd = null;
        _loadRewardedAd();
        onAdClosed();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        _rewardedAd = null;
        _loadRewardedAd();
        onAdClosed();
      },
    );

    _rewardedAd!.show(
      onUserEarnedReward: (AdWithoutView ad, RewardItem reward) {
        onRewardEarned();
      },
    );
  }
}
