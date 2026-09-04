/**
 * TF Study Shelf — Admin Chapters Page
 */
const AdminChapters = (() => {

  let currentBookId = null;

  async function render(container) {
    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">Chapters</h1>
          <p class="admin-page-header__subtitle">Manage book chapters</p>
        </div>
      </div>

      <div class="card mb-lg">
        <h3 class="text-title-medium mb-sm">Select Book</h3>
        <select id="book-selector" class="form-input" onchange="AdminChapters.onBookSelected(this.value)">
          <option value="">-- Select a Book --</option>
        </select>
      </div>

      <div id="chapters-container" class="hidden">
        <div class="flex items-center justify-between mb-md">
          <h3 class="text-title-large">Chapters List</h3>
          <button class="btn btn-sm btn-primary" onclick="AdminChapters.showCreateChapterForm()">
            <span class="material-symbols-outlined" style="font-size:16px">add</span> Add Chapter
          </button>
        </div>
        
        <div id="create-chapter-form" class="card mb-md hidden">
          <div class="flex gap-sm mb-sm">
            <input type="number" id="new-chapter-order" class="form-input" placeholder="Order (e.g. 1)" style="width: 100px;">
            <input type="text" id="new-chapter-title" class="form-input" placeholder="Chapter title" style="flex:1">
          </div>
          <div class="flex gap-sm">
            <button class="btn btn-primary btn-sm" onclick="AdminChapters.createChapter()">Save</button>
            <button class="btn btn-ghost btn-sm" onclick="document.getElementById('create-chapter-form').classList.add('hidden')">Cancel</button>
          </div>
        </div>
        
        <div id="chapters-list">
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
    const container = document.getElementById('chapters-container');
    if (!bookId) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');
    loadChapters();
  }

  async function loadChapters() {
    const listEl = document.getElementById('chapters-list');
    listEl.innerHTML = '<div class="loading-overlay" style="min-height:100px"><div class="spinner spinner-sm"></div></div>';
    try {
      const res = await ApiClient.admin.getChapters(currentBookId);
      const chapters = res.data || [];
      
      if (chapters.length === 0) {
        listEl.innerHTML = `<div class="empty-state" style="padding:var(--space-xl)"><p class="empty-state__message">No chapters yet</p></div>`;
        return;
      }

      listEl.innerHTML = chapters.map(c => `
        <div class="card card-hover mb-sm flex items-center justify-between" style="padding:12px 16px">
          <div>
            <div class="text-label-large">Chapter ${c.order}: ${c.title}</div>
          </div>
          <div>
            <button class="btn btn-ghost btn-sm" style="color:var(--error)" onclick="AdminChapters.deleteChapter('${c.id}')">Delete</button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state"><p class="empty-state__message text-error">Failed to load chapters</p></div>`;
    }
  }

  function showCreateChapterForm() {
    document.getElementById('create-chapter-form').classList.remove('hidden');
    document.getElementById('new-chapter-order').focus();
  }

  async function createChapter() {
    const title = document.getElementById('new-chapter-title').value.trim();
    const order = parseInt(document.getElementById('new-chapter-order').value.trim());
    if (!title || isNaN(order)) { Toast.error('Title and Order are required'); return; }
    
    try {
      await ApiClient.admin.createChapter(currentBookId, { title, order });
      Toast.success('Chapter added');
      document.getElementById('create-chapter-form').classList.add('hidden');
      document.getElementById('new-chapter-title').value = '';
      document.getElementById('new-chapter-order').value = '';
      loadChapters();
    } catch (err) { Toast.error(err.message); }
  }

  async function deleteChapter(chapterId) {
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    try {
      await ApiClient.admin.deleteChapter(currentBookId, chapterId);
      Toast.success('Chapter deleted');
      loadChapters();
    } catch (err) { Toast.error(err.message); }
  }

  return { render, onBookSelected, showCreateChapterForm, createChapter, deleteChapter };
})();
