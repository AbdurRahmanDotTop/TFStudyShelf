/**
 * TF Study Shelf — Admin Flashcards Page
 */
window.AdminFlashcards = (() => {

  let currentBookId = null;

  async function render(container) {
    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">Flashcards</h1>
          <p class="admin-page-header__subtitle">Manage flashcard sets for your books</p>
        </div>
      </div>

      <div class="card mb-lg">
        <h3 class="text-title-medium mb-sm">Select Book</h3>
        <select id="book-selector" class="form-input" onchange="AdminFlashcards.onBookSelected(this.value)">
          <option value="">-- Select a Book --</option>
        </select>
      </div>

      <div id="flashcards-container" class="hidden">
        <div class="flex items-center justify-between mb-md">
          <h3 class="text-title-large">Flashcard Sets List</h3>
          <button class="btn btn-sm btn-primary" onclick="AdminFlashcards.showCreateSetModal()">
            <span class="material-symbols-outlined" style="font-size:16px">add</span> Add Set
          </button>
        </div>
        
        <div id="flashcards-list">
          <div class="loading-overlay" style="min-height:100px"><div class="spinner spinner-sm"></div></div>
        </div>
      </div>
    `;

    loadBooks();
  }

  async function loadBooks() {
    try {
      const res = await ApiClient.admin.getBooks({ limit: 100 });
      const select = document.getElementById('book-selector');
      res.data.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = b.title;
        select.appendChild(opt);
      });
    } catch (err) {
      Toast.error('Failed to load books');
    }
  }

  async function onBookSelected(bookId) {
    currentBookId = bookId;
    const container = document.getElementById('flashcards-container');
    if (!bookId) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');
    loadFlashcardSets();
  }

  async function loadFlashcardSets() {
    const listEl = document.getElementById('flashcards-list');
    listEl.innerHTML = '<div class="loading-overlay" style="min-height:100px"><div class="spinner spinner-sm"></div></div>';
    try {
      const res = await ApiClient.admin.getFlashcards(currentBookId);
      const sets = res.data || [];
      
      if (sets.length === 0) {
        listEl.innerHTML = `<div class="empty-state" style="padding:var(--space-xl)"><p class="empty-state__message">No flashcard sets yet</p></div>`;
        return;
      }

      listEl.innerHTML = sets.map((s) => `
        <div class="card mb-sm" style="padding:16px">
          <div class="flex items-start justify-between">
            <div>
              <div class="text-title-medium">${escapeHtml(s.title)}</div>
              ${s.description ? `<div class="text-body-small text-secondary mt-xs">${escapeHtml(s.description)}</div>` : ''}
              <div class="flex gap-sm mt-sm">
                <span class="badge ${s.status === 'PUBLISHED' ? 'badge-success' : 'badge-secondary'}">${s.status}</span>
              </div>
            </div>
            <div class="flex gap-sm">
              <button class="btn btn-ghost btn-sm" onclick="AdminFlashcards.showEditSetModal('${s.id}', '${escapeHtml(s.title.replace(/'/g, "\\'"))}', '${escapeHtml((s.description||'').replace(/'/g, "\\'"))}', '${s.status}')">
                <span class="material-symbols-outlined" style="font-size:18px">edit</span>
              </button>
              <button class="btn btn-ghost btn-sm" style="color:var(--error);" onclick="AdminFlashcards.deleteSet('${s.id}')">
                <span class="material-symbols-outlined" style="font-size:18px">delete</span>
              </button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state"><p class="empty-state__message text-error">Failed to load flashcard sets</p></div>`;
    }
  }

  function getSetFormHtml(title = '', desc = '', status = 'PUBLISHED') {
    return `
      <div class="form-group mb-sm">
        <label class="form-label">Title *</label>
        <input type="text" id="set-title" class="form-input" placeholder="e.g. Chapter 1 Vocabulary" value="${title}" required>
      </div>
      <div class="form-group mb-sm">
        <label class="form-label">Description</label>
        <textarea id="set-desc" class="form-input" rows="2" placeholder="Optional description...">${desc}</textarea>
      </div>
      <div class="form-group mb-sm">
        <label class="form-label">Status</label>
        <select id="set-status" class="form-input">
          <option value="DRAFT" ${status === 'DRAFT' ? 'selected' : ''}>Draft</option>
          <option value="PUBLISHED" ${status === 'PUBLISHED' ? 'selected' : ''}>Published</option>
        </select>
      </div>
    `;
  }

  function showCreateSetModal() {
    Modal.form('Create Flashcard Set', getSetFormHtml(), async () => {
      const title = document.getElementById('set-title').value.trim();
      const desc = document.getElementById('set-desc').value.trim();
      const status = document.getElementById('set-status').value;

      if (!title) {
        Toast.error('Title is required');
        return false;
      }

      try {
        await ApiClient.admin.createFlashcardSet(currentBookId, {
          title, description: desc, status
        });
        Toast.success('Flashcard set created');
        loadFlashcardSets();
        return true;
      } catch (err) {
        Toast.error(err.message);
        return false;
      }
    });
  }

  function showEditSetModal(id, title, desc, status) {
    Modal.form('Edit Flashcard Set', getSetFormHtml(title, desc, status), async () => {
      const newTitle = document.getElementById('set-title').value.trim();
      const newDesc = document.getElementById('set-desc').value.trim();
      const newStatus = document.getElementById('set-status').value;

      if (!newTitle) {
        Toast.error('Title is required');
        return false;
      }

      try {
        await ApiClient.admin.updateFlashcardSet(currentBookId, id, {
          title: newTitle, description: newDesc, status: newStatus
        });
        Toast.success('Flashcard set updated');
        loadFlashcardSets();
        return true;
      } catch (err) {
        Toast.error(err.message);
        return false;
      }
    });
  }

  function deleteSet(id) {
    Modal.confirm('Delete Set', 'Are you sure you want to delete this flashcard set?', async () => {
      try {
        await ApiClient.admin.deleteFlashcardSet(currentBookId, id);
        Toast.success('Flashcard set deleted');
        loadFlashcardSets();
      } catch (err) {
        Toast.error(err.message);
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { render, onBookSelected, showCreateSetModal, showEditSetModal, deleteSet };
})();
