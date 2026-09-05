/**
 * TF Study Shelf — Admin Questions Page
 */
window.AdminQuestions = (() => {

  let currentBookId = null;

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
          <button class="btn btn-sm btn-primary" onclick="AdminQuestions.showCreateQuestionForm()">
            <span class="material-symbols-outlined" style="font-size:16px">add</span> Add Question
          </button>
        </div>
        
        <div id="create-question-form" class="card mb-md hidden">
          <div class="mb-sm">
            <label class="text-label-small text-secondary mb-xs block">Question Text</label>
            <textarea id="new-question-text" class="form-input" rows="3" placeholder="Enter your question here..."></textarea>
          </div>
          
          <div class="grid-2 gap-sm mb-sm">
            <div>
              <label class="text-label-small text-secondary mb-xs block">Option A</label>
              <input type="text" id="new-question-opt-a" class="form-input" placeholder="Option A">
            </div>
            <div>
              <label class="text-label-small text-secondary mb-xs block">Option B</label>
              <input type="text" id="new-question-opt-b" class="form-input" placeholder="Option B">
            </div>
            <div>
              <label class="text-label-small text-secondary mb-xs block">Option C</label>
              <input type="text" id="new-question-opt-c" class="form-input" placeholder="Option C">
            </div>
            <div>
              <label class="text-label-small text-secondary mb-xs block">Option D</label>
              <input type="text" id="new-question-opt-d" class="form-input" placeholder="Option D">
            </div>
          </div>
          
          <div class="mb-md">
            <label class="text-label-small text-secondary mb-xs block">Correct Answer</label>
            <select id="new-question-correct" class="form-input">
              <option value="A">Option A</option>
              <option value="B">Option B</option>
              <option value="C">Option C</option>
              <option value="D">Option D</option>
            </select>
          </div>
          
          <div class="mb-md">
            <label class="text-label-small text-secondary mb-xs block">Explanation (Optional)</label>
            <textarea id="new-question-explanation" class="form-input" rows="2" placeholder="Why is this the correct answer?"></textarea>
          </div>

          <div class="flex gap-sm">
            <button class="btn btn-primary" onclick="AdminQuestions.createQuestion()">Save Question</button>
            <button class="btn btn-ghost" onclick="document.getElementById('create-question-form').classList.add('hidden')">Cancel</button>
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
    loadQuestions();
  }

  async function loadQuestions() {
    const listEl = document.getElementById('questions-list');
    listEl.innerHTML = '<div class="loading-overlay" style="min-height:100px"><div class="spinner spinner-sm"></div></div>';
    try {
      const res = await ApiClient.admin.getQuestions(currentBookId);
      const questions = res.data || [];
      
      if (questions.length === 0) {
        listEl.innerHTML = `<div class="empty-state" style="padding:var(--space-xl)"><p class="empty-state__message">No questions yet</p></div>`;
        return;
      }

      listEl.innerHTML = questions.map((q, index) => `
        <div class="card mb-sm" style="padding:16px">
          <div class="flex items-start justify-between mb-sm">
            <div class="text-title-medium">Q${index + 1}. ${escapeHtml(q.question)}</div>
            <div class="flex gap-xs">
              <button class="btn btn-ghost btn-sm" style="padding: 4px;" onclick="AdminQuestions.showEditQuestionForm('${q.id}')">
                <span class="material-symbols-outlined" style="font-size:18px">edit</span>
              </button>
              <button class="btn btn-ghost btn-sm" style="color:var(--error); padding: 4px;" onclick="AdminQuestions.deleteQuestion('${q.id}')">
                <span class="material-symbols-outlined" style="font-size:18px">delete</span>
              </button>
            </div>
          </div>
          <div class="grid-2 gap-sm text-body-medium">
            <div style="padding: 8px; border-radius: 4px; background: ${q.correctAnswer === 'A' ? 'rgba(var(--color-success-rgb), 0.1)' : 'var(--bg-secondary)'}; border: 1px solid ${q.correctAnswer === 'A' ? 'var(--success)' : 'transparent'}">
              <strong>A:</strong> ${q.options?.A || ''}
            </div>
            <div style="padding: 8px; border-radius: 4px; background: ${q.correctAnswer === 'B' ? 'rgba(var(--color-success-rgb), 0.1)' : 'var(--bg-secondary)'}; border: 1px solid ${q.correctAnswer === 'B' ? 'var(--success)' : 'transparent'}">
              <strong>B:</strong> ${q.options?.B || ''}
            </div>
            <div style="padding: 8px; border-radius: 4px; background: ${q.correctAnswer === 'C' ? 'rgba(var(--color-success-rgb), 0.1)' : 'var(--bg-secondary)'}; border: 1px solid ${q.correctAnswer === 'C' ? 'var(--success)' : 'transparent'}">
              <strong>C:</strong> ${q.options?.C || ''}
            </div>
            <div style="padding: 8px; border-radius: 4px; background: ${q.correctAnswer === 'D' ? 'rgba(var(--color-success-rgb), 0.1)' : 'var(--bg-secondary)'}; border: 1px solid ${q.correctAnswer === 'D' ? 'var(--success)' : 'transparent'}">
              <strong>D:</strong> ${q.options?.D || ''}
            </div>
          </div>
          ${q.explanation ? `<div class="mt-sm text-body-small text-secondary" style="background: var(--bg-secondary); padding: 8px; border-radius: 4px;"><strong>Explanation:</strong> ${q.explanation}</div>` : ''}
        </div>
      `).join('');
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state"><p class="empty-state__message text-error">Failed to load questions</p></div>`;
    }
  }

  function showCreateQuestionForm() {
    document.getElementById('create-question-form').classList.remove('hidden');
    document.getElementById('new-question-text').focus();
  }

  async function createQuestion() {
    const question = document.getElementById('new-question-text').value.trim();
    const optA = document.getElementById('new-question-opt-a').value.trim();
    const optB = document.getElementById('new-question-opt-b').value.trim();
    const optC = document.getElementById('new-question-opt-c').value.trim();
    const optD = document.getElementById('new-question-opt-d').value.trim();
    const correctAnswer = document.getElementById('new-question-correct').value;
    const explanation = document.getElementById('new-question-explanation').value.trim();

    if (!question || !optA || !optB || !optC || !optD) { 
      Toast.error('Question and all options are required'); 
      return; 
    }
    
    try {
      await ApiClient.admin.createQuestion(currentBookId, { 
        question, 
        options: { A: optA, B: optB, C: optC, D: optD }, 
        correctAnswer, 
        explanation 
      });
      Toast.success('Question added');
      
      // Reset form
      document.getElementById('create-question-form').classList.add('hidden');
      document.getElementById('new-question-text').value = '';
      document.getElementById('new-question-opt-a').value = '';
      document.getElementById('new-question-opt-b').value = '';
      document.getElementById('new-question-opt-c').value = '';
      document.getElementById('new-question-opt-d').value = '';
      document.getElementById('new-question-explanation').value = '';
      
      loadQuestions();
    } catch (err) { 
      Toast.error(err.message); 
    }
  }

  function showEditQuestionForm(id) {
    // Find the question in the DOM or state... wait, we need to fetch it or keep it in state.
    // Instead of keeping state, we can use Modal to edit it.
    // Let's implement Modal for editing
    Toast.error('Edit via Modal coming soon. Please use delete/add for now.');
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

  return { render, onBookSelected, showCreateQuestionForm, createQuestion, deleteQuestion };
})();
