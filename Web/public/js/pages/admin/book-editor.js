/**
 * TF Study Shelf — Admin Book Editor
 */
window.AdminBookEditor = (() => {
  let editingBookId = null;
  let currentTab = 'basic';
  let categories = [];
  let subjects = [];

  const tabs = [
    { id: 'basic', icon: 'info', label: 'Basic Info' },
    { id: 'organization', icon: 'category', label: 'Organization' },
    { id: 'rights', icon: 'gavel', label: 'Rights & Access' },
    { id: 'chapters', icon: 'format_list_numbered', label: 'Chapters' },
    { id: 'qna', icon: 'help_outline', label: 'Q&A' },
    { id: 'quizzes', icon: 'quiz', label: 'Quizzes' },
    { id: 'flashcards', icon: 'style', label: 'Flashcards' },
    { id: 'resources', icon: 'folder', label: 'Resources' },
    { id: 'media', icon: 'play_circle', label: 'Media' },
    { id: 'preview', icon: 'preview', label: 'Preview' },
    { id: 'settings', icon: 'settings', label: 'Settings' }
  ];

  async function render(container, params = {}) {
    editingBookId = params.id || null;
    const isEdit = !!editingBookId;

    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">${isEdit ? 'Edit Book' : 'Add New Book'}</h1>
          <p class="admin-page-header__subtitle">Manage the book workspace and all its contextual content</p>
        </div>
        <div class="admin-page-header__actions">
          <button class="btn btn-ghost" onclick="AdminApp.navigate('books')">Cancel</button>
          <button class="btn btn-secondary" id="save-draft-btn" onclick="AdminBookEditor.save('DRAFT')">Save Draft</button>
          <button class="btn btn-primary" id="save-publish-btn" onclick="AdminBookEditor.save('PUBLISHED')">
            <span class="material-symbols-outlined" style="font-size:18px">publish</span> Publish
          </button>
        </div>
      </div>

      <div class="workspace-layout flex gap-lg mt-lg" style="align-items:flex-start">
        <!-- Sidebar Navigation for Workspace -->
        <div class="workspace-sidebar" style="width:240px;flex-shrink:0;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
          <div class="flex flex-col" id="workspace-tabs">
            ${tabs.map(tab => `
              <button class="workspace-tab ${tab.id === currentTab ? 'active' : ''}" data-tab="${tab.id}" style="display:flex;align-items:center;gap:var(--space-sm);padding:var(--space-md) var(--space-lg);border:none;background:transparent;text-align:left;cursor:pointer;font-family:inherit;font-size:14px;color:var(--text-secondary);border-bottom:1px solid var(--border);transition:all 0.2s;">
                <span class="material-symbols-outlined" style="font-size:18px">${tab.icon}</span> ${tab.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Main Workspace Content -->
        <div class="workspace-content" style="flex:1;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--space-xl);">
          <form id="book-editor-form">
            <!-- TAB: Basic -->
            <div id="tab-content-basic" class="workspace-tab-pane ${currentTab === 'basic' ? '' : 'hidden'}">
              <h3 class="mb-lg" style="font-size:18px;font-weight:600">Basic Information</h3>
              <div class="editor-form__row flex gap-md mb-md">
                <div class="form-group flex-1">
                  <label class="form-label" for="book-title">Title *</label>
                  <input type="text" id="book-title" class="form-input" placeholder="Enter book title" required>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label" for="book-author">Author *</label>
                  <input type="text" id="book-author" class="form-input" placeholder="Author name">
                </div>
              </div>
              <div class="editor-form__row flex gap-md mb-md">
                <div class="form-group" style="width:120px">
                  <label class="form-label" for="book-emoji">Emoji Icon</label>
                  <input type="text" id="book-emoji" class="form-input" placeholder="📘">
                </div>
                <div class="form-group flex-1">
                  <label class="form-label" for="book-cover-url">Cover Image URL *</label>
                  <input type="url" id="book-cover-url" class="form-input" placeholder="https://..." required>
                </div>
              </div>
              <div class="form-group mb-md">
                <label class="form-label" for="book-description">Description *</label>
                <textarea id="book-description" class="form-input" placeholder="Write a compelling description…" rows="4"></textarea>
              </div>
              <div class="editor-form__row flex gap-md mb-md">
                <div class="form-group flex-1">
                  <label class="form-label" for="book-language">Language *</label>
                  <select id="book-language" class="form-input"><option value="">Loading...</option></select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label" for="book-pages">Page Count</label>
                  <input type="number" id="book-pages" class="form-input" placeholder="0" min="0">
                </div>
                <div class="form-group flex-1">
                  <label class="form-label" for="book-difficulty">Difficulty</label>
                  <select id="book-difficulty" class="form-input">
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM" selected>Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label" for="book-read-time">Read Time (min)</label>
                  <input type="number" id="book-read-time" class="form-input" placeholder="0" min="0">
                </div>
              </div>
            </div>

            <!-- TAB: Organization -->
            <div id="tab-content-organization" class="workspace-tab-pane ${currentTab === 'organization' ? '' : 'hidden'}">
              <h3 class="mb-lg" style="font-size:18px;font-weight:600">Organization & Taxonomy</h3>
              <div class="form-group mb-md">
                <label class="form-label">Categories</label>
                <div id="category-checkboxes" class="flex gap-sm" style="flex-wrap:wrap"><span class="text-tertiary">Loading...</span></div>
              </div>
              <div class="form-group mb-md">
                <label class="form-label">Subjects</label>
                <div id="subject-checkboxes" class="flex gap-sm" style="flex-wrap:wrap"><span class="text-tertiary">Loading...</span></div>
              </div>
              <div class="form-group mb-md">
                <label class="form-label" for="book-tags">Tags (comma separated)</label>
                <input type="text" id="book-tags" class="form-input" placeholder="physics, mechanics">
              </div>
              <div class="form-group mb-md">
                <label class="form-label" for="book-exam-tags">Exam Tags (comma separated)</label>
                <input type="text" id="book-exam-tags" class="form-input" placeholder="JEE, NEET">
              </div>
            </div>

            <!-- TAB: Rights -->
            <div id="tab-content-rights" class="workspace-tab-pane ${currentTab === 'rights' ? '' : 'hidden'}">
              <h3 class="mb-lg" style="font-size:18px;font-weight:600">Content Rights & Access</h3>
              <div class="editor-form__row flex gap-md mb-md">
                <div class="form-group flex-1">
                  <label class="form-label" for="book-rights-status">Rights Status *</label>
                  <select id="book-rights-status" class="form-input">
                    <option value="RESTRICTED">Restricted (cannot publish)</option>
                    <option value="PUBLIC_DOMAIN">Public Domain</option>
                    <option value="OPEN_LICENSE">Open License</option>
                    <option value="AUTHORIZED">Authorized</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label" for="book-license-name">License Name</label>
                  <input type="text" id="book-license-name" class="form-input" placeholder="e.g., CC BY 4.0">
                </div>
              </div>
              <div class="editor-form__row flex gap-md mb-md">
                <div class="form-group flex-1">
                  <label class="form-label" for="book-license-source">License Source URL</label>
                  <input type="url" id="book-license-source" class="form-input" placeholder="https://...">
                </div>
                <div class="form-group flex-1">
                  <label class="form-label" for="book-rights-holder">Rights Holder</label>
                  <input type="text" id="book-rights-holder" class="form-input" placeholder="Name or org">
                </div>
              </div>
              <div class="form-group mb-md">
                <label class="form-label" for="book-permission-ref">Permission Reference</label>
                <textarea id="book-permission-ref" class="form-input" rows="2"></textarea>
              </div>
              <div class="flex gap-lg mt-md" style="flex-wrap:wrap">
                <label class="checkbox-label"><input type="checkbox" id="book-allow-download"> Allow Download</label>
                <label class="checkbox-label"><input type="checkbox" id="book-allow-offline"> Allow Offline</label>
                <label class="checkbox-label"><input type="checkbox" id="book-allow-share"> Allow Share</label>
              </div>
            </div>

            <!-- Chapters Tab -->
            <div id="tab-content-chapters" class="workspace-tab-pane ${currentTab === 'chapters' ? '' : 'hidden'}">
              <div class="flex items-center justify-between mb-md">
                <h3 style="font-size:18px;font-weight:600">Chapters</h3>
                <button class="btn btn-secondary btn-sm" onclick="AdminBookEditor.openChapterModal(); return false;">Add Chapter</button>
              </div>
              <div id="chapters-list"><div class="text-tertiary text-center p-md">Loading Chapters...</div></div>
            </div>
            
            <div id="tab-content-qna" class="workspace-tab-pane ${currentTab === 'qna' ? '' : 'hidden'}">
              <div class="flex items-center justify-between mb-md">
                <h3 style="font-size:18px;font-weight:600">Questions & Answers</h3>
                <button class="btn btn-secondary btn-sm" onclick="AdminBookEditor.openQnAModal(); return false;">Add Q&A</button>
              </div>
              <div id="qna-list"><div class="text-tertiary text-center p-md">Loading Questions...</div></div>
            </div>

            <!-- Quizzes Tab -->
            <div id="tab-content-quizzes" class="workspace-tab-pane ${currentTab === 'quizzes' ? '' : 'hidden'}">
              <div class="flex items-center justify-between mb-md">
                <h3 style="font-size:18px;font-weight:600">Quizzes</h3>
                <button class="btn btn-secondary btn-sm" onclick="AdminBookEditor.openQuizModal(); return false;">Add Quiz</button>
              </div>
              <div id="quizzes-list"><div class="text-tertiary text-center p-md">Loading Quizzes...</div></div>
            </div>

            <!-- Flashcards Tab -->
            <div id="tab-content-flashcards" class="workspace-tab-pane ${currentTab === 'flashcards' ? '' : 'hidden'}">
              <div class="flex items-center justify-between mb-md">
                <h3 style="font-size:18px;font-weight:600">Flashcard Decks</h3>
                <button class="btn btn-secondary btn-sm" onclick="AdminBookEditor.openFlashcardSetModal(); return false;">Add Deck</button>
              </div>
              <div id="flashcards-list"><div class="text-tertiary text-center p-md">Loading Flashcard Decks...</div></div>
            </div>
            <div id="tab-content-resources" class="workspace-tab-pane ${currentTab === 'resources' ? '' : 'hidden'} text-center p-xl">
              <h3 class="mb-md">Resources</h3><p class="text-tertiary">Book resources will be integrated here.</p>
            </div>
            <div id="tab-content-media" class="workspace-tab-pane ${currentTab === 'media' ? '' : 'hidden'} text-center p-xl">
              <h3 class="mb-md">Media</h3><p class="text-tertiary">Media library will be integrated here.</p>
            </div>
            <div id="tab-content-preview" class="workspace-tab-pane ${currentTab === 'preview' ? '' : 'hidden'} text-center p-xl">
              <h3 class="mb-md">Preview</h3><p class="text-tertiary">Book preview will be integrated here.</p>
            </div>
            
            <div id="tab-content-settings" class="workspace-tab-pane ${currentTab === 'settings' ? '' : 'hidden'}">
              <h3 class="mb-lg" style="font-size:18px;font-weight:600">Settings</h3>
              <div class="form-group mb-md flex items-center">
                <label class="checkbox-label">
                  <input type="checkbox" id="book-is-featured"> Featured Book
                </label>
              </div>
            </div>

          </form>
        </div>
      </div>
      <style>
        .workspace-tab.active {
          background: var(--bg-primary) !important;
          color: var(--text-primary) !important;
          font-weight: 600;
          border-left: 3px solid var(--accent) !important;
        }
        .workspace-tab:hover:not(.active) {
          background: rgba(0,0,0,0.02) !important;
        }
      </style>
    `;

    bindEvents();
    loadFormData(isEdit);
    if (isEdit) {
      loadQnA();
      loadChapters();
      loadQuizzes();
      loadFlashcards();
    }
  }

  function bindEvents() {
    document.querySelectorAll('.workspace-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = tabBtn.getAttribute('data-tab');
        currentTab = tabId;
        
        document.querySelectorAll('.workspace-tab').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');

        document.querySelectorAll('.workspace-tab-pane').forEach(p => p.classList.add('hidden'));
        document.getElementById(`tab-content-${tabId}`).classList.remove('hidden');
      });
    });
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
            <div class="text-body-medium" style="font-weight:600">Q: ${escapeHtml(q.question_text)}</div>
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
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function loadFormData(isEdit) {
    try {
      const [catSettled, subSettled, langSettled] = await Promise.allSettled([
        ApiClient.admin.getCategories(),
        ApiClient.admin.getSubjects(),
        ApiClient.admin.getLanguages()
      ]);
      
      categories = catSettled.status === 'fulfilled' ? (catSettled.value.data || []) : [];
      subjects = subSettled.status === 'fulfilled' ? (subSettled.value.data || []) : [];
      const languages = langSettled.status === 'fulfilled' ? (langSettled.value.data || []) : [];

      document.getElementById('category-checkboxes').innerHTML = categories.length
        ? categories.map(c => `<label class="checkbox-label"><input type="checkbox" value="${c.id}" class="cat-checkbox"> ${c.name}</label>`).join('')
        : '<span class="text-body-small text-tertiary">No categories.</span>';

      document.getElementById('subject-checkboxes').innerHTML = subjects.length
        ? subjects.map(s => `<label class="checkbox-label"><input type="checkbox" value="${s.id}" class="sub-checkbox"> ${s.name}</label>`).join('')
        : '<span class="text-body-small text-tertiary">No subjects.</span>';
        
      const langSelect = document.getElementById('book-language');
      if (languages.length) {
        langSelect.innerHTML = languages.map(l => `<option value="${l.code}">${l.name}</option>`).join('');
      } else {
        langSelect.innerHTML = '<option value="en">English (Default)</option>';
      }
    } catch (err) {
      console.error('Failed to load taxonomies:', err);
    }

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
        document.getElementById('book-cover-url').value = book.cover_image_url || book.coverImageUrl || '';
        document.getElementById('book-tags').value = (book.tags || []).join(', ');
        document.getElementById('book-exam-tags').value = (book.examTags || []).join(', ');
        document.getElementById('book-is-featured').checked = (book.featured_order || book.featuredOrder) != null;

        (book.categories || []).map(c => c.id).forEach(id => {
          const cb = document.querySelector(`.cat-checkbox[value="${id}"]`);
          if (cb) cb.checked = true;
        });
        (book.subjects || []).map(s => s.id).forEach(id => {
          const cb = document.querySelector(`.sub-checkbox[value="${id}"]`);
          if (cb) cb.checked = true;
        });
      } catch (err) {
        Toast.error('Failed to load book');
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
        Toast.success('Book updated');
      } else {
        await ApiClient.admin.createBook(body);
        Toast.success('Book created');
      }
      AdminApp.navigate('books');
    } catch (err) {
      Toast.error(err.message);
    } finally {
      if (saveDraftBtn) { saveDraftBtn.disabled = false; saveDraftBtn.textContent = 'Save Draft'; }
      if (savePublishBtn) { savePublishBtn.disabled = false; savePublishBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px">publish</span> Publish'; }
    }
  }

  async function loadChapters() {
    try {
      const res = await ApiClient.admin.getChapters(editingBookId);
      const items = res.data || [];
      const list = document.getElementById('chapters-list');
      if (items.length === 0) {
        list.innerHTML = '<div class="text-body-small text-tertiary text-center p-md">No chapters added yet.</div>';
        return;
      }
      list.innerHTML = items.map(i => `
        <div class="card mb-sm p-sm flex items-center justify-between" style="border:1px solid var(--border)">
          <div>
            <div class="text-body-medium" style="font-weight:600">${i.chapter_number}. ${escapeHtml(i.title)}</div>
            <div class="text-body-small text-secondary mt-xs">${i.status}</div>
          </div>
          <button class="btn-icon" onclick="AdminBookEditor.deleteChapter('${i.id}'); return false;">
            <span class="material-symbols-outlined" style="color:var(--error)">delete</span>
          </button>
        </div>
      `).join('');
    } catch (e) { document.getElementById('chapters-list').innerHTML = '<div class="text-error">Failed to load Chapters</div>'; }
  }

  async function loadQuizzes() {
    try {
      const res = await ApiClient.admin.getQuizzes(editingBookId);
      const items = res.data || [];
      const list = document.getElementById('quizzes-list');
      if (items.length === 0) {
        list.innerHTML = '<div class="text-body-small text-tertiary text-center p-md">No quizzes added yet.</div>';
        return;
      }
      list.innerHTML = items.map(i => `
        <div class="card mb-sm p-sm flex items-center justify-between" style="border:1px solid var(--border)">
          <div>
            <div class="text-body-medium" style="font-weight:600">${escapeHtml(i.title)}</div>
            <div class="text-body-small text-secondary mt-xs">${i.status} • ${i.passing_score_percent}% to pass</div>
          </div>
          <button class="btn-icon" onclick="AdminBookEditor.deleteQuiz('${i.id}'); return false;">
            <span class="material-symbols-outlined" style="color:var(--error)">delete</span>
          </button>
        </div>
      `).join('');
    } catch (e) { document.getElementById('quizzes-list').innerHTML = '<div class="text-error">Failed to load Quizzes</div>'; }
  }

  async function loadFlashcards() {
    try {
      const res = await ApiClient.admin.getFlashcards(editingBookId);
      const items = res.data || [];
      const list = document.getElementById('flashcards-list');
      if (items.length === 0) {
        list.innerHTML = '<div class="text-body-small text-tertiary text-center p-md">No flashcard decks added yet.</div>';
        return;
      }
      list.innerHTML = items.map(i => `
        <div class="card mb-sm p-sm flex items-center justify-between" style="border:1px solid var(--border)">
          <div>
            <div class="text-body-medium" style="font-weight:600">${escapeHtml(i.title)}</div>
            <div class="text-body-small text-secondary mt-xs">${i.status}</div>
          </div>
          <button class="btn-icon" onclick="AdminBookEditor.deleteFlashcardSet('${i.id}'); return false;">
            <span class="material-symbols-outlined" style="color:var(--error)">delete</span>
          </button>
        </div>
      `).join('');
    } catch (e) { document.getElementById('flashcards-list').innerHTML = '<div class="text-error">Failed to load Flashcards</div>'; }
  }

  exports.openChapterModal = function() {
    Modal.form('Add Chapter', `
      <div class="form-group mb-md">
        <label class="form-label">Chapter Number</label>
        <input type="number" id="chapter-number" class="form-input" min="1" value="1">
      </div>
      <div class="form-group">
        <label class="form-label">Title</label>
        <input type="text" id="chapter-title" class="form-input">
      </div>
    `, async () => {
      const num = parseInt(document.getElementById('chapter-number').value, 10);
      const title = document.getElementById('chapter-title').value.trim();
      if (!title) { Toast.error('Title required'); return false; }
      try {
        await ApiClient.admin.createChapter(editingBookId, { chapterNumber: num, title });
        Toast.success('Chapter added');
        loadChapters();
        return true;
      } catch (err) { Toast.error(err.message); return false; }
    });
  };

  exports.deleteChapter = function(id) {
    Modal.confirm('Delete Chapter', 'Are you sure?', async () => {
      await ApiClient.admin.deleteChapter(editingBookId, id);
      loadChapters();
    });
  };

  exports.openQuizModal = function() {
    Modal.form('Add Quiz', `
      <div class="form-group mb-md">
        <label class="form-label">Title</label>
        <input type="text" id="quiz-title" class="form-input">
      </div>
      <div class="form-group">
        <label class="form-label">Passing Score (%)</label>
        <input type="number" id="quiz-passing" class="form-input" value="60" min="0" max="100">
      </div>
    `, async () => {
      const title = document.getElementById('quiz-title').value.trim();
      const passing = parseInt(document.getElementById('quiz-passing').value, 10);
      if (!title) { Toast.error('Title required'); return false; }
      try {
        await ApiClient.admin.createQuiz(editingBookId, { title, passingScorePercent: passing });
        Toast.success('Quiz added');
        loadQuizzes();
        return true;
      } catch (err) { Toast.error(err.message); return false; }
    });
  };

  exports.deleteQuiz = function(id) {
    Modal.confirm('Delete Quiz', 'Are you sure?', async () => {
      await ApiClient.admin.deleteQuiz(editingBookId, id);
      loadQuizzes();
    });
  };

  exports.openFlashcardSetModal = function() {
    Modal.form('Add Flashcard Deck', `
      <div class="form-group mb-md">
        <label class="form-label">Title</label>
        <input type="text" id="deck-title" class="form-input">
      </div>
    `, async () => {
      const title = document.getElementById('deck-title').value.trim();
      if (!title) { Toast.error('Title required'); return false; }
      try {
        await ApiClient.admin.createFlashcardSet(editingBookId, { title });
        Toast.success('Deck added');
        loadFlashcards();
        return true;
      } catch (err) { Toast.error(err.message); return false; }
    });
  };

  exports.deleteFlashcardSet = function(id) {
    Modal.confirm('Delete Deck', 'Are you sure?', async () => {
      await ApiClient.admin.deleteFlashcardSet(editingBookId, id);
      loadFlashcards();
    });
  };

  exports.render = render;
  exports.save = save;
  window.AdminBookEditor = exports;
  return exports;
})();
