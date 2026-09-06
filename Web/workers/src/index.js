/**
 * TF Study Shelf — Cloudflare Workers API
 * Main entry point with routing, CORS, error handling, and middleware
 */

// ═══════════════════════════════════════════════════
// Utility Helpers
// ═══════════════════════════════════════════════════

function generateId() {
  return crypto.randomUUID();
}

import { FirebaseAdmin } from './firebase-admin.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function successResponse(data, meta = null) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return jsonResponse(body);
}

function errorResponse(code, message, status = 400) {
  return jsonResponse({ success: false, error: { code, message, status } }, status);
}

function corsHeaders(origin, env) {
  const allowed = (env.CORS_ORIGIN || '*').split(',').map(s => s.trim());
  const isAllowed = allowed.includes('*') || allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// ═══════════════════════════════════════════════════
// Firebase JWT Verification (simplified)
// ═══════════════════════════════════════════════════

async function verifyFirebaseToken(token, env) {
  // In production, verify Firebase JWT signature against Google's public keys
  // For development, decode the JWT payload
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    
    return {
      uid: payload.sub || payload.user_id,
      email: payload.email,
      role: payload.role || null,
      admin: payload.admin || false
    };
  } catch {
    return null;
  }
}

async function authMiddleware(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return verifyFirebaseToken(token, env);
}

async function requireAuth(request, env) {
  const user = await authMiddleware(request, env);
  if (!user) throw { status: 401, code: 'AUTH_REQUIRED', message: 'Authentication required' };
  return user;
}

async function requireAdmin(request, env) {
  const user = await requireAuth(request, env);
  // Check admin role from D1
  let admin = await env.DB.prepare('SELECT * FROM admin_users WHERE firebase_uid = ? AND is_active = 1').bind(user.uid).first();
  
  if (!admin && user.email) {
    // Fallback: Try to match by email if UID doesn't match (e.g. after Firebase project migration)
    admin = await env.DB.prepare('SELECT * FROM admin_users WHERE email = ? AND is_active = 1').bind(user.email).first();
    if (admin) {
      // Update the firebase_uid to the new one
      await env.DB.prepare('UPDATE admin_users SET firebase_uid = ? WHERE id = ?').bind(user.uid, admin.id).run();
    } else {
      // If no admin exists at all but it's the known admin email, auto-create (optional safety net for development)
      if (user.email === 'admin@techily.com' || user.email === 'admin@techilyfly.com') {
        const newId = 'admin-' + Date.now();
        await env.DB.prepare(
          'INSERT INTO admin_users (id, firebase_uid, email, display_name, role) VALUES (?, ?, ?, ?, ?)'
        ).bind(newId, user.uid, user.email, 'Super Admin', 'SUPER_ADMIN').run();
        admin = { id: newId, role: 'SUPER_ADMIN', email: user.email };
      }
    }
  }

  if (!admin) throw { status: 403, code: 'FORBIDDEN', message: 'Admin access required' };
  return { ...user, adminId: admin.id, adminRole: admin.role, adminEmail: admin.email };
}

function requireRole(admin, ...roles) {
  if (!roles.includes(admin.adminRole)) {
    throw { status: 403, code: 'FORBIDDEN', message: `Requires role: ${roles.join(' or ')}` };
  }
}

// ═══════════════════════════════════════════════════
// Rate Limiting (simple in-memory via KV)
// ═══════════════════════════════════════════════════

async function checkRateLimit(key, limit, windowSec, env) {
  try {
    const cacheKey = `rl:${key}`;
    const current = await env.CACHE.get(cacheKey);
    const count = current ? parseInt(current) : 0;
    if (count >= limit) {
      throw { status: 429, code: 'RATE_LIMITED', message: 'Too many requests. Please wait.' };
    }
    await env.CACHE.put(cacheKey, String(count + 1), { expirationTtl: windowSec });
  } catch (e) {
    if (e.status === 429) throw e;
    // KV errors shouldn't block requests
  }
}

// ═══════════════════════════════════════════════════
// Audit Logging
// ═══════════════════════════════════════════════════

