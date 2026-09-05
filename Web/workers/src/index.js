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

async function handleAdminGetChapters(bookId, admin, env) {
  const chapters = await env.DB.prepare(
    "SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number"
  ).bind(bookId).all();
  
  const results = chapters.results || [];
  for (const ch of results) {
    const qc = await env.DB.prepare("SELECT COUNT(*) as c FROM questions WHERE chapter_id = ?").bind(ch.id).first();
    ch.questionsCount = qc.c;
  }
  
  return successResponse(results);
}

async function handleAdminCreateChapter(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.bookId || !body.title || body.chapterNumber === undefined) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'bookId, title, and chapterNumber required' };
  }
  
  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO chapters (id, book_id, title, chapter_number, summary, content, word_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, body.bookId, body.title, body.chapterNumber, body.summary || null, body.content || null, body.wordCount || 0, body.status || 'PUBLISHED').run();
  
  await auditLog(env, admin.adminId, 'CREATE', 'chapter', id);
  const chapter = await env.DB.prepare('SELECT * FROM chapters WHERE id = ?').bind(id).first();
  return successResponse(chapter);
}

async function handleAdminUpdateChapter(chapterId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = [];
  const values = [];
  
  if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
  if (body.chapterNumber !== undefined) { fields.push('chapter_number = ?'); values.push(body.chapterNumber); }
  if (body.summary !== undefined) { fields.push('summary = ?'); values.push(body.summary); }
  if (body.content !== undefined) { fields.push('content = ?'); values.push(body.content); }
  if (body.wordCount !== undefined) { fields.push('word_count = ?'); values.push(body.wordCount); }
  if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
  
  if (fields.length > 0) {
    values.push(chapterId);
    await env.DB.prepare(`UPDATE chapters SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  
  await auditLog(env, admin.adminId, 'UPDATE', 'chapter', chapterId);
  const chapter = await env.DB.prepare('SELECT * FROM chapters WHERE id = ?').bind(chapterId).first();
  return successResponse(chapter);
}

async function handleAdminDeleteChapter(chapterId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare('DELETE FROM chapters WHERE id = ?').bind(chapterId).run();
  await auditLog(env, admin.adminId, 'DELETE', 'chapter', chapterId);
  return successResponse({ deleted: true });
}

// ─── Admin Questions ─────────────────────────────

async function handleAdminGetQuestions(bookId, params, admin, env) {
  const page = parseInt(params.page) || 1;
  const limit = Math.min(parseInt(params.limit) || 20, 50);
  const offset = (page - 1) * limit;
  
  let where = "book_id = ?";
  const binds = [bookId];
  
  if (params.chapterId) { where += ' AND chapter_id = ?'; binds.push(params.chapterId); }
  if (params.type) { where += ' AND question_type = ?'; binds.push(params.type); }
  if (params.difficulty) { where += ' AND difficulty = ?'; binds.push(params.difficulty); }
  if (params.status) { where += ' AND status = ?'; binds.push(params.status); }
  
  const total = (await env.DB.prepare(`SELECT COUNT(*) as c FROM questions WHERE ${where}`).bind(...binds).first()).c;
  const questions = await env.DB.prepare(`SELECT * FROM questions WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...binds, limit, offset).all();
  
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

async function handleAdminCreateQuestion(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.bookId || !body.questionText || !body.questionType || !body.answer) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'bookId, questionText, questionType, and answer required' };
  }
  
  const id = generateId();
  const metadataString = body.metadata ? JSON.stringify(body.metadata) : null;
  
  await env.DB.prepare(`
    INSERT INTO questions (id, book_id, chapter_id, question_text, question_type, difficulty, answer, explanation, metadata, marks, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, body.bookId, body.chapterId || null, body.questionText, body.questionType, body.difficulty || 'MEDIUM', body.answer, body.explanation || null, metadataString, body.marks || 1, body.status || 'PUBLISHED', admin.adminId).run();
  
  // Add options for types that support options
  if ((body.questionType === 'MCQ' || body.questionType === 'MULTIPLE_SELECT' || body.questionType === 'IMAGE_BASED') && body.options?.length) {
    for (let i = 0; i < body.options.length; i++) {
      const optId = generateId();
      await env.DB.prepare('INSERT INTO question_options (id, question_id, option_text, option_order, is_correct) VALUES (?, ?, ?, ?, ?)').bind(optId, id, body.options[i].text, i, body.options[i].isCorrect ? 1 : 0).run();
    }
  }
  
  await auditLog(env, admin.adminId, 'CREATE', 'question', id);
  return successResponse({ id });
}

async function handleAdminUpdateQuestion(questionId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = [];
  const values = [];
  
  if (body.questionText !== undefined) { fields.push('question_text = ?'); values.push(body.questionText); }
  if (body.questionType !== undefined) { fields.push('question_type = ?'); values.push(body.questionType); }
  if (body.difficulty !== undefined) { fields.push('difficulty = ?'); values.push(body.difficulty); }
  if (body.answer !== undefined) { fields.push('answer = ?'); values.push(body.answer); }
  if (body.explanation !== undefined) { fields.push('explanation = ?'); values.push(body.explanation); }
  if (body.marks !== undefined) { fields.push('marks = ?'); values.push(body.marks); }
  if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
  if (body.chapterId !== undefined) { fields.push('chapter_id = ?'); values.push(body.chapterId); }
  if (body.metadata !== undefined) { fields.push('metadata = ?'); values.push(body.metadata ? JSON.stringify(body.metadata) : null); }
  
  if (fields.length > 0) {
    values.push(questionId);
    await env.DB.prepare(`UPDATE questions SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  
  // Update options if present and applicable
  if ((body.questionType === 'MCQ' || body.questionType === 'MULTIPLE_SELECT' || body.questionType === 'IMAGE_BASED') && body.options !== undefined) {
    await env.DB.prepare('DELETE FROM question_options WHERE question_id = ?').bind(questionId).run();
    for (let i = 0; i < body.options.length; i++) {
      const optId = generateId();
      await env.DB.prepare('INSERT INTO question_options (id, question_id, option_text, option_order, is_correct) VALUES (?, ?, ?, ?, ?)').bind(optId, questionId, body.options[i].text, i, body.options[i].isCorrect ? 1 : 0).run();
    }
  }
  
  await auditLog(env, admin.adminId, 'UPDATE', 'question', questionId);
  return successResponse({ updated: true });
}

