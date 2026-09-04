# TF Study Shelf — Backend & API Requirements

**Document:** 06 — Backend & API Requirements  
**Version:** 1.0  
**Date:** September 2, 2026  
**Applies to:** [SHARED] Web Platform + Mobile App  

---

## 1. Architecture Overview

### 1.1 Backend Stack

| Component | Technology | Purpose |
|---|---|---|
| API Layer | Cloudflare Workers | Serverless API endpoints |
| Database | Cloudflare D1 | Primary data storage (SQLite) |
| File Storage | Google Drive API | PDFs, covers, content assets |
| Video Hosting | YouTube Data API | Video content |
| Auth | Firebase Auth | User authentication |
| User Data Sync | Firebase Firestore | User progress, highlights, notes, bookmarks |
| Backup Storage | Firebase Cloud Storage | Encrypted backup files |
| Push | Firebase Cloud Messaging | Push notifications |
| Analytics | Firebase Analytics | Usage tracking |
| Crash Reports | Firebase Crashlytics | Error tracking |
| Config | Firebase Remote Config | Feature flags, dynamic settings |
| Ad Verification | AdMob SSV | Server-side reward verification |

### 1.2 Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                     CLIENTS                           │
│  ┌─────────────┐              ┌─────────────────┐    │
│  │ Flutter App  │              │  Web Frontend   │    │
│  │ (Android)    │              │  (Cloudflare    │    │
│  │              │              │   Pages)        │    │
│  └──────┬───────┘              └───────┬─────────┘    │
└─────────┼──────────────────────────────┼──────────────┘
          │                              │
          ▼                              ▼
