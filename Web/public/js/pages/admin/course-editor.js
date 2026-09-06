/**
 * TF Study Shelf — Admin Course Editor
 */
window.AdminCourseEditor = (() => {
  let editingCourseId = null;
  let currentTab = 'basic';
  let categories = [];
  let subjects = [];

  const tabs = [
    { id: 'basic', icon: 'info', label: 'Basic Info' },
    { id: 'organization', icon: 'category', label: 'Organization' },
    { id: 'curriculum', icon: 'view_list', label: 'Curriculum' },
    { id: 'assessments', icon: 'quiz', label: 'Assessments' },
    { id: 'resources', icon: 'folder', label: 'Resources' },
    { id: 'enrollments', icon: 'group', label: 'Enrollments' },
    { id: 'certificates', icon: 'workspace_premium', label: 'Certificates' },
    { id: 'discussions', icon: 'forum', label: 'Discussions' },
    { id: 'settings', icon: 'settings', label: 'Settings' }
  ];

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function render(container, params = {}) {
    editingCourseId = params.id || null;
    const isEdit = !!editingCourseId;

    // Render workspace shell
    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">${isEdit ? 'Edit Course' : 'Create Course'}</h1>
          <p class="admin-page-header__subtitle">Manage course content, curriculum, and settings</p>
        </div>
        <div class="admin-page-header__actions">
          <button class="btn btn-ghost" onclick="AdminApp.navigate('courses')">Cancel</button>
          <button class="btn btn-secondary" id="save-draft-btn" onclick="AdminCourseEditor.save('DRAFT')">Save Draft</button>
          <button class="btn btn-primary" id="save-publish-btn" onclick="AdminCourseEditor.save('PUBLISHED')">
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
          <form id="course-editor-form">
            <div id="tab-content-basic" class="workspace-tab-pane ${currentTab === 'basic' ? '' : 'hidden'}">
              <h3 class="mb-lg" style="font-size:18px;font-weight:600">Basic Information</h3>
              <div class="form-group mb-md">
                <label class="form-label" for="course-title">Course Title *</label>
                <input type="text" id="course-title" class="form-input" placeholder="e.g. Advanced Mathematics" required>
              </div>
              <div class="form-group mb-md">
                <label class="form-label" for="course-subtitle">Subtitle</label>
                <input type="text" id="course-subtitle" class="form-input" placeholder="A brief catchphrase for the course">
              </div>
              <div class="form-group mb-md">
                <label class="form-label" for="course-description">Description *</label>
                <textarea id="course-description" class="form-input" rows="5" placeholder="Detailed course description..." required></textarea>
              </div>
              <div class="form-group mb-md">
                <label class="form-label" for="course-cover-url">Cover Image URL</label>
                <input type="url" id="course-cover-url" class="form-input" placeholder="https://...">
              </div>
            </div>

            <div id="tab-content-organization" class="workspace-tab-pane ${currentTab === 'organization' ? '' : 'hidden'}">
              <h3 class="mb-lg" style="font-size:18px;font-weight:600">Organization & Taxonomy</h3>
              <p class="text-body-small text-tertiary mb-lg">Classify this course so learners can find it.</p>
              
              <div class="form-group mb-md">
                <label class="form-label">Course Type</label>
                <select id="course-type" class="form-input">
                  <option value="Self Paced">Self Paced</option>
                  <option value="Instructor Led">Instructor Led</option>
                  <option value="Cohort">Cohort</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Certification">Certification</option>
                </select>
              </div>

              <div class="form-group mb-md">
                <label class="form-label">Categories</label>
                <div id="course-category-checkboxes" class="flex gap-sm" style="flex-wrap:wrap">Loading...</div>
              </div>
              
              <div class="form-group mb-md">
                <label class="form-label">Subjects</label>
                <div id="course-subject-checkboxes" class="flex gap-sm" style="flex-wrap:wrap">Loading...</div>
              </div>
            </div>

            <div id="tab-content-curriculum" class="workspace-tab-pane ${currentTab === 'curriculum' ? '' : 'hidden'}">
              <h3 class="mb-lg" style="font-size:18px;font-weight:600">Curriculum Builder</h3>
              ${isEdit ? `
                <div class="flex items-center justify-between mb-md">
                  <p class="text-body-small text-tertiary">Manage sections and lessons.</p>
                  <button class="btn btn-secondary btn-sm" onclick="AdminCourseEditor.openSectionModal(); return false;">
                    <span class="material-symbols-outlined" style="font-size:16px">add</span> Add Section
                  </button>
                </div>
                <div id="curriculum-list" style="display:flex;flex-direction:column;gap:var(--space-md);">
                  <div class="text-body-small text-tertiary text-center p-xl">Loading curriculum...</div>
                </div>
              ` : `
                <div class="empty-state">
                  <p class="text-body-small text-tertiary">Save the course first to start building the curriculum.</p>
                </div>
              `}
            </div>

            <div id="tab-content-assessments" class="workspace-tab-pane ${currentTab === 'assessments' ? '' : 'hidden'}">
              <h3 class="mb-lg" style="font-size:18px;font-weight:600">Assessments</h3>
              <p class="text-body-small text-tertiary">Manage quizzes, exams, and assignments for this course.</p>
            </div>

            <div id="tab-content-resources" class="workspace-tab-pane ${currentTab === 'resources' ? '' : 'hidden'}">
              <h3 class="mb-lg" style="font-size:18px;font-weight:600">Resources</h3>
              <p class="text-body-small text-tertiary">Upload or link supplementary materials.</p>
            </div>

            <div id="tab-content-enrollments" class="workspace-tab-pane ${currentTab === 'enrollments' ? '' : 'hidden'}">
              <h3 class="mb-lg" style="font-size:18px;font-weight:600">Enrollments</h3>
              <p class="text-body-small text-tertiary">Manage learners enrolled in this course.</p>
              <div id="enrollments-list" class="mt-md"></div>
            </div>

            <div id="tab-content-certificates" class="workspace-tab-pane ${currentTab === 'certificates' ? '' : 'hidden'}">
              <h3 class="mb-lg" style="font-size:18px;font-weight:600">Certificates</h3>
              <p class="text-body-small text-tertiary">View and issue certificates for this course.</p>
              <div id="certificates-list" class="mt-md"></div>
            </div>

            <div id="tab-content-discussions" class="workspace-tab-pane ${currentTab === 'discussions' ? '' : 'hidden'}">
              <h3 class="mb-lg" style="font-size:18px;font-weight:600">Discussions</h3>
              <p class="text-body-small text-tertiary">Monitor and moderate course discussions.</p>
              <div id="discussions-list" class="mt-md"></div>
            </div>

            <div id="tab-content-settings" class="workspace-tab-pane ${currentTab === 'settings' ? '' : 'hidden'}">
              <h3 class="mb-lg" style="font-size:18px;font-weight:600">Course Settings</h3>
              
              <div class="form-group mb-md">
                <label class="form-label">Visibility</label>
                <select id="course-visibility" class="form-input">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                </select>
              </div>

              <div class="form-group mb-md">
                <label class="checkbox-label">
                  <input type="checkbox" id="course-is-free"> Free Course
                </label>
              </div>

              <div class="form-group mb-md" id="price-group">
                <label class="form-label">Price</label>
                <div class="flex items-center gap-sm">
                  <select id="course-currency" class="form-input" style="width:80px">
                    <option value="INR">₹</option>
                    <option value="USD">$</option>
                  </select>
                  <input type="number" id="course-price" class="form-input" placeholder="0.00" min="0" step="0.01">
                </div>
              </div>

              <div class="form-group mb-md">
                <label class="checkbox-label">
                  <input type="checkbox" id="course-certificate"> Enable Certificate of Completion
                </label>
              </div>

              <div class="form-group mb-md">
                <label class="form-label" for="course-prerequisites">Prerequisites</label>
                <textarea id="course-prerequisites" class="form-input" rows="3" placeholder="List any prerequisite knowledge or courses..."></textarea>
              </div>

              <div class="form-group mb-md">
                <label class="form-label" for="course-completion-rules">Completion Rules</label>
                <textarea id="course-completion-rules" class="form-input" rows="3" placeholder="Criteria to complete the course (e.g. All assessments passed, 100% video watched)"></textarea>
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
      loadCurriculum();
      loadPhase4Data();
      loadPhase6Data();
    }
  }

  function bindEvents() {
    // Tab switching
    document.querySelectorAll('.workspace-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = tabBtn.getAttribute('data-tab');
        currentTab = tabId;
        
        // Update active class on buttons
        document.querySelectorAll('.workspace-tab').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');

        // Show/hide panes
        document.querySelectorAll('.workspace-tab-pane').forEach(p => p.classList.add('hidden'));
        document.getElementById(`tab-content-${tabId}`).classList.remove('hidden');
      });
    });

    // Price toggle
    const freeCheck = document.getElementById('course-is-free');
    const priceGroup = document.getElementById('price-group');
    if (freeCheck && priceGroup) {
      freeCheck.addEventListener('change', (e) => {
        priceGroup.style.opacity = e.target.checked ? '0.5' : '1';
        priceGroup.style.pointerEvents = e.target.checked ? 'none' : 'auto';
        if (e.target.checked) {
          document.getElementById('course-price').value = '';
        }
      });
    }
  }

  async function loadFormData(isEdit) {
    try {
      const [catSettled, subSettled] = await Promise.allSettled([
        ApiClient.admin.getCategories(),
        ApiClient.admin.getSubjects()
      ]);
      
      categories = catSettled.status === 'fulfilled' ? (catSettled.value.data || []) : [];
      subjects = subSettled.status === 'fulfilled' ? (subSettled.value.data || []) : [];

      document.getElementById('course-category-checkboxes').innerHTML = categories.length
        ? categories.map(c => `<label class="checkbox-label"><input type="checkbox" value="${c.id}" class="cat-checkbox"> ${c.name}</label>`).join('')
        : '<span class="text-body-small text-tertiary">No categories yet.</span>';

      document.getElementById('course-subject-checkboxes').innerHTML = subjects.length
        ? subjects.map(s => `<label class="checkbox-label"><input type="checkbox" value="${s.id}" class="sub-checkbox"> ${s.name}</label>`).join('')
        : '<span class="text-body-small text-tertiary">No subjects yet.</span>';

    } catch (err) {
      console.error('Failed to load taxonomies:', err);
    }

    if (isEdit) {
      try {
        const result = await ApiClient.admin.getCourses({ id: editingCourseId }); // Or getCourse if that endpoint exists in admin
        // Quick fallback for now assuming we might not have a dedicated admin getCourse yet
        let course;
        if (Array.isArray(result.data)) {
           course = result.data.find(c => c.id === editingCourseId) || result.data[0];
        } else {
           course = result.data;
        }
        
        if (course) {
          document.getElementById('course-title').value = course.title || '';
          document.getElementById('course-subtitle').value = course.subtitle || '';
          document.getElementById('course-description').value = course.description || '';
          document.getElementById('course-cover-url').value = course.coverImageUrl || '';
          document.getElementById('course-type').value = course.courseType || 'Self Paced';
          document.getElementById('course-visibility').value = course.visibility || 'public';
          
          if (course.isFree) {
            document.getElementById('course-is-free').checked = true;
            document.getElementById('price-group').style.opacity = '0.5';
            document.getElementById('price-group').style.pointerEvents = 'none';
          } else {
            document.getElementById('course-price').value = course.price || '';
            document.getElementById('course-currency').value = course.currency || 'INR';
          }
          if (course.certificateEnabled) {
            document.getElementById('course-certificate').checked = true;
          }
          document.getElementById('course-prerequisites').value = course.prerequisites || '';
          document.getElementById('course-completion-rules').value = course.completionRules || '';
        }
      } catch (err) {
        Toast.error('Failed to load course details');
      }
    }
  }

  async function save(status) {
    const title = document.getElementById('course-title').value.trim();
    if (!title) { Toast.error('Title is required'); return; }

    const body = {
      title,
      subtitle: document.getElementById('course-subtitle').value.trim(),
      description: document.getElementById('course-description').value.trim(),
      coverImageUrl: document.getElementById('course-cover-url').value.trim(),
      courseType: document.getElementById('course-type').value,
      visibility: document.getElementById('course-visibility').value,
      isFree: document.getElementById('course-is-free').checked,
      price: parseFloat(document.getElementById('course-price').value) || 0,
      currency: document.getElementById('course-currency').value,
      status: status,
      certificateEnabled: document.getElementById('course-certificate').checked,
      prerequisites: document.getElementById('course-prerequisites').value.trim(),
      completionRules: document.getElementById('course-completion-rules').value.trim()
    };

    const draftBtn = document.getElementById('save-draft-btn');
    const pubBtn = document.getElementById('save-publish-btn');
    if(draftBtn) draftBtn.disabled = true;
    if(pubBtn) pubBtn.disabled = true;

    try {
      if (editingCourseId) {
        await ApiClient.admin.updateCourse(editingCourseId, body);
        Toast.success('Course updated');
      } else {
        await ApiClient.admin.createCourse(body);
        Toast.success('Course created');
      }
      AdminApp.navigate('courses');
    } catch (err) {
      Toast.error(err.message);
    } finally {
      if(draftBtn) draftBtn.disabled = false;
      if(pubBtn) pubBtn.disabled = false;
    }
  }

  async function loadCurriculum() {
    try {
      const resSections = await ApiClient.admin.getCourseSections(editingCourseId);
      const sections = resSections.data || [];
      
      const list = document.getElementById('curriculum-list');
      
      if (sections.length === 0) {
        list.innerHTML = '<div class="text-body-small text-tertiary text-center p-xl" style="border:1px dashed var(--border);border-radius:var(--radius-md);">No sections added yet.</div>';
        return;
      }

      let html = '';
      for (const section of sections) {
        // Fetch lessons for this section
        const resLessons = await ApiClient.admin.getCourseLessons(section.id);
        const lessons = resLessons.data || [];
        
        let lessonsHtml = '';
        if (lessons.length === 0) {
          lessonsHtml = '<div class="text-body-small text-tertiary p-sm">No lessons in this section.</div>';
        } else {
          lessonsHtml = lessons.map(l => `
            <div class="flex items-center justify-between p-sm mb-xs" style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);">
              <div class="flex items-center gap-sm">
                <span class="material-symbols-outlined text-secondary" style="font-size:18px">${getIconForLessonType(l.lesson_type)}</span>
                <span class="text-body-small" style="font-weight:500">${escapeHtml(l.title)}</span>
                ${l.is_free_preview ? '<span class="badge" style="background:#e0f2f1;color:#00695c;font-size:10px;padding:2px 6px;">Preview</span>' : ''}
              </div>
              <div class="flex items-center gap-xs">
                <span class="text-tertiary" style="font-size:12px;margin-right:8px">${l.duration_minutes ? l.duration_minutes + 'm' : ''}</span>
                <button class="btn-icon" onclick="AdminCourseEditor.openLessonModal('${section.id}', '${l.id}'); return false;"><span class="material-symbols-outlined" style="font-size:16px">edit</span></button>
                <button class="btn-icon" onclick="AdminCourseEditor.deleteLesson('${section.id}', '${l.id}'); return false;"><span class="material-symbols-outlined" style="font-size:16px;color:var(--error)">delete</span></button>
              </div>
            </div>
          `).join('');
        }

        html += `
          <div class="card p-md" style="border:1px solid var(--border);background:#fcfcfc;">
            <div class="flex items-center justify-between mb-sm">
              <div class="text-body-medium" style="font-weight:600">${escapeHtml(section.title)}</div>
              <div class="flex gap-xs">
                <button class="btn btn-secondary btn-sm" onclick="AdminCourseEditor.openLessonModal('${section.id}'); return false;">Add Lesson</button>
                <button class="btn-icon" onclick="AdminCourseEditor.openSectionModal('${section.id}'); return false;"><span class="material-symbols-outlined" style="font-size:18px">edit</span></button>
                <button class="btn-icon" onclick="AdminCourseEditor.deleteSection('${section.id}'); return false;"><span class="material-symbols-outlined" style="font-size:18px;color:var(--error)">delete</span></button>
              </div>
            </div>
            <div class="pl-md" style="border-left:2px solid var(--border)">
              ${lessonsHtml}
            </div>
          </div>
        `;
      }
      
      list.innerHTML = html;
    } catch (e) {
      document.getElementById('curriculum-list').innerHTML = '<div class="text-error">Failed to load Curriculum</div>';
    }
  }
  
  function getIconForLessonType(type) {
    const icons = {
      'VIDEO': 'play_circle',
      'ARTICLE': 'article',
      'DOCUMENT': 'description',
      'QUIZ': 'quiz',
      'ASSIGNMENT': 'assignment'
    };
    return icons[type] || 'description';
  }

  const openSectionModal = async function(sectionId = null) {
    let section = null;
    if (sectionId) {
      const res = await ApiClient.admin.getCourseSections(editingCourseId);
      section = (res.data || []).find(s => s.id === sectionId);
    }
    
    Modal.form(section ? 'Edit Section' : 'Add Section', `
      <div class="form-group mb-md">
        <label class="form-label">Title</label>
        <input type="text" id="section-title" class="form-input" value="${section ? escapeHtml(section.title) : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Description (Optional)</label>
        <textarea id="section-desc" class="form-input" rows="2">${section && section.description ? escapeHtml(section.description) : ''}</textarea>
      </div>
    `, async () => {
      const title = document.getElementById('section-title').value.trim();
      const desc = document.getElementById('section-desc').value.trim();
      if (!title) { Toast.error('Title is required'); return false; }
      
      try {
        if (section) {
          await ApiClient.admin.updateCourseSection(editingCourseId, section.id, { title, description: desc });
          Toast.success('Section updated');
        } else {
          await ApiClient.admin.createCourseSection(editingCourseId, { title, description: desc });
          Toast.success('Section created');
        }
        loadCurriculum();
        return true;
      } catch (e) { Toast.error(e.message); return false; }
    });
  };

  const deleteSection = function(sectionId) {
    Modal.confirm('Delete Section', 'Are you sure? This will delete all lessons in this section.', async () => {
      await ApiClient.admin.deleteCourseSection(editingCourseId, sectionId);
      loadCurriculum();
    });
  };

  const openLessonModal = async function(sectionId, lessonId = null) {
    let lesson = null;
    let codingData = null;
    let liveData = null;
    
    if (lessonId) {
      const res = await ApiClient.admin.getCourseLessons(sectionId);
      lesson = (res.data || []).find(l => l.id === lessonId);
      
      if (lesson && lesson.lesson_type === 'CODING') {
        const cRes = await ApiClient.admin.getCodingLesson(lesson.id);
        codingData = cRes.data;
      } else if (lesson && lesson.lesson_type === 'LIVE_SESSION') {
        const lRes = await ApiClient.admin.getLiveSession(lesson.id);
        liveData = lRes.data;
      }
    }
    
    Modal.form(lesson ? 'Edit Lesson' : 'Add Lesson', `
      <div class="form-group mb-md">
        <label class="form-label">Lesson Title</label>
        <input type="text" id="lesson-title" class="form-input" value="${lesson ? escapeHtml(lesson.title) : ''}">
      </div>
      <div class="form-group mb-md">
        <label class="form-label">Lesson Type</label>
        <select id="lesson-type" class="form-input" onchange="
          const type = this.value;
          document.getElementById('content-url-group').style.display = ['VIDEO', 'DOCUMENT', 'ARTICLE', 'QUIZ', 'ASSIGNMENT'].includes(type) ? 'block' : 'none';
          document.getElementById('coding-group').style.display = type === 'CODING' ? 'block' : 'none';
          document.getElementById('live-group').style.display = type === 'LIVE_SESSION' ? 'block' : 'none';
        ">
          <option value="VIDEO" ${lesson && lesson.lesson_type === 'VIDEO' ? 'selected' : ''}>Video</option>
          <option value="ARTICLE" ${lesson && lesson.lesson_type === 'ARTICLE' ? 'selected' : ''}>Article</option>
          <option value="DOCUMENT" ${lesson && lesson.lesson_type === 'DOCUMENT' ? 'selected' : ''}>Document/PDF</option>
          <option value="QUIZ" ${lesson && lesson.lesson_type === 'QUIZ' ? 'selected' : ''}>Quiz</option>
          <option value="ASSIGNMENT" ${lesson && lesson.lesson_type === 'ASSIGNMENT' ? 'selected' : ''}>Assignment</option>
          <option value="CODING" ${lesson && lesson.lesson_type === 'CODING' ? 'selected' : ''}>Coding Exercise</option>
          <option value="LIVE_SESSION" ${lesson && lesson.lesson_type === 'LIVE_SESSION' ? 'selected' : ''}>Live Session</option>
        </select>
      </div>
      
      <!-- Standard Fields -->
      <div class="form-group mb-md" id="content-url-group" style="display: ${lesson && ['CODING', 'LIVE_SESSION'].includes(lesson.lesson_type) ? 'none' : 'block'};">
        <label class="form-label">Content URL (e.g., YouTube URL, Google Drive link, R2 link)</label>
        <input type="url" id="lesson-url" class="form-input" value="${lesson ? escapeHtml(lesson.content_url || '') : ''}" placeholder="https://...">
      </div>
      
      <!-- Coding Fields -->
      <div id="coding-group" style="display: ${lesson && lesson.lesson_type === 'CODING' ? 'block' : 'none'}; border: 1px solid var(--border); padding: var(--space-md); border-radius: var(--radius-md); margin-bottom: var(--space-md);">
        <h4 class="mb-sm">Coding Details</h4>
        <div class="form-group mb-sm">
          <label class="form-label">Language</label>
          <select id="coding-lang" class="form-input">
            <option value="javascript" ${codingData && codingData.language === 'javascript' ? 'selected' : ''}>JavaScript</option>
            <option value="python" ${codingData && codingData.language === 'python' ? 'selected' : ''}>Python</option>
          </select>
        </div>
        <div class="form-group mb-sm">
          <label class="form-label">Starter Code</label>
          <textarea id="coding-starter" class="form-input" rows="4" style="font-family: monospace;">${codingData ? escapeHtml(codingData.starter_code || '') : ''}</textarea>
        </div>
      </div>
      
      <!-- Live Session Fields -->
      <div id="live-group" style="display: ${lesson && lesson.lesson_type === 'LIVE_SESSION' ? 'block' : 'none'}; border: 1px solid var(--border); padding: var(--space-md); border-radius: var(--radius-md); margin-bottom: var(--space-md);">
        <h4 class="mb-sm">Live Session Details</h4>
        <div class="form-group mb-sm">
          <label class="form-label">Meeting URL</label>
          <input type="url" id="live-url" class="form-input" value="${liveData ? escapeHtml(liveData.meeting_url || '') : ''}" placeholder="https://zoom.us/...">
        </div>
        <div class="form-group mb-sm">
          <label class="form-label">Start Time</label>
          <input type="datetime-local" id="live-start" class="form-input" value="${liveData ? (liveData.start_time || '').slice(0,16) : ''}">
        </div>
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="lesson-preview" ${lesson && lesson.is_preview ? 'checked' : ''}> Is Preview (Available for free)
        </label>
      </div>
    `, async () => {
      const title = document.getElementById('lesson-title').value.trim();
      const type = document.getElementById('lesson-type').value;
      const url = document.getElementById('lesson-url').value.trim();
      const isPreview = document.getElementById('lesson-preview').checked;
      
      if (!title) { Toast.error('Title is required'); return false; }
      
      const body = { title, lessonType: type, contentUrl: url, isPreview };
      
      try {
        let savedLessonId = lessonId;
        if (lesson) {
          await ApiClient.admin.updateCourseLesson(sectionId, lesson.id, body);
          Toast.success('Lesson updated');
        } else {
          const res = await ApiClient.admin.createCourseLesson(sectionId, body);
          savedLessonId = res.id;
          Toast.success('Lesson created');
        }
        
        // Save additional data based on type
        if (type === 'CODING') {
          await ApiClient.admin.saveCodingLesson(editingCourseId, savedLessonId, {
            language: document.getElementById('coding-lang').value,
            starterCode: document.getElementById('coding-starter').value
          });
        } else if (type === 'LIVE_SESSION') {
          await ApiClient.admin.saveLiveSession(editingCourseId, savedLessonId, {
            meetingUrl: document.getElementById('live-url').value,
            startTime: document.getElementById('live-start').value || new Date().toISOString()
          });
        }
        
        loadCurriculum();
        return true;
      } catch (e) { Toast.error(e.message); return false; }
    });
  };

  const deleteLesson = function(sectionId, lessonId) {
    Modal.confirm('Delete Lesson', 'Are you sure?', async () => {
      await ApiClient.admin.deleteCourseLesson(sectionId, lessonId);
      loadCurriculum();
    });
  };

  // ─── Phase 4: Assessments, Assignments, Projects, Resources ───
  let assessments = [];
  let assignments = [];
  let projects = [];
  let resourcesList = [];

  async function loadPhase4Data() {
    if (!editingCourseId) return;
    try {
      const [assmnts, assigns, projs, res] = await Promise.all([
        ApiClient.admin.getCourseAssessments(editingCourseId),
        ApiClient.admin.getCourseAssignments(editingCourseId),
        ApiClient.admin.getCourseProjects(editingCourseId),
        ApiClient.admin.getCourseResources(editingCourseId)
      ]);
      assessments = assmnts.data || [];
      assignments = assigns.data || [];
      projects = projs.data || [];
      resourcesList = res.data || [];
      
      renderAssessmentsTab();
      renderResourcesTab();
    } catch (error) {
      console.error('Error loading Phase 4 data:', error);
      Toast.error('Failed to load assessments or resources');
    }
  }

  // ─── Phase 6: Enrollments, Certificates, Discussions ───
  async function loadPhase6Data() {
    if (!editingCourseId) return;
    try {
      document.getElementById('enrollments-list').innerHTML = '<p class="text-tertiary text-body-small" style="padding:var(--space-xl); border:1px dashed var(--border); border-radius:var(--radius-md); text-align:center;">Enrollment management UI goes here.</p>';
      document.getElementById('certificates-list').innerHTML = '<p class="text-tertiary text-body-small" style="padding:var(--space-xl); border:1px dashed var(--border); border-radius:var(--radius-md); text-align:center;">Certificates management UI goes here.</p>';
      document.getElementById('discussions-list').innerHTML = '<p class="text-tertiary text-body-small" style="padding:var(--space-xl); border:1px dashed var(--border); border-radius:var(--radius-md); text-align:center;">Discussions moderation UI goes here.</p>';
    } catch (err) {
      console.error('Error loading Phase 6 data:', err);
    }
  }

  function renderAssessmentsTab() {
    const container = document.getElementById('tab-content-assessments');
    if (!container) return;
    
    let html = `
      <h3 class="mb-lg" style="font-size:18px;font-weight:600">Assessments</h3>
      <p class="text-body-small text-tertiary mb-xl">Manage quizzes, exams, assignments, and projects for this course.</p>
      
      <!-- Quizzes & Exams -->
      <div class="flex items-center justify-between mb-md">
        <h4 style="font-size:16px;font-weight:600">Quizzes & Exams</h4>
        <button class="btn btn-secondary btn-sm" onclick="AdminCourseEditor.openAssessmentModal(); return false;">
          <span class="material-symbols-outlined" style="font-size:16px">add</span> Add Assessment
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-md);margin-bottom:var(--space-2xl);">
        ${assessments.length === 0 ? '<p class="text-body-small text-tertiary">No assessments found.</p>' : ''}
        ${assessments.map(a => `
          <div class="card p-md flex items-center justify-between" style="border:1px solid var(--border);">
            <div>
              <div style="font-weight:500;">${escapeHtml(a.title)}</div>
              <div class="text-body-small text-tertiary">${a.assessment_type} • ${a.status}</div>
            </div>
            <div class="flex gap-sm items-center">
              <button class="btn btn-secondary btn-sm" onclick="AdminCourseEditor.openQuestionsModal('${a.id}', '${escapeHtml(a.title)}'); return false;">Questions</button>
              <button class="btn-icon" onclick="AdminCourseEditor.openAssessmentModal('${a.id}'); return false;"><span class="material-symbols-outlined" style="font-size:18px">edit</span></button>
              <button class="btn-icon" onclick="AdminCourseEditor.deleteAssessment('${a.id}'); return false;"><span class="material-symbols-outlined" style="font-size:18px;color:var(--error)">delete</span></button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Assignments -->
      <div class="flex items-center justify-between mb-md">
        <h4 style="font-size:16px;font-weight:600">Assignments</h4>
        <button class="btn btn-secondary btn-sm" onclick="AdminCourseEditor.openAssignmentModal(); return false;">
          <span class="material-symbols-outlined" style="font-size:16px">add</span> Add Assignment
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-md);margin-bottom:var(--space-2xl);">
        ${assignments.length === 0 ? '<p class="text-body-small text-tertiary">No assignments found.</p>' : ''}
        ${assignments.map(a => `
          <div class="card p-md flex items-center justify-between" style="border:1px solid var(--border);">
            <div>
              <div style="font-weight:500;">${escapeHtml(a.title)}</div>
              <div class="text-body-small text-tertiary">Due: ${a.due_date || 'No Due Date'} • ${a.status}</div>
            </div>
            <div class="flex gap-sm">
              <button class="btn-icon" onclick="AdminCourseEditor.openAssignmentModal('${a.id}'); return false;"><span class="material-symbols-outlined" style="font-size:18px">edit</span></button>
              <button class="btn-icon" onclick="AdminCourseEditor.deleteAssignment('${a.id}'); return false;"><span class="material-symbols-outlined" style="font-size:18px;color:var(--error)">delete</span></button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Projects -->
      <div class="flex items-center justify-between mb-md">
        <h4 style="font-size:16px;font-weight:600">Projects</h4>
        <button class="btn btn-secondary btn-sm" onclick="AdminCourseEditor.openProjectModal(); return false;">
          <span class="material-symbols-outlined" style="font-size:16px">add</span> Add Project
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-md);">
        ${projects.length === 0 ? '<p class="text-body-small text-tertiary">No projects found.</p>' : ''}
        ${projects.map(p => `
          <div class="card p-md flex items-center justify-between" style="border:1px solid var(--border);">
            <div>
              <div style="font-weight:500;">${escapeHtml(p.title)}</div>
              <div class="text-body-small text-tertiary">${p.submission_type} • ${p.status}</div>
            </div>
            <div class="flex gap-sm">
              <button class="btn-icon" onclick="AdminCourseEditor.openProjectModal('${p.id}'); return false;"><span class="material-symbols-outlined" style="font-size:18px">edit</span></button>
              <button class="btn-icon" onclick="AdminCourseEditor.deleteProject('${p.id}'); return false;"><span class="material-symbols-outlined" style="font-size:18px;color:var(--error)">delete</span></button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.innerHTML = html;
  }

  function renderResourcesTab() {
    const container = document.getElementById('tab-content-resources');
    if (!container) return;
    
    let html = `
      <h3 class="mb-lg" style="font-size:18px;font-weight:600">Resources</h3>
      <p class="text-body-small text-tertiary mb-xl">Upload or link supplementary materials.</p>
      
      <div class="flex items-center justify-between mb-md">
        <h4 style="font-size:16px;font-weight:600">Course Resources</h4>
        <button class="btn btn-secondary btn-sm" onclick="AdminCourseEditor.openResourceModal(); return false;">
          <span class="material-symbols-outlined" style="font-size:16px">add</span> Add Resource
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-md);">
        ${resourcesList.length === 0 ? '<p class="text-body-small text-tertiary">No resources found.</p>' : ''}
        ${resourcesList.map(r => `
          <div class="card p-md flex items-center justify-between" style="border:1px solid var(--border);">
            <div>
              <div style="font-weight:500;">${escapeHtml(r.title)}</div>
              <div class="text-body-small text-tertiary">${r.resource_type} • <a href="${escapeHtml(r.url)}" target="_blank" style="color:var(--accent);">View</a></div>
            </div>
            <div class="flex gap-sm">
              <button class="btn-icon" onclick="AdminCourseEditor.openResourceModal('${r.id}'); return false;"><span class="material-symbols-outlined" style="font-size:18px">edit</span></button>
              <button class="btn-icon" onclick="AdminCourseEditor.deleteResource('${r.id}'); return false;"><span class="material-symbols-outlined" style="font-size:18px;color:var(--error)">delete</span></button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.innerHTML = html;
  }

  const openAssessmentModal = function(assessmentId = null) {
    const item = assessments.find(a => a.id === assessmentId);
    Modal.form(item ? 'Edit Assessment' : 'Add Assessment', `
      <div class="form-group mb-md">
        <label class="form-label">Title</label>
        <input type="text" id="assmnt-title" class="form-input" value="${item ? escapeHtml(item.title) : ''}" required>
      </div>
      <div class="form-group mb-md">
        <label class="form-label">Type</label>
        <select id="assmnt-type" class="form-input">
          <option value="QUIZ" ${item && item.assessment_type === 'QUIZ' ? 'selected' : ''}>Quiz</option>
          <option value="EXAM" ${item && item.assessment_type === 'EXAM' ? 'selected' : ''}>Exam</option>
        </select>
      </div>
      <div class="form-group mb-md">
        <label class="form-label">Passing Score (%)</label>
        <input type="number" id="assmnt-passing" class="form-input" value="${item ? (item.passing_score_percent || '') : '80'}">
      </div>
    `, async () => {
      const body = {
        title: document.getElementById('assmnt-title').value,
        assessmentType: document.getElementById('assmnt-type').value,
        passingScorePercent: parseInt(document.getElementById('assmnt-passing').value, 10) || null
      };
      if (!body.title) return Toast.error('Title required');
      try {
        if (item) await ApiClient.admin.updateCourseAssessment(editingCourseId, item.id, body);
        else await ApiClient.admin.createCourseAssessment(editingCourseId, body);
        await loadPhase4Data();
        return true;
      } catch (e) { Toast.error(e.message); return false; }
    });
  };

  const deleteAssessment = function(id) {
    Modal.confirm('Delete Assessment', 'Are you sure?', async () => {
      await ApiClient.admin.deleteCourseAssessment(editingCourseId, id);
      await loadPhase4Data();
    });
  };

  const openAssignmentModal = function(assignmentId = null) {
    const item = assignments.find(a => a.id === assignmentId);
    Modal.form(item ? 'Edit Assignment' : 'Add Assignment', `
      <div class="form-group mb-md">
        <label class="form-label">Title</label>
        <input type="text" id="assign-title" class="form-input" value="${item ? escapeHtml(item.title) : ''}" required>
      </div>
      <div class="form-group mb-md">
        <label class="form-label">Due Date</label>
        <input type="date" id="assign-due" class="form-input" value="${item ? escapeHtml(item.due_date || '') : ''}">
      </div>
    `, async () => {
      const body = {
        title: document.getElementById('assign-title').value,
        dueDate: document.getElementById('assign-due').value || null
      };
      if (!body.title) return Toast.error('Title required');
      try {
        if (item) await ApiClient.admin.updateCourseAssignment(editingCourseId, item.id, body);
        else await ApiClient.admin.createCourseAssignment(editingCourseId, body);
        await loadPhase4Data();
        return true;
      } catch (e) { Toast.error(e.message); return false; }
    });
  };

  const deleteAssignment = function(id) {
    Modal.confirm('Delete Assignment', 'Are you sure?', async () => {
      await ApiClient.admin.deleteCourseAssignment(editingCourseId, id);
      await loadPhase4Data();
    });
  };

  const openProjectModal = function(projectId = null) {
    const item = projects.find(p => p.id === projectId);
    Modal.form(item ? 'Edit Project' : 'Add Project', `
      <div class="form-group mb-md">
        <label class="form-label">Title</label>
        <input type="text" id="proj-title" class="form-input" value="${item ? escapeHtml(item.title) : ''}" required>
      </div>
      <div class="form-group mb-md">
        <label class="form-label">Submission Type</label>
        <select id="proj-sub" class="form-input">
          <option value="FILE" ${item && item.submission_type === 'FILE' ? 'selected' : ''}>File Upload</option>
          <option value="LINK" ${item && item.submission_type === 'LINK' ? 'selected' : ''}>URL Link</option>
        </select>
      </div>
    `, async () => {
      const body = {
        title: document.getElementById('proj-title').value,
        submissionType: document.getElementById('proj-sub').value
      };
      if (!body.title) return Toast.error('Title required');
      try {
        if (item) await ApiClient.admin.updateCourseProject(editingCourseId, item.id, body);
        else await ApiClient.admin.createCourseProject(editingCourseId, body);
        await loadPhase4Data();
        return true;
      } catch (e) { Toast.error(e.message); return false; }
    });
  };

  const deleteProject = function(id) {
    Modal.confirm('Delete Project', 'Are you sure?', async () => {
      await ApiClient.admin.deleteCourseProject(editingCourseId, id);
      await loadPhase4Data();
    });
  };

  const openResourceModal = function(resourceId = null) {
    const item = resourcesList.find(r => r.id === resourceId);
    Modal.form(item ? 'Edit Resource' : 'Add Resource', `
      <div class="form-group mb-md">
        <label class="form-label">Title</label>
        <input type="text" id="res-title" class="form-input" value="${item ? escapeHtml(item.title) : ''}" required>
      </div>
      <div class="form-group mb-md">
        <label class="form-label">Type</label>
        <select id="res-type" class="form-input">
          <option value="PDF" ${item && item.resource_type === 'PDF' ? 'selected' : ''}>PDF</option>
          <option value="LINK" ${item && item.resource_type === 'LINK' ? 'selected' : ''}>Link</option>
          <option value="VIDEO" ${item && item.resource_type === 'VIDEO' ? 'selected' : ''}>Video</option>
        </select>
      </div>
      <div class="form-group mb-md">
        <label class="form-label">URL</label>
        <input type="url" id="res-url" class="form-input" value="${item ? escapeHtml(item.url || '') : ''}">
      </div>
    `, async () => {
      const body = {
        title: document.getElementById('res-title').value,
        resourceType: document.getElementById('res-type').value,
        url: document.getElementById('res-url').value || null
      };
      if (!body.title) return Toast.error('Title required');
      try {
        if (item) await ApiClient.admin.updateCourseResource(editingCourseId, item.id, body);
        else await ApiClient.admin.createCourseResource(editingCourseId, body);
        await loadPhase4Data();
        return true;
      } catch (e) { Toast.error(e.message); return false; }
    });
  };

  const deleteResource = function(id) {
    Modal.confirm('Delete Resource', 'Are you sure?', async () => {
      await ApiClient.admin.deleteCourseResource(editingCourseId, id);
      await loadPhase4Data();
    });
  };

  // ─── Phase 5: Course Question Bank ───
  let courseQuestions = [];

  const openQuestionsModal = async function(assessmentId, title) {
    try {
      const res = await ApiClient.admin.getCourseQuestions(editingCourseId);
      courseQuestions = res.data || [];
    } catch (e) {
      return Toast.error('Failed to load questions');
    }
    
    // Filter by assessment
    const filtered = courseQuestions.filter(q => q.assessment_id === assessmentId);
    
    const renderQuestionsList = () => {
      if (filtered.length === 0) return '<p class="text-body-small text-tertiary">No questions added yet.</p>';
      return filtered.map((q, idx) => `
        <div class="card p-sm mb-sm flex justify-between items-center" style="border:1px solid var(--border)">
          <div>
            <div style="font-weight:500">Q${idx+1}: ${escapeHtml(q.question_text)}</div>
            <div class="text-body-small text-tertiary">${q.question_type} • ${q.points} pts</div>
          </div>
          <div class="flex gap-sm">
            <button class="btn-icon" onclick="AdminCourseEditor.editQuestion('${q.id}', '${assessmentId}'); return false;"><span class="material-symbols-outlined" style="font-size:18px">edit</span></button>
            <button class="btn-icon" onclick="AdminCourseEditor.deleteQuestion('${q.id}', '${assessmentId}'); return false;"><span class="material-symbols-outlined" style="font-size:18px;color:var(--error)">delete</span></button>
          </div>
        </div>
      `).join('');
    };

    Modal.form(`Questions for: ${escapeHtml(title)}`, `
      <div class="flex justify-between items-center mb-md">
        <h4 style="font-size:16px">Question Bank</h4>
        <button class="btn btn-primary btn-sm" onclick="AdminCourseEditor.addQuestion('${assessmentId}'); return false;">Add Question</button>
      </div>
      <div id="questions-list-container" style="max-height: 400px; overflow-y: auto;">
        ${renderQuestionsList()}
      </div>
    `, async () => {
      // Just closing the modal
      return true;
    });
  };

  const addQuestion = function(assessmentId) {
    Modal.form('Add Question', `
      <div class="form-group mb-md">
        <label class="form-label">Question Text</label>
        <textarea id="q-text" class="form-input" required rows="3"></textarea>
      </div>
      <div class="form-group mb-md">
        <label class="form-label">Question Type</label>
        <select id="q-type" class="form-input">
          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
          <option value="TRUE_FALSE">True / False</option>
          <option value="SHORT_ANSWER">Short Answer</option>
        </select>
      </div>
      <div class="form-group mb-md">
        <label class="form-label">Correct Answer</label>
        <input type="text" id="q-correct" class="form-input" required>
      </div>
      <div class="form-group mb-md">
        <label class="form-label">Points</label>
        <input type="number" id="q-points" class="form-input" value="1">
      </div>
    `, async () => {
      const body = {
        assessmentId,
        questionText: document.getElementById('q-text').value,
        questionType: document.getElementById('q-type').value,
        correctAnswer: document.getElementById('q-correct').value,
        points: parseInt(document.getElementById('q-points').value) || 1
      };
      if (!body.questionText || !body.correctAnswer) return Toast.error('Required fields missing');
      
      try {
        await ApiClient.admin.createCourseQuestion(editingCourseId, body);
        Toast.success('Question added');
        return true;
      } catch (e) { Toast.error(e.message); return false; }
    });
  };

  const editQuestion = function(questionId, assessmentId) {
    const q = courseQuestions.find(x => x.id === questionId);
    if(!q) return;
    Modal.form('Edit Question', `
      <div class="form-group mb-md">
        <label class="form-label">Question Text</label>
        <textarea id="q-text" class="form-input" required rows="3">${escapeHtml(q.question_text)}</textarea>
      </div>
      <div class="form-group mb-md">
        <label class="form-label">Question Type</label>
        <select id="q-type" class="form-input">
          <option value="MULTIPLE_CHOICE" ${q.question_type==='MULTIPLE_CHOICE'?'selected':''}>Multiple Choice</option>
          <option value="TRUE_FALSE" ${q.question_type==='TRUE_FALSE'?'selected':''}>True / False</option>
          <option value="SHORT_ANSWER" ${q.question_type==='SHORT_ANSWER'?'selected':''}>Short Answer</option>
        </select>
      </div>
      <div class="form-group mb-md">
        <label class="form-label">Correct Answer</label>
        <input type="text" id="q-correct" class="form-input" required value="${escapeHtml(q.correct_answer)}">
      </div>
      <div class="form-group mb-md">
        <label class="form-label">Points</label>
        <input type="number" id="q-points" class="form-input" value="${q.points}">
      </div>
    `, async () => {
      const body = {
        assessmentId,
        questionText: document.getElementById('q-text').value,
        questionType: document.getElementById('q-type').value,
        correctAnswer: document.getElementById('q-correct').value,
        points: parseInt(document.getElementById('q-points').value) || 1
      };
      if (!body.questionText || !body.correctAnswer) return Toast.error('Required fields missing');
      
      try {
        await ApiClient.admin.updateCourseQuestion(editingCourseId, questionId, body);
        Toast.success('Question updated');
        return true;
      } catch (e) { Toast.error(e.message); return false; }
    });
  };

  const deleteQuestion = function(questionId, assessmentId) {
    Modal.confirm('Delete Question', 'Are you sure?', async () => {
      await ApiClient.admin.deleteCourseQuestion(editingCourseId, questionId);
      Toast.success('Deleted');
    });
  };

  return { 
    render, save, openSectionModal, deleteSection, openLessonModal, deleteLesson,
    openAssessmentModal, deleteAssessment,
    openAssignmentModal, deleteAssignment,
    openProjectModal, deleteProject,
    openResourceModal, deleteResource,
    openQuestionsModal, addQuestion, editQuestion, deleteQuestion
  };
})();
