-- ═══════════════════════════════════════════════════════════════
-- TF Study Shelf — Cloudflare D1 Database Schema
-- Complete production schema with all tables, indexes, triggers
-- ═══════════════════════════════════════════════════════════════

-- ─── Books ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'en',
  page_count INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  estimated_read_time_minutes INTEGER NOT NULL DEFAULT 0,
  rating REAL DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,

  -- Content Rights (mandatory)
  rights_status TEXT NOT NULL DEFAULT 'RESTRICTED' CHECK (rights_status IN ('PUBLIC_DOMAIN', 'OPEN_LICENSE', 'AUTHORIZED', 'RESTRICTED')),
  license_name TEXT,
  license_source TEXT,
  rights_holder TEXT,
  permission_reference TEXT,
  allowed_download INTEGER NOT NULL DEFAULT 0,
  allowed_offline INTEGER NOT NULL DEFAULT 0,
  allowed_share INTEGER NOT NULL DEFAULT 0,

  -- Google Drive
  pdf_google_drive_id TEXT,
  cover_google_drive_id TEXT,

  -- Publishing
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED')),
  version INTEGER NOT NULL DEFAULT 1,
  featured_order INTEGER,

  -- Metadata
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT,
  created_by TEXT NOT NULL DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_language ON books(language);
CREATE INDEX IF NOT EXISTS idx_books_difficulty ON books(difficulty);
CREATE INDEX IF NOT EXISTS idx_books_featured ON books(featured_order) WHERE featured_order IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_books_created ON books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_published ON books(published_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS idx_books_rating ON books(rating DESC);

-- ─── Courses ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  cover_image_url TEXT,
  course_type TEXT NOT NULL DEFAULT 'Self Paced' CHECK (course_type IN ('Self Paced', 'Instructor Led', 'Cohort', 'Hybrid', 'Certification')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  is_free INTEGER NOT NULL DEFAULT 0,
  price REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  enrollment_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED')),
  certificate_enabled INTEGER NOT NULL DEFAULT 0,
  completion_rules TEXT,
  prerequisites TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT,
  created_by TEXT NOT NULL DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_visibility ON courses(visibility);
CREATE INDEX IF NOT EXISTS idx_courses_created ON courses(created_at DESC);

-- ─── Course Junction Tables ──────────────────────────────────
CREATE TABLE IF NOT EXISTS course_categories (
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, category_id)
);

CREATE TABLE IF NOT EXISTS course_subjects (
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, subject_id)
);

-- ─── Course Curriculum (Sections & Lessons) ───────────────────
CREATE TABLE IF NOT EXISTS course_sections (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_course_sections_course ON course_sections(course_id);

CREATE TABLE IF NOT EXISTS course_lessons (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('VIDEO', 'AUDIO', 'ARTICLE', 'PDF', 'DOCUMENT', 'PRESENTATION', 'QUIZ', 'ASSIGNMENT', 'EXAM', 'CODING_EXERCISE', 'MIXED_MEDIA')),
  content TEXT,
  summary TEXT,
  is_free_preview INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_section ON course_lessons(section_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course ON course_lessons(course_id);

-- ─── Categories ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Subjects ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Languages ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS languages (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  native_name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Book Junction Tables ────────────────────────────────────
CREATE TABLE IF NOT EXISTS book_categories (
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, category_id)
);

CREATE TABLE IF NOT EXISTS book_subjects (
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, subject_id)
);

CREATE TABLE IF NOT EXISTS book_tags (
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (book_id, tag)
);

CREATE TABLE IF NOT EXISTS book_exam_tags (
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  exam_tag TEXT NOT NULL,
  PRIMARY KEY (book_id, exam_tag)
);

-- ─── Chapters ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  summary TEXT,
  content TEXT,
  word_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEW', 'PUBLISHED', 'UNPUBLISHED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(book_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS idx_chapters_book ON chapters(book_id, chapter_number);

-- ─── Questions & Answers ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  answer TEXT NOT NULL,
  explanation TEXT,
  metadata TEXT,
  marks INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEW', 'PUBLISHED', 'UNPUBLISHED')),
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS question_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_order INTEGER NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,

  UNIQUE(question_id, option_order)
);

CREATE INDEX IF NOT EXISTS idx_questions_book ON questions(book_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);

-- ─── Quizzes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE SET NULL,
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  time_limit_seconds INTEGER,
  randomize INTEGER NOT NULL DEFAULT 1,
  show_explanation INTEGER NOT NULL DEFAULT 1,
  passing_score_percent INTEGER DEFAULT 60,
  difficulty TEXT DEFAULT 'MIXED' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'MIXED')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  PRIMARY KEY (quiz_id, question_id)
);

