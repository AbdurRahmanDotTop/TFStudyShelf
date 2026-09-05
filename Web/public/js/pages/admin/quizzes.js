/**
 * TF Study Shelf — Admin Quizzes Page
 */
window.AdminQuizzes = (() => {

  let currentBookId = null;

  async function render(container) {
    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">Quizzes</h1>
          <p class="admin-page-header__subtitle">Manage quizzes for your books</p>
        </div>
      </div>

      <div class="card mb-lg">
        <h3 class="text-title-medium mb-sm">Select Book</h3>
        <select id="book-selector" class="form-input" onchange="AdminQuizzes.onBookSelected(this.value)">
          <option value="">-- Select a Book --</option>
        </select>
      </div>

      <div id="quizzes-container" class="hidden">
        <div class="flex items-center justify-between mb-md">
          <h3 class="text-title-large">Quizzes List</h3>
          <button class="btn btn-sm btn-primary" onclick="AdminQuizzes.showCreateQuizModal()">
            <span class="material-symbols-outlined" style="font-size:16px">add</span> Add Quiz
          </button>
        </div>
        
        <div id="quizzes-list">
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
    const container = document.getElementById('quizzes-container');
    if (!bookId) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');
    loadQuizzes();
  }

  async function loadQuizzes() {
    const listEl = document.getElementById('quizzes-list');
    listEl.innerHTML = '<div class="loading-overlay" style="min-height:100px"><div class="spinner spinner-sm"></div></div>';
    try {
      const res = await ApiClient.admin.getQuizzes(currentBookId);
      const quizzes = res.data || [];
      
      if (quizzes.length === 0) {
        listEl.innerHTML = `<div class="empty-state" style="padding:var(--space-xl)"><p class="empty-state__message">No quizzes yet</p></div>`;
        return;
      }

      listEl.innerHTML = quizzes.map((q) => `
        <div class="card mb-sm" style="padding:16px">
          <div class="flex items-start justify-between">
            <div>
              <div class="text-title-medium">${escapeHtml(q.title)}</div>
              ${q.description ? `<div class="text-body-small text-secondary mt-xs">${escapeHtml(q.description)}</div>` : ''}
              <div class="flex gap-sm mt-sm">
                <span class="badge badge-secondary">Time: ${q.time_limit_seconds ? q.time_limit_seconds/60 + ' min' : 'None'}</span>
                <span class="badge badge-secondary">Pass: ${q.passing_score_percent}%</span>
                <span class="badge ${q.status === 'PUBLISHED' ? 'badge-success' : 'badge-secondary'}">${q.status}</span>
              </div>
            </div>
            <div class="flex gap-sm">
              <button class="btn btn-ghost btn-sm" onclick="AdminQuizzes.showEditQuizModal('${q.id}', '${escapeHtml(q.title.replace(/'/g, "\\'"))}', '${escapeHtml((q.description||'').replace(/'/g, "\\'"))}', ${q.time_limit_seconds || 0}, ${q.passing_score_percent || 70}, '${q.status}')">
                <span class="material-symbols-outlined" style="font-size:18px">edit</span>
              </button>
              <button class="btn btn-ghost btn-sm" style="color:var(--error);" onclick="AdminQuizzes.deleteQuiz('${q.id}')">
                <span class="material-symbols-outlined" style="font-size:18px">delete</span>
              </button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state"><p class="empty-state__message text-error">Failed to load quizzes</p></div>`;
    }
  }

  function getQuizFormHtml(title = '', desc = '', time = 0, pass = 70, status = 'PUBLISHED') {
    return `
      <div class="form-group mb-sm">
        <label class="form-label">Title *</label>
        <input type="text" id="quiz-title" class="form-input" placeholder="e.g. Chapter 1 Quiz" value="${title}" required>
      </div>
      <div class="form-group mb-sm">
        <label class="form-label">Description</label>
        <textarea id="quiz-desc" class="form-input" rows="2" placeholder="Optional description...">${desc}</textarea>
      </div>
      <div class="grid-2 gap-sm mb-sm">
        <div class="form-group">
          <label class="form-label">Time Limit (seconds)</label>
          <input type="number" id="quiz-time" class="form-input" value="${time}">
        </div>
        <div class="form-group">
          <label class="form-label">Passing Score (%)</label>
          <input type="number" id="quiz-pass" class="form-input" value="${pass}" min="0" max="100">
        </div>
      </div>
      <div class="form-group mb-sm">
        <label class="form-label">Status</label>
        <select id="quiz-status" class="form-input">
          <option value="DRAFT" ${status === 'DRAFT' ? 'selected' : ''}>Draft</option>
          <option value="PUBLISHED" ${status === 'PUBLISHED' ? 'selected' : ''}>Published</option>
        </select>
      </div>
    `;
  }

  function showCreateQuizModal() {
    Modal.form('Create Quiz', getQuizFormHtml(), async () => {
      const title = document.getElementById('quiz-title').value.trim();
      const desc = document.getElementById('quiz-desc').value.trim();
      const time = parseInt(document.getElementById('quiz-time').value) || 0;
      const pass = parseInt(document.getElementById('quiz-pass').value) || 70;
      const status = document.getElementById('quiz-status').value;

      if (!title) {
        Toast.error('Title is required');
        return false;
      }

      try {
        await ApiClient.admin.createQuiz(currentBookId, {
          title, description: desc, timeLimitSeconds: time, passingScorePercent: pass, status
        });
        Toast.success('Quiz created');
        loadQuizzes();
        return true;
      } catch (err) {
        Toast.error(err.message);
        return false;
      }
    });
  }

  function showEditQuizModal(id, title, desc, time, pass, status) {
    Modal.form('Edit Quiz', getQuizFormHtml(title, desc, time, pass, status), async () => {
      const newTitle = document.getElementById('quiz-title').value.trim();
      const newDesc = document.getElementById('quiz-desc').value.trim();
      const newTime = parseInt(document.getElementById('quiz-time').value) || 0;
      const newPass = parseInt(document.getElementById('quiz-pass').value) || 70;
      const newStatus = document.getElementById('quiz-status').value;

      if (!newTitle) {
        Toast.error('Title is required');
        return false;
      }

      try {
        await ApiClient.admin.updateQuiz(currentBookId, id, {
          title: newTitle, description: newDesc, timeLimitSeconds: newTime, passingScorePercent: newPass, status: newStatus
        });
        Toast.success('Quiz updated');
        loadQuizzes();
        return true;
      } catch (err) {
        Toast.error(err.message);
        return false;
      }
    });
  }

  function deleteQuiz(id) {
    Modal.confirm('Delete Quiz', 'Are you sure you want to delete this quiz?', async () => {
      try {
        await ApiClient.admin.deleteQuiz(currentBookId, id);
        Toast.success('Quiz deleted');
        loadQuizzes();
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

  return { render, onBookSelected, showCreateQuizModal, showEditQuizModal, deleteQuiz };
})();
