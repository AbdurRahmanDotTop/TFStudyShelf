/**
 * TF Study Shelf — Admin Categories & Subjects Page
 */
window.AdminCategories = (() => {

  let categories = [];
  let subjects = [];

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
            <button class="btn btn-sm btn-secondary" onclick="AdminCategories.showCreateCategoryModal()">
              <span class="material-symbols-outlined" style="font-size:16px">add</span> Add
            </button>
          </div>
          <div id="categories-list">
            <div class="loading-overlay" style="min-height:100px"><div class="spinner spinner-sm"></div></div>
          </div>
        </div>

        <!-- Subjects -->
        <div>
          <div class="flex items-center justify-between mb-md">
            <h3 class="text-title-large">Subjects</h3>
            <button class="btn btn-sm btn-secondary" onclick="AdminCategories.showCreateSubjectModal()">
              <span class="material-symbols-outlined" style="font-size:16px">add</span> Add
            </button>
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
        ApiClient.admin.getCategories(),
        ApiClient.admin.getSubjects()
      ]);

      categories = catResult.data || [];
      subjects = subResult.data || [];
      
      renderCategories();
      renderSubjects();
    } catch (err) {
      Toast.error('Failed to load data: ' + err.message);
    }
  }

  function renderCategories() {
    const list = document.getElementById('categories-list');
    if (!list) return;

    if (!categories.length) {
      list.innerHTML = `<div class="empty-state" style="padding:var(--space-xl)"><p class="empty-state__message">No categories yet</p></div>`;
      return;
    }

    list.innerHTML = categories.map(c => `
      <div class="card card-hover mb-sm flex items-center justify-between" style="padding:12px 16px">
        <div>
          <div class="text-label-large">${c.name}</div>
          ${c.description ? `<div class="text-body-small text-secondary">${c.description}</div>` : ''}
        </div>
        <div class="flex items-center gap-sm">
          <span class="badge ${c.is_active ? 'badge-active' : 'badge-inactive'}">${c.is_active ? 'Active' : 'Inactive'}</span>
          <button class="btn-icon" onclick="AdminCategories.showEditCategoryModal('${c.id}')" title="Edit Category"><span class="material-symbols-outlined" style="font-size:18px">edit</span></button>
          <button class="btn-icon text-danger" onclick="AdminCategories.confirmDeleteCategory('${c.id}')" title="Delete Category"><span class="material-symbols-outlined" style="font-size:18px">delete</span></button>
        </div>
      </div>
    `).join('');
  }

  function renderSubjects() {
    const list = document.getElementById('subjects-list');
    if (!list) return;

    if (!subjects.length) {
      list.innerHTML = `<div class="empty-state" style="padding:var(--space-xl)"><p class="empty-state__message">No subjects yet</p></div>`;
      return;
    }

    list.innerHTML = subjects.map(s => {
      const cat = categories.find(c => c.id === s.category_id);
      return `
        <div class="card card-hover mb-sm flex items-center justify-between" style="padding:12px 16px">
          <div>
            <div class="text-label-large">${s.name}</div>
            <div class="text-body-small text-secondary">
              ${cat ? `<span class="badge" style="margin-right:8px;font-size:10px">${cat.name}</span>` : ''}
              ${s.description || ''}
            </div>
          </div>
          <div class="flex items-center gap-sm">
            <span class="badge ${s.is_active ? 'badge-active' : 'badge-inactive'}">${s.is_active ? 'Active' : 'Inactive'}</span>
            <button class="btn-icon" onclick="AdminCategories.showEditSubjectModal('${s.id}')" title="Edit Subject"><span class="material-symbols-outlined" style="font-size:18px">edit</span></button>
            <button class="btn-icon text-danger" onclick="AdminCategories.confirmDeleteSubject('${s.id}')" title="Delete Subject"><span class="material-symbols-outlined" style="font-size:18px">delete</span></button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Category Modal ---

  function getCategoryFormHtml(cat = {}) {
    return `
      <div class="form-group">
        <label class="form-label">Category Name</label>
        <input type="text" id="cat-name" class="form-input" value="${cat.name || ''}" placeholder="e.g. Science">
      </div>
      <div class="form-group">
        <label class="form-label">Description (Optional)</label>
        <textarea id="cat-desc" class="form-input" rows="2" placeholder="Brief description">${cat.description || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-checkbox">
          <input type="checkbox" id="cat-active" ${cat.is_active !== 0 ? 'checked' : ''}>
          <span>Active (Visible to users)</span>
        </label>
      </div>
    `;
  }

  function showCreateCategoryModal() {
    Modal.form('Add Category', getCategoryFormHtml(), async () => {
      const name = document.getElementById('cat-name').value.trim();
      if (!name) { Toast.error('Category name is required'); return false; }
      try {
        await ApiClient.admin.createCategory({
          name,
          description: document.getElementById('cat-desc').value.trim() || null,
          isActive: document.getElementById('cat-active').checked
        });
        Toast.success('Category created');
        loadData();
        return true;
      } catch (err) {
        Toast.error(err.message);
        return false;
      }
    });
  }

  function showEditCategoryModal(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    Modal.form('Edit Category', getCategoryFormHtml(cat), async () => {
      const name = document.getElementById('cat-name').value.trim();
      if (!name) { Toast.error('Category name is required'); return false; }
      try {
        await ApiClient.admin.updateCategory(id, {
          name,
          description: document.getElementById('cat-desc').value.trim() || null,
          isActive: document.getElementById('cat-active').checked
        });
        Toast.success('Category updated');
        loadData();
        return true;
      } catch (err) {
        Toast.error(err.message);
        return false;
      }
    });
  }

  function confirmDeleteCategory(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    Modal.confirm('Delete Category', `Are you sure you want to delete "${cat.name}"? This action cannot be undone and will affect associated subjects.`, async () => {
      try {
        await ApiClient.admin.deleteCategory(id);
        Toast.success('Category deleted');
        loadData();
      } catch(err) {
        Toast.error(err.message);
      }
    });
  }

  // --- Subject Modal ---

  function getSubjectFormHtml(sub = {}) {
    const catOptions = categories.map(c => 
      `<option value="${c.id}" ${c.id === sub.category_id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    return `
      <div class="form-group">
        <label class="form-label">Subject Name</label>
        <input type="text" id="sub-name" class="form-input" value="${sub.name || ''}" placeholder="e.g. Physics">
      </div>
      <div class="form-group">
        <label class="form-label">Parent Category</label>
        <select id="sub-category" class="form-input">
          <option value="">-- No Category --</option>
          ${catOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Description (Optional)</label>
        <textarea id="sub-desc" class="form-input" rows="2" placeholder="Brief description">${sub.description || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-checkbox">
          <input type="checkbox" id="sub-active" ${sub.is_active !== 0 ? 'checked' : ''}>
          <span>Active (Visible to users)</span>
        </label>
      </div>
    `;
  }

  function showCreateSubjectModal() {
    Modal.form('Add Subject', getSubjectFormHtml(), async () => {
      const name = document.getElementById('sub-name').value.trim();
      if (!name) { Toast.error('Subject name is required'); return false; }
      try {
        await ApiClient.admin.createSubject({
          name,
          categoryId: document.getElementById('sub-category').value || null,
          description: document.getElementById('sub-desc').value.trim() || null,
          isActive: document.getElementById('sub-active').checked
        });
        Toast.success('Subject created');
        loadData();
        return true;
      } catch (err) {
        Toast.error(err.message);
        return false;
      }
    });
  }

  function showEditSubjectModal(id) {
    const sub = subjects.find(s => s.id === id);
    if (!sub) return;
    Modal.form('Edit Subject', getSubjectFormHtml(sub), async () => {
      const name = document.getElementById('sub-name').value.trim();
      if (!name) { Toast.error('Subject name is required'); return false; }
      try {
        await ApiClient.admin.updateSubject(id, {
          name,
          categoryId: document.getElementById('sub-category').value || null,
          description: document.getElementById('sub-desc').value.trim() || null,
          isActive: document.getElementById('sub-active').checked
        });
        Toast.success('Subject updated');
        loadData();
        return true;
      } catch (err) {
        Toast.error(err.message);
        return false;
      }
    });
  }

  function confirmDeleteSubject(id) {
    const sub = subjects.find(s => s.id === id);
    if (!sub) return;
    Modal.confirm('Delete Subject', `Are you sure you want to delete "${sub.name}"? This action cannot be undone.`, async () => {
      try {
        await ApiClient.admin.deleteSubject(id);
        Toast.success('Subject deleted');
        loadData();
      } catch(err) {
        Toast.error(err.message);
      }
    });
  }

  return { 
    render, 
    showCreateCategoryModal, 
    showEditCategoryModal,
    confirmDeleteCategory,
    showCreateSubjectModal,
    showEditSubjectModal,
    confirmDeleteSubject
  };
})();
