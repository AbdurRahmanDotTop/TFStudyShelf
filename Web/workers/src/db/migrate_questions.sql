PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS questions_new (
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

INSERT INTO questions_new (id, book_id, chapter_id, question_text, question_type, difficulty, answer, explanation, marks, status, display_order, created_at, updated_at, created_by)
SELECT id, book_id, chapter_id, question_text, question_type, difficulty, answer, explanation, marks, status, display_order, created_at, updated_at, created_by FROM questions;

DROP TABLE questions;
ALTER TABLE questions_new RENAME TO questions;

CREATE INDEX IF NOT EXISTS idx_questions_book ON questions(book_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);

PRAGMA foreign_keys=ON;