-- ─── Flashcards ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flashcard_sets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE SET NULL,
  card_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS flashcards (
  id TEXT PRIMARY KEY,
  set_id TEXT NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Study Packs & Collections ───────────────────────────────
CREATE TABLE IF NOT EXISTS study_packs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  difficulty TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED')),
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS study_pack_items (
  pack_id TEXT NOT NULL REFERENCES study_packs(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('BOOK', 'PDF', 'QUIZ', 'FLASHCARD_SET')),
  item_id TEXT NOT NULL,
  item_order INTEGER NOT NULL,
  PRIMARY KEY (pack_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS content_collections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED')),
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collection_books (
  collection_id TEXT NOT NULL REFERENCES content_collections(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, book_id)
);

-- ─── Videos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE SET NULL,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'UNAVAILABLE')),
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_checked_at TEXT
);

-- ─── Ad Configuration ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_units (
  id TEXT PRIMARY KEY,
  ad_unit_id TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('BANNER', 'INTERSTITIAL', 'REWARDED')),
  platform TEXT NOT NULL CHECK (platform IN ('WEB', 'APP', 'BOTH')),
  placement TEXT NOT NULL,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  is_test_mode INTEGER NOT NULL DEFAULT 0,
  priority INTEGER DEFAULT 0,
  frequency_config TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reward_transactions (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  content_id TEXT,
  entitlement_type TEXT NOT NULL,
  reward_amount INTEGER NOT NULL,
  reward_item TEXT NOT NULL,
  ad_network TEXT,
  ad_unit TEXT,
  verified_at TEXT NOT NULL DEFAULT (datetime('now')),
  custom_data TEXT
);

CREATE INDEX IF NOT EXISTS idx_reward_tx_user ON reward_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_tx_transaction ON reward_transactions(transaction_id);

-- ─── Admin Users & Audit ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ─── Notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  deep_link TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id TEXT PRIMARY KEY,
  template_id TEXT REFERENCES notification_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('ALL', 'TOPIC', 'SEGMENT', 'USER')),
  target_value TEXT,
  scheduled_at TEXT NOT NULL,
  sent_at TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'SENT', 'FAILED', 'CANCELLED')),
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── App Configuration ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);

-- ─── Full-Text Search (FTS5) ─────────────────────────────────
CREATE VIRTUAL TABLE IF NOT EXISTS books_fts USING fts5(
  title, author, description, content='books', content_rowid='rowid'
);

CREATE VIRTUAL TABLE IF NOT EXISTS questions_fts USING fts5(
  question_text, answer, explanation, content='questions', content_rowid='rowid'
);

CREATE VIRTUAL TABLE IF NOT EXISTS chapters_fts USING fts5(
  title, summary, content='chapters', content_rowid='rowid'
);

-- ─── FTS Sync Triggers ──────────────────────────────────────
CREATE TRIGGER IF NOT EXISTS books_ai AFTER INSERT ON books BEGIN
  INSERT INTO books_fts(rowid, title, author, description) VALUES (new.rowid, new.title, new.author, new.description);
END;

CREATE TRIGGER IF NOT EXISTS books_ad AFTER DELETE ON books BEGIN
  INSERT INTO books_fts(books_fts, rowid, title, author, description) VALUES ('delete', old.rowid, old.title, old.author, old.description);
END;

CREATE TRIGGER IF NOT EXISTS books_au AFTER UPDATE ON books BEGIN
  INSERT INTO books_fts(books_fts, rowid, title, author, description) VALUES ('delete', old.rowid, old.title, old.author, old.description);
  INSERT INTO books_fts(rowid, title, author, description) VALUES (new.rowid, new.title, new.author, new.description);
END;

