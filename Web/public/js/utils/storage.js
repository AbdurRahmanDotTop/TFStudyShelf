/**
 * TF Study Shelf — Local Storage Utility
 */
window.Storage = (() => {
  const PREFIX = 'tfsf_';

  return {
    get(key) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {}
    },
    remove(key) {
      try { localStorage.removeItem(PREFIX + key); } catch {}
    },
    clear() {
      try {
        Object.keys(localStorage)
          .filter(k => k.startsWith(PREFIX))
          .forEach(k => localStorage.removeItem(k));
      } catch {}
    }
  };
})();
