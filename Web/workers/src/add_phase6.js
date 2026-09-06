const fs = require('fs');
const path = require('path');

const indexJsPath = path.join(__dirname, 'index.js');
let indexJs = fs.readFileSync(indexJsPath, 'utf8');

const handlersCode = \
// --- Phase 6 Handlers (Learner Experience) -------------------------

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
  await env.DB.prepare(\INSERT INTO enrollments (id, user_id, course_id, status) VALUES (?, ?, ?, ?)\).bind(
    id, body.userId, body.courseId, body.status || 'ACTIVE'
  ).run();
  
  const course = await env.DB.prepare('SELECT title FROM courses WHERE id = ?').bind(body.courseId).first();
  const userEmail = body.userEmail || body.userId; // Usually we'd look up the user's email from Firebase
  
  if (userEmail && userEmail.includes('@')) {
    await sendBrevoEmail(userEmail, userEmail, `You've been enrolled in ${course.title}`, `<p>Hello!</p><p>You have been successfully enrolled in the course: <strong>${course.title}</strong>.</p><p>Happy learning!</p>`, env);
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
  
  await env.DB.prepare(\INSERT INTO certificates (id, course_id, user_id, certificate_number, verification_url, status) VALUES (?, ?, ?, ?, ?, ?)\).bind(
    id, body.courseId, body.userId, certNumber, body.verificationUrl || '', 'ISSUED'
  ).run();
  
  const course = await env.DB.prepare('SELECT title FROM courses WHERE id = ?').bind(body.courseId).first();
  const userEmail = body.userEmail || body.userId;
  
  if (userEmail && userEmail.includes('@')) {
    await sendBrevoEmail(userEmail, userEmail, `Certificate of Completion for ${course.title}`, `<p>Congratulations!</p><p>You have successfully completed <strong>${course.title}</strong>.</p><p>Your certificate number is: ${certNumber}</p>`, env);
  }
  
  const item = await env.DB.prepare('SELECT * FROM certificates WHERE id = ?').bind(id).first();
  return successResponse(item);
}

// Discussions
async function handleGetDiscussions(courseId, params, env) {
  const items = await env.DB.prepare('SELECT * FROM discussions WHERE course_id = ? AND status != \\'DELETED\\' ORDER BY is_pinned DESC, created_at DESC').bind(courseId).all();
  return successResponse(items.results || []);
}

async function handleCreateDiscussion(courseId, body, user, env) {
  if (!body.title || !body.content) throw { status: 400, code: 'VALIDATION_ERROR', message: 'title and content are required' };
  
  const id = generateId();
  await env.DB.prepare(\INSERT INTO discussions (id, course_id, lesson_id, user_id, title, content) VALUES (?, ?, ?, ?, ?, ?)\).bind(
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
  await env.DB.prepare(\INSERT INTO learning_paths (id, title, description, status) VALUES (?, ?, ?, ?)\).bind(
    id, body.title, body.description || null, body.status || 'DRAFT'
  ).run();
  
  const item = await env.DB.prepare('SELECT * FROM learning_paths WHERE id = ?').bind(id).first();
  return successResponse(item);
}

\;

const adminRoutes = \
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
\;

const publicRoutes = \
        // Phase 6 Public (Discussions)
        else if (method === 'GET' && (routeParams = matchRoute(path, '/api/v1/courses/:id/discussions'))) {
          response = await handleGetDiscussions(routeParams.id, params, env);
        }
\;

const authRoutes = \
        else if (method === 'POST' && (routeParams = matchRoute(path, '/api/v1/courses/:id/discussions'))) {
          response = await handleCreateDiscussion(routeParams.id, body, user, env);
        }
\;

// Inject handlers before export default {
if (!indexJs.includes('Phase 6 Handlers')) {
  indexJs = indexJs.replace('export default {', handlersCode + '\nexport default {');
}

// Inject admin routes before "// Admin Analytics"
if (!indexJs.includes('Admin Phase 6')) {
  indexJs = indexJs.replace('        // Admin Analytics', adminRoutes + '        // Admin Analytics');
}

// Inject public routes
if (!indexJs.includes('Phase 6 Public')) {
  indexJs = indexJs.replace('        // --- Protected API Routes (Requires User Auth)', publicRoutes + '\n        // --- Protected API Routes (Requires User Auth)');
}

// Inject auth routes
if (!indexJs.includes('handleCreateDiscussion')) {
  indexJs = indexJs.replace('        // --- Admin API Routes', authRoutes + '\n        // --- Admin API Routes');
}

fs.writeFileSync(indexJsPath, indexJs, 'utf8');
console.log('Successfully injected Phase 6 handlers and routes into index.js');