CREATE TRIGGER IF NOT EXISTS questions_ai AFTER INSERT ON questions BEGIN
  INSERT INTO questions_fts(rowid, question_text, answer, explanation) VALUES (new.rowid, new.question_text, new.answer, new.explanation);
END;

CREATE TRIGGER IF NOT EXISTS questions_ad AFTER DELETE ON questions BEGIN
  INSERT INTO questions_fts(questions_fts, rowid, question_text, answer, explanation) VALUES ('delete', old.rowid, old.question_text, old.answer, old.explanation);
END;

CREATE TRIGGER IF NOT EXISTS questions_au AFTER UPDATE ON questions BEGIN
  INSERT INTO questions_fts(questions_fts, rowid, question_text, answer, explanation) VALUES ('delete', old.rowid, old.question_text, old.answer, old.explanation);
  INSERT INTO questions_fts(rowid, question_text, answer, explanation) VALUES (new.rowid, new.question_text, new.answer, new.explanation);
END;

CREATE TRIGGER IF NOT EXISTS chapters_ai AFTER INSERT ON chapters BEGIN
  INSERT INTO chapters_fts(rowid, title, summary) VALUES (new.rowid, new.title, new.summary);
END;

CREATE TRIGGER IF NOT EXISTS chapters_ad AFTER DELETE ON chapters BEGIN
  INSERT INTO chapters_fts(chapters_fts, rowid, title, summary) VALUES ('delete', old.rowid, old.title, old.summary);
END;

CREATE TRIGGER IF NOT EXISTS chapters_au AFTER UPDATE ON chapters BEGIN
  INSERT INTO chapters_fts(chapters_fts, rowid, title, summary) VALUES ('delete', old.rowid, old.title, old.summary);
  INSERT INTO chapters_fts(rowid, title, summary) VALUES (new.rowid, new.title, new.summary);
END;

-- ─── Updated-At Triggers ─────────────────────────────────────
CREATE TRIGGER IF NOT EXISTS books_updated_at AFTER UPDATE ON books BEGIN
  UPDATE books SET updated_at = datetime('now') WHERE id = new.id;
END;

CREATE TRIGGER IF NOT EXISTS chapters_updated_at AFTER UPDATE ON chapters BEGIN
  UPDATE chapters SET updated_at = datetime('now') WHERE id = new.id;
END;

CREATE TRIGGER IF NOT EXISTS questions_updated_at AFTER UPDATE ON questions BEGIN
  UPDATE questions SET updated_at = datetime('now') WHERE id = new.id;
END;

CREATE TRIGGER IF NOT EXISTS ad_units_updated_at AFTER UPDATE ON ad_units BEGIN
  UPDATE ad_units SET updated_at = datetime('now') WHERE id = new.id;
END;

CREATE TRIGGER IF NOT EXISTS course_sections_updated_at AFTER UPDATE ON course_sections BEGIN
  UPDATE course_sections SET updated_at = datetime('now') WHERE id = new.id;
END;

CREATE TRIGGER IF NOT EXISTS course_lessons_updated_at AFTER UPDATE ON course_lessons BEGIN
  UPDATE course_lessons SET updated_at = datetime('now') WHERE id = new.id;
END;

-- ─── Course Assessments (Quizzes/Exams) ──────────────────────
CREATE TABLE IF NOT EXISTS course_assessments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_id TEXT REFERENCES course_sections(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL DEFAULT 'QUIZ' CHECK (assessment_type IN ('QUIZ', 'EXAM', 'PRACTICE_TEST')),
  time_limit_seconds INTEGER,
  passing_score_percent INTEGER DEFAULT 60,
  randomize INTEGER NOT NULL DEFAULT 1,
  show_explanation INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL DEFAULT 'system'
);
CREATE TRIGGER IF NOT EXISTS course_assessments_updated_at AFTER UPDATE ON course_assessments BEGIN
  UPDATE course_assessments SET updated_at = datetime('now') WHERE id = new.id;
END;

-- ─── Course Assignments ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_assignments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_id TEXT REFERENCES course_sections(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  max_attempts INTEGER DEFAULT 1,
  passing_criteria TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL DEFAULT 'system'
);
CREATE TRIGGER IF NOT EXISTS course_assignments_updated_at AFTER UPDATE ON course_assignments BEGIN
  UPDATE course_assignments SET updated_at = datetime('now') WHERE id = new.id;
