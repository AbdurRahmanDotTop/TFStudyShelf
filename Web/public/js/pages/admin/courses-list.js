/**
 * TF Study Shelf — Admin Courses List Page
 */
window.AdminCoursesList = (() => {
  let currentPage = 1;
  let currentFilter = {};

  async function render(container) {
    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">Courses</h1>
          <p class="admin-page-header__subtitle">Manage your course catalog</p>
        </div>
        <div class="admin-page-header__actions">
          <button class="btn btn-primary" onclick="AdminApp.navigate('courses', {action:'new'})">
            <span class="material-symbols-outlined" style="font-size:18px">add</span> Add Course
          </button>
        </div>
      </div>

      <div class="content-toolbar">
        <div class="content-toolbar__search">
          <div class="search-bar">
            <span class="material-symbols-outlined icon">search</span>
            <input type="text" id="courses-search" placeholder="Search courses by title…">
          </div>
        </div>
        <div class="content-toolbar__filters">
          <select class="form-input" id="courses-status-filter" style="width:auto;padding:8px 32px 8px 12px;font-size:13px">
            <option value="">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Type</th>
              <th>Status</th>
              <th>Visibility</th>
              <th>Price</th>
              <th>Enrollment</th>
              <th>Updated</th>
              <th style="width:100px">Actions</th>
            </tr>
          </thead>
          <tbody id="courses-table-body">
            <tr><td colspan="8" class="text-center p-xl"><div class="spinner" style="margin:0 auto"></div></td></tr>
          </tbody>
        </table>
      </div>

      <div id="courses-pagination" class="pagination"></div>
    `;

    // Bind events
    let searchTimeout;
    document.getElementById('courses-search').addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilter.search = e.target.value;
        currentPage = 1;
        loadCourses();
      }, 300);
    });

    document.getElementById('courses-status-filter').addEventListener('change', (e) => {
      currentFilter.status = e.target.value;
      currentPage = 1;
      loadCourses();
    });

    loadCourses();
  }

  async function loadCourses() {
    const tbody = document.getElementById('courses-table-body');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center p-xl"><div class="spinner" style="margin:0 auto"></div></td></tr>';

    try {
      const params = { page: currentPage, limit: 20, ...currentFilter };
      const result = await ApiClient.admin.getCourses(params);
      const courses = result.data || [];
      const meta = result.meta;

      if (courses.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="8">
            <div class="empty-state">
              <div class="empty-state__icon">🎓</div>
              <p class="empty-state__title">No courses found</p>
              <p class="empty-state__message">
                ${currentFilter.search ? 'Try a different search term.' : 'Start by adding your first course.'}
              </p>
              ${!currentFilter.search ? '<button class="btn btn-primary" onclick="AdminApp.navigate(\'courses\', {action:\'new\'})">Add Course</button>' : ''}
            </div>
          </td></tr>
        `;
        document.getElementById('courses-pagination').innerHTML = '';
        return;
      }

      tbody.innerHTML = courses.map(course => `
        <tr>
          <td>
            <div class="flex items-center gap-sm">
              <div style="width:54px;height:40px;border-radius:var(--radius-sm);background:var(--bg-elevated);overflow:hidden;flex-shrink:0">
                ${course.coverImageUrl ? `<img src="${course.coverImageUrl}" style="width:100%;height:100%;object-fit:cover" alt="">` : `<div style="font-size:20px;text-align:center;line-height:40px">🎓</div>`}
              </div>
              <div>
                <div class="text-label-large truncate" style="max-width:200px">${escapeHtml(course.title)}</div>
                <div class="text-body-small text-tertiary">${course.id.substring(0, 8)}…</div>
              </div>
            </div>
          </td>
          <td class="text-body-medium">${escapeHtml(course.courseType || 'Self Paced')}</td>
          <td><span class="badge badge-${course.status ? course.status.toLowerCase() : 'draft'}">${course.status || 'DRAFT'}</span></td>
          <td><span class="chip chip-outline" style="font-size:11px;padding:3px 8px">${course.visibility || 'Public'}</span></td>
          <td class="text-mono text-body-small">${course.isFree ? 'Free' : (course.price ? (course.currency || '$') + course.price : '-')}</td>
          <td class="text-mono text-body-small">${course.enrollmentCount || 0}</td>
          <td class="text-body-small text-tertiary">${new Date(course.updatedAt || course.createdAt || Date.now()).toLocaleDateString()}</td>
          <td>
            <div class="flex gap-xs">
              <button class="btn-icon" title="Edit" onclick="AdminApp.navigate('courses', {action:'edit',id:'${course.id}'})">
                <span class="material-symbols-outlined" style="font-size:18px">edit</span>
              </button>
              ${course.status === 'draft' || course.status === 'unpublished' ? `
                <button class="btn-icon" title="Publish" onclick="AdminCoursesList.publishCourse('${course.id}')">
                  <span class="material-symbols-outlined" style="font-size:18px;color:#28a745">publish</span>
                </button>
              ` : ''}
              ${course.status === 'published' ? `
                <button class="btn-icon" title="Unpublish" onclick="AdminCoursesList.unpublishCourse('${course.id}')">
                  <span class="material-symbols-outlined" style="font-size:18px;color:#ffc107">unpublished</span>
                </button>
              ` : ''}
              <button class="btn-icon" title="Delete" onclick="AdminCoursesList.deleteCourse('${course.id}','${escapeHtml(course.title)}')">
                <span class="material-symbols-outlined" style="font-size:18px;color:#dc3545">delete</span>
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      // Render pagination
      if (meta && meta.total > meta.limit) {
        const totalPages = Math.ceil(meta.total / meta.limit);
        const pag = document.getElementById('courses-pagination');
        let html = `<button class="pagination__btn" onclick="AdminCoursesList.goToPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}><span class="material-symbols-outlined" style="font-size:18px">chevron_left</span></button>`;
        for (let i = 1; i <= totalPages && i <= 10; i++) {
          html += `<button class="pagination__btn ${i === currentPage ? 'active' : ''}" onclick="AdminCoursesList.goToPage(${i})">${i}</button>`;
        }
        html += `<button class="pagination__btn" onclick="AdminCoursesList.goToPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}><span class="material-symbols-outlined" style="font-size:18px">chevron_right</span></button>`;
        pag.innerHTML = html;
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center p-xl text-secondary">Failed to load courses. ${err.message}</td></tr>`;
    }
  }

  function goToPage(page) {
    currentPage = page;
    loadCourses();
  }

  async function publishCourse(id) {
    Modal.confirm('Publish Course', 'This course will be visible to all users. Continue?', async () => {
      try {
        await ApiClient.admin.publishCourse(id);
        Toast.success('Course published successfully');
        loadCourses();
      } catch (err) { Toast.error(err.message); }
    }, 'Publish', 'btn-primary');
  }

  async function unpublishCourse(id) {
    Modal.confirm('Unpublish Course', 'This course will be hidden from users. Continue?', async () => {
      try {
        await ApiClient.admin.unpublishCourse(id);
        Toast.success('Course unpublished');
        loadCourses();
      } catch (err) { Toast.error(err.message); }
    }, 'Unpublish', 'btn-secondary');
  }

  async function deleteCourse(id, title) {
    Modal.confirm('Delete Course', `Are you sure you want to permanently delete <strong>"${title}"</strong>? This cannot be undone.`, async () => {
      try {
        await ApiClient.admin.deleteCourse(id);
        Toast.success('Course deleted');
        loadCourses();
      } catch (err) { Toast.error(err.message); }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { render, goToPage, publishCourse, unpublishCourse, deleteCourse };
})();
