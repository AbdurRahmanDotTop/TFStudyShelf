/**
 * TF Study Shelf — Modal Manager
 */
window.Modal = (() => {
  const overlay = () => document.getElementById('modal-overlay');
  const content = () => document.getElementById('modal-content');

  function show(html) {
    content().innerHTML = html;
    overlay().classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay().classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { content().innerHTML = ''; }, 300);
  }

  function confirm(title, message, onConfirm, confirmText = 'Confirm', confirmClass = 'btn-danger') {
    show(`
      <div class="modal__header">
        <h3 class="modal__title">${title}</h3>
        <button class="modal__close" onclick="Modal.close()">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <p style="color:var(--text-secondary);margin-bottom:var(--space-lg)">${message}</p>
      <div class="modal__actions">
        <button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>
        <button class="btn ${confirmClass}" id="modal-confirm-btn">${confirmText}</button>
      </div>
    `);

    document.getElementById('modal-confirm-btn').addEventListener('click', () => {
      close();
      if (onConfirm) onConfirm();
    });
  }

  // Close on overlay click
  document.addEventListener('click', (e) => {
    if (e.target === overlay()) close();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay()?.classList.contains('active')) close();
  });

  function form(title, html, onSave, saveText = 'Save', saveClass = 'btn-primary') {
    show(`
      <div class="modal__header">
        <h3 class="modal__title">${title}</h3>
        <button class="modal__close" onclick="Modal.close()">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="modal__body" style="margin-bottom:var(--space-lg)">
        ${html}
      </div>
      <div class="modal__actions">
        <button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>
        <button class="btn ${saveClass}" id="modal-save-btn">${saveText}</button>
      </div>
    `);

    document.getElementById('modal-save-btn').addEventListener('click', async () => {
      const btn = document.getElementById('modal-save-btn');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;display:inline-block;border-width:2px;border-color:currentColor transparent transparent transparent;"></span>';
      
      try {
        const success = await onSave();
        if (success !== false) {
          close();
        } else {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      } catch(e) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }

  return { show, close, confirm, form };
})();
