/**
 * TF Study Shelf — Admin Questions Page
 */
window.AdminQuestions = (() => {

  let currentBookId = null;
  let currentQuestions = [];
  let editingQuestionId = null;

  const QUESTION_TYPES = [
    { value: 'MCQ', label: 'Multiple Choice Question (MCQ)' },
    { value: 'MULTIPLE_SELECT', label: 'Multiple Select Question' },
    { value: 'TRUE_FALSE', label: 'True / False' },
    { value: 'FILL_BLANK', label: 'Fill in the Blanks' },
    { value: 'SHORT', label: 'Short Answer / One Word' },
    { value: 'LONG', label: 'Long Answer / Descriptive' },
    { value: 'MATCHING', label: 'Match the Following' },
    { value: 'ASSERTION_REASON', label: 'Assertion & Reason' },
    { value: 'NUMERICAL', label: 'Numerical / Calculation' },
    { value: 'IMAGE_BASED', label: 'Image-Based Question' },
    { value: 'SEQUENCE', label: 'Sequence / Ordering' },
    { value: 'ESSAY', label: 'Essay-Type Question' },
    { value: 'HOTS', label: 'HOTS (Higher Order Thinking)' },
    { value: 'APPLICATION', label: 'Application-Based' },
    { value: 'COMPETENCY', label: 'Competency-Based' }
  ];

  async function render(container) {
    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-header__title">Questions & Answers</h1>
          <p class="admin-page-header__subtitle">Manage Q&A content for your books</p>
        </div>
      </div>

      <div class="card mb-lg">
        <h3 class="text-title-medium mb-sm">Select Book</h3>
        <select id="book-selector" class="form-input" onchange="AdminQuestions.onBookSelected(this.value)">
          <option value="">-- Select a Book --</option>
        </select>
      </div>

      <div id="questions-container" class="hidden">
        <div class="flex items-center justify-between mb-md">
          <h3 class="text-title-large">Questions List</h3>
          <button class="btn btn-sm btn-primary" onclick="AdminQuestions.showForm()">
            <span class="material-symbols-outlined" style="font-size:16px">add</span> Add Question
          </button>
        </div>
        
        <div id="question-form-card" class="card mb-md hidden">
          <h3 class="text-title-medium mb-md" id="form-title">Create Question</h3>
          
          <div class="grid-2 gap-md mb-sm">
            <div>
              <label class="text-label-small text-secondary mb-xs block">Question Type</label>
              <select id="q-type" class="form-input" onchange="AdminQuestions.onTypeChange()">
                ${QUESTION_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-label-small text-secondary mb-xs block">Difficulty</label>
              <select id="q-difficulty" class="form-input">
                <option value="EASY">Easy</option>
                <option value="MEDIUM" selected>Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>
          
          <div class="mb-sm">
            <label class="text-label-small text-secondary mb-xs block">Question Text</label>
            <textarea id="q-text" class="form-input" rows="3" placeholder="Enter your question here..."></textarea>
          </div>
          
          <div class="mb-sm">
            <label class="text-label-small text-secondary mb-xs block">Media URL (Optional)</label>
            <input type="text" id="q-media" class="form-input" placeholder="https://example.com/image.jpg">
            <p class="text-body-small text-secondary mt-xs">Provide a valid URL for an image or video if required for this question.</p>
          </div>

          <!-- Dynamic Fields Container -->
          <div id="dynamic-fields-container" class="mb-sm" style="background: var(--bg-secondary); padding: 16px; border-radius: 8px;">
          </div>
          
          <div class="mb-md mt-sm">
            <label class="text-label-small text-secondary mb-xs block">Explanation / Key Points (Optional)</label>
            <textarea id="q-explanation" class="form-input" rows="2" placeholder="Explanation for the correct answer..."></textarea>
          </div>

          <div class="flex gap-sm">
            <button class="btn btn-primary" onclick="AdminQuestions.saveQuestion()">Save Question</button>
            <button class="btn btn-ghost" onclick="AdminQuestions.hideForm()">Cancel</button>
          </div>
        </div>
        
        <div id="questions-list">
          <div class="loading-overlay" style="min-height:100px"><div class="spinner spinner-sm"></div></div>
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
    const container = document.getElementById('questions-container');
    if (!bookId) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');
    hideForm();
    loadQuestions();
  }

  async function loadQuestions() {
    const listEl = document.getElementById('questions-list');
    listEl.innerHTML = '<div class="loading-overlay" style="min-height:100px"><div class="spinner spinner-sm"></div></div>';
    try {
      const res = await ApiClient.admin.getQuestions(currentBookId);
      currentQuestions = res.data || [];
      
      if (currentQuestions.length === 0) {
        listEl.innerHTML = \`<div class="empty-state" style="padding:var(--space-xl)"><p class="empty-state__message">No questions yet</p></div>\`;
        return;
      }

      listEl.innerHTML = currentQuestions.map((q, index) => renderQuestionCard(q, index)).join('');
    } catch (err) {
      listEl.innerHTML = \`<div class="empty-state"><p class="empty-state__message text-error">Failed to load questions</p></div>\`;
    }
  }

  function renderQuestionCard(q, index) {
    const typeLabel = QUESTION_TYPES.find(t => t.value === q.question_type)?.label || q.question_type;
    
    let detailsHtml = '';
    
    if (q.metadata?.mediaUrl) {
       detailsHtml += \`<div class="mb-sm"><img src="\${escapeHtml(q.metadata.mediaUrl)}" style="max-height: 150px; border-radius: 4px;" onerror="this.style.display='none'"></div>\`;
    }

    if (q.question_type === 'MCQ' || q.question_type === 'MULTIPLE_SELECT') {
      detailsHtml += '<div class="grid-2 gap-sm text-body-medium">';
      (q.options || []).forEach(opt => {
        const isCorrect = opt.is_correct === 1;
        detailsHtml += \`<div style="padding: 8px; border-radius: 4px; background: \${isCorrect ? 'rgba(var(--color-success-rgb), 0.1)' : 'var(--bg-secondary)'}; border: 1px solid \${isCorrect ? 'var(--success)' : 'transparent'}">
          \${escapeHtml(opt.option_text)}
        </div>\`;
      });
      detailsHtml += '</div>';
    } else if (q.question_type === 'MATCHING') {
      const pairs = q.metadata?.pairs || [];
      detailsHtml += '<div class="grid-2 gap-sm text-body-medium">';
      pairs.forEach(p => {
        detailsHtml += \`<div style="padding: 8px; background: var(--bg-secondary); border-radius: 4px;">\${escapeHtml(p.left)} ➔ \${escapeHtml(p.right)}</div>\`;
      });
      detailsHtml += '</div>';
    } else {
      detailsHtml += \`<div class="text-body-medium" style="padding: 8px; border-radius: 4px; background: rgba(var(--color-success-rgb), 0.1); border: 1px solid var(--success)">
        <strong>Answer:</strong> \${escapeHtml(q.answer)}
      </div>\`;
    }

    return \`
      <div class="card mb-sm" style="padding:16px">
        <div class="flex items-start justify-between mb-sm">
          <div>
            <span class="badge badge-primary mb-xs">\${typeLabel}</span>
            <div class="text-title-medium">Q\${index + 1}. \${escapeHtml(q.question_text)}</div>
          </div>
          <div class="flex gap-xs">
            <button class="btn btn-ghost btn-sm" style="padding: 4px;" onclick="AdminQuestions.editQuestion('\${q.id}')">
              <span class="material-symbols-outlined" style="font-size:18px">edit</span>
            </button>
            <button class="btn btn-ghost btn-sm" style="color:var(--error); padding: 4px;" onclick="AdminQuestions.deleteQuestion('\${q.id}')">
              <span class="material-symbols-outlined" style="font-size:18px">delete</span>
            </button>
          </div>
        </div>
        \${detailsHtml}
        \${q.explanation ? \`<div class="mt-sm text-body-small text-secondary" style="background: var(--bg-secondary); padding: 8px; border-radius: 4px;"><strong>Explanation:</strong> \${escapeHtml(q.explanation)}</div>\` : ''}
      </div>
    \`;
  }

  function showForm() {
    editingQuestionId = null;
    document.getElementById('form-title').textContent = 'Create Question';
    document.getElementById('question-form-card').classList.remove('hidden');
    resetForm();
    onTypeChange();
    document.getElementById('q-text').focus();
  }

  function hideForm() {
    document.getElementById('question-form-card').classList.add('hidden');
  }

  function resetForm() {
    document.getElementById('q-text').value = '';
    document.getElementById('q-explanation').value = '';
    document.getElementById('q-media').value = '';
    document.getElementById('q-type').value = 'MCQ';
    document.getElementById('q-difficulty').value = 'MEDIUM';
  }

  function onTypeChange() {
    const type = document.getElementById('q-type').value;
    const container = document.getElementById('dynamic-fields-container');
    container.innerHTML = '';

    if (type === 'MCQ' || type === 'MULTIPLE_SELECT' || type === 'IMAGE_BASED') {
      const isMulti = type === 'MULTIPLE_SELECT';
      container.innerHTML = \`
        <div class="flex items-center justify-between mb-xs">
          <label class="text-label-small text-secondary">Options (Check the correct ones)</label>
          <button class="btn btn-sm btn-ghost" onclick="AdminQuestions.addOptionField()">+ Add Option</button>
        </div>
        <div id="options-list" class="grid gap-xs"></div>
      \`;
      // Default 4 options
      for (let i = 0; i < 4; i++) addOptionField();
    } else if (type === 'TRUE_FALSE') {
      container.innerHTML = \`
        <label class="text-label-small text-secondary mb-xs block">Correct Answer</label>
        <select id="q-answer" class="form-input">
          <option value="True">True</option>
          <option value="False">False</option>
        </select>
      \`;
    } else if (type === 'MATCHING') {
      container.innerHTML = \`
        <div class="flex items-center justify-between mb-xs">
          <label class="text-label-small text-secondary">Matching Pairs</label>
          <button class="btn btn-sm btn-ghost" onclick="AdminQuestions.addMatchingPair()">+ Add Pair</button>
        </div>
        <div id="matching-list" class="grid gap-xs"></div>
      \`;
      for (let i = 0; i < 4; i++) addMatchingPair();
    } else if (type === 'ASSERTION_REASON') {
      container.innerHTML = \`
        <div class="grid gap-sm">
          <div><label class="text-label-small text-secondary mb-xs block">Assertion</label><input type="text" id="q-assertion" class="form-input"></div>
          <div><label class="text-label-small text-secondary mb-xs block">Reason</label><input type="text" id="q-reason" class="form-input"></div>
          <div>
            <label class="text-label-small text-secondary mb-xs block">Correct Option</label>
            <select id="q-answer" class="form-input">
              <option value="Both A and R are true and R is the correct explanation of A">Both A and R are true and R is the correct explanation of A</option>
              <option value="Both A and R are true but R is not the correct explanation of A">Both A and R are true but R is not the correct explanation of A</option>
              <option value="A is true but R is false">A is true but R is false</option>
              <option value="A is false but R is true">A is false but R is true</option>
            </select>
          </div>
        </div>
      \`;
    } else {
      // Default for short, long, fill blanks, numerical, etc.
      container.innerHTML = \`
        <label class="text-label-small text-secondary mb-xs block">Correct Answer</label>
        <textarea id="q-answer" class="form-input" rows="2" placeholder="Model answer or accepted values..."></textarea>
      \`;
    }
  }

  function addOptionField(text = '', isCorrect = false) {
    const list = document.getElementById('options-list');
    if (!list) return;
    const type = document.getElementById('q-type').value;
    const inputType = type === 'MULTIPLE_SELECT' ? 'checkbox' : 'radio';
    const name = type === 'MULTIPLE_SELECT' ? '' : 'name="mcq_correct"';
    
    const div = document.createElement('div');
    div.className = 'flex gap-sm items-center';
    div.innerHTML = \`
      <input type="\${inputType}" \${name} class="opt-correct" \${isCorrect ? 'checked' : ''} style="width:20px; height:20px;">
      <input type="text" class="form-input opt-text" placeholder="Option text" value="\${escapeHtml(text)}">
      <button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()"><span class="material-symbols-outlined">close</span></button>
    \`;
    list.appendChild(div);
  }

  function addMatchingPair(left = '', right = '') {
    const list = document.getElementById('matching-list');
    if (!list) return;
    const div = document.createElement('div');
    div.className = 'grid-2 gap-sm items-center';
    div.innerHTML = \`
      <input type="text" class="form-input match-left" placeholder="Left item" value="\${escapeHtml(left)}">
      <div class="flex gap-xs items-center">
        <span>➔</span>
        <input type="text" class="form-input match-right" placeholder="Matching right item" value="\${escapeHtml(right)}">
        <button class="btn btn-ghost btn-sm" onclick="this.parentElement.parentElement.remove()"><span class="material-symbols-outlined">close</span></button>
      </div>
    \`;
    list.appendChild(div);
  }

  async function saveQuestion() {
    const type = document.getElementById('q-type').value;
    
    const payload = {
      bookId: currentBookId,
      questionText: document.getElementById('q-text').value.trim(),
      questionType: type,
      difficulty: document.getElementById('q-difficulty').value,
      explanation: document.getElementById('q-explanation').value.trim(),
      metadata: { mediaUrl: document.getElementById('q-media').value.trim() },
      status: 'PUBLISHED'
    };

    if (!payload.questionText) return Toast.error('Question text is required');

    if (type === 'MCQ' || type === 'MULTIPLE_SELECT' || type === 'IMAGE_BASED') {
      const optionEls = document.querySelectorAll('#options-list > div');
      payload.options = [];
      let hasCorrect = false;
      optionEls.forEach(el => {
        const text = el.querySelector('.opt-text').value.trim();
        const isCorrect = el.querySelector('.opt-correct').checked;
        if (text) {
          payload.options.push({ text, isCorrect });
          if (isCorrect) hasCorrect = true;
        }
      });
      if (payload.options.length < 2) return Toast.error('Provide at least 2 options');
      if (!hasCorrect) return Toast.error('Select at least one correct option');
      
      // The backend answer field is required, so we put a summary or the first correct option text
      payload.answer = payload.options.filter(o => o.isCorrect).map(o => o.text).join(', ');
    } else if (type === 'MATCHING') {
      const pairEls = document.querySelectorAll('#matching-list > div');
      payload.metadata.pairs = [];
      pairEls.forEach(el => {
        const left = el.querySelector('.match-left').value.trim();
        const right = el.querySelector('.match-right').value.trim();
        if (left && right) payload.metadata.pairs.push({ left, right });
      });
      if (payload.metadata.pairs.length < 2) return Toast.error('Provide at least 2 matching pairs');
      payload.answer = 'See matching pairs'; // generic required field
    } else if (type === 'ASSERTION_REASON') {
      payload.metadata.assertion = document.getElementById('q-assertion').value.trim();
      payload.metadata.reason = document.getElementById('q-reason').value.trim();
      payload.answer = document.getElementById('q-answer').value.trim();
      if (!payload.metadata.assertion || !payload.metadata.reason) return Toast.error('Assertion and Reason required');
    } else {
      payload.answer = document.getElementById('q-answer').value.trim();
      if (!payload.answer) return Toast.error('Answer is required');
    }
    
    try {
      if (editingQuestionId) {
        await ApiClient.admin.updateQuestion(currentBookId, editingQuestionId, payload);
        Toast.success('Question updated');
      } else {
        await ApiClient.admin.createQuestion(currentBookId, payload);
        Toast.success('Question added');
      }
      hideForm();
      loadQuestions();
    } catch (err) { 
      Toast.error(err.message); 
    }
  }

  function editQuestion(id) {
    const q = currentQuestions.find(x => x.id === id);
    if (!q) return;

    editingQuestionId = id;
    document.getElementById('form-title').textContent = 'Edit Question';
    document.getElementById('question-form-card').classList.remove('hidden');
    
    document.getElementById('q-type').value = q.question_type;
    document.getElementById('q-difficulty').value = q.difficulty;
    document.getElementById('q-text').value = q.question_text;
    document.getElementById('q-explanation').value = q.explanation || '';
    document.getElementById('q-media').value = q.metadata?.mediaUrl || '';
    
    // Trigger dynamic fields rendering
    onTypeChange();

    // Populate dynamic fields
    const type = q.question_type;
    if (type === 'MCQ' || type === 'MULTIPLE_SELECT' || type === 'IMAGE_BASED') {
      const list = document.getElementById('options-list');
      list.innerHTML = '';
      (q.options || []).forEach(opt => {
        addOptionField(opt.option_text, opt.is_correct === 1);
      });
    } else if (type === 'MATCHING') {
      const list = document.getElementById('matching-list');
      list.innerHTML = '';
      (q.metadata?.pairs || []).forEach(p => addMatchingPair(p.left, p.right));
    } else if (type === 'ASSERTION_REASON') {
      document.getElementById('q-assertion').value = q.metadata?.assertion || '';
      document.getElementById('q-reason').value = q.metadata?.reason || '';
      document.getElementById('q-answer').value = q.answer || '';
    } else {
      const ansEl = document.getElementById('q-answer');
      if (ansEl) ansEl.value = q.answer || '';
    }
    
    document.getElementById('q-text').focus();
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function deleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await ApiClient.admin.deleteQuestion(currentBookId, questionId);
      Toast.success('Question deleted');
      loadQuestions();
    } catch (err) { Toast.error(err.message); }
  }

  return { render, onBookSelected, showForm, hideForm, saveQuestion, editQuestion, deleteQuestion, onTypeChange, addOptionField, addMatchingPair };
})();
