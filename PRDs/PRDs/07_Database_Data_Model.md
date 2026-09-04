# TF Study Shelf — Database & Data Model Requirements

**Document:** 07 — Database & Data Model Requirements  
**Version:** 1.0  
**Date:** September 2, 2026  
**Applies to:** [SHARED] Web Platform + Mobile App  

---

## 1. Storage Architecture Overview

| Storage | Technology | Purpose | Platform |
|---|---|---|---|
| **Primary Database** | Cloudflare D1 (SQLite) | Content data, admin data, public catalog | Web (server) |
| **User Data Sync** | Firebase Firestore | User progress, annotations, sync | Both (cloud) |
| **Backup Files** | Firebase Cloud Storage | Encrypted backup `.tfsbackup` files | Both (cloud) |
| **Content Files** | Google Drive | PDFs, cover images, assets | Both (via API) |
| **Video Content** | YouTube | Video files | Both (embed) |
| **Local Database** | Drift (SQLite) | Cached data, offline content, entitlements | App (local) |
| **Local KV Store** | SharedPreferences / Hive | Settings, flags, small config | App (local) |
| **Secure Storage** | flutter_secure_storage | Auth tokens, encryption keys | App (local) |
| **Edge Cache** | Cloudflare KV | API response cache, config | Web (edge) |

---

## 2. Cloudflare D1 Database Schema (Server)

### 2.1 Books Table

```sql
CREATE TABLE books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  page_count INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  estimated_read_time_minutes INTEGER NOT NULL,
  rating REAL DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  
  -- Content Rights (mandatory)
  rights_status TEXT NOT NULL CHECK (rights_status IN ('PUBLIC_DOMAIN', 'OPEN_LICENSE', 'AUTHORIZED', 'RESTRICTED')),
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
  created_by TEXT NOT NULL,
  
  CONSTRAINT valid_rights CHECK (
    rights_status = 'PUBLIC_DOMAIN' OR
    (license_name IS NOT NULL AND rights_holder IS NOT NULL)
  )
);

CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_language ON books(language);
CREATE INDEX idx_books_difficulty ON books(difficulty);
CREATE INDEX idx_books_featured ON books(featured_order) WHERE featured_order IS NOT NULL;
CREATE INDEX idx_books_created ON books(created_at DESC);
CREATE INDEX idx_books_published ON books(published_at DESC) WHERE status = 'PUBLISHED';
```

### 2.2 Book Categories Junction

```sql
CREATE TABLE book_categories (
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, category_id)
);

CREATE TABLE book_subjects (
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, subject_id)
);

CREATE TABLE book_tags (
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (book_id, tag)
);

CREATE TABLE book_exam_tags (
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  exam_tag TEXT NOT NULL,
  PRIMARY KEY (book_id, exam_tag)
);
```

### 2.3 Categories & Subjects

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  parent_id TEXT REFERENCES categories(id),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  category_id TEXT REFERENCES categories(id),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 2.4 Chapters

```sql
CREATE TABLE chapters (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  summary TEXT,
  content TEXT,
  word_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  UNIQUE(book_id, chapter_number)
);

CREATE INDEX idx_chapters_book ON chapters(book_id, chapter_number);
```

### 2.5 Questions & Answers

```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'MCQ', 'SHORT', 'LONG', 'TRUE_FALSE', 'FILL_BLANK', 'EXAM', 'CONCEPTUAL'
  )),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  answer TEXT NOT NULL,
  explanation TEXT,
  marks INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL
);

CREATE TABLE question_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_order INTEGER NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  
  UNIQUE(question_id, option_order)
);

CREATE INDEX idx_questions_book ON questions(book_id);
CREATE INDEX idx_questions_chapter ON questions(chapter_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
```

### 2.6 Quizzes

```sql
CREATE TABLE quizzes (
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
  difficulty TEXT CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'MIXED')),
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL
);

CREATE TABLE quiz_questions (
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  PRIMARY KEY (quiz_id, question_id)
);
```

### 2.7 Flashcards

```sql
CREATE TABLE flashcard_sets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE SET NULL,
  card_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL
);

CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  set_id TEXT NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 2.8 Study Packs & Collections

```sql
CREATE TABLE study_packs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  subject_id TEXT REFERENCES subjects(id),
  difficulty TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL
);

CREATE TABLE study_pack_items (
  pack_id TEXT NOT NULL REFERENCES study_packs(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('BOOK', 'PDF', 'QUIZ', 'FLASHCARD_SET')),
  item_id TEXT NOT NULL,
  item_order INTEGER NOT NULL,
  PRIMARY KEY (pack_id, item_type, item_id)
);

