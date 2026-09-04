/**
 * TF Study Shelf — Admin Books List Page
 */
const AdminBooksList = (() => {
  let currentPage = 1;
  let currentFilter = {};

  async function render(container) {
    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">Books</h1>
          <p class="admin-page-header__subtitle">Manage your book catalog</p>
        </div>
        <div class="admin-page-header__actions">
          <button class="btn btn-primary" onclick="AdminApp.navigate('books', {action:'new'})">
            <span class="material-symbols-outlined" style="font-size:18px">add</span> Add Book
          </button>
        </div>
      </div>

      <div class="content-toolbar">
        <div class="content-toolbar__search">
          <div class="search-bar">
            <span class="material-symbols-outlined icon">search</span>
            <input type="text" id="books-search" placeholder="Search books by title or author…">
          </div>
        </div>
        <div class="content-toolbar__filters">
          <select class="form-input" id="books-status-filter" style="width:auto;padding:8px 32px 8px 12px;font-size:13px">
            <option value="">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="REVIEW">Review</option>
            <option value="UNPUBLISHED">Unpublished</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Author</th>
              <th>Status</th>
              <th>Difficulty</th>
              <th>Pages</th>
              <th>Rights</th>
              <th>Updated</th>
              <th style="width:100px">Actions</th>
            </tr>
          </thead>
          <tbody id="books-table-body">
            <tr><td colspan="8" class="text-center p-xl"><div class="spinner" style="margin:0 auto"></div></td></tr>
          </tbody>
        </table>
      </div>

      <div id="books-pagination" class="pagination"></div>
    `;

    // Bind events
    let searchTimeout;
    document.getElementById('books-search').addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilter.search = e.target.value;
        currentPage = 1;
        loadBooks();
      }, 300);
    });

    document.getElementById('books-status-filter').addEventListener('change', (e) => {
      currentFilter.status = e.target.value;
      currentPage = 1;
      loadBooks();
    });

    loadBooks();
  }

  async function loadBooks() {
    const tbody = document.getElementById('books-table-body');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center p-xl"><div class="spinner" style="margin:0 auto"></div></td></tr>';

    try {
      const params = { page: currentPage, limit: 20, ...currentFilter };
      const result = await ApiClient.admin.getBooks(params);
      const books = result.data;
      const meta = result.meta;

      if (books.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="8">
            <div class="empty-state">
              <div class="empty-state__icon">📚</div>
              <p class="empty-state__title">No books found</p>
              <p class="empty-state__message">
                ${currentFilter.search ? 'Try a different search term.' : 'Start by adding your first book.'}
              </p>
              ${!currentFilter.search ? '<button class="btn btn-primary" onclick="AdminApp.navigate(\'books\', {action:\'new\'})">Add Book</button>' : ''}
            </div>
          </td></tr>
        `;
        document.getElementById('books-pagination').innerHTML = '';
        return;
      }

      tbody.innerHTML = books.map(book => `
        <tr>
          <td>
            <div class="flex items-center gap-sm">
              <div style="width:40px;height:54px;border-radius:var(--radius-sm);background:var(--bg-elevated);overflow:hidden;flex-shrink:0">
                ${book.url ? `<img src="${book.url}" style="width:100%;height:100%;object-fit:cover" alt="">` : `<div style="font-size:24px;text-align:center;line-height:54px">${book.emoji || '📘'}</div>`}
              </div>
              <div>
                <div class="text-label-large truncate" style="max-width:200px">${escapeHtml(book.title)}</div>
                <div class="text-body-small text-tertiary">${book.id.substring(0, 8)}…</div>
              </div>
            </div>
          </td>
          <td class="text-body-medium">${escapeHtml(book.author)}</td>
          <td><span class="badge badge-${book.status.toLowerCase()}">${book.status}</span></td>
          <td><span class="chip chip-outline" style="font-size:11px;padding:3px 8px">${book.difficulty || 'MEDIUM'}</span></td>
          <td class="text-mono text-body-small">${book.pages || 0}</td>
          <td><span class="text-body-small ${book.rightsStatus === 'RESTRICTED' ? 'text-accent' : 'text-secondary'}">${(book.rightsStatus || 'RESTRICTED').replace('_', ' ')}</span></td>
          <td class="text-body-small text-tertiary">${new Date(book.updatedAt || book.createdAt || Date.now()).toLocaleDateString()}</td>
          <td>
            <div class="flex gap-xs">
              <button class="btn-icon" title="Edit" onclick="AdminApp.navigate('books', {action:'edit',id:'${book.id}'})">
                <span class="material-symbols-outlined" style="font-size:18px">edit</span>
              </button>
              ${book.status === 'draft' || book.status === 'unpublished' ? `
                <button class="btn-icon" title="Publish" onclick="AdminBooksList.publishBook('${book.id}')">
                  <span class="material-symbols-outlined" style="font-size:18px;color:#28a745">publish</span>
                </button>
              ` : ''}
              ${book.status === 'published' ? `
                <button class="btn-icon" title="Unpublish" onclick="AdminBooksList.unpublishBook('${book.id}')">
                  <span class="material-symbols-outlined" style="font-size:18px;color:#ffc107">unpublished</span>
                </button>
              ` : ''}
              <button class="btn-icon" title="Delete" onclick="AdminBooksList.deleteBook('${book.id}','${escapeHtml(book.title)}')">
                <span class="material-symbols-outlined" style="font-size:18px;color:#dc3545">delete</span>
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      // Render pagination
      if (meta && meta.total > meta.limit) {
        const totalPages = Math.ceil(meta.total / meta.limit);
        const pag = document.getElementById('books-pagination');
        let html = `<button class="pagination__btn" onclick="AdminBooksList.goToPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}><span class="material-symbols-outlined" style="font-size:18px">chevron_left</span></button>`;
        for (let i = 1; i <= totalPages && i <= 10; i++) {
          html += `<button class="pagination__btn ${i === currentPage ? 'active' : ''}" onclick="AdminBooksList.goToPage(${i})">${i}</button>`;
        }
        html += `<button class="pagination__btn" onclick="AdminBooksList.goToPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}><span class="material-symbols-outlined" style="font-size:18px">chevron_right</span></button>`;
        pag.innerHTML = html;
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center p-xl text-secondary">Failed to load books. ${err.message}</td></tr>`;
    }
  }

  function goToPage(page) {
    currentPage = page;
    loadBooks();
  }

  async function publishBook(id) {
    Modal.confirm('Publish Book', 'This book will be visible to all users. Continue?', async () => {
      try {
        await ApiClient.admin.publishBook(id);
        Toast.success('Book published successfully');
        loadBooks();
      } catch (err) { Toast.error(err.message); }
    }, 'Publish', 'btn-primary');
  }

  async function unpublishBook(id) {
    Modal.confirm('Unpublish Book', 'This book will be hidden from users. Continue?', async () => {
      try {
        await ApiClient.admin.unpublishBook(id);
        Toast.success('Book unpublished');
        loadBooks();
      } catch (err) { Toast.error(err.message); }
    }, 'Unpublish', 'btn-secondary');
  }

  async function deleteBook(id, title) {
    Modal.confirm('Delete Book', `Are you sure you want to permanently delete <strong>"${title}"</strong>? This cannot be undone.`, async () => {
      try {
        await ApiClient.admin.deleteBook(id);
        Toast.success('Book deleted');
        loadBooks();
      } catch (err) { Toast.error(err.message); }
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { render, goToPage, publishBook, unpublishBook, deleteBook };
})();
