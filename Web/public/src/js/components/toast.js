/**
 * TF Study Shelf — Toast Notifications
 */
const Toast = (() => {
  function show(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
    toast.innerHTML = `
      <span class="material-symbols-outlined" style="font-size:20px;flex-shrink:0">${icons[type] || 'info'}</span>
      <span style="flex:1">${message}</span>
      <button class="btn-icon" onclick="this.parentElement.remove()" style="margin-left:8px">
        <span class="material-symbols-outlined" style="font-size:16px">close</span>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  return {
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
    warning: (msg) => show(msg, 'warning'),
    info: (msg) => show(msg, 'info'),
  };
})();
