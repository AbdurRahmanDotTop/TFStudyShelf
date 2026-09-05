/**
 * TF Study Shelf — Admin Languages Page
 */
window.AdminLanguages = (() => {

  let languages = [];

  async function render(container) {
    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">Languages</h1>
          <p class="admin-page-header__subtitle">Manage supported languages for your content</p>
        </div>
        <button class="btn btn-primary" onclick="AdminLanguages.showCreateModal()">
          <span class="material-symbols-outlined" style="font-size:18px">add</span> Add Language
        </button>
      </div>

      <div id="languages-list">
        <div class="loading-overlay" style="min-height:200px"><div class="spinner spinner-md"></div></div>
      </div>
    `;

    loadData();
  }

  async function loadData() {
    try {
      const res = await ApiClient.admin.getLanguages();
      languages = res.data || [];
      renderList();
    } catch (err) {
      Toast.error('Failed to load languages: ' + err.message);
    }
  }

  function renderList() {
    const list = document.getElementById('languages-list');
    if (!list) return;

    if (!languages.length) {
      list.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-outlined empty-state__icon">translate</span>
          <h3 class="empty-state__title">No Languages Found</h3>
          <p class="empty-state__message">You haven't added any languages yet.</p>
          <button class="btn btn-primary mt-md" onclick="AdminLanguages.showCreateModal()">Add Language</button>
        </div>
      `;
      return;
    }

    list.innerHTML = `
      <div class="card p-0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Native Name</th>
              <th>Status</th>
              <th align="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${languages.map(lang => `
              <tr>
                <td style="font-family: monospace">${lang.code}</td>
                <td><strong>${lang.name}</strong></td>
                <td>${lang.native_name || '-'}</td>
                <td><span class="badge ${lang.is_active ? 'badge-active' : 'badge-inactive'}">${lang.is_active ? 'Active' : 'Inactive'}</span></td>
                <td align="right">
                  <button class="btn btn-sm btn-ghost" onclick="AdminLanguages.showEditModal('${lang.id}')" title="Edit">
                    <span class="material-symbols-outlined" style="font-size:18px">edit</span>
                  </button>
                  <button class="btn btn-sm btn-ghost text-danger" onclick="AdminLanguages.confirmDelete('${lang.id}')" title="Delete">
                    <span class="material-symbols-outlined" style="font-size:18px">delete</span>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function getFormHtml(lang = {}) {
    return `
      <div class="form-group">
        <label class="form-label">Language Code (e.g., 'en', 'es', 'hi')</label>
        <input type="text" id="lang-code" class="form-input" value="${lang.code || ''}" placeholder="Code">
      </div>
      <div class="form-group">
        <label class="form-label">Name (in English)</label>
        <input type="text" id="lang-name" class="form-input" value="${lang.name || ''}" placeholder="Name">
      </div>
      <div class="form-group">
        <label class="form-label">Native Name (optional)</label>
        <input type="text" id="lang-native-name" class="form-input" value="${lang.native_name || ''}" placeholder="Native Name">
      </div>
      <div class="form-group">
        <label class="form-checkbox">
          <input type="checkbox" id="lang-active" ${lang.is_active !== 0 ? 'checked' : ''}>
          <span>Active (Available for selection)</span>
        </label>
      </div>
    `;
  }

  function showCreateModal() {
    Modal.form('Add Language', getFormHtml(), async () => {
      const code = document.getElementById('lang-code').value.trim();
      const name = document.getElementById('lang-name').value.trim();
      if (!code || !name) { Toast.error('Code and Name are required'); return false; }
      
      try {
        await ApiClient.admin.createLanguage({
          code,
          name,
          nativeName: document.getElementById('lang-native-name').value.trim(),
          isActive: document.getElementById('lang-active').checked
        });
        Toast.success('Language created successfully');
        loadData();
        return true;
      } catch (err) {
        Toast.error(err.message);
        return false;
      }
    });
  }

  function showEditModal(id) {
    const lang = languages.find(l => l.id === id);
    if (!lang) return;

    Modal.form('Edit Language', getFormHtml(lang), async () => {
      const code = document.getElementById('lang-code').value.trim();
      const name = document.getElementById('lang-name').value.trim();
      if (!code || !name) { Toast.error('Code and Name are required'); return false; }
      
      try {
        await ApiClient.admin.updateLanguage(id, {
          code,
          name,
          nativeName: document.getElementById('lang-native-name').value.trim(),
          isActive: document.getElementById('lang-active').checked
        });
        Toast.success('Language updated successfully');
        loadData();
        return true;
      } catch (err) {
        Toast.error(err.message);
        return false;
      }
    });
  }

  function confirmDelete(id) {
    const lang = languages.find(l => l.id === id);
    if (!lang) return;

    Modal.confirm(
      'Delete Language',
      `Are you sure you want to delete "${lang.name}"? This action cannot be undone.`,
      async () => {
        try {
          await ApiClient.admin.deleteLanguage(id);
          Toast.success('Language deleted');
          loadData();
        } catch (err) {
          Toast.error(err.message);
        }
      }
    );
  }

  return { render, showCreateModal, showEditModal, confirmDelete };
})();