async function handleAdminDeleteQuestion(questionId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const question = await env.DB.prepare('SELECT * FROM questions WHERE id = ?').bind(questionId).first();
  if (!question) throw { status: 404, code: 'NOT_FOUND', message: 'Question not found' };
  
  await env.DB.prepare('DELETE FROM questions WHERE id = ?').bind(questionId).run();
  await auditLog(env, admin.adminId, 'DELETE', 'question', questionId);
  return successResponse({ deleted: true });
}

// ─── Admin Quizzes ───────────────────────────────

async function handleAdminGetQuizzes(bookId, admin, env) {
  const quizzes = await env.DB.prepare("SELECT * FROM quizzes WHERE book_id = ?").bind(bookId).all();
  
  for (const quiz of (quizzes.results || [])) {
    const questions = await env.DB.prepare('SELECT question_id FROM quiz_questions WHERE quiz_id = ? ORDER BY question_order').bind(quiz.id).all();
    quiz.questionIds = questions.results.map(q => q.question_id);
    quiz.questionCount = quiz.questionIds.length;
  }
  
  return successResponse(quizzes.results || []);
}

async function handleAdminCreateQuiz(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.title) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'title required' };
  }
  
  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO quizzes (id, title, description, book_id, chapter_id, subject_id, time_limit_seconds, randomize, show_explanation, passing_score_percent, difficulty, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, body.title, body.description || null, body.bookId || null, body.chapterId || null, body.subjectId || null, body.timeLimitSeconds || null, body.randomize !== false ? 1 : 0, body.showExplanation !== false ? 1 : 0, body.passingScorePercent || 60, body.difficulty || 'MIXED', body.status || 'PUBLISHED', admin.adminId).run();
  
  if (Array.isArray(body.questionIds) && body.questionIds.length > 0) {
    for (let i = 0; i < body.questionIds.length; i++) {
      await env.DB.prepare('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (?, ?, ?)').bind(id, body.questionIds[i], i).run();
    }
  }
  
  await auditLog(env, admin.adminId, 'CREATE', 'quiz', id);
  return successResponse({ id });
}