END;

-- ─── Course Projects ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_projects (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  objectives TEXT,
  submission_type TEXT NOT NULL DEFAULT 'FILE',
  evaluation_criteria TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TRIGGER IF NOT EXISTS course_projects_updated_at AFTER UPDATE ON course_projects BEGIN
  UPDATE course_projects SET updated_at = datetime('now') WHERE id = new.id;
END;

-- ─── Course Resources ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_resources (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_id TEXT REFERENCES course_sections(id) ON DELETE SET NULL,
  lesson_id TEXT REFERENCES course_lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  url TEXT NOT NULL,
  download_allowed INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Phase 5: Course Question Bank & Interactive Content ───

-- ─── Course Questions ───
CREATE TABLE IF NOT EXISTS course_questions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assessment_id TEXT REFERENCES course_assessments(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER
  options TEXT, -- JSON array of options for multiple choice
  correct_answer TEXT NOT NULL, -- Text matching an option, or exact answer
  explanation TEXT,
  points INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Course Coding Lessons ───
CREATE TABLE IF NOT EXISTS course_coding_lessons (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL UNIQUE REFERENCES course_lessons(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  starter_code TEXT,
  test_cases TEXT, -- JSON array of test cases
  solution_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Course Live Sessions ───
CREATE TABLE IF NOT EXISTS course_live_sessions (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL UNIQUE REFERENCES course_lessons(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  meeting_url TEXT,
  start_time TEXT, -- ISO string
  duration_minutes INTEGER,
  host_info TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Phase 6: Learner Progress, Enrollment & Interactive Features ───

-- ─── Enrollments ───
CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'DROPPED', 'EXPIRED')),
  enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  UNIQUE(user_id, course_id)
);

-- ─── Learner Progress ───
CREATE TABLE IF NOT EXISTS course_progress (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TRIGGER IF NOT EXISTS course_progress_updated_at AFTER UPDATE ON course_progress BEGIN
  UPDATE course_progress SET updated_at = datetime('now') WHERE id = new.id;
END;

CREATE TABLE IF NOT EXISTS lesson_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  UNIQUE(user_id, lesson_id)
);

-- ─── Certificates ───
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TEXT NOT NULL DEFAULT (datetime('now')),
  verification_url TEXT,
  status TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'REVOKED')),
  UNIQUE(user_id, course_id)
);

-- ─── Discussions ───
CREATE TABLE IF NOT EXISTS discussions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES course_lessons(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'LOCKED', 'HIDDEN', 'DELETED')),
  is_pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TRIGGER IF NOT EXISTS discussions_updated_at AFTER UPDATE ON discussions BEGIN
  UPDATE discussions SET updated_at = datetime('now') WHERE id = new.id;
END;

CREATE TABLE IF NOT EXISTS discussion_posts (
  id TEXT PRIMARY KEY,
  discussion_id TEXT NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_instructor_reply INTEGER NOT NULL DEFAULT 0,
  is_solution INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'HIDDEN', 'DELETED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TRIGGER IF NOT EXISTS discussion_posts_updated_at AFTER UPDATE ON discussion_posts BEGIN
  UPDATE discussion_posts SET updated_at = datetime('now') WHERE id = new.id;
END;

-- ─── Learner Notes & Bookmarks ───
CREATE TABLE IF NOT EXISTS learner_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  video_timestamp_seconds INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TRIGGER IF NOT EXISTS learner_notes_updated_at AFTER UPDATE ON learner_notes BEGIN
  UPDATE learner_notes SET updated_at = datetime('now') WHERE id = new.id;
END;

CREATE TABLE IF NOT EXISTS learner_bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, lesson_id)
);

-- ─── Learning Paths ───
CREATE TABLE IF NOT EXISTS learning_paths (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TRIGGER IF NOT EXISTS learning_paths_updated_at AFTER UPDATE ON learning_paths BEGIN
  UPDATE learning_paths SET updated_at = datetime('now') WHERE id = new.id;
END;

CREATE TABLE IF NOT EXISTS learning_path_courses (
  path_id TEXT NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_mandatory INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (path_id, course_id)
);
