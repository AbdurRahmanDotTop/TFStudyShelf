/**
 * TF Study Shelf — API Client
 * Connects to the Cloudflare Worker Backend.
 */

window.ApiClient = (() => {
  let baseUrl = 'http://localhost:8787'; // Default for local dev (wrangler dev)
  let authToken = null;

  // Determine base URL from environment/location
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Ensure this matches the actual deployed Worker URL!
    baseUrl = 'https://tf-api.tfstudyshelf.workers.dev';
  }

  function setBaseUrl(url) {
    baseUrl = url;
  }

  function setAuthToken(token) {
    authToken = token;
  }

  function getAuthToken() {
    return authToken;
  }

  async function request(endpoint, options = {}) {
    const url = `${baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    } else if (window.firebase && firebase.auth && firebase.auth().currentUser) {
       // Automatically try to get token if using Firebase Auth client
       try {
         const token = await firebase.auth().currentUser.getIdToken();
         headers['Authorization'] = `Bearer ${token}`;
       } catch (e) {
         console.warn("Could not get Firebase token for API request", e);
       }
    }

    const config = {
      ...options,
      headers
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `API Error: ${response.status}`);
      error.status = response.status;
      error.code = data.code;
      throw error;
    }

    return data;
  }

  return {
    setBaseUrl,
    setAuthToken,
    getAuthToken,

    // ─── Public Endpoints ──────────────────────────────────────────
    
    getCategories: () => request('/api/v1/categories'),
    getSubjects: () => request('/api/v1/subjects'),
    getLanguages: () => request('/api/v1/languages'),
    
    getBooks: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/api/v1/books${qs ? '?' + qs : ''}`);
    },
    getBook: (id) => request(`/api/v1/books/${id}`),
    
    getChapters: (bookId) => request(`/api/v1/books/${bookId}/chapters`),
    getQuestions: (bookId) => request(`/api/v1/books/${bookId}/questions`),
    getQuizzes: (bookId) => request(`/api/v1/books/${bookId}/quizzes`),
    getFlashcards: (bookId) => request(`/api/v1/books/${bookId}/flashcards`),

    search: (query, filters = {}) => {
      const params = new URLSearchParams({ q: query, ...filters }).toString();
      return request(`/api/v1/search?${params}`);
    },

    // ─── Admin Endpoints ───────────────────────────────────────────
    
    admin: {
      getAnalytics: () => request('/api/v1/admin/analytics/overview'),
      
      // Books
      getBooks: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/v1/admin/books${qs ? '?' + qs : ''}`);
      },
      createBook: (body) => request('/api/v1/admin/books', { method: 'POST', body }),
      updateBook: (id, body) => request(`/api/v1/admin/books/${id}`, { method: 'PUT', body }),
      deleteBook: (id) => request(`/api/v1/admin/books/${id}`, { method: 'DELETE' }),
      publishBook: (id) => request(`/api/v1/admin/books/${id}/publish`, { method: 'POST' }),
      unpublishBook: (id) => request(`/api/v1/admin/books/${id}/unpublish`, { method: 'POST' }),

      // Chapters
      getChapters: (bookId) => request(`/api/v1/books/${bookId}/chapters`), 
      createChapter: (bookId, body) => request('/api/v1/admin/chapters', { method: 'POST', body: { bookId, ...body } }),
      updateChapter: (bookId, chapterId, body) => request(`/api/v1/admin/chapters/${chapterId}`, { method: 'PUT', body: { bookId, ...body } }),
      deleteChapter: (bookId, chapterId) => request(`/api/v1/admin/chapters/${chapterId}`, { method: 'DELETE' }),
      
      // Q&A
      getQuestions: (bookId) => request(`/api/v1/books/${bookId}/questions`),
      createQuestion: (bookId, body) => request('/api/v1/admin/questions', { method: 'POST', body: { bookId, ...body } }),
      updateQuestion: (bookId, questionId, body) => request(`/api/v1/admin/questions/${questionId}`, { method: 'PUT', body: { bookId, ...body } }),
      deleteQuestion: (bookId, questionId) => request(`/api/v1/admin/questions/${questionId}`, { method: 'DELETE' }),

      // Quizzes
      getQuizzes: (bookId) => request(`/api/v1/books/${bookId}/quizzes`),
      createQuiz: (bookId, body) => request('/api/v1/admin/quizzes', { method: 'POST', body: { bookId, ...body } }),
      updateQuiz: (bookId, quizId, body) => request(`/api/v1/admin/quizzes/${quizId}`, { method: 'PUT', body: { bookId, ...body } }),
      deleteQuiz: (bookId, quizId) => request(`/api/v1/admin/quizzes/${quizId}`, { method: 'DELETE' }),

      // Flashcards
      getFlashcards: (bookId) => request(`/api/v1/books/${bookId}/flashcards`),
      createFlashcardSet: (bookId, body) => request('/api/v1/admin/flashcard-sets', { method: 'POST', body: { bookId, ...body } }),
      updateFlashcardSet: (bookId, setId, body) => request(`/api/v1/admin/flashcard-sets/${setId}`, { method: 'PUT', body: { bookId, ...body } }),
      deleteFlashcardSet: (bookId, setId) => request(`/api/v1/admin/flashcard-sets/${setId}`, { method: 'DELETE' }),

      // Categories & Subjects
      createCategory: (body) => request('/api/v1/admin/categories', { method: 'POST', body }),
      updateCategory: (id, body) => request(`/api/v1/admin/categories/${id}`, { method: 'PUT', body }),
      deleteCategory: (id) => request(`/api/v1/admin/categories/${id}`, { method: 'DELETE' }),
      
      createSubject: (body) => request('/api/v1/admin/subjects', { method: 'POST', body }),
      updateSubject: (id, body) => request(`/api/v1/admin/subjects/${id}`, { method: 'PUT', body }),
      deleteSubject: (id) => request(`/api/v1/admin/subjects/${id}`, { method: 'DELETE' }),

      // Languages
      createLanguage: (body) => request('/api/v1/admin/languages', { method: 'POST', body }),
      updateLanguage: (id, body) => request(`/api/v1/admin/languages/${id}`, { method: 'PUT', body }),
      deleteLanguage: (id) => request(`/api/v1/admin/languages/${id}`, { method: 'DELETE' }),

      // Users
      getUsers: () => request('/api/v1/admin/users'),
      updateUser: (id, body) => request(`/api/v1/admin/users/${id}`, { method: 'PUT', body }),
      changeUserPassword: (id, password) => request(`/api/v1/admin/users/${id}/password`, { method: 'POST', body: { password } }),
      deleteUser: (id) => request(`/api/v1/admin/users/${id}`, { method: 'DELETE' }),

      // Ads Configuration
      getAdsConfig: () => request('/api/v1/admin/ads'),
      saveAdsConfig: (config) => {
        if (config.id) {
            return request(`/api/v1/admin/ads/${config.id}`, { method: 'PUT', body: config });
        }
        return request('/api/v1/admin/ads', { method: 'POST', body: config });
      }
    }
  };
})();
