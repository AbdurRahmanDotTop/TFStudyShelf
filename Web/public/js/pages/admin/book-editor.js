/**
 * TF Study Shelf — Admin Book Editor
 */
window.AdminBookEditor = (() => {
  let editingBookId = null;
  let categories = [];
  let subjects = [];

  async function render(container, params = {}) {
    editingBookId = params.id || null;
    const isEdit = !!editingBookId;

    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">${isEdit ? 'Edit Book' : 'Add New Book'}</h1>
          <p class="admin-page-header__subtitle">${isEdit ? 'Update book information and settings' : 'Fill in the book details to add it to your catalog'}</p>
        </div>
        <div class="admin-page-header__actions">
          <button class="btn btn-ghost" onclick="AdminApp.navigate('books')">Cancel</button>
          <button class="btn btn-secondary" id="save-draft-btn" onclick="AdminBookEditor.save('DRAFT')">Save as Draft</button>
          <button class="btn btn-primary" id="save-publish-btn" onclick="AdminBookEditor.save('PUBLISHED')">
            <span class="material-symbols-outlined" style="font-size:18px">publish</span> Save & Publish
          </button>
        </div>
      </div>

      <div class="editor-form" id="book-editor-form">
        <!-- Basic Info -->
        <div class="editor-form__section">
          <h3 class="editor-form__section-title">📘 Basic Information</h3>
          <div class="editor-form__row">
            <div class="form-group">
              <label class="form-label" for="book-title">Title *</label>
              <input type="text" id="book-title" class="form-input" placeholder="Enter book title" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="book-author">Author *</label>
              <input type="text" id="book-author" class="form-input" placeholder="Author name">
            </div>
            <div class="form-group">
              <label class="form-label" for="book-emoji">Emoji Icon</label>
              <input type="text" id="book-emoji" class="form-input" placeholder="📘">
            </div>
            <div class="form-group flex items-center mt-md">
              <label class="checkbox-label mt-sm">
                <input type="checkbox" id="book-is-featured"> Featured Book
              </label>
            </div>
          </div>
          <div class="form-group mt-md">
            <label class="form-label" for="book-description">Description *</label>
            <textarea id="book-description" class="form-input" placeholder="Write a compelling description…" rows="4"></textarea>
          </div>
          <div class="editor-form__row mt-md">
            <div class="form-group">
              <label class="form-label" for="book-language">Language</label>
              <select id="book-language" class="form-input">
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="bn">Bengali</option>
                <option value="te">Telugu</option>
                <option value="ta">Tamil</option>
                <option value="mr">Marathi</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="book-pages">Page Count</label>
              <input type="number" id="book-pages" class="form-input" placeholder="0" min="0">
            </div>
            <div class="form-group">
              <label class="form-label" for="book-difficulty">Difficulty</label>
              <select id="book-difficulty" class="form-input">
                <option value="EASY">Easy</option>
                <option value="MEDIUM" selected>Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="book-read-time">Est. Read Time (min)</label>
              <input type="number" id="book-read-time" class="form-input" placeholder="0" min="0">
            </div>
          </div>
        </div>

        <!-- Content Rights (Mandatory) -->
        <div class="editor-form__section">
          <h3 class="editor-form__section-title">⚖️ Content Rights (Required for Publishing)</h3>
          <div class="editor-form__row">
            <div class="form-group">
              <label class="form-label" for="book-rights-status">Rights Status *</label>
              <select id="book-rights-status" class="form-input">
                <option value="RESTRICTED">Restricted (cannot publish)</option>
                <option value="PUBLIC_DOMAIN">Public Domain</option>
                <option value="OPEN_LICENSE">Open License</option>
                <option value="AUTHORIZED">Authorized</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="book-license-name">License Name</label>
              <input type="text" id="book-license-name" class="form-input" placeholder="e.g., CC BY 4.0, MIT">
            </div>
          </div>
          <div class="editor-form__row mt-md">
            <div class="form-group">
              <label class="form-label" for="book-license-source">License Source URL</label>
              <input type="url" id="book-license-source" class="form-input" placeholder="https://...">
            </div>
            <div class="form-group">
              <label class="form-label" for="book-rights-holder">Rights Holder</label>
              <input type="text" id="book-rights-holder" class="form-input" placeholder="Name or organization">
            </div>
          </div>
          <div class="form-group mt-md">
            <label class="form-label" for="book-permission-ref">Permission Reference</label>
            <textarea id="book-permission-ref" class="form-input" placeholder="Link or description of permission documentation" rows="2"></textarea>
          </div>
          <div class="flex gap-lg mt-md" style="flex-wrap:wrap">
            <label class="checkbox-label"><input type="checkbox" id="book-allow-download"> Allow Download</label>
            <label class="checkbox-label"><input type="checkbox" id="book-allow-offline"> Allow Offline</label>
            <label class="checkbox-label"><input type="checkbox" id="book-allow-share"> Allow Share</label>
          </div>
        </div>

        <!-- Google Drive / Cover -->
        <div class="editor-form__section">
          <h3 class="editor-form__section-title">📁 Content Files</h3>
          <div class="editor-form__row">
            <div class="form-group">
              <label class="form-label" for="book-pdf-drive-id">PDF Google Drive File ID</label>
              <input type="text" id="book-pdf-drive-id" class="form-input" placeholder="Google Drive file ID">
            </div>
            <div class="form-group">
              <label class="form-label" for="book-cover-url">Cover Image URL</label>
              <input type="url" id="book-cover-url" class="form-input" placeholder="https://...">
            </div>
          </div>
        </div>

        <!-- Categories & Tags -->
        <div class="editor-form__section">
          <h3 class="editor-form__section-title">🏷️ Organization</h3>
          <div class="editor-form__row">
            <div class="form-group">
              <label class="form-label">Categories</label>
              <div id="category-checkboxes" class="flex gap-sm" style="flex-wrap:wrap">
                <span class="text-body-small text-tertiary">Loading categories…</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Subjects</label>
              <div id="subject-checkboxes" class="flex gap-sm" style="flex-wrap:wrap">
                <span class="text-body-small text-tertiary">Loading subjects…</span>
              </div>
            </div>
          </div>
          <div class="form-group mt-md">
            <label class="form-label" for="book-tags">Tags (comma separated)</label>
            <input type="text" id="book-tags" class="form-input" placeholder="physics, mechanics, newton">
          </div>
          <div class="form-group mt-md">
            <label class="form-label" for="book-exam-tags">Exam Tags (comma separated)</label>
            <input type="text" id="book-exam-tags" class="form-input" placeholder="JEE, NEET, UPSC">
          </div>
        </div>

        <!-- Questions & Answers -->
        ${isEdit ? `
        <div class="editor-form__section">
          <div class="flex items-center justify-between">
            <h3 class="editor-form__section-title">❓ Questions & Answers</h3>
            <button class="btn btn-secondary btn-sm" onclick="AdminBookEditor.openQnAModal(); return false;">
              <span class="material-symbols-outlined" style="font-size:16px">add</span> Add Q&A
            </button>
          </div>
          <div id="qna-list" class="mt-md">
            <div class="text-body-small text-tertiary">Loading Questions...</div>
          </div>
        </div>
        ` : `<div class="editor-form__section text-center"><p class="text-tertiary text-body-small">Save the book first to add Questions & Answers.</p></div>`}
      </div>
    `;

    loadFormData(isEdit);
    if (isEdit) loadQnA();
  }

  async function loadQnA() {
    try {
      const result = await ApiClient.admin.getQuestions(editingBookId);
      const qnas = result.data || [];
      const list = document.getElementById('qna-list');
      if (qnas.length === 0) {
        list.innerHTML = '<div class="text-body-small text-tertiary text-center p-md">No questions added yet.</div>';
        return;
      }
      list.innerHTML = qnas.map(q => `
        <div class="card mb-sm p-sm flex items-start justify-between" style="border:1px solid var(--border)">
          <div>
            <div class="text-body-medium" style="font-weight:600">Q: ${escapeHtml(q.question)}</div>
            <div class="text-body-small text-secondary mt-xs">A: ${escapeHtml(q.answer)}</div>
          </div>
          <button class="btn-icon" onclick="AdminBookEditor.deleteQnA('${q.id}'); return false;">
            <span class="material-symbols-outlined" style="color:var(--error)">delete</span>
          </button>
        </div>
      `).join('');
    } catch (e) {
      document.getElementById('qna-list').innerHTML = '<div class="text-error">Failed to load QnA</div>';
    }
  }

  const exports = {};

  exports.openQnAModal = function() {
    Modal.form('Add Q&A', `
      <div class="form-group mb-md">
        <label class="form-label">Question</label>
        <textarea id="qna-question" class="form-input" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Answer</label>
        <textarea id="qna-answer" class="form-input" rows="4"></textarea>
      </div>
    `, async () => {
      const q = document.getElementById('qna-question').value.trim();
      const a = document.getElementById('qna-answer').value.trim();
      if (!q || !a) { Toast.error('Both fields required'); return false; }
      try {
        await ApiClient.admin.createQuestion(editingBookId, { questionText: q, answer: a, questionType: 'SHORT' });
        Toast.success('Q&A added');
        loadQnA();
        return true;
      } catch (err) { Toast.error(err.message); return false; }
    });
  };

  exports.deleteQnA = function(id) {
    Modal.confirm('Delete Q&A', 'Are you sure?', async () => {
      await ApiClient.admin.deleteQuestion(editingBookId, id);
      loadQnA();
    });
  };

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function loadFormData(isEdit) {
    // Load categories and subjects
    try {
      const [catResult, subResult] = await Promise.all([
        ApiClient.getCategories(),
        ApiClient.getSubjects()
      ]);
      categories = catResult.data || [];
      subjects = subResult.data || [];

      document.getElementById('category-checkboxes').innerHTML = categories.length
        ? categories.map(c => `<label class="checkbox-label"><input type="checkbox" value="${c.id}" class="cat-checkbox"> ${c.name}</label>`).join('')
        : '<span class="text-body-small text-tertiary">No categories yet. Add from Categories page.</span>';

      document.getElementById('subject-checkboxes').innerHTML = subjects.length
        ? subjects.map(s => `<label class="checkbox-label"><input type="checkbox" value="${s.id}" class="sub-checkbox"> ${s.name}</label>`).join('')
        : '<span class="text-body-small text-tertiary">No subjects yet. Add from Categories page.</span>';
    } catch (err) {
      console.error('Failed to load categories/subjects:', err);
    }

    // If editing, populate form
    if (isEdit) {
      try {
        const result = await ApiClient.getBook(editingBookId);
        const book = result.data;
        
        document.getElementById('book-title').value = book.title || '';
        document.getElementById('book-author').value = book.author || '';
        document.getElementById('book-emoji').value = book.emoji || '📘';
        document.getElementById('book-description').value = book.description || '';
        document.getElementById('book-language').value = book.language || 'English';
        document.getElementById('book-pages').value = book.page_count || book.pages || '';
        document.getElementById('book-difficulty').value = book.difficulty || 'MEDIUM';
        document.getElementById('book-read-time').value = book.estimated_read_time_minutes || book.estimatedReadTimeMinutes || '';
        document.getElementById('book-rights-status').value = book.rights_status || book.rightsStatus || 'RESTRICTED';
        document.getElementById('book-license-name').value = book.license_name || book.licenseName || '';
        document.getElementById('book-license-source').value = book.license_source || book.licenseSource || '';
        document.getElementById('book-rights-holder').value = book.rights_holder || book.rightsHolder || '';
        document.getElementById('book-permission-ref').value = book.permission_reference || book.permissionReference || '';
        document.getElementById('book-allow-download').checked = !!(book.allowed_download || book.allowedDownload);
        document.getElementById('book-allow-offline').checked = !!(book.allowed_offline || book.allowedOffline);
        document.getElementById('book-allow-share').checked = !!(book.allowed_share || book.allowedShare);
        document.getElementById('book-pdf-drive-id').value = book.pdf_google_drive_id || book.pdfGoogleDriveId || '';
        document.getElementById('book-cover-url').value = book.cover_image_url || book.coverImageUrl || '';
        document.getElementById('book-tags').value = (book.tags || []).join(', ');
        document.getElementById('book-exam-tags').value = (book.examTags || []).join(', ');
        document.getElementById('book-is-featured').checked = (book.featured_order || book.featuredOrder) != null;

        // Check category/subject boxes
        (book.categories || []).map(c => c.id).forEach(id => {
          const cb = document.querySelector(`.cat-checkbox[value="${id}"]`);
          if (cb) cb.checked = true;
        });
        (book.subjects || []).map(s => s.id).forEach(id => {
          const cb = document.querySelector(`.sub-checkbox[value="${id}"]`);
          if (cb) cb.checked = true;
        });
      } catch (err) {
        Toast.error('Failed to load book: ' + err.message);
      }
    }
  }

  async function save(status) {
    const title = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const description = document.getElementById('book-description').value.trim();

    if (!title || !author || !description) {
      Toast.error('Title, author, and description are required.');
      return;
    }

    const rightsStatus = document.getElementById('book-rights-status').value;
    if (status === 'PUBLISHED' && rightsStatus === 'RESTRICTED') {
      Toast.error('Cannot publish a book with RESTRICTED rights status.');
      return;
    }

    const saveDraftBtn = document.getElementById('save-draft-btn');
    const savePublishBtn = document.getElementById('save-publish-btn');
    if (saveDraftBtn) { saveDraftBtn.disabled = true; saveDraftBtn.textContent = 'Saving...'; }
    if (savePublishBtn) { savePublishBtn.disabled = true; savePublishBtn.innerHTML = 'Saving...'; }

    const body = {
      title,
      author,
      description,
      emoji: document.getElementById('book-emoji').value.trim() || '📘',
      language: document.getElementById('book-language').value,
      pages: parseInt(document.getElementById('book-pages').value) || 0,
      pageCount: parseInt(document.getElementById('book-pages').value) || 0,
      difficulty: document.getElementById('book-difficulty').value,
      estimatedReadTimeMinutes: parseInt(document.getElementById('book-read-time').value) || 0,
      rightsStatus: rightsStatus,
      licenseName: document.getElementById('book-license-name').value || null,
      licenseSource: document.getElementById('book-license-source').value || null,
      rightsHolder: document.getElementById('book-rights-holder').value || null,
      permissionReference: document.getElementById('book-permission-ref').value || null,
      allowedDownload: document.getElementById('book-allow-download').checked,
      allowedOffline: document.getElementById('book-allow-offline').checked,
      allowedShare: document.getElementById('book-allow-share').checked,
      pdfGoogleDriveId: document.getElementById('book-pdf-drive-id').value || null,
      coverImageUrl: document.getElementById('book-cover-url').value || '',
      tags: document.getElementById('book-tags').value.split(',').map(s => s.trim()).filter(Boolean),
      examTags: document.getElementById('book-exam-tags').value.split(',').map(s => s.trim()).filter(Boolean),
      categoryIds: [...document.querySelectorAll('.cat-checkbox:checked')].map(cb => cb.value),
      category: [...document.querySelectorAll('.cat-checkbox:checked')].length > 0 ? document.querySelectorAll('.cat-checkbox:checked')[0].nextSibling.textContent.trim() : 'General',
      subjectIds: [...document.querySelectorAll('.sub-checkbox:checked')].map(cb => cb.value),
      featuredOrder: document.getElementById('book-is-featured').checked ? 1 : null,
      status,
    };

    try {
      if (editingBookId) {
        await ApiClient.admin.updateBook(editingBookId, body);
        Toast.success('Book updated successfully');
      } else {
        await ApiClient.admin.createBook(body);
        Toast.success('Book created successfully');
      }
      AdminApp.navigate('books');
    } catch (err) {
      Toast.error(err.message);
    } finally {
      if (saveDraftBtn) { saveDraftBtn.disabled = false; saveDraftBtn.textContent = 'Save as Draft'; }
      if (savePublishBtn) { savePublishBtn.disabled = false; savePublishBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px">publish</span> Save & Publish'; }
    }
  }

  exports.render = render;
  exports.save = save;
  window.AdminBookEditor = exports;
  return exports;
})();
