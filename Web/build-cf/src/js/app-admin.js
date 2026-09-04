/**
 * TF Study Shelf — Admin App Controller
 * Handles auth, navigation, page routing, and sidebar state
 */
const AdminApp = (() => {
  let currentUser = null;
  let currentPage = 'dashboard';

  // ─── Page Registry ─────────────────────────────
  const pages = {
    dashboard: { title: 'Dashboard', render: (c) => AdminDashboard.render(c) },
    books: { title: 'Books', render: (c, p) => p?.action === 'new' || p?.action === 'edit' ? AdminBookEditor.render(c, p) : AdminBooksList.render(c) },
    chapters: { title: 'Chapters', render: (c) => AdminChapters.render(c) },
    questions: { title: 'Questions', render: (c) => AdminQuestions.render(c) },
    quizzes: { title: 'Quizzes', render: (c) => renderPlaceholder(c, 'Quizzes', 'quiz', 'Build quizzes from your questions') },
    flashcards: { title: 'Flashcards', render: (c) => renderPlaceholder(c, 'Flashcards', 'style', 'Create flashcard sets for study') },
    categories: { title: 'Categories', render: (c) => AdminCategories.render(c) },
    users: { title: 'Users', render: (c) => AdminUsers.render(c) },
    ads: { title: 'Ads', render: (c) => AdminAds.render(c) },
    notifications: { title: 'Notifications', render: (c) => renderPlaceholder(c, 'Notifications', 'campaign', 'Send push notifications to users') },
    settings: { title: 'Settings', render: (c) => renderPlaceholder(c, 'Settings', 'settings', 'System configuration and feature flags') },
    audit: { title: 'Audit Log', render: (c) => renderPlaceholder(c, 'Audit Log', 'history', 'View admin activity history') },
  };

  function renderPlaceholder(container, title, icon, description) {
    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">${title}</h1>
          <p class="admin-page-header__subtitle">${description}</p>
        </div>
      </div>
      <div class="card" style="text-align:center;padding:var(--space-3xl)">
        <div class="empty-state__icon" style="margin:0 auto var(--space-md)">
          <span class="material-symbols-outlined" style="font-size:28px">${icon}</span>
        </div>
        <h3 class="text-title-large mb-sm">Coming Next</h3>
        <p class="text-body-medium text-secondary">${description}. This page will be implemented in the next phase.</p>
      </div>
    `;
  }

  // ─── Navigation ────────────────────────────────
  function navigate(page, params = {}) {
    // If we're already on this page and no special params, just return
    if (currentPage === page && Object.keys(params).length === 0 && window.location.hash.slice(1) === page) return;
    
    // Instead of rendering directly, change the hash. The hashchange event will handle the rendering.
    let hash = `#${page}`;
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      hash += `?${searchParams.toString()}`;
    }
    
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      // Force render if hash is the same (e.g., clicking the same link twice)
      renderPage(page, params);
    }
  }

  function renderPage(page, params = {}) {
    currentPage = page;
    const pageConfig = pages[page];
    if (!pageConfig) return;

    // Update sidebar active state
    document.querySelectorAll('.admin-sidebar__link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    // Update breadcrumb
    const breadcrumb = document.getElementById('admin-breadcrumb');
    if (breadcrumb) {
      let label = pageConfig.title;
      if (params.action === 'new') label = `New ${pageConfig.title.replace(/s$/, '')}`;
      if (params.action === 'edit') label = `Edit ${pageConfig.title.replace(/s$/, '')}`;
      breadcrumb.innerHTML = `
        <span class="text-secondary" style="cursor:pointer" onclick="AdminApp.navigate('dashboard')">Admin</span> 
        <span class="material-symbols-outlined mx-xs" style="font-size:16px;vertical-align:middle;color:var(--text-tertiary)">chevron_right</span>
        <span>${label}</span>
      `;
    }

    // Render content
    const container = document.getElementById('admin-page-content');
    if (!container) return;
    
    // Cleanup previous page if needed (could be extended)
    container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
    
    setTimeout(() => {
      pageConfig.render(container, params);
    }, 50); // slight delay for smooth transition feel

    // Close sidebar on mobile
    document.getElementById('admin-sidebar').classList.remove('open');
  }

  function handleHashChange() {
    let hash = window.location.hash.slice(1);
    if (!hash) {
      hash = 'dashboard';
    }
    
    // Parse query params if they exist in hash (e.g. #books?action=new)
    let page = hash;
    let params = {};
    if (hash.includes('?')) {
      const parts = hash.split('?');
      page = parts[0];
      const searchParams = new URLSearchParams(parts[1]);
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
    }
    
    if (pages[page]) {
      renderPage(page, params);
    } else {
      renderPage('dashboard');
    }
  }

  // ─── Auth Flow ─────────────────────────────────
  function showLogin() {
    document.getElementById('admin-login').classList.remove('hidden');
    document.getElementById('admin-app').classList.add('hidden');
  }

  function showApp() {
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('admin-app').classList.remove('hidden');
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const spinner = document.getElementById('login-spinner');
    const submitBtn = document.getElementById('login-submit');

    errorEl.classList.add('hidden');
    spinner.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
      // For development: simulate a basic auth flow
      // In production, this uses Firebase Auth SDK
      if (typeof firebase !== 'undefined' && firebase.auth) {
        const credential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const token = await credential.user.getIdToken();
        ApiClient.setAuthToken(token);
        currentUser = { uid: credential.user.uid, email: credential.user.email };
      } else {
        // Dev mode: create a mock JWT for testing
        const payload = btoa(JSON.stringify({ sub: 'dev-admin', email, role: 'SUPER_ADMIN', admin: true, exp: Math.floor(Date.now() / 1000) + 3600 }));
        const mockToken = `eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.${payload}.dev`;
        ApiClient.setAuthToken(mockToken);
        Storage.set('admin_token', mockToken);
        currentUser = { uid: 'dev-admin', email, adminRole: 'SUPER_ADMIN' };
      }

      // Update UI
      document.getElementById('admin-name').textContent = email.split('@')[0];
      document.getElementById('admin-role').textContent = currentUser.adminRole || 'Admin';
      document.getElementById('admin-avatar').textContent = email[0].toUpperCase();

      showApp();
      navigate('dashboard');
      Toast.success('Welcome back!');
    } catch (err) {
      errorEl.textContent = err.message || 'Invalid email or password';
      errorEl.classList.remove('hidden');
    } finally {
      spinner.classList.add('hidden');
      submitBtn.disabled = false;
    }
  }

  function handleLogout() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().signOut();
    }
    ApiClient.setAuthToken(null);
    Storage.remove('admin_token');
    currentUser = null;
    showLogin();
    Toast.info('Signed out');
  }

  // ─── Initialization ────────────────────────────
  function init() {
    ThemeManager.init();

    // Setup Hash Routing
    window.addEventListener('hashchange', handleHashChange);

    // Login form
    document.getElementById('admin-login-form').addEventListener('submit', handleLogin);

    // Logout button
    document.getElementById('admin-logout').addEventListener('click', handleLogout);

    // Sidebar navigation links
    document.querySelectorAll('.admin-sidebar__link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(link.dataset.page);
      });
    });

    // Mobile sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.getElementById('admin-sidebar').classList.toggle('open');
    });

    // Check for stored session or firebase auth state
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          currentUser = { uid: user.uid, email: user.email, adminRole: 'Admin' };
          document.getElementById('admin-name').textContent = (user.email || 'Admin').split('@')[0];
          document.getElementById('admin-role').textContent = currentUser.adminRole;
          document.getElementById('admin-avatar').textContent = (user.email || 'A')[0].toUpperCase();
          showApp();
          // Only navigate if we are currently not showing anything or showing login
          const content = document.getElementById('admin-page-content').innerHTML;
          if (content.trim() === '' || content.includes('loading-overlay')) {
            handleHashChange();
          }
        } else {
          handleLogout();
        }
      });
    } else {
      const storedToken = Storage.get('admin_token');
      if (storedToken) {
        ApiClient.setAuthToken(storedToken);
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          if (payload.exp * 1000 > Date.now()) {
            currentUser = { uid: payload.sub, email: payload.email, adminRole: payload.role || 'Admin' };
            document.getElementById('admin-name').textContent = (payload.email || 'Admin').split('@')[0];
            document.getElementById('admin-role').textContent = currentUser.adminRole;
            document.getElementById('admin-avatar').textContent = (payload.email || 'A')[0].toUpperCase();
            showApp();
            handleHashChange();
            return;
          }
        } catch {}
      }
      showLogin();
    }
  }

  // Boot
  document.addEventListener('DOMContentLoaded', init);

  return { navigate, handleLogout };
})();
