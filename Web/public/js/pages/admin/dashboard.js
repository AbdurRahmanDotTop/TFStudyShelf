/**
 * TF Study Shelf — Admin Dashboard Page
 */
window.AdminDashboard = (() => {

  async function render(container) {
    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">Dashboard</h1>
          <p class="admin-page-header__subtitle">Welcome back. Here's your content overview.</p>
        </div>
        <div class="admin-page-header__actions">
          <button class="btn btn-primary" onclick="AdminApp.navigate('books', {action:'new'})">
            <span class="material-symbols-outlined" style="font-size:18px">add</span> Add Book
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid" id="stats-grid">
        ${renderStatSkeleton(6)}
      </div>

      <!-- Content Sections -->
      <div class="grid-2 gap-lg">
        <div class="card" style="padding:0">
          <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border)">
            <h3 class="text-title-medium">Recent Activity</h3>
          </div>
          <div id="activity-feed" style="padding:var(--space-md) var(--space-lg);max-height:400px;overflow-y:auto">
            <div class="loading-overlay" style="min-height:100px"><div class="spinner spinner-sm"></div></div>
          </div>
        </div>

        <div class="card" style="padding:0">
          <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border)">
            <h3 class="text-title-medium">Quick Actions</h3>
          </div>
          <div style="padding:var(--space-lg);display:flex;flex-direction:column;gap:var(--space-sm)">
            <button class="btn btn-ghost btn-full" style="justify-content:flex-start" onclick="AdminApp.navigate('books', {action:'new'})">
              <span class="material-symbols-outlined" style="font-size:20px;color:var(--accent)">add_circle</span> Create New Book
            </button>
            <button class="btn btn-ghost btn-full" style="justify-content:flex-start" onclick="AdminApp.navigate('questions')">
              <span class="material-symbols-outlined" style="font-size:20px;color:var(--accent)">help_outline</span> Add Questions
            </button>
            <button class="btn btn-ghost btn-full" style="justify-content:flex-start" onclick="AdminApp.navigate('quizzes')">
              <span class="material-symbols-outlined" style="font-size:20px;color:var(--accent)">quiz</span> Create Quiz
            </button>
            <button class="btn btn-ghost btn-full" style="justify-content:flex-start" onclick="AdminApp.navigate('categories')">
              <span class="material-symbols-outlined" style="font-size:20px;color:var(--accent)">category</span> Manage Categories
            </button>
            <button class="btn btn-ghost btn-full" style="justify-content:flex-start" onclick="AdminApp.navigate('notifications')">
              <span class="material-symbols-outlined" style="font-size:20px;color:var(--accent)">campaign</span> Send Notification
            </button>
          </div>
        </div>
      </div>
    `;

    loadDashboardData();
  }

  function renderStatSkeleton(count) {
    return Array(count).fill('').map(() => `
      <div class="stat-card">
        <div class="skeleton" style="width:40px;height:40px;border-radius:var(--radius-sm)"></div>
        <div class="skeleton" style="width:60px;height:28px;margin-top:var(--space-sm)"></div>
        <div class="skeleton" style="width:100px;height:14px"></div>
      </div>
    `).join('');
  }

  async function loadDashboardData() {
    try {
      const result = await ApiClient.admin.getAnalytics();
      const counts = result.data.counts;

      document.getElementById('stats-grid').innerHTML = `
        ${statCard('menu_book', counts.books, 'Total Books')}
        ${statCard('check_circle', counts.publishedBooks, 'Published')}
        ${statCard('edit_note', counts.draftBooks, 'Drafts')}
        ${statCard('group', counts.users, 'Total Users')}
        ${statCard('help_outline', counts.questions, 'Questions')}
        ${statCard('quiz', counts.quizzes, 'Quizzes')}
      `;

      // Activity feed
      const activity = result.data.recentActivity || [];
      const feedEl = document.getElementById('activity-feed');

      if (activity.length === 0) {
        feedEl.innerHTML = `
          <div class="empty-state" style="padding:var(--space-xl) 0">
            <div class="empty-state__icon">📋</div>
            <p class="empty-state__message">No recent activity yet.</p>
          </div>
        `;
      } else {
        feedEl.innerHTML = `<div class="activity-feed">
          ${activity.map(a => `
            <div class="activity-item">
              <div class="activity-item__dot"></div>
              <div class="activity-item__content">
                <div class="activity-item__text">
                  <strong>${a.action}</strong> on ${a.entity_type}
                  ${a.entity_id ? `<span class="text-tertiary">(${a.entity_id.substring(0, 8)}…)</span>` : ''}
                </div>
                <div class="activity-item__time">${new Date(a.created_at).toLocaleString()}</div>
              </div>
            </div>
          `).join('')}
        </div>`;
      }
    } catch (err) {
      document.getElementById('stats-grid').innerHTML = `
        <div class="card card-accent" style="grid-column:1/-1">
          <p style="color:var(--text-secondary)">
            <span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">info</span>
            Could not load analytics. Make sure the API server is running.
          </p>
        </div>
      `;
    }
  }

  function statCard(icon, value, label) {
    return `
      <div class="stat-card">
        <div class="stat-card__icon">
          <span class="material-symbols-outlined">${icon}</span>
        </div>
        <div class="stat-card__value">${value}</div>
        <div class="stat-card__label">${label}</div>
      </div>
    `;
  }

  return { render };
})();
