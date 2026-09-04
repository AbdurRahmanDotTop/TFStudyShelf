/**
 * TF Study Shelf — Admin Categories & Subjects Page
 */
window.AdminCategories = (() => {

  async function render(container) {
    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">Categories & Subjects</h1>
          <p class="admin-page-header__subtitle">Organize your content library</p>
        </div>
      </div>

      <div class="grid-2 gap-lg">
        <!-- Categories -->
        <div>
          <div class="flex items-center justify-between mb-md">
            <h3 class="text-title-large">Categories</h3>
            <button class="btn btn-sm btn-secondary" onclick="AdminCategories.showCreateCategoryForm()">
              <span class="material-symbols-outlined" style="font-size:16px">add</span> Add
            </button>
          </div>
          <div id="create-category-form" class="card mb-md hidden">
            <div class="flex gap-sm">
              <input type="text" id="new-category-name" class="form-input" placeholder="Category name" style="flex:1">
              <button class="btn btn-primary btn-sm" onclick="AdminCategories.createCategory()">Save</button>
              <button class="btn btn-ghost btn-sm" onclick="document.getElementById('create-category-form').classList.add('hidden')">Cancel</button>
            </div>
            <input type="text" id="new-category-desc" class="form-input mt-sm" placeholder="Description (optional)">
          </div>
          <div id="categories-list">
            <div class="loading-overlay" style="min-height:100px"><div class="spinner spinner-sm"></div></div>
          </div>
        </div>

        <!-- Subjects -->
        <div>
          <div class="flex items-center justify-between mb-md">
            <h3 class="text-title-large">Subjects</h3>
            <button class="btn btn-sm btn-secondary" onclick="AdminCategories.showCreateSubjectForm()">
              <span class="material-symbols-outlined" style="font-size:16px">add</span> Add
            </button>
          </div>
          <div id="create-subject-form" class="card mb-md hidden">
            <div class="flex gap-sm">
              <input type="text" id="new-subject-name" class="form-input" placeholder="Subject name" style="flex:1">
              <button class="btn btn-primary btn-sm" onclick="AdminCategories.createSubject()">Save</button>
              <button class="btn btn-ghost btn-sm" onclick="document.getElementById('create-subject-form').classList.add('hidden')">Cancel</button>
            </div>
            <input type="text" id="new-subject-desc" class="form-input mt-sm" placeholder="Description (optional)">
          </div>
          <div id="subjects-list">
            <div class="loading-overlay" style="min-height:100px"><div class="spinner spinner-sm"></div></div>
          </div>
        </div>
      </div>
    `;

    loadData();
  }

  async function loadData() {
    try {
      const [catResult, subResult] = await Promise.all([
        ApiClient.getCategories(),
        ApiClient.getSubjects()
      ]);

      const cats = catResult.data || [];
      const subs = subResult.data || [];

      document.getElementById('categories-list').innerHTML = cats.length
        ? cats.map(c => `
          <div class="card card-hover mb-sm flex items-center justify-between" style="padding:12px 16px">
            <div>
              <div class="text-label-large">${c.name}</div>
              ${c.description ? `<div class="text-body-small text-secondary">${c.description}</div>` : ''}
            </div>
            <span class="badge badge-active">${c.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        `).join('')
        : `<div class="empty-state" style="padding:var(--space-xl)">
            <p class="empty-state__message">No categories yet</p>
          </div>`;

      document.getElementById('subjects-list').innerHTML = subs.length
        ? subs.map(s => `
          <div class="card card-hover mb-sm flex items-center justify-between" style="padding:12px 16px">
            <div>
              <div class="text-label-large">${s.name}</div>
              ${s.description ? `<div class="text-body-small text-secondary">${s.description}</div>` : ''}
            </div>
            <span class="badge badge-active">${s.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        `).join('')
        : `<div class="empty-state" style="padding:var(--space-xl)">
            <p class="empty-state__message">No subjects yet</p>
          </div>`;
    } catch (err) {
      Toast.error('Failed to load data: ' + err.message);
    }
  }

  function showCreateCategoryForm() {
    document.getElementById('create-category-form').classList.remove('hidden');
    document.getElementById('new-category-name').focus();
  }

  function showCreateSubjectForm() {
    document.getElementById('create-subject-form').classList.remove('hidden');
    document.getElementById('new-subject-name').focus();
  }

  async function createCategory() {
    const name = document.getElementById('new-category-name').value.trim();
    if (!name) { Toast.error('Category name is required'); return; }
    try {
      await ApiClient.admin.createCategory({ name, description: document.getElementById('new-category-desc').value.trim() || null });
      Toast.success('Category created');
      document.getElementById('create-category-form').classList.add('hidden');
      document.getElementById('new-category-name').value = '';
      document.getElementById('new-category-desc').value = '';
      loadData();
    } catch (err) { Toast.error(err.message); }
  }

  async function createSubject() {
    const name = document.getElementById('new-subject-name').value.trim();
    if (!name) { Toast.error('Subject name is required'); return; }
    try {
      await ApiClient.admin.createSubject({ name, description: document.getElementById('new-subject-desc').value.trim() || null });
      Toast.success('Subject created');
      document.getElementById('create-subject-form').classList.add('hidden');
      document.getElementById('new-subject-name').value = '';
      document.getElementById('new-subject-desc').value = '';
      loadData();
    } catch (err) { Toast.error(err.message); }
  }

  return { render, showCreateCategoryForm, showCreateSubjectForm, createCategory, createSubject };
})();
