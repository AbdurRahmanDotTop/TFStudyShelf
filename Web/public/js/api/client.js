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
      const errorMessage = (data.error && data.error.message) || data.message || `API Error: ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.code = (data.error && data.error.code) || data.code;
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

    getCourses: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/api/v1/courses${qs ? '?' + qs : ''}`);
    },
    getCourse: (id) => request(`/api/v1/courses/${id}`),

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

      // Courses
      getCourses: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/v1/admin/courses${qs ? '?' + qs : ''}`);
      },
      createCourse: (body) => request('/api/v1/admin/courses', { method: 'POST', body }),
      updateCourse: (id, body) => request(`/api/v1/admin/courses/${id}`, { method: 'PUT', body }),
      deleteCourse: (id) => request(`/api/v1/admin/courses/${id}`, { method: 'DELETE' }),
      publishCourse: (id) => request(`/api/v1/admin/courses/${id}/publish`, { method: 'POST' }),
      unpublishCourse: (id) => request(`/api/v1/admin/courses/${id}/unpublish`, { method: 'POST' }),

      // Course Sections
      getCourseSections: (courseId) => request(`/api/v1/admin/courses/${courseId}/sections`),
      createCourseSection: (courseId, body) => request('/api/v1/admin/course-sections', { method: 'POST', body: { courseId, ...body } }),
      updateCourseSection: (courseId, sectionId, body) => request(`/api/v1/admin/course-sections/${sectionId}`, { method: 'PUT', body: { courseId, ...body } }),
      deleteCourseSection: (courseId, sectionId) => request(`/api/v1/admin/course-sections/${sectionId}`, { method: 'DELETE' }),

      // Course Lessons
      getCourseLessons: (sectionId) => request(`/api/v1/admin/course-sections/${sectionId}/lessons`),
      createCourseLesson: (sectionId, body) => request('/api/v1/admin/course-lessons', { method: 'POST', body: { sectionId, ...body } }),
      updateCourseLesson: (sectionId, lessonId, body) => request(`/api/v1/admin/course-lessons/${lessonId}`, { method: 'PUT', body: { sectionId, ...body } }),
      deleteCourseLesson: (sectionId, lessonId) => request(`/api/v1/admin/course-lessons/${lessonId}`, { method: 'DELETE' }),

      // Course Assessments
      getCourseAssessments: (courseId) => request(`/api/v1/admin/courses/${courseId}/assessments`),
      createCourseAssessment: (courseId, body) => request('/api/v1/admin/course-assessments', { method: 'POST', body: { courseId, ...body } }),
      updateCourseAssessment: (courseId, assessmentId, body) => request(`/api/v1/admin/course-assessments/${assessmentId}`, { method: 'PUT', body: { courseId, ...body } }),
      deleteCourseAssessment: (courseId, assessmentId) => request(`/api/v1/admin/course-assessments/${assessmentId}`, { method: 'DELETE' }),

      // Course Assignments
      getCourseAssignments: (courseId) => request(`/api/v1/admin/courses/${courseId}/assignments`),
      createCourseAssignment: (courseId, body) => request('/api/v1/admin/course-assignments', { method: 'POST', body: { courseId, ...body } }),
      updateCourseAssignment: (courseId, assignmentId, body) => request(`/api/v1/admin/course-assignments/${assignmentId}`, { method: 'PUT', body: { courseId, ...body } }),
      deleteCourseAssignment: (courseId, assignmentId) => request(`/api/v1/admin/course-assignments/${assignmentId}`, { method: 'DELETE' }),

      // Course Projects
      getCourseProjects: (courseId) => request(`/api/v1/admin/courses/${courseId}/projects`),
      createCourseProject: (courseId, body) => request('/api/v1/admin/course-projects', { method: 'POST', body: { courseId, ...body } }),
      updateCourseProject: (courseId, projectId, body) => request(`/api/v1/admin/course-projects/${projectId}`, { method: 'PUT', body: { courseId, ...body } }),
      deleteCourseProject: (courseId, projectId) => request(`/api/v1/admin/course-projects/${projectId}`, { method: 'DELETE' }),

      // Course Resources
      getCourseResources: (courseId) => request(`/api/v1/admin/courses/${courseId}/resources`),
      createCourseResource: (courseId, body) => request('/api/v1/admin/course-resources', { method: 'POST', body: { courseId, ...body } }),
      updateCourseResource: (courseId, resourceId, body) => request(`/api/v1/admin/course-resources/${resourceId}`, { method: 'PUT', body: { courseId, ...body } }),
      deleteCourseResource: (courseId, resourceId) => request(`/api/v1/admin/course-resources/${resourceId}`, { method: 'DELETE' }),

      // Phase 5: Course Questions & Interactive Content
      getCourseQuestions: (courseId) => request(`/api/v1/admin/courses/${courseId}/questions`),
      createCourseQuestion: (courseId, body) => request(`/api/v1/admin/courses/${courseId}/questions`, { method: 'POST', body }),
      updateCourseQuestion: (courseId, questionId, body) => request(`/api/v1/admin/courses/${courseId}/questions/${questionId}`, { method: 'PUT', body }),
      deleteCourseQuestion: (courseId, questionId) => request(`/api/v1/admin/courses/${courseId}/questions/${questionId}`, { method: 'DELETE' }),

      getCodingLesson: (lessonId) => request(`/api/v1/admin/course-lessons/${lessonId}/coding`),
      saveCodingLesson: (courseId, lessonId, body) => request(`/api/v1/admin/courses/${courseId}/lessons/${lessonId}/coding`, { method: 'POST', body }),

      getLiveSession: (lessonId) => request(`/api/v1/admin/course-lessons/${lessonId}/live`),
      saveLiveSession: (courseId, lessonId, body) => request(`/api/v1/admin/courses/${courseId}/lessons/${lessonId}/live`, { method: 'POST', body }),

      // Chapters
      getChapters: (bookId) => request(`/api/v1/admin/books/${bookId}/chapters`), 
      createChapter: (bookId, body) => request('/api/v1/admin/chapters', { method: 'POST', body: { bookId, ...body } }),
      updateChapter: (bookId, chapterId, body) => request(`/api/v1/admin/chapters/${chapterId}`, { method: 'PUT', body: { bookId, ...body } }),
      deleteChapter: (bookId, chapterId) => request(`/api/v1/admin/chapters/${chapterId}`, { method: 'DELETE' }),
      
      // Q&A
      getQuestions: (bookId) => request(`/api/v1/admin/books/${bookId}/questions`),
      createQuestion: (bookId, body) => request('/api/v1/admin/questions', { method: 'POST', body: { bookId, ...body } }),
      updateQuestion: (bookId, questionId, body) => request(`/api/v1/admin/questions/${questionId}`, { method: 'PUT', body: { bookId, ...body } }),
      deleteQuestion: (bookId, questionId) => request(`/api/v1/admin/questions/${questionId}`, { method: 'DELETE' }),

      // Quizzes
      getQuizzes: (bookId) => request(`/api/v1/admin/books/${bookId}/quizzes`),
      createQuiz: (bookId, body) => request('/api/v1/admin/quizzes', { method: 'POST', body: { bookId, ...body } }),
      updateQuiz: (bookId, quizId, body) => request(`/api/v1/admin/quizzes/${quizId}`, { method: 'PUT', body: { bookId, ...body } }),
      deleteQuiz: (bookId, quizId) => request(`/api/v1/admin/quizzes/${quizId}`, { method: 'DELETE' }),

      // Flashcards
      getFlashcards: (bookId) => request(`/api/v1/admin/books/${bookId}/flashcards`),
      createFlashcardSet: (bookId, body) => request('/api/v1/admin/flashcard-sets', { method: 'POST', body: { bookId, ...body } }),
      updateFlashcardSet: (bookId, setId, body) => request(`/api/v1/admin/flashcard-sets/${setId}`, { method: 'PUT', body: { bookId, ...body } }),
      deleteFlashcardSet: (bookId, setId) => request(`/api/v1/admin/flashcard-sets/${setId}`, { method: 'DELETE' }),

      // Categories & Subjects
      getCategories: () => request('/api/v1/admin/categories'),
      createCategory: (body) => request('/api/v1/admin/categories', { method: 'POST', body }),
      updateCategory: (id, body) => request(`/api/v1/admin/categories/${id}`, { method: 'PUT', body }),
      deleteCategory: (id) => request(`/api/v1/admin/categories/${id}`, { method: 'DELETE' }),
      
      getSubjects: () => request('/api/v1/admin/subjects'),
      createSubject: (body) => request('/api/v1/admin/subjects', { method: 'POST', body }),
      updateSubject: (id, body) => request(`/api/v1/admin/subjects/${id}`, { method: 'PUT', body }),
      deleteSubject: (id) => request(`/api/v1/admin/subjects/${id}`, { method: 'DELETE' }),

      // Languages
      getLanguages: () => request('/api/v1/admin/languages'),
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
