/**
 * TF Study Shelf — Theme Manager
 * Supports System / Light / Dark with persistence
 */
const ThemeManager = (() => {
  const STORAGE_KEY = 'theme';
  const THEMES = ['light', 'dark'];

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme) {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    document.documentElement.setAttribute('data-theme', resolved);
    Storage.set(STORAGE_KEY, theme);
    updateToggleIcon(resolved);
  }

  function toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    apply(current === 'light' ? 'dark' : 'light');
  }

  function updateToggleIcon(resolved) {
    const icons = document.querySelectorAll('#theme-toggle .material-symbols-outlined');
    icons.forEach(icon => {
      icon.textContent = resolved === 'dark' ? 'light_mode' : 'dark_mode';
    });
  }

  function init() {
    const saved = Storage.get(STORAGE_KEY) || 'system';
    apply(saved);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (Storage.get(STORAGE_KEY) === 'system') {
        apply('system');
      }
    });

    // Bind toggle buttons
    document.querySelectorAll('#theme-toggle').forEach(btn => {
      btn.addEventListener('click', toggle);
    });
  }

  return { init, apply, toggle, getSystemTheme };
})();
