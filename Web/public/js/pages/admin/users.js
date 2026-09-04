/**
 * TF Study Shelf — Admin Users Page
 */
window.AdminUsers = (() => {

  async function render(container) {
    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">Users</h1>
          <p class="admin-page-header__subtitle">Manage registered users</p>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-md">
          <h3 class="text-title-large">User Accounts</h3>
        </div>
        
        <div id="users-list">
          <div class="loading-overlay" style="min-height:100px"><div class="spinner spinner-sm"></div></div>
        </div>
      </div>
    `;

    loadUsers();
  }

  async function loadUsers() {
    const listEl = document.getElementById('users-list');
    try {
      const res = await ApiClient.admin.getUsers();
      const users = res.data || [];
      
      if (users.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state" style="padding:var(--space-xl)">
            <p class="empty-state__message">No users found</p>
          </div>`;
        return;
      }

      listEl.innerHTML = `
        <table class="data-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; border-bottom: 1px solid var(--border);">
              <th style="padding: 12px; color: var(--text-secondary); font-weight: normal;">ID</th>
              <th style="padding: 12px; color: var(--text-secondary); font-weight: normal;">Email / Name</th>
              <th style="padding: 12px; color: var(--text-secondary); font-weight: normal;">Status</th>
              <th style="padding: 12px; color: var(--text-secondary); font-weight: normal;">Created At</th>
              <th style="padding: 12px; text-align: right; color: var(--text-secondary); font-weight: normal;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;">
                <td style="padding: 12px; font-family: monospace; font-size: 0.85rem; color: var(--text-secondary);">${u.localId.substring(0, 10)}...</td>
                <td style="padding: 12px;">
                  <div class="font-medium">${u.displayName || 'Unknown'}</div>
                  <div class="text-body-small text-secondary">${u.email || 'No email'} ${u.emailVerified ? '✓' : ''}</div>
                </td>
                <td style="padding: 12px;">
                  <span class="badge ${u.disabled ? '' : 'badge-active'}" style="background: var(--bg-secondary)">
                    ${u.disabled ? 'DISABLED' : 'ACTIVE'}
                  </span>
                </td>
                <td style="padding: 12px; color: var(--text-secondary);">
                  ${u.createdAt ? new Date(parseInt(u.createdAt)).toLocaleDateString() : 'N/A'}
                </td>
                <td style="padding: 12px; text-align: right; white-space: nowrap;">
                  <button class="btn btn-icon" onclick="AdminUsers.changePassword('${u.localId}')" title="Change Password"><span class="material-symbols-outlined text-secondary">lock_reset</span></button>
                  <button class="btn btn-icon" onclick="AdminUsers.editUser('${u.localId}', '${u.displayName || ''}', '${u.disabled || false}')" title="Edit"><span class="material-symbols-outlined text-secondary">edit</span></button>
                  <button class="btn btn-icon" onclick="AdminUsers.deleteUser('${u.localId}')" title="Delete"><span class="material-symbols-outlined text-error">delete</span></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state"><p class="empty-state__message text-error">Failed to load users: ${err.message}</p></div>`;
    }
  }

  async function changePassword(uid) {
    const password = prompt("Enter new password for this user (min 6 characters):");
    if (!password) return;
    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    try {
      await ApiClient.admin.changeUserPassword(uid, password);
      alert("Password updated successfully.");
    } catch (err) {
      alert("Failed to update password: " + err.message);
    }
  }

  async function editUser(uid, currentName, currentDisabled) {
    const newName = prompt("Enter new display name:", currentName);
    if (newName === null) return;
    const disabled = confirm("Should this user be disabled? (OK = Disabled, Cancel = Active)") ? true : false;
    
    try {
      await ApiClient.admin.updateUser(uid, { displayName: newName, disabled });
      loadUsers();
    } catch (err) {
      alert("Failed to update user: " + err.message);
    }
  }

  async function deleteUser(uid) {
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      await ApiClient.admin.deleteUser(uid);
      loadUsers();
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    }
  }

  return { render, changePassword, editUser, deleteUser };
})();