┌──────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKERS (API)                  │
│                                                        │
│  /api/books       /api/search       /api/categories    │
│  /api/chapters    /api/questions    /api/subjects       │
│  /api/quizzes     /api/flashcards  /api/pdf/:id        │
│  /api/config      /api/admin/*     /api/ssv/verify     │
│  /api/user/*      /api/backup      /api/notifications  │
│                                                        │
├──────────────────────────────────────────────────────┤
│                   DATA LAYER                           │
│                                                        │
│  ┌─────────┐  ┌───────────┐  ┌──────────────────┐    │
│  │   D1    │  │ Google    │  │   YouTube        │    │
│  │Database │  │ Drive API │  │   Data API       │    │
│  └─────────┘  └───────────┘  └──────────────────┘    │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │              FIREBASE SERVICES                   │  │
│  │  Auth │ Firestore │ Storage │ FCM │ Analytics   │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## 2. API Design

### 2.1 API Standards

| Standard | Value |
|---|---|
| Protocol | HTTPS only |
| Format | JSON (request/response) |
| Authentication | Bearer token (Firebase Auth JWT) |
| Versioning | URL-based: `/api/v1/...` |
| Pagination | Cursor-based or offset (`?page=1&limit=20`) |
| Rate Limiting | Per-endpoint, per-user |
| Error Format | Consistent error response schema |
| CORS | Configured for allowed origins |

### 2.2 Request/Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 342,
    "hasMore": true
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "BOOK_NOT_FOUND",
    "message": "The requested book was not found.",
    "status": 404
  }
}
```

### 2.3 Authentication

**Public Endpoints (no auth required):**
- `GET /api/v1/books` — List books
- `GET /api/v1/books/:id` — Book detail
- `GET /api/v1/categories` — Categories
- `GET /api/v1/subjects` — Subjects
- `GET /api/v1/search` — Search
- `GET /api/v1/config` — App configuration

**Authenticated Endpoints (Firebase JWT required):**
- `POST /api/v1/user/*` — User data operations
- `POST /api/v1/backup` — Backup operations
- `GET /api/v1/user/profile` — User profile

**Admin Endpoints (Admin role JWT required):**
- `POST /api/v1/admin/*` — All admin operations
- `PUT /api/v1/admin/*` — Update operations
- `DELETE /api/v1/admin/*` — Delete operations

---

## 3. API Endpoint Specification

### 3.1 Books API

**GET `/api/v1/books`** — List books (paginated)

| Parameter | Type | Required | Description |
|---|---|---|---|
| `page` | Integer | No | Page number (default: 1) |
| `limit` | Integer | No | Items per page (default: 20, max: 50) |
| `category` | String | No | Filter by category ID |
| `subject` | String | No | Filter by subject ID |
| `difficulty` | Enum | No | EASY / MEDIUM / HARD |
| `language` | String | No | Filter by language code |
| `sort` | Enum | No | popular / recent / title / rating |
| `status` | Enum | No | PUBLISHED (default for public) |
| `featured` | Boolean | No | Only featured books |
| `examTag` | String | No | Filter by exam tag (JEE, NEET, etc.) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "book_abc123",
      "title": "Physics Class 12",
      "author": "HC Verma",
      "description": "...",
      "coverImageUrl": "https://...",
      "language": "en",
      "pageCount": 320,
      "difficulty": "MEDIUM",
      "estimatedReadTimeMinutes": 480,
      "categoryIds": ["cat_science"],
      "subjectIds": ["sub_physics"],
      "rightsStatus": "AUTHORIZED",
      "allowedDownload": true,
      "allowedOffline": true,
      "allowedShare": false,
      "rating": 4.8,
      "status": "PUBLISHED",
      "version": 2,
      "tags": ["physics", "class12", "board"],
      "examTags": ["CBSE", "JEE"],
      "createdAt": "2026-08-15T10:30:00Z",
      "updatedAt": "2026-09-01T14:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 342, "hasMore": true }
}
```

**GET `/api/v1/books/:id`** — Book detail (includes chapters list)

**GET `/api/v1/books/:id/chapters`** — All chapters for a book

**GET `/api/v1/books/:id/chapters/:chapterId`** — Single chapter with content

**GET `/api/v1/books/:id/questions`** — Questions for a book

| Parameter | Type | Description |
|---|---|---|
| `chapterId` | String | Filter by chapter |
| `type` | Enum | MCQ / SHORT / LONG / TRUE_FALSE / FILL_BLANK |
| `difficulty` | Enum | EASY / MEDIUM / HARD |
| `page` | Integer | Pagination |
| `limit` | Integer | Items per page |

**GET `/api/v1/books/:id/quizzes`** — Available quizzes for a book

**GET `/api/v1/books/:id/flashcards`** — Flashcard sets for a book

### 3.2 PDF API

**GET `/api/v1/pdf/:fileId`** — Stream PDF from Google Drive

| Header | Value |
|---|---|
| `Authorization` | Bearer token (for authenticated access) |
| `Content-Type` | `application/pdf` (response) |
| `Content-Disposition` | `inline` (for viewing, not download) |

**Flow:**
1. Worker receives request with `fileId`
2. Worker authenticates with Google Drive API (service account)
3. Worker streams PDF bytes to client
4. Worker adds caching headers for Cloudflare edge

### 3.3 Search API

**GET `/api/v1/search`** — Cross-content search

| Parameter | Type | Required | Description |
|---|---|---|---|
| `q` | String | ✅ | Search query (min 2 chars) |
| `type` | Enum | No | books / pdfs / questions / chapters / all (default) |
| `limit` | Integer | No | Results per type (default: 10) |

**Response:**
```json
{
  "success": true,
  "data": {
    "books": [{ "id": "...", "title": "...", "author": "..." }],
    "pdfs": [{ "id": "...", "title": "..." }],
    "questions": [{ "id": "...", "text": "...", "bookTitle": "..." }],
    "chapters": [{ "id": "...", "title": "...", "bookTitle": "..." }]
  },
  "meta": { "totalResults": 21, "query": "photosynthesis" }
}
```

### 3.4 Categories & Subjects API

**GET `/api/v1/categories`** — All categories  
**GET `/api/v1/subjects`** — All subjects  
**GET `/api/v1/study-packs`** — All study packs  
**GET `/api/v1/collections`** — All content collections

### 3.5 User Data API (Authenticated)

**POST `/api/v1/user/progress`** — Sync reading progress

```json
{
  "bookId": "book_abc123",
  "currentPage": 48,
  "totalPages": 320,
  "progressPercent": 15.0,
  "currentChapterId": "ch_003",
  "totalReadTimeSeconds": 3600,
  "lastReadAt": "2026-09-02T08:30:00Z"
}
```

**POST `/api/v1/user/highlights`** — Create/sync highlight  
**POST `/api/v1/user/notes`** — Create/sync note  
**POST `/api/v1/user/bookmarks`** — Create/sync bookmark  
**POST `/api/v1/user/quiz-results`** — Submit quiz result  
**POST `/api/v1/user/sync`** — Batch sync pending operations  

**GET `/api/v1/user/shelf`** — Get user's saved books, progress, etc.  
**GET `/api/v1/user/stats`** — Get user statistics

### 3.6 Backup API (Authenticated)

**POST `/api/v1/backup/create`** — Initiate backup upload

```json
{
  "backupVersion": "1.0",
  "appVersion": "1.2.0",
  "schemaVersion": 3,
  "fileSize": 524288,
  "checksum": "sha256:abc123...",
  "deviceLabel": "Samsung Galaxy S21"
}
```

**GET `/api/v1/backup/list`** — List user's backups  
**GET `/api/v1/backup/:id/download`** — Download backup file  
**DELETE `/api/v1/backup/:id`** — Delete a backup

### 3.7 Configuration API

**GET `/api/v1/config`** — App/web configuration

```json
{
  "success": true,
  "data": {
    "adConfig": {
      "bannerEnabled": true,
      "interstitialEnabled": true,
      "rewardedEnabled": true,
      "interstitialThresholdMin": 15,
      "interstitialThresholdMax": 25,
      "bannerAdId": "ca-app-pub-xxxxx/banner",
      "interstitialAdId": "ca-app-pub-xxxxx/interstitial",
      "rewardedAdIds": {
        "offlineReading": "ca-app-pub-xxxxx/reward_offline",
        "pdfDownload": "ca-app-pub-xxxxx/reward_pdf",
        "offlineStudy": "ca-app-pub-xxxxx/reward_study",
        "backup": "ca-app-pub-xxxxx/reward_backup",
        "restore": "ca-app-pub-xxxxx/reward_restore"
      }
    },
    "featureFlags": {
      "aiAssistantEnabled": false,
      "ttsEnabled": true,
      "communityCommentsEnabled": false,
      "flashcardsEnabled": true
    },
    "contentConfig": {
      "maxPdfSizeMB": 100,
      "offlineAccessDurationHours": 24,
      "maxBackupCount": 2
    },
    "appVersion": {
      "latestVersion": "1.2.0",
      "minSupportedVersion": "1.0.0",
      "updateRequired": false
    }
  }
}
```

### 3.8 SSV Verification API

**POST `/api/v1/ssv/verify`** — AdMob Server-Side Verification callback

Receives AdMob SSV callback with signed parameters:
```
ad_network, ad_unit, reward_amount, reward_item,
signature, key_id, timestamp, transaction_id,
user_id, custom_data
```

**Process:**
1. Verify `signature` against AdMob's ECDSA public keys
2. Parse `custom_data` (userId + contentId + entitlementType)
3. Check idempotency (transaction_id not already processed)
4. Grant/finalize entitlement
5. Log transaction

### 3.9 Admin API (Admin JWT Required)

**Content Management:**
- `POST /api/v1/admin/books` — Create book
- `PUT /api/v1/admin/books/:id` — Update book
- `DELETE /api/v1/admin/books/:id` — Delete book
- `POST /api/v1/admin/books/:id/publish` — Publish
- `POST /api/v1/admin/books/:id/unpublish` — Unpublish
- `POST /api/v1/admin/books/:id/emergency-unpublish` — Emergency unpublish

**Chapter & Study Content:**
- `POST /api/v1/admin/chapters` — Create chapter
- `PUT /api/v1/admin/chapters/:id` — Update chapter
- `POST /api/v1/admin/questions` — Create question
- `POST /api/v1/admin/questions/bulk` — Bulk import questions
- `POST /api/v1/admin/quizzes` — Create quiz
- `POST /api/v1/admin/flashcards` — Create flashcard set

**User Management:**
- `GET /api/v1/admin/users` — List users
- `GET /api/v1/admin/users/:id` — User detail
- `POST /api/v1/admin/users/:id/reset-password` — Send reset email
- `POST /api/v1/admin/users/:id/set-password` — Set new password
- `POST /api/v1/admin/users/:id/ban` — Ban user
- `DELETE /api/v1/admin/users/:id` — Delete user

**Ad Configuration:**
- `GET /api/v1/admin/ads` — List ad units
- `POST /api/v1/admin/ads` — Create ad unit config
- `PUT /api/v1/admin/ads/:id` — Update ad unit config
- `DELETE /api/v1/admin/ads/:id` — Delete ad unit config

**Categories & Organization:**
- `POST /api/v1/admin/categories` — Create category
- `POST /api/v1/admin/subjects` — Create subject
- `POST /api/v1/admin/study-packs` — Create study pack
- `POST /api/v1/admin/collections` — Create collection

**Notifications:**
- `POST /api/v1/admin/notifications/send` — Send push notification
- `POST /api/v1/admin/notifications/schedule` — Schedule notification

**Analytics:**
- `GET /api/v1/admin/analytics/overview` — Dashboard metrics
- `GET /api/v1/admin/analytics/content` — Content analytics
- `GET /api/v1/admin/analytics/users` — User analytics
- `GET /api/v1/admin/analytics/revenue` — Revenue analytics
- `GET /api/v1/admin/analytics/export` — Export report (CSV/PDF/JSON)

---

## 4. Google Drive API Integration

### 4.1 Authentication

- Service account authentication (not user OAuth for file access)
- Service account key stored as Cloudflare Worker secret
- Service account granted access to shared Drive folder

### 4.2 API Operations

| Operation | API Call | Usage |
|---|---|---|
| Upload PDF | `files.create` | Admin uploads new PDF |
| List files | `files.list` | Admin browses Drive content |
| Get file | `files.get` + `alt=media` | Stream PDF to client |
| Delete file | `files.delete` | Remove content |
| Get metadata | `files.get` | File info, size, modified date |
| Storage quota | `about.get` | Monitor storage usage |

### 4.3 Caching Strategy

| Content | Cache | TTL |
|---|---|---|
| PDF metadata | Cloudflare KV | 1 hour |
| PDF file (first page) | Edge cache | 24 hours |
| Full PDF | Streaming (not cached whole) | — |
| Cover images | Edge cache | 7 days |

---

## 5. YouTube Data API Integration

### 5.1 API Operations

| Operation | API Call | Quota Cost |
|---|---|---|
| Get video details | `videos.list` | 1 unit |
| Search videos | `search.list` | 100 units |
| Upload video | `videos.insert` | 1600 units |
| Check availability | `videos.list` (status check) | 1 unit |

### 5.2 Quota Management

Daily quota: 10,000 units

| Strategy | Implementation |
|---|---|
| Cache video metadata | KV cache, refresh every 24h |
| Batch requests | Combine video ID lookups |
| Minimize search | Admin uses direct video URLs when possible |
| Monitor usage | Dashboard alert at 80% quota |

---

## 6. Firebase Integration

### 6.1 Firebase Auth

**Setup:**
- Email/password provider enabled
- Email verification enabled (optional)
- Password reset configured
- Admin SDK for server-side user management

### 6.2 Firebase Firestore

**Collections:**

| Collection | Documents | Purpose |
|---|---|---|
| `users/{uid}` | User profile, preferences | User data |
| `users/{uid}/progress` | Reading progress per book | Sync |
| `users/{uid}/highlights` | All highlights | Sync |
| `users/{uid}/notes` | All notes | Sync |
| `users/{uid}/bookmarks` | All bookmarks | Sync |
| `users/{uid}/quizResults` | Quiz attempt history | Sync |
| `users/{uid}/flashcardState` | Flashcard review state | Sync |
| `backupMetadata/{uid}` | Backup info (not the file) | Backup tracking |

**Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /backupMetadata/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6.3 Firebase Cloud Storage

**Structure:**
```
backups/
  {uid}/
    backup_latest.tfsbackup
    backup_previous.tfsbackup
```

**Security Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /backups/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 7. Rate Limiting

| Endpoint Category | Limit | Window |
|---|---|---|
| Public read APIs | 60 requests | Per minute per IP |
| Authenticated APIs | 120 requests | Per minute per user |
| Search | 30 requests | Per minute per user |
| Admin APIs | 300 requests | Per minute per admin |
| SSV callback | No limit | AdMob-initiated |
| PDF streaming | 10 requests | Per minute per user |
| Backup operations | 5 requests | Per hour per user |

---

## 8. Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `AUTH_REQUIRED` | 401 | Authentication token missing or invalid |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `DRIVE_ERROR` | 502 | Google Drive API error |
| `YOUTUBE_ERROR` | 502 | YouTube API error |
| `QUOTA_EXCEEDED` | 503 | API quota exceeded |
| `CONTENT_UNAVAILABLE` | 410 | Content has been removed |
| `ENTITLEMENT_EXPIRED` | 403 | Offline entitlement has expired |
| `RIGHTS_RESTRICTED` | 403 | Content rights don't allow this action |
| `BACKUP_INVALID` | 422 | Backup file is corrupted or incompatible |

---

## 9. Security Considerations

| Concern | Mitigation |
|---|---|
| SQL Injection | Parameterized queries in D1 |
| XSS | Input sanitization, Content-Security-Policy headers |
| CSRF | SameSite cookies, origin validation |
| API Key exposure | Keys in Cloudflare Worker secrets, never client-side |
| Firebase secrets | Admin SDK credentials in Worker secrets only |
| Drive access | Service account with minimal scopes |
| Data validation | Server-side validation on all inputs |
| CORS | Strict origin allowlist |
| Rate limiting | Per-endpoint limits |
| Audit logging | All admin actions logged with timestamp and user |

---

*This document defines the complete backend and API requirements. For database schemas, see [07 Database & Data Model](./07_Database_Data_Model.md). For security details, see [08 Authentication & Security](./08_Authentication_Security.md).*