async function handleAdminUpdateQuiz(quizId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = [];
  const values = [];
  
  if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
  if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
  if (body.chapterId !== undefined) { fields.push('chapter_id = ?'); values.push(body.chapterId); }
  if (body.timeLimitSeconds !== undefined) { fields.push('time_limit_seconds = ?'); values.push(body.timeLimitSeconds); }
  if (body.randomize !== undefined) { fields.push('randomize = ?'); values.push(body.randomize ? 1 : 0); }
  if (body.showExplanation !== undefined) { fields.push('show_explanation = ?'); values.push(body.showExplanation ? 1 : 0); }
  if (body.passingScorePercent !== undefined) { fields.push('passing_score_percent = ?'); values.push(body.passingScorePercent); }
  if (body.difficulty !== undefined) { fields.push('difficulty = ?'); values.push(body.difficulty); }
  if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
  
  if (fields.length > 0) {
    values.push(quizId);
    await env.DB.prepare(`UPDATE quizzes SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  
  if (body.questionIds !== undefined) {
    await env.DB.prepare('DELETE FROM quiz_questions WHERE quiz_id = ?').bind(quizId).run();
    for (let i = 0; i < body.questionIds.length; i++) {
      await env.DB.prepare('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (?, ?, ?)').bind(quizId, body.questionIds[i], i).run();
    }
  }
  
  await auditLog(env, admin.adminId, 'UPDATE', 'quiz', quizId);
  return successResponse({ updated: true });
}

async function handleAdminDeleteQuiz(quizId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare('DELETE FROM quizzes WHERE id = ?').bind(quizId).run();
  await auditLog(env, admin.adminId, 'DELETE', 'quiz', quizId);
  return successResponse({ deleted: true });
}

// ─── Admin Flashcards ────────────────────────────

async function handleAdminGetFlashcards(bookId, admin, env) {
  const sets = await env.DB.prepare("SELECT * FROM flashcard_sets WHERE book_id = ?").bind(bookId).all();
  return successResponse(sets.results || []);
}

async function handleAdminCreateFlashcardSet(body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  if (!body.title) throw { status: 400, code: 'VALIDATION_ERROR', message: 'title required' };
  
  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO flashcard_sets (id, title, description, book_id, chapter_id, card_count, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, body.title, body.description || null, body.bookId || null, body.chapterId || null, body.cards?.length || 0, body.status || 'PUBLISHED', admin.adminId).run();
  
  if (body.cards?.length) {
    for (let i = 0; i < body.cards.length; i++) {
      const cardId = generateId();
      await env.DB.prepare('INSERT INTO flashcards (id, set_id, front_text, back_text, display_order) VALUES (?, ?, ?, ?, ?)').bind(cardId, id, body.cards[i].front, body.cards[i].back, i).run();
    }
  }
  
  await auditLog(env, admin.adminId, 'CREATE', 'flashcard_set', id);
  return successResponse({ id });
}

async function handleAdminUpdateFlashcardSet(setId, body, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  const fields = [];
  const values = [];
  
  if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
  if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
  if (body.chapterId !== undefined) { fields.push('chapter_id = ?'); values.push(body.chapterId); }
  if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
  if (body.cards !== undefined) { fields.push('card_count = ?'); values.push(body.cards.length); }
  
  if (fields.length > 0) {
    values.push(setId);
    await env.DB.prepare(`UPDATE flashcard_sets SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  
  if (body.cards !== undefined) {
    await env.DB.prepare('DELETE FROM flashcards WHERE set_id = ?').bind(setId).run();
    for (let i = 0; i < body.cards.length; i++) {
      const cardId = generateId();
      await env.DB.prepare('INSERT INTO flashcards (id, set_id, front_text, back_text, display_order) VALUES (?, ?, ?, ?, ?)').bind(cardId, setId, body.cards[i].front, body.cards[i].back, i).run();
    }
  }
  
  await auditLog(env, admin.adminId, 'UPDATE', 'flashcard_set', setId);
  return successResponse({ updated: true });
}

async function handleAdminDeleteFlashcardSet(setId, admin, env) {
  requireRole(admin, 'SUPER_ADMIN', 'CONTENT_MANAGER');
  await env.DB.prepare('DELETE FROM flashcard_sets WHERE id = ?').bind(setId).run();
  await auditLog(env, admin.adminId, 'DELETE', 'flashcard_set', setId);
  return successResponse({ deleted: true });
}

// ─── Admin Categories/Subjects ───────────────────

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
          response = await handleAdminUpdateSubject(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/subjects/:id'))) {
          response = await handleAdminDeleteSubject(routeParams.id, admin, env);
        }
        // Admin Languages
        else if (method === 'GET' && path === '/api/v1/admin/languages') {
          response = await handleAdminGetLanguages(env);
        }
        else if (method === 'POST' && path === '/api/v1/admin/languages') {
          response = await handleAdminCreateLanguage(body, admin, env);
        }
        else if (method === 'PUT' && (routeParams = matchRoute(path, '/api/v1/admin/languages/:id'))) {
          response = await handleAdminUpdateLanguage(routeParams.id, body, admin, env);
        }
        else if (method === 'DELETE' && (routeParams = matchRoute(path, '/api/v1/admin/languages/:id'))) {
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