CREATE TABLE content_collections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE collection_books (
  collection_id TEXT NOT NULL REFERENCES content_collections(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  PRIMARY KEY (collection_id, book_id)
);
```

### 2.9 Videos

```sql
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE SET NULL,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_checked_at TEXT
);
```

### 2.10 Ad Configuration

```sql
CREATE TABLE ad_units (
  id TEXT PRIMARY KEY,
  ad_unit_id TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('BANNER', 'INTERSTITIAL', 'REWARDED')),
  platform TEXT NOT NULL CHECK (platform IN ('WEB', 'APP', 'BOTH')),
  placement TEXT NOT NULL,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  is_test_mode INTEGER NOT NULL DEFAULT 0,
  priority INTEGER DEFAULT 0,
  frequency_config TEXT, -- JSON: cooldown, threshold, etc.
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE reward_transactions (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE, -- From AdMob SSV
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

CREATE INDEX idx_reward_tx_user ON reward_transactions(user_id);
CREATE INDEX idx_reward_tx_transaction ON reward_transactions(transaction_id);
```

### 2.11 Admin & Audit

```sql
CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT, -- JSON
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_admin ON audit_log(admin_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
```

### 2.12 Notifications

```sql
CREATE TABLE notification_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  deep_link TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL
);

CREATE TABLE scheduled_notifications (
  id TEXT PRIMARY KEY,
  template_id TEXT REFERENCES notification_templates(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('ALL', 'TOPIC', 'SEGMENT', 'USER')),
  target_value TEXT,
  scheduled_at TEXT NOT NULL,
  sent_at TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 2.13 Full-Text Search

```sql
-- FTS5 virtual table for search
CREATE VIRTUAL TABLE books_fts USING fts5(
  title, author, description, content='books', content_rowid='rowid'
);

CREATE VIRTUAL TABLE questions_fts USING fts5(
  question_text, answer, explanation, content='questions', content_rowid='rowid'
);

CREATE VIRTUAL TABLE chapters_fts USING fts5(
  title, summary, content, content='chapters', content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER books_ai AFTER INSERT ON books BEGIN
  INSERT INTO books_fts(rowid, title, author, description) VALUES (new.rowid, new.title, new.author, new.description);
END;

CREATE TRIGGER books_ad AFTER DELETE ON books BEGIN
  INSERT INTO books_fts(books_fts, rowid, title, author, description) VALUES ('delete', old.rowid, old.title, old.author, old.description);
END;

CREATE TRIGGER books_au AFTER UPDATE ON books BEGIN
  INSERT INTO books_fts(books_fts, rowid, title, author, description) VALUES ('delete', old.rowid, old.title, old.author, old.description);
  INSERT INTO books_fts(rowid, title, author, description) VALUES (new.rowid, new.title, new.author, new.description);
END;
```

---

## 3. Firebase Firestore Schema (User Data)

### 3.1 User Profile

```
/users/{uid}
{
  email: string,
  displayName: string?,
  joinedAt: timestamp,
  lastActiveAt: timestamp,
  preferences: {
    theme: "system" | "light" | "dark",
    fontSize: "small" | "default" | "large" | "extraLarge" | "huge",
    lineSpacing: "compact" | "normal" | "relaxed",
    pageMode: "paged" | "scroll",
    readingGoalMinutes: number,
    downloadPreference: "wifi" | "any" | "ask",
    notifications: {
      newContent: boolean,
      readingReminders: boolean,
      quizReminders: boolean,
      revisionReminders: boolean,
      studyGoals: boolean,
      announcements: boolean
    }
  }
}
```

### 3.2 Reading Progress

```
/users/{uid}/progress/{bookId}
{
  bookId: string,
  currentPage: number,
  totalPages: number,
  progressPercent: number,
  currentChapterId: string?,
  totalReadTimeSeconds: number,
  lastReadAt: timestamp,
  startedAt: timestamp,
  completedAt: timestamp?,
  isCompleted: boolean,
  updatedAt: timestamp
}
```

### 3.3 Highlights

```
/users/{uid}/highlights/{highlightId}
{
  id: string,
  bookId: string,
  chapterId: string?,
  page: number,
  selectedText: string,
  startPosition: { paragraph: number, offset: number },
  endPosition: { paragraph: number, offset: number },
  category: "primary" | "important" | "question" | "remember" | "definition",
  noteId: string?,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3.4 Notes

```
/users/{uid}/notes/{noteId}
{
  id: string,
  bookId: string,
  chapterId: string?,
  page: number?,
  highlightId: string?,
  type: "text" | "checklist" | "question" | "idea",
  content: string,
  checklistItems: [{ text: string, checked: boolean }]?,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3.5 Bookmarks

```
/users/{uid}/bookmarks/{bookmarkId}
{
  id: string,
  bookId: string,
  chapterId: string?,
  page: number,
  label: string?,
  createdAt: timestamp
}
```

### 3.6 Quiz Results

```
/users/{uid}/quizResults/{resultId}
{
  id: string,
  quizId: string,
  bookId: string?,
  chapterId: string?,
  score: number,
  totalQuestions: number,
  correctAnswers: number,
  accuracy: number,
  timeTakenSeconds: number,
  answers: [
    {
      questionId: string,
      selectedOption: number?,
      isCorrect: boolean,
      savedToMistakeBank: boolean
    }
  ],
  completedAt: timestamp
}
```

### 3.7 Flashcard State

```
/users/{uid}/flashcardState/{setId}
{
  setId: string,
  cardStates: {
    [cardId]: {
      status: "new" | "learning" | "mastered",
      lastReviewedAt: timestamp?,
      reviewCount: number,
      gotItCount: number,
      reviewAgainCount: number
    }
  },
  lastReviewedAt: timestamp
}
```

### 3.8 Saved Books (Shelf)

```
/users/{uid}/shelf/saved
{
  bookIds: [string],
  updatedAt: timestamp
}

/users/{uid}/shelf/finished
{
  bookIds: [string],
  updatedAt: timestamp
}
```

### 3.9 Mistake Bank

```
/users/{uid}/mistakeBank/{entryId}
{
  id: string,
  questionId: string,
  quizId: string,
  bookId: string?,
  chapterId: string?,
  userAnswer: string,
  correctAnswer: string,
  explanation: string?,
  addedAt: timestamp,
  reviewedAt: timestamp?,
  resolved: boolean
}
```

### 3.10 Backup Metadata

```
/backupMetadata/{uid}
{
  latestBackup: {
    backupId: string,
    createdAt: timestamp,
    backupVersion: string,
    appVersion: string,
    schemaVersion: number,
    fileSize: number,
    checksum: string,
    deviceLabel: string,
    status: "COMPLETED" | "FAILED"
  },
  previousBackup: { ... }?,
  totalBackupCount: number
}
```

---

## 4. Local Database Schema (Flutter — Drift)

### 4.1 Cached Books

```dart
class CachedBooks extends Table {
  TextColumn get id => text()();
  TextColumn get title => text()();
  TextColumn get author => text()();
  TextColumn get description => text()();
  TextColumn get coverUrl => text()();
  IntColumn get pageCount => integer()();
  TextColumn get difficulty => text()();
  TextColumn get language => text().withDefault(const Constant('en'))();
  IntColumn get estimatedReadTime => integer()();
  RealColumn get rating => real().withDefault(const Constant(0.0))();
  TextColumn get rightsStatus => text()();
  BoolColumn get allowedDownload => boolean().withDefault(const Constant(false))();
  BoolColumn get allowedOffline => boolean().withDefault(const Constant(false))();
  BoolColumn get allowedShare => boolean().withDefault(const Constant(false))();
  TextColumn get pdfDriveId => text().nullable()();
  TextColumn get status => text()();
  IntColumn get version => integer().withDefault(const Constant(1))();
  TextColumn get categoriesJson => text().withDefault(const Constant('[]'))();
  TextColumn get subjectsJson => text().withDefault(const Constant('[]'))();
  TextColumn get tagsJson => text().withDefault(const Constant('[]'))();
  DateTimeColumn get cachedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}
```

### 4.2 Offline Entitlements

```dart
class OfflineEntitlements extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get contentId => text()();
  TextColumn get type => text()(); // BOOK_OFFLINE, PDF, STUDY_PACKAGE
  DateTimeColumn get grantedAt => dateTime()();
  DateTimeColumn get expiresAt => dateTime()();
  TextColumn get status => text()(); // ACTIVE, EXPIRED, REVOKED
  IntColumn get contentVersion => integer()();
  TextColumn get rewardTransactionId => text()();
  TextColumn get localFilePath => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
```

### 4.3 Pending Operations

```dart
class PendingOperations extends Table {
  TextColumn get id => text()();
  TextColumn get operationType => text()();
  TextColumn get entityId => text()();
  TextColumn get dataJson => text()();
  DateTimeColumn get createdAt => dateTime()();
  TextColumn get syncStatus => text().withDefault(const Constant('PENDING'))();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get lastAttemptAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
```

### 4.4 Local Reading Progress

```dart
class LocalReadingProgress extends Table {
  TextColumn get bookId => text()();
  IntColumn get currentPage => integer()();
  IntColumn get totalPages => integer()();
  RealColumn get progressPercent => real()();
  TextColumn get currentChapterId => text().nullable()();
  IntColumn get totalReadTimeSeconds => integer().withDefault(const Constant(0))();
  DateTimeColumn get lastReadAt => dateTime()();
  BoolColumn get isCompleted => boolean().withDefault(const Constant(false))();
  TextColumn get syncStatus => text().withDefault(const Constant('PENDING'))();

  @override
  Set<Column> get primaryKey => {bookId};
}
```

### 4.5 Local Highlights, Notes, Bookmarks

```dart
class LocalHighlights extends Table {
  TextColumn get id => text()();
  TextColumn get bookId => text()();
  TextColumn get chapterId => text().nullable()();
  IntColumn get page => integer()();
  TextColumn get selectedText => text()();
  TextColumn get category => text()();
  TextColumn get noteId => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  TextColumn get syncStatus => text().withDefault(const Constant('PENDING'))();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalNotes extends Table {
  TextColumn get id => text()();
  TextColumn get bookId => text()();
  TextColumn get chapterId => text().nullable()();
  IntColumn get page => integer().nullable()();
  TextColumn get highlightId => text().nullable()();
  TextColumn get type => text()();
  TextColumn get content => text()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  TextColumn get syncStatus => text().withDefault(const Constant('PENDING'))();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalBookmarks extends Table {
  TextColumn get id => text()();
  TextColumn get bookId => text()();
  TextColumn get chapterId => text().nullable()();
  IntColumn get page => integer()();
  TextColumn get label => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  TextColumn get syncStatus => text().withDefault(const Constant('PENDING'))();

  @override
  Set<Column> get primaryKey => {id};
}
```

### 4.6 Search History

```dart
class SearchHistory extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get query => text()();
  DateTimeColumn get searchedAt => dateTime()();
}
```

---

## 5. Data Relationships

```
┌──────────┐    ┌──────────────┐    ┌──────────┐
│  Books   │───<│ Book_Categories│>───│Categories│
│          │    └──────────────┘    └──────────┘
│          │    ┌──────────────┐    ┌──────────┐
│          │───<│ Book_Subjects │>───│ Subjects │
│          │    └──────────────┘    └──────────┘
│          │
│          │───<│ Chapters │───<│ Questions │───<│ Question_Options │
│          │    └──────────┘    └───────────┘    └──────────────────┘
│          │                         │
│          │                    ┌────┴────┐
│          │                    │Quiz_Qs  │
│          │                    └────┬────┘
│          │                         │
│          │───<│ Quizzes │──────────┘
│          │    └─────────┘
│          │
│          │───<│ Flashcard_Sets │───<│ Flashcards │
│          │    └────────────────┘    └────────────┘
│          │
│          │───<│ Videos │
└──────────┘    └────────┘

┌──────────┐
│  Users   │───<│ Progress │
│ (Firestore)│───<│ Highlights │
│          │───<│ Notes │
│          │───<│ Bookmarks │
│          │───<│ Quiz Results │
│          │───<│ Flashcard State │
│          │───<│ Mistake Bank │
│          │───<│ Shelf (saved/finished) │
│          │───<│ Backup Metadata │
└──────────┘
```

---

## 6. Data Migration & Versioning

### 6.1 D1 Migration Strategy

```
migrations/
├── 001_initial_schema.sql
├── 002_add_exam_tags.sql
├── 003_add_fts_tables.sql
├── 004_add_notifications.sql
└── ...
```

Each migration is versioned and applied sequentially. Cloudflare D1 migrations are managed via Wrangler CLI.

### 6.2 Drift Migration (Flutter)

```dart
@DriftDatabase(tables: [CachedBooks, OfflineEntitlements, PendingOperations, ...])
class AppDatabase extends _$AppDatabase {
  @override
  int get schemaVersion => 3;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    onUpgrade: (m, from, to) async {
      if (from < 2) {
        await m.addColumn(cachedBooks, cachedBooks.examTagsJson);
      }
      if (from < 3) {
        await m.createTable(localBookmarks);
      }
    },
  );
}
```

### 6.3 Backup Schema Versioning

Backup files carry a `schemaVersion` field. Restore validates compatibility:
- Same version → restore directly
- Older version → migrate up during restore
- Newer version → reject with "Update app" message

---

## 7. Data Integrity Rules

| Rule | Enforcement |
|---|---|
| Referential integrity | Foreign keys with CASCADE/SET NULL |
| Required fields | NOT NULL constraints |
| Valid enums | CHECK constraints |
| Rights validation | Custom constraint on books table |
| Unique constraints | On emails, transaction IDs, chapter numbers |
| Soft deletes | Status field (ARCHIVED) instead of hard delete for books |
| Audit trail | All admin mutations logged |
| Idempotency | Transaction IDs prevent duplicate reward grants |

---

*This document defines the complete data model. For API that operates on this data, see [06 Backend & API](./06_Backend_API_Requirements.md). For security rules, see [08 Authentication & Security](./08_Authentication_Security.md).*
