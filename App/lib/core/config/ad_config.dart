import 'dart:io';

class AdConfig {
  /// Test AdMob App ID (Use this in AndroidManifest.xml for testing)
  /// Android: ca-app-pub-3940256099942544~3347511713
  
  static String get bannerAdUnitId {
    if (Platform.isAndroid) {
      // Test Banner ID
      return 'ca-app-pub-3940256099942544/6300978111';
    } else if (Platform.isIOS) {
      return 'ca-app-pub-3940256099942544/2934735716';
    }
    throw UnsupportedError('Unsupported platform');
  }

  static String get interstitialAdUnitId {
    if (Platform.isAndroid) {
      // Test Interstitial ID
      return 'ca-app-pub-3940256099942544/1033173712';
    } else if (Platform.isIOS) {
      return 'ca-app-pub-3940256099942544/4411468910';
    }
    throw UnsupportedError('Unsupported platform');
  }

  static String get rewardedAdUnitId {
    if (Platform.isAndroid) {
      // Test Rewarded ID
      return 'ca-app-pub-3940256099942544/5224354917';
    } else if (Platform.isIOS) {
      return 'ca-app-pub-3940256099942544/1712467313';
    }
    throw UnsupportedError('Unsupported platform');
  }
}
