/**
 * TF Study Shelf — User App Controller
 * Handles page routing, content loading, and user interactions
 */
const UserApp = (() => {
  let currentPage = 'home';

  // ─── Page Renderers ────────────────────────────

  async function renderHome(container) {
    const greeting = getGreeting();

    container.innerHTML = `
      <div class="user-content fade-in">
        <!-- Hero Section -->
        <div class="hero">
          <h1 class="hero__title">${greeting} 👋</h1>
          <p class="hero__subtitle">Your free digital library and study companion. Read books, solve quizzes, and study smarter — all in one place.</p>
          <div class="hero__actions">
            <button class="btn btn-primary btn-lg" onclick="UserApp.navigate('explore')" style="background:#FAFAFA;color:#212121">
              <span class="material-symbols-outlined" style="font-size:20px">explore</span> Explore Library
            </button>
            <button class="btn btn-secondary btn-lg" onclick="UserApp.navigate('study')" style="border-color:rgba(250,250,250,0.4);color:#FAFAFA">
              <span class="material-symbols-outlined" style="font-size:20px">school</span> Start Studying
            </button>
          </div>
        </div>

        <!-- Browse Categories -->
        <div class="section-header mt-xl">
          <h2 class="section-title">Browse</h2>
          <a class="section-link" href="#" onclick="UserApp.navigate('explore');return false">
            View all <span class="material-symbols-outlined" style="font-size:16px">arrow_forward</span>
          </a>
        </div>
        <div class="category-rail" id="category-rail">
          ${categorySkeletons(8)}
        </div>

        <!-- Featured Books -->
        <div class="section-header mt-xl">
          <h2 class="section-title">Featured Books</h2>
          <a class="section-link" href="#" onclick="UserApp.navigate('explore');return false">
            See all <span class="material-symbols-outlined" style="font-size:16px">arrow_forward</span>
          </a>
        </div>
        <div class="books-grid" id="featured-books">
          ${bookSkeletons(8)}
        </div>

        <!-- Study Section -->
        <div class="section-header mt-xl">
          <h2 class="section-title">Study Tools</h2>
        </div>
        <div class="grid-4 gap-md" style="margin-bottom:var(--space-xl)">
          ${studyCard('quiz', 'Quizzes', 'Test your knowledge', 'study')}
          ${studyCard('style', 'Flashcards', 'Review key concepts', 'study')}
          ${studyCard('help_outline', 'Q&A', 'Questions & Answers', 'study')}
          ${studyCard('auto_stories', 'Study Packs', 'Curated learning paths', 'explore')}
        </div>

        <!-- Recently Added -->
        <div class="section-header mt-xl">
          <h2 class="section-title">Recently Added</h2>
        </div>
        <div class="books-grid" id="recent-books">
          ${bookSkeletons(4)}
        </div>
      </div>
    `;

    loadHomeData();
  }

  async function loadHomeData() {
    try {
      // Load categories
      const catResult = await ApiClient.getCategories();
      const cats = catResult.data || [];
      const catIcons = ['📚', '🔬', '📐', '🌍', '💻', '🎨', '📖', '🧪', '🏛️', '🔢'];
      document.getElementById('category-rail').innerHTML = cats.length
        ? cats.map((c, i) => `
          <div class="category-rail__item" onclick="UserApp.navigate('explore', {category:'${c.id}'})">
            <div class="category-rail__icon">${catIcons[i % catIcons.length]}</div>
            <div class="category-rail__name">${c.name}</div>
          </div>
        `).join('')
        : `<div class="text-body-medium text-secondary" style="padding:var(--space-lg)">No categories yet. Content will appear here once the admin adds books.</div>`;

      // Load featured books
      const featuredResult = await ApiClient.getBooks({ featured: 'true', limit: 8 });
      renderBookGrid('featured-books', featuredResult.data || []);

      // Load recent books
      const recentResult = await ApiClient.getBooks({ sort: 'recent', limit: 4 });
      renderBookGrid('recent-books', recentResult.data || []);

    } catch (err) {
      document.getElementById('featured-books').innerHTML = `
        <div class="card card-accent" style="grid-column:1/-1;padding:var(--space-lg)">
          <p class="text-body-medium text-secondary">
            <span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">info</span>
            Connect to the API server to see content. Run <code style="background:var(--bg-elevated);padding:2px 6px;border-radius:4px">npm run dev</code> in the Web directory.
          </p>
        </div>`;
      document.getElementById('recent-books').innerHTML = '';
    }
  }

  async function renderExplore(container, params = {}) {
    container.innerHTML = `
      <div class="user-content fade-in">
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-header__title">Explore</h1>
            <p class="admin-page-header__subtitle">Discover books, PDFs, and study materials</p>
          </div>
        </div>

        <!-- Filters -->
        <div class="content-toolbar">
          <div class="content-toolbar__search" style="max-width:480px">
            <div class="search-bar">
              <span class="material-symbols-outlined icon">search</span>
              <input type="text" id="explore-search" placeholder="Search books, topics, questions…">
            </div>
          </div>
          <div class="content-toolbar__filters">
            <select class="form-input" id="explore-sort" style="width:auto;padding:8px 32px 8px 12px;font-size:13px">
              <option value="recent">Recently Added</option>
              <option value="popular">Most Popular</option>
              <option value="title">Title A-Z</option>
              <option value="rating">Top Rated</option>
            </select>
            <select class="form-input" id="explore-difficulty" style="width:auto;padding:8px 32px 8px 12px;font-size:13px">
              <option value="">All Difficulty</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        </div>

        <!-- Category Chips -->
        <div id="explore-category-chips" class="flex gap-sm mb-lg" style="flex-wrap:wrap;overflow-x:auto">
          <span class="chip active" data-cat="" onclick="UserApp.filterByCategory(this, '')">All</span>
        </div>

        <!-- Results Grid -->
        <div class="books-grid" id="explore-results">
          ${bookSkeletons(12)}
        </div>

        <div id="explore-pagination" class="pagination"></div>
      </div>
    `;

    loadExploreData(params);
    bindExploreEvents();
  }

  let exploreState = { page: 1, sort: 'recent', difficulty: '', category: '', search: '' };

  async function loadExploreData(params = {}) {
    Object.assign(exploreState, params);

    try {
      // Load category chips
      const catResult = await ApiClient.getCategories();
      const catChips = document.getElementById('explore-category-chips');
      const cats = catResult.data || [];
      catChips.innerHTML = `<span class="chip ${!exploreState.category ? 'active' : ''}" onclick="UserApp.filterByCategory(this, '')">All</span>` +
        cats.map(c => `<span class="chip ${exploreState.category === c.id ? 'active' : ''}" onclick="UserApp.filterByCategory(this, '${c.id}')">${c.name}</span>`).join('');

      // Load books
      const result = await ApiClient.getBooks({
        page: exploreState.page,
        limit: 20,
        sort: exploreState.sort,
        difficulty: exploreState.difficulty || undefined,
        category: exploreState.category || undefined,
      });

      renderBookGrid('explore-results', result.data || []);

    } catch (err) {
      document.getElementById('explore-results').innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">🔍</div>
          <p class="empty-state__title">Could not load books</p>
          <p class="empty-state__message">${err.message}</p>
        </div>`;
    }
  }

  function bindExploreEvents() {
    let searchTimeout;
    document.getElementById('explore-search')?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => { exploreState.search = e.target.value; loadExploreData(); }, 400);
    });
    document.getElementById('explore-sort')?.addEventListener('change', (e) => { exploreState.sort = e.target.value; loadExploreData(); });
    document.getElementById('explore-difficulty')?.addEventListener('change', (e) => { exploreState.difficulty = e.target.value; loadExploreData(); });
  }

  function filterByCategory(el, catId) {
    document.querySelectorAll('#explore-category-chips .chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    exploreState.category = catId;
    loadExploreData();
  }

  async function renderBookDetail(container, params = {}) {
    container.innerHTML = `<div class="user-content"><div class="loading-overlay"><div class="spinner"></div></div></div>`;

    try {
      const [bookResult, qnaResult] = await Promise.all([
        ApiClient.getBook(params.id),
        ApiClient.getQuestions(params.id).catch(() => ({ data: [] }))
      ]);
      const book = bookResult.data;
      const qnas = qnaResult.data || [];

      container.innerHTML = `
        <div class="user-content fade-in">
          <div class="book-detail">
            <div class="book-detail__header">
              <div class="book-detail__cover">
                ${book.cover_image_url
                  ? `<img src="${book.cover_image_url}" alt="${escapeHtml(book.title)}">`
                  : `<div style="width:100%;height:100%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;color:#fff;font-size:36px;font-weight:700">${book.title[0]}</div>`
                }
              </div>
              <div class="book-detail__info">
                <h1 class="book-detail__title">${escapeHtml(book.title)}</h1>
                <p class="book-detail__author">by ${escapeHtml(book.author)}</p>
                <div class="book-detail__meta">
                  <span>⭐ ${book.rating?.toFixed(1) || '—'}</span>
                  <span>📄 ${book.page_count} pages</span>
                  <span>⏱ ${Math.floor((book.estimated_read_time_minutes || 0) / 60)}h ${(book.estimated_read_time_minutes || 0) % 60}m</span>
                  <span class="chip" style="font-size:11px;padding:3px 8px">${book.difficulty}</span>
                </div>
                <div class="flex gap-sm mt-sm" style="flex-wrap:wrap">
                  ${(book.categories || []).map(c => `<span class="chip chip-outline" style="font-size:11px">${c.name}</span>`).join('')}
                </div>
                <div class="book-detail__actions">
                  <button class="btn btn-gradient btn-lg" onclick="UserApp.navigate('pdfReader', {url: '${book.url}', title: '${escapeHtml(book.title)}'})" ${!book.url ? 'disabled' : ''}>
                    <span class="material-symbols-outlined" style="font-size:20px">auto_stories</span> Read Now
                  </button>
                  <button class="btn btn-secondary">
                    <span class="material-symbols-outlined" style="font-size:18px">favorite_border</span> Save
                  </button>
                  ${book.allowed_download ? `
                    <button class="btn btn-secondary">
                      <span class="material-symbols-outlined" style="font-size:18px">download</span> PDF
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Description -->
            <div class="card mb-lg">
              <h3 class="text-title-medium mb-sm">Description</h3>
              <p class="book-detail__description" style="margin-bottom:0">${escapeHtml(book.description)}</p>
            </div>

            <!-- Rights Info -->
            <div class="card card-accent mb-lg" style="padding:12px 16px">
              <div class="flex items-center gap-sm">
                <span class="material-symbols-outlined" style="font-size:18px;color:var(--accent)">verified</span>
                <span class="text-body-small">Rights: <strong>${book.rights_status.replace('_', ' ')}</strong>
                  ${book.license_name ? ` • License: ${book.license_name}` : ''}
                </span>
              </div>
            </div>

            <!-- Study Stats -->
            <div class="grid-3 gap-md mb-lg">
              <div class="stat-card text-center">
                <div class="stat-card__value" style="color:var(--accent)">${book.questionsCount || 0}</div>
                <div class="stat-card__label">Questions</div>
              </div>
              <div class="stat-card text-center">
                <div class="stat-card__value" style="color:var(--accent)">${book.quizzesCount || 0}</div>
                <div class="stat-card__label">Quizzes</div>
              </div>
              <div class="stat-card text-center">
                <div class="stat-card__value" style="color:var(--accent)">${book.flashcardSetsCount || 0}</div>
                <div class="stat-card__label">Flashcard Sets</div>
              </div>
            </div>

            <!-- Chapters -->
            ${book.chapters?.length ? `
              <div class="card" style="padding:0; margin-bottom:var(--space-lg);">
                <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border)">
                  <h3 class="text-title-medium">Chapters (${book.chapters.length})</h3>
                </div>
                <div class="chapter-list">
                  ${book.chapters.map(ch => `
                    <div class="chapter-item">
                      <div class="chapter-item__number">Chapter ${ch.chapter_number}</div>
                      <div class="chapter-item__title">${escapeHtml(ch.title)}</div>
                      <div class="chapter-item__meta">
                        ${ch.summary ? `<span>📝 Has summary</span>` : ''}
                        ${ch.questionsCount ? `<span>❓ ${ch.questionsCount} questions</span>` : ''}
                        ${ch.word_count ? `<span>📄 ${ch.word_count} words</span>` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Questions & Answers -->
            ${qnas.length > 0 ? `
              <div class="card" style="padding:0">
                <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border)">
                  <h3 class="text-title-medium">Questions & Answers</h3>
                </div>
                <div style="padding:var(--space-md) var(--space-lg)">
                  ${qnas.map(q => `
                    <div style="margin-bottom:16px; border-bottom:1px solid var(--border); padding-bottom:16px;">
                      <div class="text-body-medium" style="font-weight:600; color:var(--text-primary); margin-bottom:4px;">Q: ${escapeHtml(q.question)}</div>
                      <div class="text-body-small" style="color:var(--text-secondary);">A: ${escapeHtml(q.answer)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div class="user-content">
          <div class="empty-state">
            <div class="empty-state__icon">📚</div>
            <p class="empty-state__title">Book not found</p>
            <p class="empty-state__message">${err.message}</p>
            <button class="btn btn-primary" onclick="UserApp.navigate('explore')">Browse Library</button>
          </div>
        </div>`;
    }
  }

  function renderStudy(container) {
    container.innerHTML = `
      <div class="user-content fade-in">
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-header__title">Study Hub</h1>
            <p class="admin-page-header__subtitle">Your study tools and progress</p>
          </div>
        </div>

        <div class="grid-2 gap-lg mb-xl">
          ${studyLargeCard('quiz', 'Quizzes', 'Test your knowledge with multiple-choice quizzes from your books', 'Start Quiz')}
          ${studyLargeCard('style', 'Flashcards', 'Review key concepts with spaced-repetition flashcards', 'Study Cards')}
          ${studyLargeCard('help_outline', 'Q&A', 'Browse and study questions and answers for every chapter', 'Browse Q&A')}
          ${studyLargeCard('psychology', 'Revision Center', 'Review highlighted and saved concepts across all your books', 'Open Revision')}
        </div>

        <div class="card">
          <div class="empty-state">
            <div class="empty-state__icon">🎯</div>
            <p class="empty-state__title">Start studying to see your progress</p>
            <p class="empty-state__message">Take quizzes, review flashcards, and answer questions to build your study statistics.</p>
            <button class="btn btn-primary" onclick="UserApp.navigate('explore')">Find Study Material</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderShelf(container) {
    container.innerHTML = `
      <div class="user-content fade-in">
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-header__title">My Shelf</h1>
            <p class="admin-page-header__subtitle">Your saved books, highlights, and downloads</p>
          </div>
        </div>

        <div class="tabs mb-lg">
          <span class="tab active">Saved Books</span>
          <span class="tab">Downloads</span>
          <span class="tab">Highlights</span>
          <span class="tab">Notes</span>
          <span class="tab">Bookmarks</span>
        </div>

        <div class="empty-state">
          <div class="empty-state__icon">📚</div>
          <p class="empty-state__title">Your shelf is waiting.</p>
          <p class="empty-state__message">Save books while browsing and they'll appear here. Sign in to sync across devices.</p>
          <button class="btn btn-primary" onclick="UserApp.navigate('explore')">Explore Books</button>
        </div>
      </div>
    `;
  }

  function renderProfile(container) {
    container.innerHTML = `
      <div class="user-content fade-in">
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-header__title">Profile</h1>
            <p class="admin-page-header__subtitle">Account and settings</p>
          </div>
        </div>

        <div class="grid-2 gap-lg">
          <div class="card">
            <h3 class="text-title-medium mb-md">Account</h3>
            <div class="empty-state" style="padding:var(--space-lg)">
              <div class="empty-state__icon">👤</div>
              <p class="empty-state__title">Sign in to unlock more</p>
              <p class="empty-state__message">Sign in with your email to sync progress, highlights, and bookmarks across devices.</p>
              <button class="btn btn-primary">Sign In</button>
            </div>
          </div>

          <div>
            <div class="card mb-md">
              <h3 class="text-title-medium mb-md">Appearance</h3>
              <div class="flex items-center justify-between">
                <span class="text-body-medium">Dark Mode</span>
                <div class="toggle" id="profile-theme-toggle" onclick="ThemeManager.toggle();this.classList.toggle('active')"></div>
              </div>
            </div>
            <div class="card mb-md">
              <h3 class="text-title-medium mb-md">About</h3>
              <p class="text-body-medium text-secondary mb-sm">TF Study Shelf v1.0.0</p>
              <p class="text-body-small text-tertiary">Read. Learn. Remember.<br>© 2026 Techily Fly. All rights reserved.</p>
            </div>
            <div class="card">
              <h3 class="text-title-medium mb-md">Legal</h3>
              <a href="#" class="text-body-medium text-accent" style="display:block;padding:8px 0">Privacy Policy</a>
              <a href="#" class="text-body-medium text-accent" style="display:block;padding:8px 0">Terms of Use</a>
              <a href="#" class="text-body-medium text-accent" style="display:block;padding:8px 0">Content Rights Policy</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function renderPdfReader(container, params = {}) {
    const { url, title } = params;
    if (!url) {
      container.innerHTML = `<div class="user-content"><div class="empty-state"><p>No PDF URL provided.</p><button class="btn btn-primary" onclick="UserApp.navigate('explore')">Go Back</button></div></div>`;
      return;
    }

    container.innerHTML = `
      <div class="pdf-viewer-container" style="display:flex;flex-direction:column;height:calc(100vh - 64px);">
        <!-- Top Toolbar -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:var(--bg-elevated);border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="btn-icon" onclick="UserApp.navigate('home')"><span class="material-symbols-outlined">arrow_back</span></button>
            <h2 class="text-title-medium" style="margin:0">${title || 'Reading'}</h2>
          </div>
          <div style="display:flex;align-items:center;gap:16px;">
            <span id="page-num" class="text-label-large"></span>
            <button class="btn-icon" id="btn-zoom-out"><span class="material-symbols-outlined">zoom_out</span></button>
            <button class="btn-icon" id="btn-zoom-in"><span class="material-symbols-outlined">zoom_in</span></button>
          </div>
        </div>

        <!-- PDF Canvas Wrapper -->
        <div style="flex:1;overflow:auto;background:var(--bg-base);display:flex;justify-content:center;padding:24px 0;" id="pdf-wrapper">
          <canvas id="pdf-canvas" style="box-shadow:0 8px 24px rgba(0,0,0,0.1);max-width:100%;border-radius:8px;"></canvas>
        </div>

        <!-- Bottom Controls -->
        <div style="display:flex;align-items:center;justify-content:center;gap:24px;padding:16px;background:var(--bg-elevated);border-top:1px solid var(--border);">
          <button class="btn btn-secondary" id="btn-prev"><span class="material-symbols-outlined" style="margin-right:8px">navigate_before</span> Previous</button>
          <div style="display:flex;gap:4px;overflow-x:auto;max-width:300px;align-items:center;" id="page-scrubber">
             <!-- Tiny dots for progress -->
          </div>
          <button class="btn btn-primary" id="btn-next">Next <span class="material-symbols-outlined" style="margin-left:8px">navigate_next</span></button>
        </div>
      </div>
    `;

    // Initialize PDF.js
    let pdfDoc = null,
        pageNum = 1,
        pageRendering = false,
        pageNumPending = null,
        scale = 1.2,
        canvas = document.getElementById('pdf-canvas'),
        ctx = canvas.getContext('2d');

    function renderPage(num) {
      pageRendering = true;
      pdfDoc.getPage(num).then(function(page) {
        let viewport = page.getViewport({scale: scale});
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        let renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };
        let renderTask = page.render(renderContext);

        renderTask.promise.then(function() {
          pageRendering = false;
          if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
          }
        });
      });
      document.getElementById('page-num').textContent = `Page ${num} of ${pdfDoc.numPages}`;
      updateScrubber(num, pdfDoc.numPages);
    }

    function queueRenderPage(num) {
      if (pageRendering) {
        pageNumPending = num;
      } else {
        renderPage(num);
      }
    }

    function onPrevPage() {
      if (pageNum <= 1) return;
      pageNum--;
      queueRenderPage(pageNum);
    }

    function onNextPage() {
      if (pageNum >= pdfDoc.numPages) return;
      pageNum++;
      queueRenderPage(pageNum);
    }

    function updateScrubber(curr, total) {
      const scrub = document.getElementById('page-scrubber');
      if(!scrub) return;
      
      let html = '';
      const maxDots = 20;
      const step = Math.max(1, Math.floor(total / maxDots));
      
      for(let i=1; i<=total; i+=step) {
        const isActive = (i <= curr && curr < i+step);
        html += `<div style="width:8px;height:8px;border-radius:50%;background:${isActive ? 'var(--accent)' : 'var(--border)'};cursor:pointer" onclick="UserApp.goToPdfPage(${i})"></div>`;
      }
      scrub.innerHTML = html;
    }

    UserApp.goToPdfPage = function(num) {
      if (pdfDoc && num >= 1 && num <= pdfDoc.numPages) {
        pageNum = num;
        queueRenderPage(pageNum);
      }
    };

    document.getElementById('btn-prev').addEventListener('click', onPrevPage);
    document.getElementById('btn-next').addEventListener('click', onNextPage);
    document.getElementById('btn-zoom-in').addEventListener('click', () => { scale += 0.2; queueRenderPage(pageNum); });
    document.getElementById('btn-zoom-out').addEventListener('click', () => { if(scale > 0.6) scale -= 0.2; queueRenderPage(pageNum); });

    pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
      pdfDoc = pdfDoc_;
      renderPage(pageNum);
    }).catch(function(err) {
      container.innerHTML = `<div class="user-content"><div class="empty-state"><p>Error loading PDF: ${err.message}</p><button class="btn btn-primary" onclick="UserApp.navigate('explore')">Go Back</button></div></div>`;
    });
  }

  // ─── Helper Functions ──────────────────────────

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  }

  function bookSkeletons(n) {
    return Array(n).fill('').map(() => `
      <div class="book-card">
        <div class="book-card__cover skeleton" style="aspect-ratio:3/4"></div>
        <div class="skeleton mt-sm" style="height:16px;width:80%"></div>
        <div class="skeleton mt-xs" style="height:12px;width:60%"></div>
        <div class="skeleton mt-xs" style="height:12px;width:40%"></div>
      </div>
    `).join('');
  }

  function categorySkeletons(n) {
    return Array(n).fill('').map(() => `
      <div class="category-rail__item">
        <div class="skeleton" style="width:32px;height:32px;border-radius:50%"></div>
        <div class="skeleton" style="width:50px;height:12px"></div>
      </div>
    `).join('');
  }

  function studyCard(icon, title, desc, page) {
    return `
      <div class="card card-hover" style="cursor:pointer;text-align:center;padding:var(--space-xl) var(--space-md)" onclick="UserApp.navigate('${page}')">
        <div style="font-size:32px;margin-bottom:var(--space-sm)">
          <span class="material-symbols-outlined" style="font-size:36px;color:var(--accent)">${icon}</span>
        </div>
        <div class="text-title-medium">${title}</div>
        <div class="text-body-small text-secondary mt-xs">${desc}</div>
      </div>
    `;
  }

  function studyLargeCard(icon, title, desc, cta) {
    return `
      <div class="card card-hover" style="cursor:pointer">
        <div class="flex items-center gap-md mb-md">
          <div class="stat-card__icon" style="width:48px;height:48px">
            <span class="material-symbols-outlined" style="font-size:24px">${icon}</span>
          </div>
          <div>
            <div class="text-title-large">${title}</div>
            <div class="text-body-small text-secondary">${desc}</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-full">${cta}</button>
      </div>
    `;
  }

  function renderBookGrid(containerId, books) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (books.length === 0) {
      el.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">📚</div>
          <p class="empty-state__title">No books found</p>
          <p class="empty-state__message">Content will appear here once books are added through the admin panel.</p>
        </div>`;
      return;
    }

    el.innerHTML = books.map(book => `
      <div class="book-card" onclick="UserApp.navigate('book', {id:'${book.id}'})">
        <div class="book-card__cover">
          ${book.cover_image_url
            ? `<img src="${book.cover_image_url}" alt="${escapeHtml(book.title)}" loading="lazy">`
            : `<div style="width:100%;height:100%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:700">${book.title[0]}</div>`
          }
        </div>
        <div class="book-card__title">${escapeHtml(book.title)}</div>
        <div class="book-card__author">${escapeHtml(book.author)}</div>
        <div class="book-card__meta">
          <span>⭐ ${book.rating?.toFixed(1) || '—'}</span>
          <span>📄 ${book.page_count}</span>
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── Navigation ────────────────────────────────

  const pageRenderers = {
    home: renderHome,
    explore: renderExplore,
    book: renderBookDetail,
    study: renderStudy,
    shelf: renderShelf,
    profile: renderProfile,
    pdfReader: renderPdfReader,
  };

  function navigate(page, params = {}) {
    currentPage = page;
    const container = document.getElementById('user-main-content');
    
    // Hide topbar/footer when reading a PDF for full immersion
    const topbar = document.querySelector('.user-topbar');
    const footer = document.querySelector('.user-footer');
    if (page === 'pdfReader') {
      if(topbar) topbar.style.display = 'none';
      if(footer) footer.style.display = 'none';
    } else {
      if(topbar) topbar.style.display = 'flex';
      if(footer) footer.style.display = 'block';
    }

    const renderer = pageRenderers[page];

    if (renderer) {
      container.innerHTML = '<div class="user-content"><div class="loading-overlay"><div class="spinner"></div></div></div>';
      renderer(container, params);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ─── Search ────────────────────────────────────
  function bindGlobalSearch() {
    const input = document.getElementById('global-search');
    let timeout;
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        navigate('explore', { search: input.value.trim() });
      }
    });
  }

  // ─── Init ──────────────────────────────────────
  function init() {
    ThemeManager.init();
    bindGlobalSearch();
    navigate('home');
  }

  document.addEventListener('DOMContentLoaded', init);

  return { navigate, filterByCategory };
})();
