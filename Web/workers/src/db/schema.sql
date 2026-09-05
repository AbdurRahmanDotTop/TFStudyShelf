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
  question_type TEXT NOT NULL CHECK (question_type IN (
    'MCQ', 'SHORT', 'LONG', 'TRUE_FALSE', 'FILL_BLANK', 'EXAM', 'CONCEPTUAL'
  )),
  difficulty TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  answer TEXT NOT NULL,
  explanation TEXT,
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
