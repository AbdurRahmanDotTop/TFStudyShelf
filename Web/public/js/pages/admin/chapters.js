/**
 * TF Study Shelf — Admin Chapters Page & Content Editor
 */
window.AdminChapters = (() => {

  let currentBookId = null;
  let editingChapter = null;
  let blocks = []; // Current blocks for the editing chapter

  async function render(container) {
    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">Chapters & Content</h1>
          <p class="admin-page-header__subtitle">Manage book chapters and their structured content</p>
        </div>
      </div>

      <div id="main-view">
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
              <input type="number" id="new-chapter-order" class="form-input" placeholder="Number (e.g. 1)" style="width: 100px;">
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
      </div>

      <div id="editor-view" class="hidden">
        <div class="mb-md flex justify-between items-center">
          <button class="btn btn-ghost" onclick="AdminChapters.closeEditor()">
            <span class="material-symbols-outlined" style="font-size:18px">arrow_back</span> Back to Chapters
          </button>
          <button class="btn btn-primary" onclick="AdminChapters.saveContent()">
            <span class="material-symbols-outlined" style="font-size:18px">save</span> Save Content
          </button>
        </div>
        <div class="card">
          <h2 class="text-title-large mb-sm" id="editor-chapter-title">Edit Content</h2>
          <p class="text-body-small text-tertiary mb-lg">Add and reorder blocks of content for this chapter.</p>
          
          <div class="flex gap-sm mb-lg" style="flex-wrap: wrap">
            <button class="btn btn-secondary btn-sm" onclick="AdminChapters.addBlock('paragraph')">+ Text</button>
            <button class="btn btn-secondary btn-sm" onclick="AdminChapters.addBlock('heading')">+ Heading</button>
            <button class="btn btn-secondary btn-sm" onclick="AdminChapters.addBlock('image')">+ Image URL</button>
            <button class="btn btn-secondary btn-sm" onclick="AdminChapters.addBlock('video')">+ Video URL</button>
            <button class="btn btn-secondary btn-sm" onclick="AdminChapters.addBlock('pdf')">+ PDF URL</button>
          </div>

          <div id="blocks-container" class="flex" style="flex-direction:column; gap:16px;">
            <!-- Blocks will be rendered here -->
          </div>
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
            <div class="text-label-large">Chapter ${c.chapter_number || c.order}: ${c.title}</div>
            <div class="text-body-small text-tertiary">
               ${c.content && c.content.length > 5 ? 'Contains structured content' : 'Empty content'}
            </div>
          </div>
          <div class="flex gap-sm">
            <button class="btn btn-secondary btn-sm" onclick="AdminChapters.openEditor('${c.id}')">Edit Content</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--error)" onclick="AdminChapters.deleteChapter('${c.id}')">Delete</button>
          </div>
        </div>
      `).join('');
      
      // Store chapters in a global map for quick access
      window._cachedChapters = chapters.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});
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
      await ApiClient.admin.createChapter(currentBookId, { title, chapterNumber: order, order: order });
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

  // --- Content Block Editor ---

  function openEditor(chapterId) {
    editingChapter = window._cachedChapters[chapterId];
    if (!editingChapter) return;

    document.getElementById('main-view').classList.add('hidden');
    document.getElementById('editor-view').classList.remove('hidden');
    document.getElementById('editor-chapter-title').textContent = `Editing: Chapter ${editingChapter.chapter_number || editingChapter.order} - ${editingChapter.title}`;

    try {
      blocks = editingChapter.content ? JSON.parse(editingChapter.content) : [];
      if (!Array.isArray(blocks)) blocks = [];
    } catch (e) {
      console.error('Failed to parse blocks', e);
      blocks = [];
    }
    
    renderBlocks();
  }

  function closeEditor() {
    editingChapter = null;
    blocks = [];
    document.getElementById('main-view').classList.remove('hidden');
    document.getElementById('editor-view').classList.add('hidden');
    loadChapters(); // refresh list to show updated status
  }

  function renderBlocks() {
    const container = document.getElementById('blocks-container');
    if (blocks.length === 0) {
      container.innerHTML = '<div class="text-tertiary text-body-small p-md" style="border: 1px dashed var(--border); border-radius: 8px; text-align: center;">No content blocks yet. Add one from above!</div>';
      return;
    }

    container.innerHTML = blocks.map((b, index) => {
      let contentInput = '';
      if (b.type === 'paragraph') {
        contentInput = `<textarea class="form-input block-input" rows="4" data-index="${index}" data-field="content" placeholder="Write text here...">${escapeHtml(b.content || '')}</textarea>`;
      } else if (b.type === 'heading') {
        contentInput = `
          <div class="flex gap-sm">
            <select class="form-input block-input" style="width:100px" data-index="${index}" data-field="level">
              <option value="1" ${b.level == 1 ? 'selected' : ''}>H1</option>
              <option value="2" ${b.level == 2 ? 'selected' : ''}>H2</option>
              <option value="3" ${b.level == 3 ? 'selected' : ''}>H3</option>
            </select>
            <input type="text" class="form-input block-input" style="flex:1" data-index="${index}" data-field="content" value="${escapeHtml(b.content || '')}" placeholder="Heading text">
          </div>
        `;
      } else if (b.type === 'image') {
        contentInput = `
          <input type="url" class="form-input block-input mb-sm" data-index="${index}" data-field="url" value="${escapeHtml(b.url || '')}" placeholder="Image URL (e.g. https://...)">
          <input type="text" class="form-input block-input" data-index="${index}" data-field="alt" value="${escapeHtml(b.alt || '')}" placeholder="Alt text (optional)">
          ${b.url ? `<div class="mt-sm"><img src="${b.url}" alt="Preview" style="max-height: 100px; border-radius:4px"></div>` : ''}
        `;
      } else if (b.type === 'video') {
        contentInput = `<input type="url" class="form-input block-input" data-index="${index}" data-field="url" value="${escapeHtml(b.url || '')}" placeholder="YouTube or Video URL">`;
      } else if (b.type === 'pdf') {
        contentInput = `<input type="url" class="form-input block-input" data-index="${index}" data-field="url" value="${escapeHtml(b.url || '')}" placeholder="PDF direct URL">`;
      }

      return `
        <div class="card flex" style="border: 1px solid var(--border); padding: 12px; position:relative; overflow: visible;">
          <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; width: 40px; border-right: 1px solid var(--border); margin-right: 12px; padding-right: 12px;">
             <button class="btn-icon btn-sm" onclick="AdminChapters.moveBlock(${index}, -1)" ${index === 0 ? 'disabled' : ''}><span class="material-symbols-outlined">arrow_upward</span></button>
             <div class="text-body-small text-tertiary mt-xs mb-xs">${index + 1}</div>
             <button class="btn-icon btn-sm" onclick="AdminChapters.moveBlock(${index}, 1)" ${index === blocks.length - 1 ? 'disabled' : ''}><span class="material-symbols-outlined">arrow_downward</span></button>
          </div>
          <div style="flex:1">
             <div class="flex justify-between items-center mb-sm">
                <span class="badge badge-primary" style="text-transform: uppercase; font-size:10px">${b.type}</span>
                <button class="btn-icon btn-sm" style="color:var(--error)" onclick="AdminChapters.removeBlock(${index})"><span class="material-symbols-outlined">delete</span></button>
             </div>
             ${contentInput}
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners
    document.querySelectorAll('.block-input').forEach(el => {
      el.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        let val = e.target.value;
        if (field === 'level') val = parseInt(val);
        blocks[index][field] = val;
        if(field === 'url' && blocks[index].type === 'image') renderBlocks(); // Re-render to show image preview
      });
    });
  }

  function addBlock(type) {
    const newBlock = { id: crypto.randomUUID(), type };
    if (type === 'heading') newBlock.level = 2;
    blocks.push(newBlock);
    renderBlocks();
    // Scroll to bottom
    setTimeout(() => {
      const c = document.getElementById('blocks-container');
      if(c && c.parentElement) {
        c.parentElement.scrollTo({ top: c.parentElement.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  }

  function removeBlock(index) {
    if (confirm('Delete this block?')) {
      blocks.splice(index, 1);
      renderBlocks();
    }
  }

  function moveBlock(index, dir) {
    if (index + dir < 0 || index + dir >= blocks.length) return;
    const temp = blocks[index];
    blocks[index] = blocks[index + dir];
    blocks[index + dir] = temp;
    renderBlocks();
  }

  async function saveContent() {
    try {
      // Force all inputs to commit values
      document.querySelectorAll('.block-input').forEach(el => {
        const index = parseInt(el.dataset.index);
        const field = el.dataset.field;
        let val = el.value;
        if (field === 'level') val = parseInt(val);
        blocks[index][field] = val;
      });

      const jsonStr = JSON.stringify(blocks);
      await ApiClient.admin.updateChapter(currentBookId, editingChapter.id, { content: jsonStr });
      Toast.success('Content saved successfully');
      editingChapter.content = jsonStr;
    } catch (err) {
      Toast.error('Failed to save content: ' + err.message);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }

  return { render, onBookSelected, showCreateChapterForm, createChapter, deleteChapter,
           openEditor, closeEditor, addBlock, removeBlock, moveBlock, saveContent };
})();
