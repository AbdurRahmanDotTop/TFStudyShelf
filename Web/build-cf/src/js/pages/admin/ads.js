/**
 * TF Study Shelf — Admin Ads Configuration
 */
const AdminAds = (() => {

  async function render(container) {
    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">Ad Configuration</h1>
          <p class="admin-page-header__subtitle">Manage AdMob IDs and toggle ads globally</p>
        </div>
        <div class="admin-page-header__actions">
          <button class="btn btn-primary" id="save-ads-btn" onclick="AdminAds.saveConfig()">
            <span class="material-symbols-outlined" style="font-size:18px">save</span> Save Configuration
          </button>
        </div>
      </div>

      <div class="card mb-lg" id="ads-form-container">
        <div class="loading-overlay" style="min-height: 200px;"><div class="spinner spinner-sm"></div></div>
      </div>
    `;

    loadConfig();
  }

  async function loadConfig() {
    try {
      const res = await ApiClient.admin.getAdsConfig();
      const config = res.data || {};
      
      document.getElementById('ads-form-container').innerHTML = `
        <div class="editor-form__section">
          <div class="flex items-center justify-between mb-md">
            <h3 class="editor-form__section-title mb-0">General Settings</h3>
            <label class="toggle">
              <input type="checkbox" id="enable-ads" ${config.enableAds ? 'checked' : ''}>
              <span class="toggle-slider"></span>
              <span class="ml-xs font-medium">Enable Ads Globally</span>
            </label>
          </div>
        </div>

        <div class="editor-form__section">
          <h3 class="editor-form__section-title">🤖 Android Ad Units</h3>
          <div class="editor-form__row">
            <div class="form-group">
              <label class="form-label" for="android-banner-id">Banner Ad Unit ID</label>
              <input type="text" id="android-banner-id" class="form-input" placeholder="ca-app-pub-..." value="${config.androidBannerId || ''}">
            </div>
            <div class="form-group">
              <label class="form-label" for="android-interstitial-id">Interstitial Ad Unit ID</label>
              <input type="text" id="android-interstitial-id" class="form-input" placeholder="ca-app-pub-..." value="${config.androidInterstitialId || ''}">
            </div>
            <div class="form-group">
              <label class="form-label" for="android-rewarded-id">Rewarded Ad Unit ID</label>
              <input type="text" id="android-rewarded-id" class="form-input" placeholder="ca-app-pub-..." value="${config.androidRewardedId || ''}">
            </div>
          </div>
        </div>

        <div class="editor-form__section">
          <h3 class="editor-form__section-title">🍎 iOS Ad Units</h3>
          <div class="editor-form__row">
            <div class="form-group">
              <label class="form-label" for="ios-banner-id">Banner Ad Unit ID</label>
              <input type="text" id="ios-banner-id" class="form-input" placeholder="ca-app-pub-..." value="${config.iosBannerId || ''}">
            </div>
            <div class="form-group">
              <label class="form-label" for="ios-interstitial-id">Interstitial Ad Unit ID</label>
              <input type="text" id="ios-interstitial-id" class="form-input" placeholder="ca-app-pub-..." value="${config.iosInterstitialId || ''}">
            </div>
            <div class="form-group">
              <label class="form-label" for="ios-rewarded-id">Rewarded Ad Unit ID</label>
              <input type="text" id="ios-rewarded-id" class="form-input" placeholder="ca-app-pub-..." value="${config.iosRewardedId || ''}">
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      document.getElementById('ads-form-container').innerHTML = `
        <div class="empty-state">
          <p class="empty-state__message text-error">Failed to load ad configuration: ${err.message}</p>
        </div>
      `;
    }
  }

  async function saveConfig() {
    const btn = document.getElementById('save-ads-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm" style="border-color:white;border-top-color:transparent;width:16px;height:16px"></span> Saving...';

    const config = {
      enableAds: document.getElementById('enable-ads').checked,
      androidBannerId: document.getElementById('android-banner-id').value.trim(),
      androidInterstitialId: document.getElementById('android-interstitial-id').value.trim(),
      androidRewardedId: document.getElementById('android-rewarded-id').value.trim(),
      iosBannerId: document.getElementById('ios-banner-id').value.trim(),
      iosInterstitialId: document.getElementById('ios-interstitial-id').value.trim(),
      iosRewardedId: document.getElementById('ios-rewarded-id').value.trim(),
      updatedAt: new Date().toISOString()
    };

    try {
      await ApiClient.admin.saveAdsConfig(config);
      Toast.success('Ads configuration saved successfully');
    } catch (err) {
      Toast.error('Failed to save configuration: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px">save</span> Save Configuration';
    }
  }

  return { render, saveConfig };
})();