async function auditLog(env, adminId, action, entityType, entityId = null, details = null, ip = null) {
  try {
    await env.DB.prepare(
      'INSERT INTO audit_log (id, admin_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(generateId(), adminId, action, entityType, entityId, details ? JSON.stringify(details) : null, ip).run();
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

// ═══════════════════════════════════════════════════
// URL Parsing
// ═══════════════════════════════════════════════════

function parseUrl(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const params = Object.fromEntries(url.searchParams);
  return { url, path, params };
}

function matchRoute(path, pattern) {
  const pathParts = path.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  if (pathParts.length !== patternParts.length) return null;
  
  const routeParams = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      routeParams[patternParts[i].substring(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return routeParams;
}

// ═══════════════════════════════════════════════════
// API Route Handlers
// ═══════════════════════════════════════════════════

// ─── Books API (Public) ──────────────────────────

async function handleGetBooks(params, env) {
  const page = parseInt(params.page) || 1;
  const limit = Math.min(parseInt(params.limit) || 20, 50);
  const offset = (page - 1) * limit;
  
  let where = "status = 'PUBLISHED'";
  const binds = [];
  
  if (params.category) {
    where += ' AND id IN (SELECT book_id FROM book_categories WHERE category_id = ?)';
    binds.push(params.category);
  }
  if (params.subject) {
    where += ' AND id IN (SELECT book_id FROM book_subjects WHERE subject_id = ?)';
    binds.push(params.subject);
  }
  if (params.difficulty) {
    where += ' AND difficulty = ?';
    binds.push(params.difficulty);
  }
  if (params.language) {
    where += ' AND language = ?';
    binds.push(params.language);
  }
  if (params.featured === 'true') {
    where += ' AND featured_order IS NOT NULL';
  }
  if (params.examTag) {
    where += ' AND id IN (SELECT book_id FROM book_exam_tags WHERE exam_tag = ?)';
    binds.push(params.examTag);
  }

  let orderBy = 'created_at DESC';
  switch (params.sort) {
    case 'popular': orderBy = 'rating DESC, rating_count DESC'; break;
    case 'recent': orderBy = 'published_at DESC'; break;
    case 'title': orderBy = 'title ASC'; break;
    case 'title_desc': orderBy = 'title DESC'; break;
    case 'rating': orderBy = 'rating DESC'; break;
  }

  const countStmt = env.DB.prepare(`SELECT COUNT(*) as total FROM books WHERE ${where}`);
  const dataStmt = env.DB.prepare(`SELECT * FROM books WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`);
  
  const boundCount = binds.length > 0 ? countStmt.bind(...binds) : countStmt;
  const boundData = binds.length > 0 ? dataStmt.bind(...binds, limit, offset) : dataStmt.bind(limit, offset);
  
  const [countResult, dataResult] = await Promise.all([boundCount.first(), boundData.all()]);
  
  const total = countResult.total;
  
  // Fetch tags for each book
  const books = dataResult.results || [];
  for (const book of books) {
    const [cats, subs, tags, examTags] = await Promise.all([
      env.DB.prepare('SELECT category_id FROM book_categories WHERE book_id = ?').bind(book.id).all(),
      env.DB.prepare('SELECT subject_id FROM book_subjects WHERE book_id = ?').bind(book.id).all(),
      env.DB.prepare('SELECT tag FROM book_tags WHERE book_id = ?').bind(book.id).all(),
      env.DB.prepare('SELECT exam_tag FROM book_exam_tags WHERE book_id = ?').bind(book.id).all(),
    ]);
    book.categoryIds = (cats.results || []).map(r => r.category_id);
    book.subjectIds = (subs.results || []).map(r => r.subject_id);
    book.tags = (tags.results || []).map(r => r.tag);
    book.examTags = (examTags.results || []).map(r => r.exam_tag);
  }
  
  return successResponse(books, { page, limit, total, hasMore: offset + limit < total });
}

async function handleGetBook(bookId, env) {
  const book = await env.DB.prepare('SELECT * FROM books WHERE id = ?').bind(bookId).first();
  if (!book) throw { status: 404, code: 'NOT_FOUND', message: 'Book not found' };
  
  // Fetch related data
  const [chapters, cats, subs, tags, examTags] = await Promise.all([
    env.DB.prepare('SELECT id, title, chapter_number, summary, word_count, status FROM chapters WHERE book_id = ? ORDER BY chapter_number').bind(bookId).all(),
    env.DB.prepare('SELECT c.* FROM categories c JOIN book_categories bc ON c.id = bc.category_id WHERE bc.book_id = ?').bind(bookId).all(),
    env.DB.prepare('SELECT s.* FROM subjects s JOIN book_subjects bs ON s.id = bs.subject_id WHERE bs.book_id = ?').bind(bookId).all(),
    env.DB.prepare('SELECT tag FROM book_tags WHERE book_id = ?').bind(bookId).all(),
    env.DB.prepare('SELECT exam_tag FROM book_exam_tags WHERE book_id = ?').bind(bookId).all(),
  ]);
  
  book.chapters = chapters.results || [];
  book.categories = (cats.results || []);
  book.subjects = (subs.results || []);
  book.tags = (tags.results || []).map(r => r.tag);
  book.examTags = (examTags.results || []).map(r => r.exam_tag);
  
  // Fetch counts
  const [qCount, quizCount, fcCount] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as c FROM questions WHERE book_id = ? AND status = 'PUBLISHED'").bind(bookId).first(),
    env.DB.prepare("SELECT COUNT(*) as c FROM quizzes WHERE book_id = ? AND status = 'PUBLISHED'").bind(bookId).first(),
    env.DB.prepare("SELECT COUNT(*) as c FROM flashcard_sets WHERE book_id = ? AND status = 'PUBLISHED'").bind(bookId).first(),
  ]);
  
  book.questionsCount = qCount.c;
  book.quizzesCount = quizCount.c;
  book.flashcardSetsCount = fcCount.c;
  
  return successResponse(book);
}

async function handleGetChapters(bookId, env) {
  const chapters = await env.DB.prepare(
    "SELECT * FROM chapters WHERE book_id = ? AND status = 'PUBLISHED' ORDER BY chapter_number"
  ).bind(bookId).all();
  
  // Get question/quiz/flashcard counts per chapter
  const results = chapters.results || [];
  for (const ch of results) {
    const qc = await env.DB.prepare("SELECT COUNT(*) as c FROM questions WHERE chapter_id = ? AND status = 'PUBLISHED'").bind(ch.id).first();
    ch.questionsCount = qc.c;
  }
  
  return successResponse(results);
}

async function handleGetQuestions(bookId, params, env) {
  const page = parseInt(params.page) || 1;
  const limit = Math.min(parseInt(params.limit) || 20, 50);
  const offset = (page - 1) * limit;
  
  let where = "book_id = ? AND status = 'PUBLISHED'";
  const binds = [bookId];
  
  if (params.chapterId) { where += ' AND chapter_id = ?'; binds.push(params.chapterId); }
  if (params.type) { where += ' AND question_type = ?'; binds.push(params.type); }
  if (params.difficulty) { where += ' AND difficulty = ?'; binds.push(params.difficulty); }
  
  const total = (await env.DB.prepare(`SELECT COUNT(*) as c FROM questions WHERE ${where}`).bind(...binds).first()).c;
  const questions = await env.DB.prepare(`SELECT * FROM questions WHERE ${where} ORDER BY display_order, created_at LIMIT ? OFFSET ?`).bind(...binds, limit, offset).all();
  
  // Fetch options for MCQ questions and parse metadata
  for (const q of (questions.results || [])) {
    if (q.metadata) {
      try { q.metadata = JSON.parse(q.metadata); } catch(e) {}
    } else {
      q.metadata = {};
    }
    
    if (q.question_type === 'MCQ' || q.question_type === 'MULTIPLE_SELECT' || q.question_type === 'IMAGE_BASED') {
      const opts = await env.DB.prepare('SELECT * FROM question_options WHERE question_id = ? ORDER BY option_order').bind(q.id).all();
      q.options = opts.results || [];
    }
  }
  
  return successResponse(questions.results || [], { page, limit, total, hasMore: offset + limit < total });
}

async function handleGetQuizzes(bookId, env) {
  const quizzes = await env.DB.prepare("SELECT * FROM quizzes WHERE book_id = ? AND status = 'PUBLISHED'").bind(bookId).all();
  
  for (const quiz of (quizzes.results || [])) {
    const qc = await env.DB.prepare('SELECT COUNT(*) as c FROM quiz_questions WHERE quiz_id = ?').bind(quiz.id).first();
    quiz.questionCount = qc.c;
  }
  
  return successResponse(quizzes.results || []);
}

async function handleGetFlashcards(bookId, env) {
  const sets = await env.DB.prepare("SELECT * FROM flashcard_sets WHERE book_id = ? AND status = 'PUBLISHED'").bind(bookId).all();
  return successResponse(sets.results || []);
}

// ─── Categories & Subjects (Public) ──────────────

async function handleGetCategories(env) {
  const cats = await env.DB.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order, name').all();
  return successResponse(cats.results || []);
}

async function handleGetSubjects(env) {
  const subs = await env.DB.prepare('SELECT * FROM subjects WHERE is_active = 1 ORDER BY display_order, name').all();
  return successResponse(subs.results || []);
}

async function handleGetLanguages(env) {
  const langs = await env.DB.prepare('SELECT * FROM languages WHERE is_active = 1 ORDER BY name').all();
  return successResponse(langs.results || []);
}

async function handleGetStudyPacks(env) {
  const packs = await env.DB.prepare("SELECT * FROM study_packs WHERE status = 'PUBLISHED' ORDER BY display_order").all();
  return successResponse(packs.results || []);
}

async function handleGetCollections(env) {
  const cols = await env.DB.prepare("SELECT * FROM content_collections WHERE status = 'PUBLISHED' ORDER BY display_order").all();
  return successResponse(cols.results || []);
}

// ─── Search API ──────────────────────────────────

async function handleSearch(params, env) {
  const q = (params.q || '').trim();
  if (q.length < 2) throw { status: 400, code: 'VALIDATION_ERROR', message: 'Search query must be at least 2 characters' };
  
  const limit = Math.min(parseInt(params.limit) || 10, 30);
  const type = params.type || 'all';
  const searchTerm = q + '*';
  
  const results = {};
  let totalResults = 0;
  
  if (type === 'all' || type === 'books') {
    const books = await env.DB.prepare(
      "SELECT b.id, b.title, b.author, b.cover_image_url, b.rating, b.difficulty FROM books b JOIN books_fts f ON b.rowid = f.rowid WHERE books_fts MATCH ? AND b.status = 'PUBLISHED' LIMIT ?"
    ).bind(searchTerm, limit).all();
    results.books = books.results || [];
    totalResults += results.books.length;
  }
  
  if (type === 'all' || type === 'questions') {
    const questions = await env.DB.prepare(
      "SELECT q.id, q.question_text, q.question_type, q.difficulty, b.title as book_title FROM questions q JOIN questions_fts f ON q.rowid = f.rowid LEFT JOIN books b ON q.book_id = b.id WHERE questions_fts MATCH ? AND q.status = 'PUBLISHED' LIMIT ?"
    ).bind(searchTerm, limit).all();
    results.questions = questions.results || [];
    totalResults += results.questions.length;
  }
  
  if (type === 'all' || type === 'chapters') {
    const chapters = await env.DB.prepare(
      "SELECT c.id, c.title, c.chapter_number, b.title as book_title FROM chapters c JOIN chapters_fts f ON c.rowid = f.rowid LEFT JOIN books b ON c.book_id = b.id WHERE chapters_fts MATCH ? AND c.status = 'PUBLISHED' LIMIT ?"
    ).bind(searchTerm, limit).all();
    results.chapters = chapters.results || [];
    totalResults += results.chapters.length;
  }
  
  return successResponse(results, { totalResults, query: q });
}

// ─── Config API ──────────────────────────────────

async function handleGetConfig(env) {
  const configs = await env.DB.prepare('SELECT key, value FROM app_config').all();
  const configMap = {};
  for (const row of (configs.results || [])) {
    try { configMap[row.key] = JSON.parse(row.value); } 
    catch { configMap[row.key] = row.value; }
  }
  
  // Fetch ad units
  const ads = await env.DB.prepare('SELECT * FROM ad_units WHERE is_enabled = 1').all();
  
  configMap.adUnits = (ads.results || []).map(ad => ({
    id: ad.id,
    adUnitId: ad.ad_unit_id,
    adType: ad.ad_type,
    platform: ad.platform,
    placement: ad.placement,
    isTestMode: !!ad.is_test_mode,
    frequencyConfig: ad.frequency_config ? JSON.parse(ad.frequency_config) : null
  }));
  
  return successResponse(configMap);
}

// ─── Quiz Detail API ─────────────────────────────

async function handleGetQuiz(quizId, env) {
  const quiz = await env.DB.prepare('SELECT * FROM quizzes WHERE id = ?').bind(quizId).first();
  if (!quiz) throw { status: 404, code: 'NOT_FOUND', message: 'Quiz not found' };
  
  // Fetch questions with options
  const qqs = await env.DB.prepare('SELECT question_id, question_order FROM quiz_questions WHERE quiz_id = ? ORDER BY question_order').bind(quizId).all();
  const questions = [];
  for (const qq of (qqs.results || [])) {
    const q = await env.DB.prepare('SELECT * FROM questions WHERE id = ?').bind(qq.question_id).first();
    if (q) {
      if (q.question_type === 'MCQ') {
        const opts = await env.DB.prepare('SELECT * FROM question_options WHERE question_id = ? ORDER BY option_order').bind(q.id).all();
        q.options = opts.results || [];
      }
      questions.push(q);
    }
  }
  
  quiz.questions = quiz.randomize ? questions.sort(() => Math.random() - 0.5) : questions;
  return successResponse(quiz);
}

// ─── Flashcard Set Detail API ────────────────────

async function handleGetFlashcardSet(setId, env) {
  const set = await env.DB.prepare('SELECT * FROM flashcard_sets WHERE id = ?').bind(setId).first();
  if (!set) throw { status: 404, code: 'NOT_FOUND', message: 'Flashcard set not found' };
  
  const cards = await env.DB.prepare('SELECT * FROM flashcards WHERE set_id = ? ORDER BY display_order').bind(setId).all();
  set.cards = cards.results || [];
  return successResponse(set);
}

// ─── Courses API (Public & Admin) ─────────────────

async function handleGetCourses(params, env) {
  const page = parseInt(params.page) || 1;
  const limit = Math.min(parseInt(params.limit) || 20, 50);
  const offset = (page - 1) * limit;
  
  let where = "status = 'PUBLISHED' AND visibility = 'public'";
  const binds = [];
  
  if (params.category) {
    where += ' AND id IN (SELECT course_id FROM course_categories WHERE category_id = ?)';
    binds.push(params.category);
  }
  if (params.subject) {
    where += ' AND id IN (SELECT course_id FROM course_subjects WHERE subject_id = ?)';
    binds.push(params.subject);
  }

  let orderBy = 'created_at DESC';
  
  const countStmt = env.DB.prepare(`SELECT COUNT(*) as total FROM courses WHERE ${where}`);
  const dataStmt = env.DB.prepare(`SELECT * FROM courses WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`);
  
  const boundCount = binds.length > 0 ? countStmt.bind(...binds) : countStmt;
  const boundData = binds.length > 0 ? dataStmt.bind(...binds, limit, offset) : dataStmt.bind(limit, offset);
  
  const [countResult, dataResult] = await Promise.all([boundCount.first(), boundData.all()]);
  
  const total = countResult.total;
  const courses = dataResult.results || [];
  
  return successResponse(courses, { page, limit, total, hasMore: offset + limit < total });
}

async function handleGetCourse(courseId, env) {
  const course = await env.DB.prepare('SELECT * FROM courses WHERE id = ?').bind(courseId).first();
  if (!course) throw { status: 404, code: 'NOT_FOUND', message: 'Course not found' };
  
  return successResponse(course);
}

async function handleAdminGetCourses(params, admin, env) {
  const page = parseInt(params.page) || 1;
  const limit = Math.min(parseInt(params.limit) || 20, 50);
  const offset = (page - 1) * limit;
  
  let where = "1=1";
  const binds = [];
  
  if (params.search) {
    where += ' AND title LIKE ?';
    binds.push(`%${params.search}%`);
  }
  if (params.status) {
    where += ' AND status = ?';
    binds.push(params.status);
  }
  
  const total = (await env.DB.prepare(`SELECT COUNT(*) as c FROM courses WHERE ${where}`).bind(...binds).first()).c;
  const courses = await env.DB.prepare(`SELECT * FROM courses WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...binds, limit, offset).all();
  
  return successResponse(courses.results || [], { page, limit, total, hasMore: offset + limit < total });
}

async function handleAdminCreateCourse(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  
  if (!body.title || !body.description) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'Title and description are required' };
  }
  
  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO courses (id, title, subtitle, description, cover_image_url, course_type, visibility,
      is_free, price, currency, status, certificate_enabled, completion_rules, prerequisites, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, body.title, body.subtitle || null, body.description, body.coverImageUrl || null,
    body.courseType || 'Self Paced', body.visibility || 'public',
    body.isFree ? 1 : 0, body.price || 0, body.currency || 'USD',
    body.status || 'DRAFT', body.certificateEnabled ? 1 : 0, body.completionRules || null, body.prerequisites || null, admin.adminId
  ).run();
  
  await auditLog(env, admin.adminId, 'CREATE', 'course', id, { title: body.title });
  
  const course = await env.DB.prepare('SELECT * FROM courses WHERE id = ?').bind(id).first();
  return successResponse(course);
}

async function handleAdminUpdateCourse(courseId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  
  const existing = await env.DB.prepare('SELECT * FROM courses WHERE id = ?').bind(courseId).first();
  if (!existing) throw { status: 404, code: 'NOT_FOUND', message: 'Course not found' };
  
  const fields = [];
  const values = [];
  
  const updateFields = {
    title: 'title', subtitle: 'subtitle', description: 'description',
    coverImageUrl: 'cover_image_url', courseType: 'course_type',
    visibility: 'visibility', price: 'price', currency: 'currency',
    status: 'status', completionRules: 'completion_rules', prerequisites: 'prerequisites'
  };
  
  for (const [jsKey, dbKey] of Object.entries(updateFields)) {
    if (body[jsKey] !== undefined) {
      fields.push(`${dbKey} = ?`);
      values.push(body[jsKey]);
    }
  }

  if (body.certificateEnabled !== undefined) {
    fields.push('certificate_enabled = ?');
    values.push(body.certificateEnabled ? 1 : 0);
  }
  
  if (body.isFree !== undefined) { fields.push('is_free = ?'); values.push(body.isFree ? 1 : 0); }
  
  if (body.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
    fields.push("published_at = datetime('now')");
  }
  
  if (fields.length > 0) {
    values.push(courseId);
    await env.DB.prepare(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  
  await auditLog(env, admin.adminId, 'UPDATE', 'course', courseId);
  const updated = await env.DB.prepare('SELECT * FROM courses WHERE id = ?').bind(courseId).first();
  return successResponse(updated);
}

async function handleAdminDeleteCourse(courseId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const course = await env.DB.prepare('SELECT * FROM courses WHERE id = ?').bind(courseId).first();
  if (!course) throw { status: 404, code: 'NOT_FOUND', message: 'Course not found' };
  
  await env.DB.prepare('DELETE FROM courses WHERE id = ?').bind(courseId).run();
  await auditLog(env, admin.adminId, 'DELETE', 'course', courseId, { title: course.title });
  return successResponse({ deleted: true });
}

async function handleAdminPublishCourse(courseId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const course = await env.DB.prepare('SELECT * FROM courses WHERE id = ?').bind(courseId).first();
  if (!course) throw { status: 404, code: 'NOT_FOUND', message: 'Course not found' };
  
  await env.DB.prepare("UPDATE courses SET status = 'PUBLISHED', published_at = datetime('now') WHERE id = ?").bind(courseId).run();
  await auditLog(env, admin.adminId, 'PUBLISH', 'course', courseId, { title: course.title });
  return successResponse({ published: true });
}

async function handleAdminUnpublishCourse(courseId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const course = await env.DB.prepare('SELECT * FROM courses WHERE id = ?').bind(courseId).first();
  if (!course) throw { status: 404, code: 'NOT_FOUND', message: 'Course not found' };
  
  await env.DB.prepare("UPDATE courses SET status = 'UNPUBLISHED' WHERE id = ?").bind(courseId).run();
  await auditLog(env, admin.adminId, 'UNPUBLISH', 'course', courseId, { title: course.title });
  return successResponse({ unpublished: true });
}

// ─── Chapters (Admin) ─────────────────────────────

async function handleAdminGetChapters(bookId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const chapters = await env.DB.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number ASC').bind(bookId).all();
  return successResponse(chapters.results || []);
}

async function handleAdminCreateChapter(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.bookId || !body.title || body.chapterNumber === undefined) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'bookId, title, and chapterNumber are required' };
  }
  
  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO chapters (id, book_id, title, chapter_number, summary, content, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, body.bookId, body.title, body.chapterNumber, body.summary || null, body.content || null, body.status || 'DRAFT'
  ).run();
  
  await auditLog(env, admin.adminId, 'CREATE', 'chapter', id, { title: body.title, bookId: body.bookId });
  const chapter = await env.DB.prepare('SELECT * FROM chapters WHERE id = ?').bind(id).first();
  return successResponse(chapter);
}

async function handleAdminUpdateChapter(chapterId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const existing = await env.DB.prepare('SELECT * FROM chapters WHERE id = ?').bind(chapterId).first();
  if (!existing) throw { status: 404, code: 'NOT_FOUND', message: 'Chapter not found' };
  
  const fields = [];
  const values = [];
  const updateFields = { title: 'title', chapterNumber: 'chapter_number', summary: 'summary', content: 'content', status: 'status' };
  
  for (const [jsKey, dbKey] of Object.entries(updateFields)) {
    if (body[jsKey] !== undefined) {
      fields.push(`${dbKey} = ?`);
      values.push(body[jsKey]);
    }
  }
  
  if (fields.length > 0) {
    values.push(chapterId);
    await env.DB.prepare(`UPDATE chapters SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  
  await auditLog(env, admin.adminId, 'UPDATE', 'chapter', chapterId);
  const updated = await env.DB.prepare('SELECT * FROM chapters WHERE id = ?').bind(chapterId).first();
  return successResponse(updated);
}

async function handleAdminDeleteChapter(chapterId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare('DELETE FROM chapters WHERE id = ?').bind(chapterId).run();
  await auditLog(env, admin.adminId, 'DELETE', 'chapter', chapterId);
  return successResponse({ deleted: true });
}

// ─── Course Sections (Admin) ──────────────────────────

async function handleAdminGetCourseSections(courseId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const sections = await env.DB.prepare('SELECT * FROM course_sections WHERE course_id = ? ORDER BY display_order ASC').bind(courseId).all();
  return successResponse(sections.results || []);
}

async function handleAdminCreateCourseSection(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.courseId || !body.title) throw { status: 400, code: 'VALIDATION_ERROR', message: 'courseId and title are required' };
  
  const id = generateId();
  await env.DB.prepare(`INSERT INTO course_sections (id, course_id, title, description, display_order) VALUES (?, ?, ?, ?, ?)`).bind(
    id, body.courseId, body.title, body.description || null, body.displayOrder || 0
  ).run();
  
  const section = await env.DB.prepare('SELECT * FROM course_sections WHERE id = ?').bind(id).first();
  return successResponse(section);
}

async function handleAdminUpdateCourseSection(sectionId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = []; const values = [];
  if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
  if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
  if (body.displayOrder !== undefined) { fields.push('display_order = ?'); values.push(body.displayOrder); }
  
  if (fields.length > 0) {
    values.push(sectionId);
    await env.DB.prepare(`UPDATE course_sections SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  const updated = await env.DB.prepare('SELECT * FROM course_sections WHERE id = ?').bind(sectionId).first();
  return successResponse(updated);
}

async function handleAdminDeleteCourseSection(sectionId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare('DELETE FROM course_sections WHERE id = ?').bind(sectionId).run();
  return successResponse({ deleted: true });
}

// ─── Course Lessons (Admin) ───────────────────────────

async function handleAdminGetCourseLessons(sectionId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const lessons = await env.DB.prepare('SELECT * FROM course_lessons WHERE section_id = ? ORDER BY display_order ASC').bind(sectionId).all();
  return successResponse(lessons.results || []);
}

async function handleAdminCreateCourseLesson(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.sectionId || !body.courseId || !body.title || !body.lessonType) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'Missing required lesson fields' };
  }
  const id = generateId();
  await env.DB.prepare(`INSERT INTO course_lessons (id, section_id, course_id, title, lesson_type, content, summary, is_free_preview, duration_minutes, display_order, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    id, body.sectionId, body.courseId, body.title, body.lessonType, body.content || null, body.summary || null, body.isFreePreview ? 1 : 0, body.durationMinutes || 0, body.displayOrder || 0, body.status || 'DRAFT'
  ).run();
  
  const lesson = await env.DB.prepare('SELECT * FROM course_lessons WHERE id = ?').bind(id).first();
  return successResponse(lesson);
}

async function handleAdminUpdateCourseLesson(lessonId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = []; const values = [];
  const updateFields = { title: 'title', lessonType: 'lesson_type', content: 'content', summary: 'summary', durationMinutes: 'duration_minutes', displayOrder: 'display_order', status: 'status' };
  
  for (const [jsKey, dbKey] of Object.entries(updateFields)) {
    if (body[jsKey] !== undefined) { fields.push(`${dbKey} = ?`); values.push(body[jsKey]); }
  }
  if (body.isFreePreview !== undefined) { fields.push('is_free_preview = ?'); values.push(body.isFreePreview ? 1 : 0); }
  
  if (fields.length > 0) {
    values.push(lessonId);
    await env.DB.prepare(`UPDATE course_lessons SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  const updated = await env.DB.prepare('SELECT * FROM course_lessons WHERE id = ?').bind(lessonId).first();
  return successResponse(updated);
}

async function handleAdminDeleteCourseLesson(lessonId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare('DELETE FROM course_lessons WHERE id = ?').bind(lessonId).run();
  return successResponse({ deleted: true });
}

// ─── Course Assessments (Admin) ───────────────────────────

async function handleAdminGetCourseAssessments(courseId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const items = await env.DB.prepare('SELECT * FROM course_assessments WHERE course_id = ? ORDER BY created_at ASC').bind(courseId).all();
  return successResponse(items.results || []);
}

async function handleAdminCreateCourseAssessment(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.courseId || !body.title) throw { status: 400, code: 'VALIDATION_ERROR', message: 'courseId and title are required' };
  
  const id = generateId();
  await env.DB.prepare(`INSERT INTO course_assessments (id, course_id, section_id, title, description, assessment_type, time_limit_seconds, passing_score_percent, randomize, show_explanation, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    id, body.courseId, body.sectionId || null, body.title, body.description || null, body.assessmentType || 'QUIZ', body.timeLimitSeconds || null, body.passingScorePercent || 60, body.randomize ? 1 : 0, body.showExplanation ? 1 : 0, body.status || 'DRAFT'
  ).run();
  
  const item = await env.DB.prepare('SELECT * FROM course_assessments WHERE id = ?').bind(id).first();
  return successResponse(item);
}

async function handleAdminUpdateCourseAssessment(id, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = []; const values = [];
  const updateFields = { title: 'title', description: 'description', sectionId: 'section_id', assessmentType: 'assessment_type', timeLimitSeconds: 'time_limit_seconds', passingScorePercent: 'passing_score_percent', status: 'status' };
  
  for (const [jsKey, dbKey] of Object.entries(updateFields)) {
    if (body[jsKey] !== undefined) { fields.push(`${dbKey} = ?`); values.push(body[jsKey]); }
  }
  if (body.randomize !== undefined) { fields.push('randomize = ?'); values.push(body.randomize ? 1 : 0); }
  if (body.showExplanation !== undefined) { fields.push('show_explanation = ?'); values.push(body.showExplanation ? 1 : 0); }
  
  if (fields.length > 0) {
    values.push(id);
    await env.DB.prepare(`UPDATE course_assessments SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  const updated = await env.DB.prepare('SELECT * FROM course_assessments WHERE id = ?').bind(id).first();
  return successResponse(updated);
}

async function handleAdminDeleteCourseAssessment(id, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare('DELETE FROM course_assessments WHERE id = ?').bind(id).run();
  return successResponse({ deleted: true });
}

// ─── Course Assignments (Admin) ───────────────────────────

async function handleAdminGetCourseAssignments(courseId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const items = await env.DB.prepare('SELECT * FROM course_assignments WHERE course_id = ? ORDER BY created_at ASC').bind(courseId).all();
  return successResponse(items.results || []);
}

async function handleAdminCreateCourseAssignment(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.courseId || !body.title) throw { status: 400, code: 'VALIDATION_ERROR', message: 'courseId and title are required' };
  
  const id = generateId();
  await env.DB.prepare(`INSERT INTO course_assignments (id, course_id, section_id, title, description, due_date, max_attempts, passing_criteria, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    id, body.courseId, body.sectionId || null, body.title, body.description || null, body.dueDate || null, body.maxAttempts || 1, body.passingCriteria || null, body.status || 'DRAFT'
  ).run();
  
  const item = await env.DB.prepare('SELECT * FROM course_assignments WHERE id = ?').bind(id).first();
  return successResponse(item);
}

async function handleAdminUpdateCourseAssignment(id, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = []; const values = [];
  const updateFields = { title: 'title', description: 'description', sectionId: 'section_id', dueDate: 'due_date', maxAttempts: 'max_attempts', passingCriteria: 'passing_criteria', status: 'status' };
  
  for (const [jsKey, dbKey] of Object.entries(updateFields)) {
    if (body[jsKey] !== undefined) { fields.push(`${dbKey} = ?`); values.push(body[jsKey]); }
  }
  
  if (fields.length > 0) {
    values.push(id);
    await env.DB.prepare(`UPDATE course_assignments SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  const updated = await env.DB.prepare('SELECT * FROM course_assignments WHERE id = ?').bind(id).first();
  return successResponse(updated);
}

async function handleAdminDeleteCourseAssignment(id, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare('DELETE FROM course_assignments WHERE id = ?').bind(id).run();
  return successResponse({ deleted: true });
}

// ─── Course Projects (Admin) ───────────────────────────

async function handleAdminGetCourseProjects(courseId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const items = await env.DB.prepare('SELECT * FROM course_projects WHERE course_id = ? ORDER BY created_at ASC').bind(courseId).all();
  return successResponse(items.results || []);
}

async function handleAdminCreateCourseProject(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.courseId || !body.title) throw { status: 400, code: 'VALIDATION_ERROR', message: 'courseId and title are required' };
  
  const id = generateId();
  await env.DB.prepare(`INSERT INTO course_projects (id, course_id, title, objectives, submission_type, evaluation_criteria, status) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(
    id, body.courseId, body.title, body.objectives || null, body.submissionType || 'FILE', body.evaluationCriteria || null, body.status || 'DRAFT'
  ).run();
  
  const item = await env.DB.prepare('SELECT * FROM course_projects WHERE id = ?').bind(id).first();
  return successResponse(item);
}

async function handleAdminUpdateCourseProject(id, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = []; const values = [];
  const updateFields = { title: 'title', objectives: 'objectives', submissionType: 'submission_type', evaluationCriteria: 'evaluation_criteria', status: 'status' };
  
  for (const [jsKey, dbKey] of Object.entries(updateFields)) {
    if (body[jsKey] !== undefined) { fields.push(`${dbKey} = ?`); values.push(body[jsKey]); }
  }
  
  if (fields.length > 0) {
    values.push(id);
    await env.DB.prepare(`UPDATE course_projects SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  const updated = await env.DB.prepare('SELECT * FROM course_projects WHERE id = ?').bind(id).first();
  return successResponse(updated);
}

async function handleAdminDeleteCourseProject(id, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare('DELETE FROM course_projects WHERE id = ?').bind(id).run();
  return successResponse({ deleted: true });
}

// ─── Course Resources (Admin) ───────────────────────────

async function handleAdminGetCourseResources(courseId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const items = await env.DB.prepare('SELECT * FROM course_resources WHERE course_id = ? ORDER BY display_order ASC').bind(courseId).all();
  return successResponse(items.results || []);
}

async function handleAdminCreateCourseResource(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.courseId || !body.title || !body.url || !body.resourceType) throw { status: 400, code: 'VALIDATION_ERROR', message: 'Missing required resource fields' };
  
  const id = generateId();
  await env.DB.prepare(`INSERT INTO course_resources (id, course_id, section_id, lesson_id, title, resource_type, url, download_allowed, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    id, body.courseId, body.sectionId || null, body.lessonId || null, body.title, body.resourceType, body.url, body.downloadAllowed ? 1 : 0, body.displayOrder || 0
  ).run();
  
  const item = await env.DB.prepare('SELECT * FROM course_resources WHERE id = ?').bind(id).first();
  return successResponse(item);
}

async function handleAdminUpdateCourseResource(id, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = []; const values = [];
  const updateFields = { title: 'title', sectionId: 'section_id', lessonId: 'lesson_id', resourceType: 'resource_type', url: 'url', displayOrder: 'display_order' };
  
  for (const [jsKey, dbKey] of Object.entries(updateFields)) {
    if (body[jsKey] !== undefined) { fields.push(`${dbKey} = ?`); values.push(body[jsKey]); }
  }
  if (body.downloadAllowed !== undefined) { fields.push('download_allowed = ?'); values.push(body.downloadAllowed ? 1 : 0); }
  
  if (fields.length > 0) {
    values.push(id);
    await env.DB.prepare(`UPDATE course_resources SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  const updated = await env.DB.prepare('SELECT * FROM course_resources WHERE id = ?').bind(id).first();
  return successResponse(updated);
}

async function handleAdminDeleteCourseResource(id, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare('DELETE FROM course_resources WHERE id = ?').bind(id).run();
  return successResponse({ deleted: true });
}

// ─── Phase 5: Course Question Bank & Interactive Content ───

// -- Course Questions --
async function handleAdminGetCourseQuestions(courseId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const result = await env.DB.prepare('SELECT * FROM course_questions WHERE course_id = ? ORDER BY created_at DESC').bind(courseId).all();
  return { data: result.results || [] };
}

async function handleAdminCreateCourseQuestion(courseId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.questionText || !body.questionType || !body.correctAnswer) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'Missing required question fields' };
  }
  
  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO course_questions (id, course_id, assessment_id, question_text, question_type, options, correct_answer, explanation, points)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, courseId, body.assessmentId || null, body.questionText, body.questionType, 
    body.options ? JSON.stringify(body.options) : null, 
    body.correctAnswer, body.explanation || null, body.points || 1
  ).run();
  
  return { success: true, id };
}

async function handleAdminUpdateCourseQuestion(courseId, questionId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare(`
    UPDATE course_questions SET 
      assessment_id = COALESCE(?, assessment_id),
      question_text = COALESCE(?, question_text),
      question_type = COALESCE(?, question_type),
      options = COALESCE(?, options),
      correct_answer = COALESCE(?, correct_answer),
      explanation = COALESCE(?, explanation),
      points = COALESCE(?, points)
    WHERE id = ? AND course_id = ?
  `).bind(
    body.assessmentId !== undefined ? body.assessmentId : null,
    body.questionText || null,
    body.questionType || null,
    body.options ? JSON.stringify(body.options) : null,
    body.correctAnswer || null,
    body.explanation || null,
    body.points || null,
    questionId, courseId
  ).run();
  return { success: true };
}

async function handleAdminDeleteCourseQuestion(courseId, questionId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare('DELETE FROM course_questions WHERE id = ? AND course_id = ?').bind(questionId, courseId).run();
  return { success: true };
}

// -- Course Coding Lessons --
async function handleAdminGetCodingLesson(lessonId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const result = await env.DB.prepare('SELECT * FROM course_coding_lessons WHERE lesson_id = ?').bind(lessonId).first();
  return { data: result || null };
}

async function handleAdminSaveCodingLesson(courseId, lessonId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.language) throw { status: 400, code: 'VALIDATION_ERROR', message: 'Language is required' };
  
  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO course_coding_lessons (id, lesson_id, course_id, language, starter_code, test_cases, solution_code)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(lesson_id) DO UPDATE SET 
      language=excluded.language, starter_code=excluded.starter_code, 
      test_cases=excluded.test_cases, solution_code=excluded.solution_code
  `).bind(
    id, lessonId, courseId, body.language, body.starterCode || null, 
    body.testCases ? JSON.stringify(body.testCases) : null, body.solutionCode || null
  ).run();
  
  return { success: true };
}

// -- Course Live Sessions --
async function handleAdminGetLiveSession(lessonId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const result = await env.DB.prepare('SELECT * FROM course_live_sessions WHERE lesson_id = ?').bind(lessonId).first();
  return { data: result || null };
}

async function handleAdminSaveLiveSession(courseId, lessonId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.meetingUrl || !body.startTime) throw { status: 400, code: 'VALIDATION_ERROR', message: 'Meeting URL and start time required' };
  
  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO course_live_sessions (id, lesson_id, course_id, meeting_url, start_time, duration_minutes, host_info)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(lesson_id) DO UPDATE SET 
      meeting_url=excluded.meeting_url, start_time=excluded.start_time, 
      duration_minutes=excluded.duration_minutes, host_info=excluded.host_info
  `).bind(
    id, lessonId, courseId, body.meetingUrl, body.startTime, 
    body.durationMinutes || 60, body.hostInfo || null
  ).run();
  
  return { success: true };
}


// ─── Questions (Admin) ────────────────────────────

async function handleAdminGetQuestions(bookId, params, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  
  let query = 'SELECT * FROM questions WHERE book_id = ?';
  const binds = [bookId];
  
  if (params.chapterId) {
    query += ' AND chapter_id = ?';
    binds.push(params.chapterId);
  }
  
  query += ' ORDER BY display_order ASC';
  
  const questions = await env.DB.prepare(query).bind(...binds).all();
  return successResponse(questions.results || []);
}

async function handleAdminCreateQuestion(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.bookId || !body.questionText || !body.questionType || !body.answer) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'Missing required question fields' };
  }
  
  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO questions (id, book_id, chapter_id, question_text, question_type, difficulty, answer, explanation, marks, status, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, body.bookId, body.chapterId || null, body.questionText, body.questionType, body.difficulty || 'MEDIUM',
    body.answer, body.explanation || null, body.marks || 1, body.status || 'DRAFT', body.displayOrder || 0
  ).run();
  
  const question = await env.DB.prepare('SELECT * FROM questions WHERE id = ?').bind(id).first();
  return successResponse(question);
}

async function handleAdminUpdateQuestion(questionId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = []; const values = [];
  const updateFields = {
    chapterId: 'chapter_id', questionText: 'question_text', questionType: 'question_type',
    difficulty: 'difficulty', answer: 'answer', explanation: 'explanation',
    marks: 'marks', status: 'status', displayOrder: 'display_order'
  };
  
  for (const [jsKey, dbKey] of Object.entries(updateFields)) {
    if (body[jsKey] !== undefined) { fields.push(`${dbKey} = ?`); values.push(body[jsKey] === '' ? null : body[jsKey]); }
  }
  
  if (fields.length > 0) {
    values.push(questionId);
    await env.DB.prepare(`UPDATE questions SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  
  const updated = await env.DB.prepare('SELECT * FROM questions WHERE id = ?').bind(questionId).first();
  return successResponse(updated);
}

async function handleAdminDeleteQuestion(questionId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare('DELETE FROM questions WHERE id = ?').bind(questionId).run();
  return successResponse({ deleted: true });
}

// ─── Quizzes (Admin) ──────────────────────────────

async function handleAdminGetQuizzes(bookId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const quizzes = await env.DB.prepare('SELECT * FROM quizzes WHERE book_id = ? ORDER BY created_at DESC').bind(bookId).all();
  return successResponse(quizzes.results || []);
}

async function handleAdminCreateQuiz(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.bookId || !body.title) throw { status: 400, code: 'VALIDATION_ERROR', message: 'bookId and title are required' };
  
  const id = generateId();
  await env.DB.prepare(`INSERT INTO quizzes (id, title, description, book_id, chapter_id, time_limit_seconds, passing_score_percent, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    id, body.title, body.description || null, body.bookId, body.chapterId || null, body.timeLimitSeconds || null, body.passingScorePercent || 60, body.status || 'DRAFT'
  ).run();
  
  const quiz = await env.DB.prepare('SELECT * FROM quizzes WHERE id = ?').bind(id).first();
  return successResponse(quiz);
}

async function handleAdminUpdateQuiz(quizId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = []; const values = [];
  const updateFields = { title: 'title', description: 'description', chapterId: 'chapter_id', timeLimitSeconds: 'time_limit_seconds', passingScorePercent: 'passing_score_percent', status: 'status' };
  
  for (const [jsKey, dbKey] of Object.entries(updateFields)) {
    if (body[jsKey] !== undefined) { fields.push(`${dbKey} = ?`); values.push(body[jsKey]); }
  }
  
  if (fields.length > 0) {
    values.push(quizId);
    await env.DB.prepare(`UPDATE quizzes SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  
  const updated = await env.DB.prepare('SELECT * FROM quizzes WHERE id = ?').bind(quizId).first();
  return successResponse(updated);
}

async function handleAdminDeleteQuiz(quizId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare('DELETE FROM quizzes WHERE id = ?').bind(quizId).run();
  return successResponse({ deleted: true });
}

// ─── Flashcard Sets (Admin) ────────────────────────

async function handleAdminGetFlashcards(bookId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const sets = await env.DB.prepare('SELECT * FROM flashcard_sets WHERE book_id = ? ORDER BY created_at DESC').bind(bookId).all();
  return successResponse(sets.results || []);
}

async function handleAdminCreateFlashcardSet(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.bookId || !body.title) throw { status: 400, code: 'VALIDATION_ERROR', message: 'bookId and title are required' };
  
  const id = generateId();
  await env.DB.prepare(`INSERT INTO flashcard_sets (id, title, description, book_id, chapter_id, status) VALUES (?, ?, ?, ?, ?, ?)`).bind(
    id, body.title, body.description || null, body.bookId, body.chapterId || null, body.status || 'DRAFT'
  ).run();
  
  const set = await env.DB.prepare('SELECT * FROM flashcard_sets WHERE id = ?').bind(id).first();
  return successResponse(set);
}

async function handleAdminUpdateFlashcardSet(setId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = []; const values = [];
  const updateFields = { title: 'title', description: 'description', chapterId: 'chapter_id', status: 'status' };
  
  for (const [jsKey, dbKey] of Object.entries(updateFields)) {
    if (body[jsKey] !== undefined) { fields.push(`${dbKey} = ?`); values.push(body[jsKey]); }
  }
  
  if (fields.length > 0) {
    values.push(setId);
    await env.DB.prepare(`UPDATE flashcard_sets SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  
  const updated = await env.DB.prepare('SELECT * FROM flashcard_sets WHERE id = ?').bind(setId).first();
  return successResponse(updated);
}

async function handleAdminDeleteFlashcardSet(setId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare('DELETE FROM flashcard_sets WHERE id = ?').bind(setId).run();
  return successResponse({ deleted: true });
}

// ═══════════════════════════════════════════════════
// Admin API Handlers
// ═══════════════════════════════════════════════════

async function handleAdminCreateBook(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  
  if (!body.title || !body.author || !body.description) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'Title, author, and description are required' };
  }
  
  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO books (id, title, author, description, cover_image_url, language, page_count, difficulty,
      estimated_read_time_minutes, rights_status, license_name, license_source, rights_holder,
      permission_reference, allowed_download, allowed_offline, allowed_share, pdf_google_drive_id,
      status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, body.title, body.author, body.description, body.coverImageUrl || '',
    body.language || 'en', body.pages || 0, body.difficulty || 'MEDIUM',
    body.estimatedReadTimeMinutes || 0, body.rightsStatus || 'RESTRICTED',
    body.licenseName || null, body.licenseSource || null, body.rightsHolder || null,
    body.permissionReference || null, body.allowedDownload ? 1 : 0,
    body.allowedOffline ? 1 : 0, body.allowedShare ? 1 : 0,
    body.pdfGoogleDriveId || null, body.status || 'DRAFT', admin.adminId
  ).run();
  
  // Add categories, subjects, tags
  if (body.categoryIds?.length) {
    for (const catId of body.categoryIds) {
      await env.DB.prepare('INSERT OR IGNORE INTO book_categories (book_id, category_id) VALUES (?, ?)').bind(id, catId).run();
    }
  }
  if (body.subjectIds?.length) {
    for (const subId of body.subjectIds) {
      await env.DB.prepare('INSERT OR IGNORE INTO book_subjects (book_id, subject_id) VALUES (?, ?)').bind(id, subId).run();
    }
  }
  if (body.tags?.length) {
    for (const tag of body.tags) {
      await env.DB.prepare('INSERT OR IGNORE INTO book_tags (book_id, tag) VALUES (?, ?)').bind(id, tag).run();
    }
  }
  if (body.examTags?.length) {
    for (const tag of body.examTags) {
      await env.DB.prepare('INSERT OR IGNORE INTO book_exam_tags (book_id, exam_tag) VALUES (?, ?)').bind(id, tag).run();
    }
  }
  
  await auditLog(env, admin.adminId, 'CREATE', 'book', id, { title: body.title });
  
  const book = await env.DB.prepare('SELECT * FROM books WHERE id = ?').bind(id).first();
  return successResponse(book);
}

async function handleAdminUpdateBook(bookId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  
  const existing = await env.DB.prepare('SELECT * FROM books WHERE id = ?').bind(bookId).first();
  if (!existing) throw { status: 404, code: 'NOT_FOUND', message: 'Book not found' };
  
  const fields = [];
  const values = [];
  
  const updateFields = {
    title: 'title', author: 'author', description: 'description',
    coverImageUrl: 'cover_image_url', language: 'language',
    pageCount: 'page_count', difficulty: 'difficulty',
    estimatedReadTimeMinutes: 'estimated_read_time_minutes',
    rightsStatus: 'rights_status', licenseName: 'license_name',
    licenseSource: 'license_source', rightsHolder: 'rights_holder',
    permissionReference: 'permission_reference',
    pdfGoogleDriveId: 'pdf_google_drive_id',
    featuredOrder: 'featured_order', status: 'status'
  };
  
  for (const [jsKey, dbKey] of Object.entries(updateFields)) {
    if (body[jsKey] !== undefined) {
      fields.push(`${dbKey} = ?`);
      values.push(body[jsKey]);
    }
  }
  
  if (body.allowedDownload !== undefined) { fields.push('allowed_download = ?'); values.push(body.allowedDownload ? 1 : 0); }
  if (body.allowedOffline !== undefined) { fields.push('allowed_offline = ?'); values.push(body.allowedOffline ? 1 : 0); }
  if (body.allowedShare !== undefined) { fields.push('allowed_share = ?'); values.push(body.allowedShare ? 1 : 0); }
  
  if (body.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
    fields.push("published_at = datetime('now')");
  }
  
  if (fields.length > 0) {
    values.push(bookId);
    await env.DB.prepare(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  
  // Update tags
  if (body.categoryIds) {
    await env.DB.prepare('DELETE FROM book_categories WHERE book_id = ?').bind(bookId).run();
    for (const catId of body.categoryIds) {
      await env.DB.prepare('INSERT OR IGNORE INTO book_categories (book_id, category_id) VALUES (?, ?)').bind(bookId, catId).run();
    }
  }
  if (body.subjectIds) {
    await env.DB.prepare('DELETE FROM book_subjects WHERE book_id = ?').bind(bookId).run();
    for (const subId of body.subjectIds) {
      await env.DB.prepare('INSERT OR IGNORE INTO book_subjects (book_id, subject_id) VALUES (?, ?)').bind(bookId, subId).run();
    }
  }
  if (body.tags) {
    await env.DB.prepare('DELETE FROM book_tags WHERE book_id = ?').bind(bookId).run();
    for (const tag of body.tags) {
      await env.DB.prepare('INSERT OR IGNORE INTO book_tags (book_id, tag) VALUES (?, ?)').bind(bookId, tag).run();
    }
  }
  if (body.examTags) {
    await env.DB.prepare('DELETE FROM book_exam_tags WHERE book_id = ?').bind(bookId).run();
    for (const tag of body.examTags) {
      await env.DB.prepare('INSERT OR IGNORE INTO book_exam_tags (book_id, exam_tag) VALUES (?, ?)').bind(bookId, tag).run();
    }
  }
  
  await auditLog(env, admin.adminId, 'UPDATE', 'book', bookId, { changes: Object.keys(body) });
  
  const updated = await env.DB.prepare('SELECT * FROM books WHERE id = ?').bind(bookId).first();
  return successResponse(updated);
}

async function handleAdminDeleteBook(bookId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN');
  const book = await env.DB.prepare('SELECT * FROM books WHERE id = ?').bind(bookId).first();
  if (!book) throw { status: 404, code: 'NOT_FOUND', message: 'Book not found' };
  
  await env.DB.prepare('DELETE FROM books WHERE id = ?').bind(bookId).run();
  await auditLog(env, admin.adminId, 'DELETE', 'book', bookId, { title: book.title });
  return successResponse({ deleted: true });
}

async function handleAdminPublishBook(bookId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const book = await env.DB.prepare('SELECT * FROM books WHERE id = ?').bind(bookId).first();
  if (!book) throw { status: 404, code: 'NOT_FOUND', message: 'Book not found' };
  if (book.rights_status === 'RESTRICTED') throw { status: 400, code: 'VALIDATION_ERROR', message: 'Cannot publish RESTRICTED content' };
  
  await env.DB.prepare("UPDATE books SET status = 'PUBLISHED', published_at = datetime('now') WHERE id = ?").bind(bookId).run();
  
  // Cascade publish to child content
  await env.DB.prepare("UPDATE chapters SET status = 'PUBLISHED' WHERE book_id = ?").bind(bookId).run();
  await env.DB.prepare("UPDATE questions SET status = 'PUBLISHED' WHERE book_id = ?").bind(bookId).run();
  await env.DB.prepare("UPDATE quizzes SET status = 'PUBLISHED' WHERE book_id = ?").bind(bookId).run();
  await env.DB.prepare("UPDATE flashcard_sets SET status = 'PUBLISHED' WHERE book_id = ?").bind(bookId).run();

  await auditLog(env, admin.adminId, 'PUBLISH', 'book', bookId, { title: book.title });
  return successResponse({ published: true });
}

async function handleAdminUnpublishBook(bookId, admin, env, emergency = false) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare("UPDATE books SET status = 'UNPUBLISHED' WHERE id = ?").bind(bookId).run();
  
  // Cascade unpublish to child content
  await env.DB.prepare("UPDATE chapters SET status = 'DRAFT' WHERE book_id = ?").bind(bookId).run();
  await env.DB.prepare("UPDATE questions SET status = 'DRAFT' WHERE book_id = ?").bind(bookId).run();
  await env.DB.prepare("UPDATE quizzes SET status = 'DRAFT' WHERE book_id = ?").bind(bookId).run();
  await env.DB.prepare("UPDATE flashcard_sets SET status = 'DRAFT' WHERE book_id = ?").bind(bookId).run();

  await auditLog(env, admin.adminId, emergency ? 'EMERGENCY_UNPUBLISH' : 'UNPUBLISH', 'book', bookId);
  return successResponse({ unpublished: true, emergency });
}

// ─── Admin Chapters ──────────────────────────────
async function handleAdminCreateCategory(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.name) throw { status: 400, code: 'VALIDATION_ERROR', message: 'name required' };
  
  const existing = await env.DB.prepare('SELECT id FROM categories WHERE name = ?').bind(body.name).first();
  if (existing) throw { status: 400, code: 'ALREADY_EXISTS', message: 'Category with this name already exists' };

  const id = generateId();
  await env.DB.prepare('INSERT INTO categories (id, name, description, icon_url, display_order, parent_id) VALUES (?, ?, ?, ?, ?, ?)').bind(id, body.name, body.description || null, body.iconUrl || null, body.displayOrder || 0, body.parentId || null).run();
  await auditLog(env, admin.adminId, 'CREATE', 'category', id);
  return successResponse({ id, name: body.name });
}

async function handleAdminCreateSubject(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.name) throw { status: 400, code: 'VALIDATION_ERROR', message: 'name required' };
  
  const existing = await env.DB.prepare('SELECT id FROM subjects WHERE name = ?').bind(body.name).first();
  if (existing) throw { status: 400, code: 'ALREADY_EXISTS', message: 'Subject with this name already exists' };

  const id = generateId();
  await env.DB.prepare('INSERT INTO subjects (id, name, description, icon_url, display_order, category_id) VALUES (?, ?, ?, ?, ?, ?)').bind(id, body.name, body.description || null, body.iconUrl || null, body.displayOrder || 0, body.categoryId || null).run();
  await auditLog(env, admin.adminId, 'CREATE', 'subject', id);
  return successResponse({ id, name: body.name });
}

async function handleAdminUpdateCategory(id, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = [];
  const values = [];
  
  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
  if (body.iconUrl !== undefined) { fields.push('icon_url = ?'); values.push(body.iconUrl); }
  if (body.displayOrder !== undefined) { fields.push('display_order = ?'); values.push(body.displayOrder); }
  if (body.parentId !== undefined) { fields.push('parent_id = ?'); values.push(body.parentId); }
  if (body.isActive !== undefined) { fields.push('is_active = ?'); values.push(body.isActive ? 1 : 0); }
  
  if (fields.length > 0) {
    values.push(id);
    await env.DB.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  await auditLog(env, admin.adminId, 'UPDATE', 'category', id);
  return successResponse({ updated: true });
}

async function handleAdminDeleteCategory(id, admin, env) {
  requireRole(admin, 'SUPER_ADMIN');
  // Optional: Check if there are subjects or books linked to this category before deleting
  await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
  await auditLog(env, admin.adminId, 'DELETE', 'category', id);
  return successResponse({ deleted: true });
}

async function handleAdminUpdateSubject(id, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = [];
  const values = [];
  
  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
  if (body.iconUrl !== undefined) { fields.push('icon_url = ?'); values.push(body.iconUrl); }
  if (body.displayOrder !== undefined) { fields.push('display_order = ?'); values.push(body.displayOrder); }
  if (body.categoryId !== undefined) { fields.push('category_id = ?'); values.push(body.categoryId); }
  if (body.isActive !== undefined) { fields.push('is_active = ?'); values.push(body.isActive ? 1 : 0); }
  
  if (fields.length > 0) {
    values.push(id);
    await env.DB.prepare(`UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  await auditLog(env, admin.adminId, 'UPDATE', 'subject', id);
  return successResponse({ updated: true });
}

async function handleAdminDeleteSubject(id, admin, env) {
  requireRole(admin, 'SUPER_ADMIN');
  await env.DB.prepare('DELETE FROM subjects WHERE id = ?').bind(id).run();
  await auditLog(env, admin.adminId, 'DELETE', 'subject', id);
  return successResponse({ deleted: true });
}

// ─── Admin Languages ─────────────────────────────

async function handleAdminCreateLanguage(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.code || !body.name) throw { status: 400, code: 'VALIDATION_ERROR', message: 'code and name required' };
  
  const existing = await env.DB.prepare('SELECT id FROM languages WHERE code = ? OR name = ?').bind(body.code, body.name).first();
  if (existing) throw { status: 400, code: 'ALREADY_EXISTS', message: 'Language with this code or name already exists' };

  const id = generateId();
  await env.DB.prepare('INSERT INTO languages (id, code, name, native_name, is_active) VALUES (?, ?, ?, ?, ?)').bind(id, body.code, body.name, body.nativeName || null, body.isActive !== false ? 1 : 0).run();
  await auditLog(env, admin.adminId, 'CREATE', 'language', id);
  return successResponse({ id, name: body.name });
}

async function handleAdminUpdateLanguage(id, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = [];
  const values = [];
  
  if (body.code !== undefined) { fields.push('code = ?'); values.push(body.code); }
  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.nativeName !== undefined) { fields.push('native_name = ?'); values.push(body.nativeName); }
  if (body.isActive !== undefined) { fields.push('is_active = ?'); values.push(body.isActive ? 1 : 0); }
  
  if (fields.length > 0) {
    values.push(id);
    await env.DB.prepare(`UPDATE languages SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  await auditLog(env, admin.adminId, 'UPDATE', 'language', id);
  return successResponse({ updated: true });
}

async function handleAdminDeleteLanguage(id, admin, env) {
  requireRole(admin, 'SUPER_ADMIN');
  await env.DB.prepare('DELETE FROM languages WHERE id = ?').bind(id).run();
  await auditLog(env, admin.adminId, 'DELETE', 'language', id);
  return successResponse({ deleted: true });
}

// ─── Admin Categories/Subjects/Languages GET ────────

async function handleAdminGetCategories(env) {
  const cats = await env.DB.prepare('SELECT * FROM categories ORDER BY display_order, name').all();
  return successResponse(cats.results || []);
}

async function handleAdminGetSubjects(env) {
  const subs = await env.DB.prepare('SELECT * FROM subjects ORDER BY display_order, name').all();
  return successResponse(subs.results || []);
}

async function handleAdminGetLanguages(env) {
  const langs = await env.DB.prepare('SELECT * FROM languages ORDER BY name').all();
  return successResponse(langs.results || []);
}

// ─── Admin Users ─────────────────────────────────

function getFirebaseAdmin(env) {
  return new FirebaseAdmin(env.FIREBASE_SERVICE_ACCOUNT_JSON);
}

async function handleAdminGetUsers(params, admin, env) {
  requireRole(admin, 'SUPER_ADMIN');
  try {
    const firebase = getFirebaseAdmin(env);
    const result = await firebase.listUsers(params.nextPageToken, parseInt(params.maxResults) || 100);
    return successResponse(result.users || [], { nextPageToken: result.nextPageToken });
  } catch (err) {
    console.error('Error fetching users:', err);
    throw { status: 500, code: 'FIREBASE_ERROR', message: err.message || 'Failed to fetch users from Firebase' };
  }
}

async function handleAdminUpdateUser(uid, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN');
  try {
    const firebase = getFirebaseAdmin(env);
    const updatedUser = await firebase.updateUser(uid, body);
    await auditLog(env, admin.adminId, 'UPDATE', 'user', uid);
    return successResponse(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err);
    throw { status: 500, code: 'FIREBASE_ERROR', message: err.message || 'Failed to update user' };
  }
}

async function handleAdminChangePassword(uid, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN');
  if (!body.password || body.password.length < 6) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters long' };
  }
  try {
    const firebase = getFirebaseAdmin(env);
    await firebase.updateUser(uid, { password: body.password });
    await auditLog(env, admin.adminId, 'UPDATE_PASSWORD', 'user', uid);
    return successResponse({ success: true });
  } catch (err) {
    console.error('Error changing password:', err);
    throw { status: 500, code: 'FIREBASE_ERROR', message: err.message || 'Failed to change password' };
  }
}

async function handleAdminDeleteUser(uid, admin, env) {
  requireRole(admin, 'SUPER_ADMIN');
  try {
    const firebase = getFirebaseAdmin(env);
    await firebase.deleteUser(uid);
    await auditLog(env, admin.adminId, 'DELETE', 'user', uid);
    return successResponse({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    throw { status: 500, code: 'FIREBASE_ERROR', message: err.message || 'Failed to delete user' };
  }
}

// ─── Admin Ads ───────────────────────────────────

async function handleAdminGetAds(env) {
  const ads = await env.DB.prepare('SELECT * FROM ad_units ORDER BY ad_type, priority').all();
  return successResponse(ads.results || []);
}

async function handleAdminCreateAd(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN');
  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO ad_units (id, ad_unit_id, ad_type, platform, placement, is_enabled, is_test_mode, priority, frequency_config)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, body.adUnitId, body.adType, body.platform, body.placement, body.isEnabled ? 1 : 0, body.isTestMode ? 1 : 0, body.priority || 0, body.frequencyConfig ? JSON.stringify(body.frequencyConfig) : null).run();
  await auditLog(env, admin.adminId, 'CREATE', 'ad_unit', id);
  return successResponse({ id });
}

async function handleAdminUpdateAd(adId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN');
  const fields = [];
  const values = [];
  if (body.adUnitId !== undefined) { fields.push('ad_unit_id = ?'); values.push(body.adUnitId); }
  if (body.isEnabled !== undefined) { fields.push('is_enabled = ?'); values.push(body.isEnabled ? 1 : 0); }
  if (body.isTestMode !== undefined) { fields.push('is_test_mode = ?'); values.push(body.isTestMode ? 1 : 0); }
  if (body.placement !== undefined) { fields.push('placement = ?'); values.push(body.placement); }
  if (body.priority !== undefined) { fields.push('priority = ?'); values.push(body.priority); }
  if (body.frequencyConfig !== undefined) { fields.push('frequency_config = ?'); values.push(JSON.stringify(body.frequencyConfig)); }
  
  if (fields.length > 0) {
    values.push(adId);
    await env.DB.prepare(`UPDATE ad_units SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  await auditLog(env, admin.adminId, 'UPDATE', 'ad_unit', adId);
  return successResponse({ updated: true });
}

// ─── Admin Analytics ─────────────────────────────

async function handleAdminAnalytics(env) {
  const [bookCount, chapterCount, questionCount, quizCount, flashcardCount, videoCount, adCount] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as c FROM books').first(),
    env.DB.prepare('SELECT COUNT(*) as c FROM chapters').first(),
    env.DB.prepare('SELECT COUNT(*) as c FROM questions').first(),
    env.DB.prepare('SELECT COUNT(*) as c FROM quizzes').first(),
    env.DB.prepare('SELECT COUNT(*) as c FROM flashcard_sets').first(),
    env.DB.prepare('SELECT COUNT(*) as c FROM videos').first(),
    env.DB.prepare('SELECT COUNT(*) as c FROM ad_units WHERE is_enabled = 1').first(),
  ]);
  
  const publishedBooks = await env.DB.prepare("SELECT COUNT(*) as c FROM books WHERE status = 'PUBLISHED'").first();
  const draftBooks = await env.DB.prepare("SELECT COUNT(*) as c FROM books WHERE status = 'DRAFT'").first();
  const recentActivity = await env.DB.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 20').all();
  
  let userCount = 0;
  try {
    const fbAdmin = new FirebaseAdmin(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    const usersData = await fbAdmin.listUsers(null, 1000); 
    userCount = usersData.users ? usersData.users.length : 0;
  } catch (e) {
    console.error('Failed to get user count:', e);
  }

  return successResponse({
    counts: {
      books: bookCount.c,
      chapters: chapterCount.c,
      questions: questionCount.c,
      quizzes: quizCount.c,
      flashcardSets: flashcardCount.c,
      videos: videoCount.c,
      publishedBooks: publishedBooks.c,
      draftBooks: draftBooks.c,
      users: userCount,
      ads: adCount.c
    },
    recentActivity: recentActivity.results
  });
}



// ─── Admin Notifications ─────────────────────────

async function handleAdminCreateNotification(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO scheduled_notifications (id, title, body, target_type, target_value, scheduled_at, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, body.title, body.body, body.targetType || 'ALL', body.targetValue || null, body.scheduledAt || new Date().toISOString(), body.sendNow ? 'SENT' : 'SCHEDULED', admin.adminId).run();
  
  await auditLog(env, admin.adminId, 'CREATE', 'notification', id);
  return successResponse({ id });
}

// ─── Admin Config ────────────────────────────────

async function handleAdminGetConfig(env) {
  const configs = await env.DB.prepare('SELECT * FROM app_config').all();
  return successResponse(configs.results || []);
}

async function handleAdminUpdateConfig(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  
  if (!Array.isArray(body.configs)) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'Body must contain configs array' };
  }

  for (const item of body.configs) {
    if (!item.key || item.value === undefined) continue;
    
    const existing = await env.DB.prepare('SELECT key FROM app_config WHERE key = ?').bind(item.key).first();
    const strValue = typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value);
    
    if (existing) {
      await env.DB.prepare('UPDATE app_config SET value = ?, updated_by = ?, updated_at = datetime("now") WHERE key = ?')
        .bind(strValue, admin.adminId, item.key).run();
    } else {
      await env.DB.prepare('INSERT INTO app_config (key, value, description, updated_by) VALUES (?, ?, ?, ?)')
        .bind(item.key, strValue, item.description || '', admin.adminId).run();
    }
  }
  
  await auditLog(env, admin.adminId, 'UPDATE_CONFIG', 'app_config', 'bulk');
  return successResponse({ updated: true });
}

// ─── Admin All Books (with all statuses) ─────────

async function handleAdminGetBooks(params, admin, env) {
  const page = parseInt(params.page) || 1;
  const limit = Math.min(parseInt(params.limit) || 20, 50);
  const offset = (page - 1) * limit;
  
  let where = '1=1';
  const binds = [];
  
  if (params.status) { where += ' AND status = ?'; binds.push(params.status); }
  if (params.search) { where += ' AND (title LIKE ? OR author LIKE ?)'; binds.push(`%${params.search}%`, `%${params.search}%`); }
  
  const total = (await env.DB.prepare(`SELECT COUNT(*) as c FROM books WHERE ${where}`).bind(...binds).first()).c;
  const books = await env.DB.prepare(`SELECT * FROM books WHERE ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`).bind(...binds, limit, offset).all();
  
  return successResponse(books.results || [], { page, limit, total, hasMore: offset + limit < total });
}

// ═══════════════════════════════════════════════════
// Main Router
// ═══════════════════════════════════════════════════


// ─── Phase 6 Handlers (Learner Experience) ─────────────────────────

async function sendBrevoEmail(toEmail, toName, subject, htmlContent, env) {
  const BREVO_API_KEY = env.BREVO_API_KEY || 'MISSING_API_KEY';
  const url = 'https://api.brevo.com/v3/smtp/email';
  
  const payload = {
    sender: { name: 'TF Study Shelf', email: 'no-reply@techilyfly.com' },
    to: [{ email: toEmail, name: toName || toEmail }],
    subject: subject,
    htmlContent: htmlContent
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      console.error('Brevo error:', await response.text());
    }
  } catch (error) {
    console.error('Brevo fetch error:', error);
  }
}

// Enrollments
async function handleAdminGetEnrollments(courseId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const items = await env.DB.prepare('SELECT * FROM enrollments WHERE course_id = ? ORDER BY enrolled_at DESC').bind(courseId).all();
  return successResponse(items.results || []);
}

async function handleAdminCreateEnrollment(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.courseId || !body.userId) throw { status: 400, code: 'VALIDATION_ERROR', message: 'courseId and userId are required' };
  
  const id = generateId();
  await env.DB.prepare(`INSERT INTO enrollments (id, user_id, course_id, status) VALUES (?, ?, ?, ?)`).bind(
    id, body.userId, body.courseId, body.status || 'ACTIVE'
  ).run();
  
  const course = await env.DB.prepare('SELECT title FROM courses WHERE id = ?').bind(body.courseId).first();
  const userEmail = body.userEmail || body.userId;
  
  if (userEmail && userEmail.includes('@')) {
    await sendBrevoEmail(userEmail, userEmail, `You've been enrolled in ${course?.title || 'a new course'}`, `<p>Hello!</p><p>You have been successfully enrolled in the course: <strong>${course?.title || 'the course'}</strong>.</p><p>Happy learning!</p>`, env);
  }
  
  const item = await env.DB.prepare('SELECT * FROM enrollments WHERE id = ?').bind(id).first();
  return successResponse(item);
}

// Certificates
async function handleAdminGetCertificates(courseId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const items = await env.DB.prepare('SELECT * FROM certificates WHERE course_id = ? ORDER BY issued_at DESC').bind(courseId).all();
  return successResponse(items.results || []);
}

async function handleAdminIssueCertificate(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.courseId || !body.userId) throw { status: 400, code: 'VALIDATION_ERROR', message: 'courseId and userId are required' };
  
  const id = generateId();
  const certNumber = 'CERT-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  
  await env.DB.prepare(`INSERT INTO certificates (id, course_id, user_id, certificate_number, verification_url, status) VALUES (?, ?, ?, ?, ?, ?)`).bind(
    id, body.courseId, body.userId, certNumber, body.verificationUrl || '', 'ISSUED'
  ).run();
  
  const course = await env.DB.prepare('SELECT title FROM courses WHERE id = ?').bind(body.courseId).first();
  const userEmail = body.userEmail || body.userId;
  
  if (userEmail && userEmail.includes('@')) {
    await sendBrevoEmail(userEmail, userEmail, `Certificate of Completion for ${course?.title || 'the course'}`, `<p>Congratulations!</p><p>You have successfully completed <strong>${course?.title || 'the course'}</strong>.</p><p>Your certificate number is: ${certNumber}</p>`, env);
  }
  
  const item = await env.DB.prepare('SELECT * FROM certificates WHERE id = ?').bind(id).first();
  return successResponse(item);
}

// Discussions
async function handleGetDiscussions(courseId, params, env) {
  const items = await env.DB.prepare("SELECT * FROM discussions WHERE course_id = ? AND status != 'DELETED' ORDER BY is_pinned DESC, created_at DESC").bind(courseId).all();
  return successResponse(items.results || []);
}

async function handleCreateDiscussion(courseId, body, user, env) {
  if (!body.title || !body.content) throw { status: 400, code: 'VALIDATION_ERROR', message: 'title and content are required' };
  
  const id = generateId();
  await env.DB.prepare(`INSERT INTO discussions (id, course_id, lesson_id, user_id, title, content) VALUES (?, ?, ?, ?, ?, ?)`).bind(
    id, courseId, body.lessonId || null, user.uid, body.title, body.content
  ).run();
  
  const item = await env.DB.prepare('SELECT * FROM discussions WHERE id = ?').bind(id).first();
  return successResponse(item);
}

// Learning Paths
async function handleAdminGetLearningPaths(admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const items = await env.DB.prepare('SELECT * FROM learning_paths ORDER BY created_at DESC').bind().all();
  return successResponse(items.results || []);
}

async function handleAdminCreateLearningPath(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.title) throw { status: 400, code: 'VALIDATION_ERROR', message: 'title is required' };
  
  const id = generateId();
  await env.DB.prepare(`INSERT INTO learning_paths (id, title, description, status) VALUES (?, ?, ?, ?)`).bind(
    id, body.title, body.description || null, body.status || 'DRAFT'
  ).run();
  
  const item = await env.DB.prepare('SELECT * FROM learning_paths WHERE id = ?').bind(id).first();
  return successResponse(item);
}

export default {
  async fetch(request, env, ctx) {
    const { path, params } = parseUrl(request);
    const method = request.method;
    const origin = request.headers.get('Origin') || '*';
    
    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }
    
    try {
      let response;
      let routeParams;
      
      // ─── Public API Routes ─────────────────────
      
      if (method === 'GET' && path === '/') {
        response = jsonResponse({ success: true, message: "TF Study Shelf API is running" });
      }
      else if (method === 'GET' && path === '/api/v1/books') {
        response = await handleGetBooks(params, env);
      }
      else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/books/:id'))) {
        response = await handleGetBook(routeParams.id, env);
      }
      else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/books/:id/chapters'))) {
        response = await handleGetChapters(routeParams.id, env);
      }
      else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/books/:id/questions'))) {
        response = await handleGetQuestions(routeParams.id, params, env);
      }
      else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/books/:id/quizzes'))) {
        response = await handleGetQuizzes(routeParams.id, env);
      }
      else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/books/:id/flashcards'))) {
        response = await handleGetFlashcards(routeParams.id, env);
      }
      else if (method === 'GET' && path === '/api/v1/categories') {
        response = await handleGetCategories(env);
      }
      else if (method === 'GET' && path === '/api/v1/subjects') {
        response = await handleGetSubjects(env);
      }
      else if (method === 'GET' && path === '/api/v1/languages') {
        response = await handleGetLanguages(env);
      }
      else if (method === 'GET' && path === '/api/v1/courses') {
        response = await handleGetCourses(params, env);
      }
      else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/courses/:id'))) {
        response = await handleGetCourse(routeParams.id, env);
      }
      else if (method === 'GET' && path === '/api/v1/study-packs') {
        response = await handleGetStudyPacks(env);
      }
      else if (method === 'GET' && path === '/api/v1/collections') {
        response = await handleGetCollections(env);
      }
      else if (method === 'GET' && path === '/api/v1/search') {
        await checkRateLimit(`search:${request.headers.get('CF-Connecting-IP')}`, 30, 60, env);
        response = await handleSearch(params, env);
      }
      else if (method === 'GET' && path === '/api/v1/config') {
        response = await handleGetConfig(env);
      }
      else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/quizzes/:id'))) {
        response = await handleGetQuiz(routeParams.id, env);
      }
      else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/flashcard-sets/:id'))) {
        response = await handleGetFlashcardSet(routeParams.id, env);
      }
      
      // ─── Admin API Routes ──────────────────────
      
      else if (path.startsWith('/api/v1/admin/')) {
        const admin = await requireAdmin(request, env);
        const body = (method === 'POST' || method === 'PUT') ? await request.json().catch(() => ({})) : {};
        
        // Admin Books
        if (method === 'GET' && path === '/api/v1/admin/books') {
          response = await handleAdminGetBooks(params, admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/books') {
          response = await handleAdminCreateBook(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/books/:id'))) {
          response = await handleAdminUpdateBook(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/books/:id'))) {
          response = await handleAdminDeleteBook(routeParams.id, admin, env);
        }
        else if (method === 'POST' && (routeParams = matchRoute(path, '/api/v1/admin/books/:id/publish'))) {
          response = await handleAdminPublishBook(routeParams.id, admin, env);
        }
        else if (method === 'POST' && (routeParams = matchRoute(path, '/api/v1/admin/books/:id/unpublish'))) {
          response = await handleAdminUnpublishBook(routeParams.id, admin, env);
        }
        else if (method === 'POST' && (routeParams = matchRoute(path, '/api/v1/admin/books/:id/emergency-unpublish'))) {
          response = await handleAdminUnpublishBook(routeParams.id, admin, env, true);
        }
        // Admin Courses
        else if (method === 'GET' && path === '/api/v1/admin/courses') {
          response = await handleAdminGetCourses(params, admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/courses') {
          response = await handleAdminCreateCourse(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:id'))) {
          response = await handleAdminUpdateCourse(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:id'))) {
          response = await handleAdminDeleteCourse(routeParams.id, admin, env);
        }
        else if (method === 'POST' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:id/publish'))) {
          response = await handleAdminPublishCourse(routeParams.id, admin, env);
        }
        else if (method === 'POST' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:id/unpublish'))) {
          response = await handleAdminUnpublishCourse(routeParams.id, admin, env);
        }
        // Admin Course Sections
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:id/sections'))) {
          response = await handleAdminGetCourseSections(routeParams.id, admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/course-sections') {
          response = await handleAdminCreateCourseSection(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/course-sections/:id'))) {
          response = await handleAdminUpdateCourseSection(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/course-sections/:id'))) {
          response = await handleAdminDeleteCourseSection(routeParams.id, admin, env);
        }
        // Admin Course Lessons
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/course-sections/:id/lessons'))) {
          response = await handleAdminGetCourseLessons(routeParams.id, admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/course-lessons') {
          response = await handleAdminCreateCourseLesson(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/course-lessons/:id'))) {
          response = await handleAdminUpdateCourseLesson(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/course-lessons/:id'))) {
          response = await handleAdminDeleteCourseLesson(routeParams.id, admin, env);
        }
        // Admin Course Assessments
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:id/assessments'))) {
          response = await handleAdminGetCourseAssessments(routeParams.id, admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/course-assessments') {
          response = await handleAdminCreateCourseAssessment(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/course-assessments/:id'))) {
          response = await handleAdminUpdateCourseAssessment(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/course-assessments/:id'))) {
          response = await handleAdminDeleteCourseAssessment(routeParams.id, admin, env);
        }
        // Admin Course Assignments
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:id/assignments'))) {
          response = await handleAdminGetCourseAssignments(routeParams.id, admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/course-assignments') {
          response = await handleAdminCreateCourseAssignment(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/course-assignments/:id'))) {
          response = await handleAdminUpdateCourseAssignment(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/course-assignments/:id'))) {
          response = await handleAdminDeleteCourseAssignment(routeParams.id, admin, env);
        }
        // Admin Course Projects
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:id/projects'))) {
          response = await handleAdminGetCourseProjects(routeParams.id, admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/course-projects') {
          response = await handleAdminCreateCourseProject(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/course-projects/:id'))) {
          response = await handleAdminUpdateCourseProject(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/course-projects/:id'))) {
          response = await handleAdminDeleteCourseProject(routeParams.id, admin, env);
        }
        // Admin Course Resources
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:id/resources'))) {
          response = await handleAdminGetCourseResources(routeParams.id, admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/course-resources') {
          response = await handleAdminCreateCourseResource(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/course-resources/:id'))) {
          response = await handleAdminUpdateCourseResource(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/course-resources/:id'))) {
          response = await handleAdminDeleteCourseResource(routeParams.id, admin, env);
        }
        // Admin Course Questions (Phase 5)
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:id/questions'))) {
          response = await handleAdminGetCourseQuestions(routeParams.id, admin, env);
        }
        else if (method === 'POST' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:id/questions'))) {
          response = await handleAdminCreateCourseQuestion(routeParams.id, body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:courseId/questions/:questionId'))) {
          response = await handleAdminUpdateCourseQuestion(routeParams.courseId, routeParams.questionId, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:courseId/questions/:questionId'))) {
          response = await handleAdminDeleteCourseQuestion(routeParams.courseId, routeParams.questionId, admin, env);
        }
        // Admin Course Interactive Content (Phase 5)
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/course-lessons/:id/coding'))) {
          response = await handleAdminGetCodingLesson(routeParams.id, admin, env);
        }
        else if (method === 'POST' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:courseId/lessons/:lessonId/coding'))) {
          response = await handleAdminSaveCodingLesson(routeParams.courseId, routeParams.lessonId, body, admin, env);
        }
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/course-lessons/:id/live'))) {
          response = await handleAdminGetLiveSession(routeParams.id, admin, env);
        }
        else if (method === 'POST' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:courseId/lessons/:lessonId/live'))) {
          response = await handleAdminSaveLiveSession(routeParams.courseId, routeParams.lessonId, body, admin, env);
        }
        // Admin Chapters
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/books/:id/chapters'))) {
          response = await handleAdminGetChapters(routeParams.id, admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/chapters') {
          response = await handleAdminCreateChapter(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/chapters/:id'))) {
          response = await handleAdminUpdateChapter(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/chapters/:id'))) {
          response = await handleAdminDeleteChapter(routeParams.id, admin, env);
        }
        // Admin Questions
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/books/:id/questions'))) {
          response = await handleAdminGetQuestions(routeParams.id, params, admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/questions') {
          response = await handleAdminCreateQuestion(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/questions/:id'))) {
          response = await handleAdminUpdateQuestion(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/questions/:id'))) {
          response = await handleAdminDeleteQuestion(routeParams.id, admin, env);
        }
        // Admin Quizzes
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/books/:id/quizzes'))) {
          response = await handleAdminGetQuizzes(routeParams.id, admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/quizzes') {
          response = await handleAdminCreateQuiz(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/quizzes/:id'))) {
          response = await handleAdminUpdateQuiz(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/quizzes/:id'))) {
          response = await handleAdminDeleteQuiz(routeParams.id, admin, env);
        }
        // Admin Flashcards
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/books/:id/flashcards'))) {
          response = await handleAdminGetFlashcards(routeParams.id, admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/flashcard-sets') {
          response = await handleAdminCreateFlashcardSet(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/flashcard-sets/:id'))) {
          response = await handleAdminUpdateFlashcardSet(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/flashcard-sets/:id'))) {
          response = await handleAdminDeleteFlashcardSet(routeParams.id, admin, env);
        }
        // Admin Categories & Subjects
        else if (method === 'GET' && path === '/api/v1/admin/categories') {
          response = await handleAdminGetCategories(env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/categories') {
          response = await handleAdminCreateCategory(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/categories/:id'))) {
          response = await handleAdminUpdateCategory(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/categories/:id'))) {
          response = await handleAdminDeleteCategory(routeParams.id, admin, env);
        }
        else if (method === 'GET' && path === '/api/v1/admin/subjects') {
          response = await handleAdminGetSubjects(env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/subjects') {
          response = await handleAdminCreateSubject(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/subjects/:id'))) {
          response = await handleAdminDeleteLanguage(routeParams.id, admin, env);
        }
        // Admin Users
        else if (method === 'GET' && path === '/api/v1/admin/users') {
          response = await handleAdminGetUsers(params, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/users/:id'))) {
          response = await handleAdminUpdateUser(routeParams.id, body, admin, env);
        }
        else if (method === 'POST' && (routeParams = matchRoute(path, '/api/v1/admin/users/:id/password'))) {
          response = await handleAdminChangePassword(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/users/:id'))) {
          response = await handleAdminDeleteUser(routeParams.id, admin, env);
        }
        // Admin Ads
        else if (method === 'GET' && path === '/api/v1/admin/ads') {
          response = await handleAdminGetAds(env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/ads') {
          response = await handleAdminCreateAd(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/ads/:id'))) {
          response = await handleAdminUpdateAd(routeParams.id, body, admin, env);
        }

        // Admin Phase 6 (Enrollments, Certificates, Learning Paths)
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:id/enrollments'))) {
          response = await handleAdminGetEnrollments(routeParams.id, admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/enrollments') {
          response = await handleAdminCreateEnrollment(body, admin, env);
        }
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/admin/courses/:id/certificates'))) {
          response = await handleAdminGetCertificates(routeParams.id, admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/certificates') {
          response = await handleAdminIssueCertificate(body, admin, env);
        }
        else if (method === 'GET' && path === '/api/v1/admin/learning-paths') {
          response = await handleAdminGetLearningPaths(admin, env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/learning-paths') {
          response = await handleAdminCreateLearningPath(body, admin, env);
        }
        // Admin Analytics
        else if (method === 'GET' && path === '/api/v1/admin/analytics/overview') {
          response = await handleAdminAnalytics(env);
        }
        // Admin Notifications
        else if (method === 'POST' && path === '/api/v1/admin/notifications/send') {
          response = await handleAdminCreateNotification(body, admin, env);
        }
        else {
          response = errorResponse('NOT_FOUND', 'Admin endpoint not found', 404);
        }
      }
      
      // ─── 404 ───────────────────────────────────
      
      else {
        response = errorResponse('NOT_FOUND', `Route ${method} ${path} not found`, 404);
      }
      
      // Add CORS headers to response
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(corsHeaders(origin, env))) {
        headers.set(key, value);
      }
      
      return new Response(response.body, { status: response.status, headers });
      
    } catch (err) {
      const status = err.status || 500;
      const code = err.code || 'SERVER_ERROR';
      const message = err.message || 'An unexpected error occurred';
      
      if (status === 500) console.error('Server error:', err);
      
      const response = errorResponse(code, message, status);
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(corsHeaders(origin, env))) {
        headers.set(key, value);
      }
      return new Response(response.body, { status: response.status, headers });
    }
  }
};
