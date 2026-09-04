# TF Study Shelf — Web Platform PRD

**Document:** 02 — Web Platform PRD  
**Version:** 1.0  
**Date:** September 2, 2026  
**Applies to:** [WEB] Web Platform  
**Technology:** Cloudflare Pages/Workers, D1 Database, HTML/CSS/JavaScript  
**Hosting:** Cloudflare (Always-Free Tier)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Architecture](#2-platform-architecture)
3. [Admin Panel — Complete Specification](#3-admin-panel--complete-specification)
4. [User-Facing Web — Content Consumption](#4-user-facing-web--content-consumption)
5. [Content Management System (CMS)](#5-content-management-system-cms)
6. [Google Drive Integration](#6-google-drive-integration)
7. [YouTube Integration](#7-youtube-integration)
8. [Ad Management System](#8-ad-management-system)
9. [User Management](#9-user-management)
10. [Analytics & Reporting Dashboard](#10-analytics--reporting-dashboard)
11. [Search, Filtering & Categorization](#11-search-filtering--categorization)
12. [Notifications Management](#12-notifications-management)
13. [SEO Requirements](#13-seo-requirements)
14. [Responsive Design Requirements](#14-responsive-design-requirements)
15. [Performance & Scalability](#15-performance--scalability)
16. [Error Handling & Edge Cases](#16-error-handling--edge-cases)
17. [Deployment & Production](#17-deployment--production)
18. [Acceptance Criteria](#18-acceptance-criteria)

---

## 1. Executive Summary

TF Study Shelf Web is the cloud-hosted web version of the completely free, ad-supported digital library and study companion. It serves two distinct purposes:

1. **Admin Panel (Primary):** A comprehensive content management system where admins can manage every aspect of the product from A to Z — all content, users, ad units, configurations, and analytics.
2. **User-Facing Web (Secondary):** Web-based access to content consumption features for end users.

### 1.1 Key Requirements from Stakeholder

| Requirement | Implementation |
|---|---|
| Hosted on Cloudflare | Cloudflare Pages + Workers (free tier) |
| PDFs uploaded to Google Drive | Google Drive API integration from admin panel |
| Videos uploaded to YouTube | YouTube Data API integration |
| Text/data in Cloudflare databases | Cloudflare D1 (serverless SQL) |
| Always free tech stacks | Cloudflare free tier, Google APIs free quotas |
| Admin manages everything A-to-Z | Comprehensive admin panel with full control |
| Ad units managed from admin panel | Complete ad configuration UI |
| Admin can change user passwords | User management with password reset capability |

→ See [01 Shared Requirements](./01_Shared_Product_Business_Requirements.md) for product identity and business model.

---

## 2. Platform Architecture

### 2.1 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | HTML5 + CSS3 + Vanilla JavaScript | Maximum compatibility, zero framework cost, always free |
| **Hosting** | Cloudflare Pages | Free tier, global CDN, edge deployment |
| **API/Backend** | Cloudflare Workers | Serverless compute, free tier (100K requests/day) |
| **Database** | Cloudflare D1 | Serverless SQLite, free tier (5M reads/day, 100K writes/day) |
| **File Storage** | Google Drive API | Free storage for PDFs and content files |
| **Video Hosting** | YouTube (via YouTube Data API) | Free video hosting and streaming |
| **Authentication** | Firebase Auth (Email + Password) | Free tier covers requirements |
| **Analytics** | Firebase Analytics + Cloudflare Analytics | Both free tier |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Free tier |

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    CLOUDFLARE PAGES                       │
│              (Static HTML/CSS/JS Frontend)                │
├─────────────────────────────────────────────────────────┤
│                    CLOUDFLARE WORKERS                     │
│                (API Layer / Backend Logic)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Auth API │  │Content   │  │ Ad Mgmt  │  │ Analytics│ │
│  │          │  │Management│  │   API    │  │   API    │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
├───────┴──────────────┴────────────┴──────────────┴──────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Cloudflare│  │ Google   │  │ YouTube  │               │
│  │    D1     │  │  Drive   │  │   API    │               │
│  │ (Database)│  │  (Files) │  │ (Videos) │               │
│  └──────────┘  └──────────┘  └──────────┘               │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Firebase  │  │ Firebase │  │ Firebase │               │
│  │   Auth   │  │ Firestore│  │   FCM    │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Free Tier Limits & Monitoring

| Service | Free Tier Limit | Monitoring Action |
|---|---|---|
| Cloudflare Pages | Unlimited sites, 500 builds/month | Monitor build count |
| Cloudflare Workers | 100K requests/day | Dashboard alert at 80% |
| Cloudflare D1 | 5M reads/day, 100K writes/day, 5GB storage | Dashboard alerts |
| Google Drive | 15GB storage per account | Storage usage indicator in admin |
| YouTube API | 10,000 quota units/day | Quota monitoring in admin |
| Firebase Auth | 10K verifications/month (free) | Monitor auth volume |
| Firebase Firestore | 50K reads, 20K writes, 20K deletes/day | Usage dashboard |

---

## 3. Admin Panel — Complete Specification

### 3.1 Admin Authentication

**Feature Name:** Admin Login  
**Objective:** Secure access to the admin panel with role-based permissions.  
**User Story:** As an admin, I want to securely log into the admin panel so that I can manage all content and settings.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| ADM-AUTH-01 | Admin login via email + password (Firebase Auth) |
| ADM-AUTH-02 | Admin accounts created by super-admin only |
| ADM-AUTH-03 | Role-based access: Super Admin, Content Manager, Moderator |
| ADM-AUTH-04 | Session timeout after 30 minutes of inactivity |
| ADM-AUTH-05 | Secure password reset via Firebase email reset |
| ADM-AUTH-06 | Login attempt rate limiting (max 5 attempts per 15 minutes) |
| ADM-AUTH-07 | Audit log of all admin login/logout events |

**Role Definitions:**

| Role | Capabilities |
|---|---|
| **Super Admin** | Full access: content, users, ads, settings, other admin accounts |
| **Content Manager** | Content CRUD, publish/unpublish, Q&A management, no user management |
| **Moderator** | Content review, report handling, no publish/delete |

**Error States:**
- Invalid credentials → "Invalid email or password. Please try again."
- Account locked → "Account temporarily locked. Try again in 15 minutes."
- Network error → "Unable to connect. Check your internet connection."
- Session expired → Redirect to login with "Session expired. Please sign in again."

### 3.2 Admin Dashboard

**Feature Name:** Admin Dashboard  
**Objective:** Provide a real-time overview of the entire platform at a glance.  
**User Story:** As an admin, I want a dashboard showing key metrics so that I can monitor platform health and activity.

**Dashboard Sections:**

```
┌─────────────────────────────────────────────────┐
│  TF Study Shelf — Admin Dashboard                │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │Books │  │PDFs  │  │Users │  │Videos│        │
│  │ 342  │  │ 156  │  │12.4K │  │  89  │        │
│  └──────┘  └──────┘  └──────┘  └──────┘        │
│                                                  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │Q&As  │  │Quizzes│  │Active│  │Revenue│       │
│  │2,340 │  │  678  │  │Users │  │ Today │       │
│  │      │  │       │  │ 845  │  │₹1,240│       │
│  └──────┘  └──────┘  └──────┘  └──────┘        │
│                                                  │
│  Recent Activity                                 │
│  ─────────────                                   │
│  • New book "Physics Class 12" published         │
│  • 23 new user registrations today               │
│  • PDF "Chemistry Notes" downloaded 145 times    │
│  • Quiz "Math Chapter 5" completed by 67 users   │
│                                                  │
│  Quick Actions                                   │
│  ─────────────                                   │
│  [ Upload Book ]  [ Add PDF ]  [ Create Quiz ]   │
│  [ Manage Users ] [ Ad Config ] [ View Reports ] │
└─────────────────────────────────────────────────┘
```

**Functional Requirements:**

| ID | Requirement |
|---|---|
| ADM-DASH-01 | Real-time metrics cards: total books, PDFs, users, videos, Q&As, quizzes |
| ADM-DASH-02 | Active users count (last 24h, 7d, 30d) |
| ADM-DASH-03 | Revenue summary (today, week, month) |
| ADM-DASH-04 | Recent activity feed (last 50 actions) |
| ADM-DASH-05 | Quick action buttons for common tasks |
| ADM-DASH-06 | System health indicators (API status, storage usage, quota remaining) |
| ADM-DASH-07 | Content moderation alerts (pending reviews, reports) |
| ADM-DASH-08 | Charts: user growth (7d/30d/90d), content views, ad revenue trend |

### 3.3 Admin Navigation

**Top Navigation — 7 sections:**

| Tab | Content |
|---|---|
| **Dashboard** | Overview, analytics, recent activity, quick actions |
| **Content** | Books, PDFs, Videos, Chapters, Q&A, Quizzes, Flashcards, Summaries |
| **Users** | User list, stats, password management, account actions |
| **Categories** | Subjects, categories, study packs, collections, learning paths |
| **Ads** | Ad unit configuration, placement management, performance, SSV settings |
| **Notifications** | Push notification management, scheduled notifications, templates |
| **Settings** | App configuration, feature flags, API keys, system settings |

---

## 4. User-Facing Web — Content Consumption

### 4.1 Home Page

**Feature Name:** User Home Page  
**Objective:** Provide engaging content discovery for web users.  
**User Story:** As a user, I want to browse and discover books/PDFs on the web so that I can start reading without installing the app.

**Sections:**
1. **Hero Banner** — Featured books/content (admin-configurable)
2. **Continue Reading** — Large horizontal progress cards (signed-in users)
3. **Browse Categories** — Horizontal category rail: Books · PDFs · Subjects · Questions · Study Packs
4. **Recommended for You** — Personalized using reading history (signed-in users)
5. **Recently Added** — Latest content
6. **Popular This Week** — Trending content
7. **Study Today** — "Your Study Plan" card

**Greeting Logic:**
- 5:00 AM – 11:59 AM → "Good morning 👋"
- 12:00 PM – 4:59 PM → "Good afternoon 👋"
- 5:00 PM – 8:59 PM → "Good evening 👋"
- 9:00 PM – 4:59 AM → "Good night 👋"

### 4.2 Explore Page

**Feature Name:** Content Exploration  
**Objective:** Enable users to browse the full content catalog with filtering and sorting.

**Sections:** Books, PDFs, Subjects, Questions, Study Packs, Popular, Recently Added, Recommended.

**Filtering Options:**
- By Subject/Category
- By Difficulty (Easy / Medium / Hard)
- By Language
- By Content Type (Book / PDF / Study Pack)
- By Author

**Sorting Options:**
- Most Popular
- Recently Added
- Title (A-Z / Z-A)
- Rating
- Reading Time

### 4.3 Book Detail Page

**Feature Name:** Book Details  
**Objective:** Display comprehensive book information with all available actions.

**Displayed Information:**
- Cover image, title, author, description
- Categories, difficulty, language
- Estimated reading time, page count, rating
- Content rights badge (Public Domain / Open License / Authorized)

**Primary Actions:**
- `[ Read Now ]` → Open web reader
- `[ Save to Shelf ]` → Add to personal shelf
- `[ Download PDF ]` → Ad-gated PDF download (if `allowedDownload = true`)
- `[ Questions ]` → View Q&A
- `[ Summary ]` → View summary

**"Learn from this Book" Section:**
```
Chapter 1: Introduction
  • Summary
  • Questions & Answers (24 questions)
  • Key Concepts (8 concepts)
  • Important Quotes (5 quotes)
  • Flashcards (12 cards)
  • Quiz (10 questions)

Chapter 2: Fundamentals
  • Summary
  • Questions & Answers (18 questions)
  ...
```

### 4.4 Web Reader

**Feature Name:** In-Browser Reader  
**Objective:** Provide a premium reading experience within the browser.

**Text Controls:**
- Font size slider (Small → Huge)
- Font family: Manrope
- Line spacing, paragraph spacing, margins, text alignment

**Page Controls:**
- Page mode vs. scroll mode
- Page width adjustment
- Full-screen reading mode

**Appearance:**
- Light / Dark / Dim / System

**Reading Features:**
- Progress indicator (percentage + page number)
- Chapter navigation sidebar
- In-book search
- Table of contents

**Interaction:**
- Click left edge → Previous page
- Click right edge → Next page
- Click center → Toggle reader controls
- Text selection → Highlight / Note / Copy / Share / Ask toolbar

### 4.5 In-Browser PDF Reader

**Feature Name:** Web PDF Viewer  
**Objective:** View PDFs within the browser without external apps or downloads.

**Features:**
- Zoom controls (fit-width, fit-page, custom zoom)
- Page thumbnails sidebar
- Page number display with jump-to-page
- In-document search
- Table of contents navigation
- Bookmarks
- Text selection (where PDF supports it)
- Dark reading mode (where feasible)
- Rotation (portrait/landscape)
- Reading progress tracking

**Security:**
- PDFs never exposed via public Google Drive URLs
- Workers fetch PDFs via authenticated Google Drive API
- Download permission controlled by content rights metadata
- Right-click save disabled where feasible (defense in depth)

### 4.6 Study Tools (Web)

**Feature Name:** Web-Based Study Tools  
**Objective:** Provide study functionality on the web platform.

**Q&A System:**
- Browse questions by book/chapter
- View answers with explanations
- Filter by type (MCQ, Short Answer, etc.) and difficulty

**Quiz Engine:**
- Timed/untimed quizzes
- Chapter-specific or subject-specific
- Instant explanations
- Score display with review

**Flashcards:**
- Card-based interface (flip interaction)
- Got it / Review Again actions

### 4.7 User Shelf (Web)

**Feature Name:** Personal Shelf  
**Objective:** Provide users with a personal library of saved content.

**Sections:** Continue Reading, Saved Books, Highlights, Notes, Bookmarks, Finished

**Views:** Grid / List  
**Sort:** Recently opened, Recently added, Title, Author, Progress

### 4.8 User Profile & Settings (Web)

**Feature Name:** User Profile  
**Objective:** Allow users to manage their account and preferences.

**Sections:**
- Statistics (books read, pages read, quiz accuracy, study time)
- Reading settings
- Theme preference
- Notification preferences
- Account management (sign in, sign up, sign out, delete account)

---

## 5. Content Management System (CMS)

### 5.1 Book Management

**Feature Name:** Book CRUD  
**Objective:** Enable admins to create, read, update, and delete books with full metadata.

**Book Schema:**

| Field | Type | Required | Description |
|---|---|---|---|
| `bookId` | UUID | Auto | Unique identifier |
| `title` | String | ✅ | Book title |
| `author` | String | ✅ | Author name |
| `description` | Text | ✅ | Book description |
| `coverImageUrl` | URL | ✅ | Cover image (stored on Google Drive) |
| `language` | Enum | ✅ | Content language |
| `pageCount` | Integer | ✅ | Total pages |
| `difficulty` | Enum | ✅ | Easy / Medium / Hard |
| `estimatedReadTime` | Integer | ✅ | Minutes |
| `categoryIds` | Array | ✅ | Associated categories |
| `subjectIds` | Array | ✅ | Associated subjects |
| `rightsStatus` | Enum | ✅ | PUBLIC_DOMAIN / OPEN_LICENSE / AUTHORIZED / RESTRICTED |
| `licenseName` | String | Conditional | Required if rights ≠ PUBLIC_DOMAIN |
| `licenseSource` | URL | Conditional | Source of license |
| `rightsHolder` | String | Conditional | Rights owner |
| `permissionReference` | String | Conditional | Permission proof |
| `allowedDownload` | Boolean | ✅ | Can users download? |
| `allowedOffline` | Boolean | ✅ | Can users access offline? |
| `allowedShare` | Boolean | ✅ | Can users share? |
| `pdfGoogleDriveId` | String | Optional | Google Drive file ID |
| `status` | Enum | ✅ | DRAFT / REVIEW / PUBLISHED / UNPUBLISHED / ARCHIVED |
| `version` | Integer | ✅ | Content version number |
| `featuredOrder` | Integer | Optional | Position in featured section |
| `tags` | Array | Optional | Search tags |
| `examTags` | Array | Optional | JEE, NEET, UPSC, CBSE, etc. |
| `createdAt` | Timestamp | Auto | Creation time |
| `updatedAt` | Timestamp | Auto | Last update time |
| `publishedAt` | Timestamp | Auto | Publish time |
| `createdBy` | String | Auto | Admin who created |

**Admin UI — Book List:**
```
┌─────────────────────────────────────────────────┐
│  Books (342 total)                    [ + Add Book ]│
│                                                  │
│  Search: [________________]  Status: [All ▼]     │
│  Category: [All ▼]  Subject: [All ▼]             │
│                                                  │
│  ┌────┬────────────────┬──────┬────────┬───────┐ │
│  │ # │ Title          │Author│ Status │Actions│ │
│  ├────┼────────────────┼──────┼────────┼───────┤ │
│  │ 1 │ Physics XII    │ HC V.│Published│ ✏️ 👁️ 🗑️│ │
│  │ 2 │ Organic Chem   │ Morri│ Draft  │ ✏️ 👁️ 🗑️│ │
│  │ 3 │ Calculus Basics │ Stew │ Review │ ✏️ 👁️ 🗑️│ │
│  └────┴────────────────┴──────┴────────┴───────┘ │
│                                                  │
│  Showing 1-20 of 342  [ ← ] [ 1 ] [ 2 ] [ → ]  │
└─────────────────────────────────────────────────┘
```

**Admin UI — Book Editor:**
```
┌─────────────────────────────────────────────────┐
│  Add / Edit Book                                 │
│                                                  │
│  Title: [____________________________________]   │
│  Author: [___________________________________]   │
│  Description: [______________________________]   │
│                                                  │
│  Cover Image: [ Choose from Drive ] [Preview]    │
│  PDF File:    [ Upload to Drive ]   [Preview]    │
│                                                  │
│  Language: [English ▼]  Difficulty: [Medium ▼]   │
│  Pages: [___]  Est. Read Time: [___ min]         │
│                                                  │
│  Categories: [Select... ▼] [+]                   │
│  Subjects:   [Select... ▼] [+]                   │
│  Exam Tags:  [JEE] [NEET] [CBSE] [+]            │
│                                                  │
│  ── Content Rights (Required) ──                 │
│  Rights Status: [Public Domain ▼]                │
│  License Name: [____________________________]    │
│  License Source: [__________________________]    │
│  Rights Holder: [___________________________]    │
│  Permission Ref: [__________________________]    │
│  [✓] Allow Download  [✓] Allow Offline           │
│  [✓] Allow Share                                 │
│                                                  │
│  [ Save Draft ]  [ Submit for Review ]           │
│  [ Publish ]     [ Cancel ]                      │
└─────────────────────────────────────────────────┘
```

**Validation Rules:**
- Title: Required, 1-200 characters
- Author: Required, 1-100 characters
- Description: Required, 10-5000 characters
- Cover Image: Required, JPEG/PNG/WebP, max 5MB
- PDF: Optional, max 100MB per file
- Rights Status: Required, must not be RESTRICTED for published content
- Categories: At least one required
- Page count: Positive integer
- Estimated read time: Positive integer (auto-calculated if not provided)

### 5.2 Chapter Management

**Feature Name:** Chapter CRUD  
**Objective:** Manage book chapters with associated study content.

**Chapter Schema:**

| Field | Type | Required |
|---|---|---|
| `chapterId` | UUID | Auto |
| `bookId` | UUID | ✅ |
| `title` | String | ✅ |
| `chapterNumber` | Integer | ✅ |
| `summary` | Text | Optional |
| `keyConceptsCount` | Integer | Auto |
| `questionsCount` | Integer | Auto |
| `content` | Rich Text | ✅ |
| `status` | Enum | ✅ |

### 5.3 Questions & Answers Management

**Feature Name:** Q&A CRUD  
**Objective:** Manage structured questions associated with books and chapters.

**Question Schema:**

| Field | Type | Required |
|---|---|---|
| `questionId` | UUID | Auto |
| `bookId` | UUID | ✅ |
| `chapterId` | UUID | Optional |
| `questionText` | Text | ✅ |
| `questionType` | Enum | ✅ (MCQ / SHORT / LONG / TRUE_FALSE / FILL_BLANK / EXAM / CONCEPTUAL) |
| `difficulty` | Enum | ✅ (EASY / MEDIUM / HARD) |
| `answer` | Text | ✅ |
| `explanation` | Text | Optional |
| `options` | Array | Conditional (required for MCQ) |
| `correctOption` | Integer | Conditional (required for MCQ) |
| `marks` | Integer | Optional |
| `tags` | Array | Optional |
| `status` | Enum | ✅ |

**Bulk Operations:**
- Import questions from CSV/JSON
- Bulk assign to chapter
- Bulk change difficulty
- Bulk publish/unpublish

### 5.4 Quiz Management

**Feature Name:** Quiz Builder  
**Objective:** Create and manage quizzes from the question bank.

**Quiz Schema:**

| Field | Type | Required |
|---|---|---|
| `quizId` | UUID | Auto |
| `title` | String | ✅ |
| `bookId` | UUID | Optional |
| `chapterId` | UUID | Optional |
| `subjectId` | UUID | Optional |
| `questionIds` | Array | ✅ |
| `timeLimit` | Integer (seconds) | Optional |
| `randomize` | Boolean | Default: true |
| `showExplanation` | Boolean | Default: true |
| `passingScore` | Integer (%) | Default: 60 |
| `difficulty` | Enum | ✅ |
| `status` | Enum | ✅ |

### 5.5 Flashcard Management

**Feature Name:** Flashcard Sets  
**Objective:** Create and manage flashcard sets for study content.

**Flashcard Schema:**

| Field | Type | Required |
|---|---|---|
| `flashcardId` | UUID | Auto |
| `setId` | UUID | ✅ |
| `front` | Text | ✅ (Question/concept) |
| `back` | Text | ✅ (Answer/explanation) |
| `bookId` | UUID | Optional |
| `chapterId` | UUID | Optional |
| `order` | Integer | Auto |

### 5.6 Content Versioning

**Feature Name:** Content Version Control  
**Objective:** Track and manage content updates without disrupting active users.

**Business Rules:**
- Books can be updated (Version 1 → Version 2)
- Online reader always gets the latest version
- Active offline packages remain valid for their granted window
- Expired packages are simply removed
- Fresh offline unlock always fetches the latest version
- Never silently replace an active local file mid-session

### 5.7 Emergency Unpublish

**Feature Name:** Emergency Content Removal  
**Objective:** Rapidly remove content for copyright complaints, incorrect content, safety issues, or license expiration.

**Requirements:**
- One-click unpublish action (not multi-step)
- Immediately removes from all public-facing views
- Logs reason and timestamp
- Notifies relevant admins
- Does not delete content — only hides from public
- Can be re-published after issue resolution

---

## 6. Google Drive Integration

### 6.1 PDF Upload Flow

**Feature Name:** Google Drive PDF Management  
**Objective:** Store all PDF content on Google Drive with authenticated access.

**Upload Flow:**
```
Admin clicks "Upload PDF"
    ↓
Google Drive Picker opens (OAuth2 authenticated)
    ↓
Admin selects or uploads PDF file
    ↓
File stored in organized folder structure on Drive
    ↓
Google Drive File ID saved to book/PDF record
    ↓
Rights metadata assigned
    ↓
Content published/unpublished via CMS
```

**Google Drive Folder Structure:**
```
TF_Study_Shelf/
├── Books/
│   ├── Physics/
│   │   ├── physics_class12_v2.pdf
│   │   └── physics_class11_v1.pdf
│   ├── Chemistry/
│   └── Mathematics/
├── PDFs/
│   ├── Notes/
│   └── Study_Material/
├── Covers/
│   ├── book_covers/
│   └── thumbnails/
└── Assets/
    └── icons/
```

### 6.2 Access Rules

| Rule | Implementation |
|---|---|
| No public URLs | PDFs never exposed via public Google Drive URLs |
| Authenticated access | Workers fetch PDFs via authenticated Google Drive API calls |
| Download control | Download permission controlled by content rights metadata |
| Streaming | PDF content streamed through Workers proxy, not direct Drive links |
| Caching | Cloudflare edge caching for frequently accessed content |

### 6.3 Storage Monitoring

**Admin UI — Google Drive Storage:**
```
Google Drive Storage
━━━━━━━━━━━━━━━━━━━
Used: 8.3 GB / 15 GB  [████████░░░░░] 55%

Breakdown:
  PDFs:       6.1 GB (184 files)
  Covers:     0.8 GB (342 images)
  Assets:     0.4 GB
  Other:      1.0 GB

⚠️ Warning at 12 GB  |  🚨 Critical at 14 GB
```

---

## 7. YouTube Integration

### 7.1 Video Management

**Feature Name:** YouTube Video Integration  
**Objective:** Manage video content hosted on YouTube with admin panel controls.

**Video Schema:**

| Field | Type | Required |
|---|---|---|
| `videoId` | UUID | Auto |
| `youtubeVideoId` | String | ✅ |
| `title` | String | ✅ |
| `description` | Text | Optional |
| `bookId` | UUID | Optional |
| `chapterId` | UUID | Optional |
| `duration` | Integer (seconds) | Auto-fetched |
| `thumbnailUrl` | URL | Auto-fetched |
| `status` | Enum | ✅ |

### 7.2 Video Upload Workflow

```
Admin clicks "Add Video"
    ↓
Option 1: Paste YouTube URL → Auto-fetch metadata
Option 2: Upload via YouTube Data API → Get video ID
    ↓
Associate with book/chapter
    ↓
Set visibility and status
    ↓
Video appears in relevant content pages
```

### 7.3 Video Availability Monitoring

- Periodic check for video availability (deleted/private/blocked)
- Admin notification when video becomes unavailable
- Fallback message: "This video is currently unavailable"

---

## 8. Ad Management System

### 8.1 Ad Unit Configuration

**Feature Name:** Admin Ad Management  
**Objective:** Allow admin to manage all ad units, placements, and configurations from the admin panel.

**User Story:** As an admin, I want to configure all ad units from the admin panel so that I can control monetization without code changes.

**Ad Configuration Schema:**

| Field | Type | Description |
|---|---|---|
| `adUnitId` | String | AdMob/web ad unit ID |
| `adType` | Enum | BANNER / INTERSTITIAL / REWARDED |
| `platform` | Enum | WEB / APP / BOTH |
| `placement` | String | Where the ad appears |
| `isEnabled` | Boolean | Toggle on/off |
| `priority` | Integer | Display priority |
| `testMode` | Boolean | Use test ads |
| `frequency` | Object | Frequency cap settings |
| `targetAudience` | Object | Targeting settings |

**Admin UI — Ad Management:**
```
┌─────────────────────────────────────────────────┐
│  Ad Unit Management                              │
│                                                  │
│  Platform: [All ▼]  Type: [All ▼]  Status: [All ▼]│
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │ Banner - Home Page Header                     ││
│  │ ID: ca-app-pub-xxxxx/yyyyy                    ││
│  │ Platform: Web  │  Status: ✅ Active            ││
│  │ Impressions: 12,340 today                     ││
│  │ [ Edit ] [ Disable ] [ View Stats ]           ││
│  └──────────────────────────────────────────────┘│
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │ Rewarded - Offline Reading Unlock             ││
│  │ ID: ca-app-pub-xxxxx/zzzzz                    ││
│  │ Platform: App  │  Status: ✅ Active            ││
│  │ Completions: 2,456 today                      ││
│  │ [ Edit ] [ Disable ] [ View Stats ]           ││
│  └──────────────────────────────────────────────┘│
│                                                  │
│  [ + Add New Ad Unit ]                           │
└─────────────────────────────────────────────────┘
```

### 8.2 Interstitial Configuration

**Admin-configurable settings:**
- Activity threshold range (min/max before showing)
- Session cooldown (minutes)
- Minimum time between interstitials
- Qualifying activity types (checkboxes)
- Blocked contexts (during reading, during quiz, etc.)

### 8.3 Rewarded Ad Configuration

**Admin-configurable settings:**
- Ad unit IDs per reward type
- SSV callback URL
- Reward mapping (which ad unlocks what)
- Test/production mode toggle

### 8.4 Ad Performance Dashboard

**Metrics displayed:**
- Impressions per ad unit (today, 7d, 30d)
- Click-through rates
- Rewarded ad completion rates
- Revenue estimates
- Fill rates
- Error rates

→ See [09 Ads & Monetization](./09_Ads_Monetization.md) for complete ad system specification.

---

## 9. User Management

### 9.1 User List & Search

**Feature Name:** User Management Panel  
**Objective:** Enable admin to manage all user accounts, including password changes.

**User Story:** As an admin, I want to view, search, and manage all user accounts so that I can help users and maintain the platform.

**Admin UI — User List:**
```
┌─────────────────────────────────────────────────┐
│  Users (12,456 total)                            │
│                                                  │
│  Search: [________________]  Role: [All ▼]       │
│  Status: [All ▼]  Sort: [Recent ▼]              │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ user@email.com                               │ │
│  │ Joined: 15 Aug 2026 │ Last Active: Today     │ │
│  │ Books: 12 │ Notes: 45 │ Quizzes: 23          │ │
│  │ [ View Details ] [ Reset Password ] [ Ban ]  │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 9.2 User Actions

| Action | Description | Permission |
|---|---|---|
| View Details | Full user profile, activity, statistics | All admin roles |
| Reset Password | Send password reset email via Firebase | Super Admin only |
| Change Password | Directly set new password for user | Super Admin only |
| Ban/Suspend | Temporarily or permanently suspend account | Super Admin, Moderator |
| Delete Account | Permanently delete user account and data | Super Admin only |
| View Activity | See user's reading history, quiz results, etc. | All admin roles |
| Export Data | Export user data (GDPR/DPDP compliance) | Super Admin only |

### 9.3 User Detail View

**Displayed Information:**
- Email, join date, last active
- Reading statistics (books read, pages, time spent)
- Study statistics (quizzes taken, accuracy, flashcards reviewed)
- Saved content (books, highlights, notes, bookmarks)
- Offline access history
- Backup history
- Activity log
- Account status

### 9.4 Password Management

**Feature Name:** Admin Password Control  
**Objective:** Allow admin to reset or change any user's password.

**User Story:** As a super admin, I want to change a user's password so that I can help users who cannot reset their own passwords.

**Flow:**
```
Admin selects user → "Reset Password"
    ↓
Option 1: "Send Reset Email" → Firebase password reset email sent
Option 2: "Set New Password" → Admin enters new password → Firebase Admin SDK updates password
    ↓
Confirmation: "Password updated successfully"
    ↓
Audit log entry created
```

**Security Requirements:**
- Only Super Admin can change passwords
- All password changes logged in audit trail
- New passwords must meet minimum strength requirements
- User receives email notification of password change

---

## 10. Analytics & Reporting Dashboard

### 10.1 Overview Dashboard

**Feature Name:** Analytics Dashboard  
**Objective:** Provide comprehensive analytics and reporting to inform business decisions.

**Dashboard Sections:**

| Section | Metrics |
|---|---|
| **User Analytics** | DAU, MAU, new registrations, retention (D1/D7/D30), session duration |
| **Content Analytics** | Most viewed books, popular categories, search trends, content gaps |
| **Study Analytics** | Quiz completion rates, average scores, flashcard usage, Q&A views |
| **Revenue Analytics** | Ad revenue (daily/weekly/monthly), ARPDAU, rewarded ad completion |
| **Offline Analytics** | Offline unlock frequency, popular offline content, renewal rates |
| **Platform Analytics** | Device distribution, OS versions, screen sizes, network types |

### 10.2 Content Reports

- Top 50 books by views (weekly/monthly)
- Content with no views (potential cleanup candidates)
- Q&A completion rates by book
- Search queries with no results (content gap indicator)
- Download counts per PDF

### 10.3 Custom Report Builder

**Feature Name:** Custom Analytics Reports  
**Objective:** Allow admins to build custom reports with flexible filters.

**Filters Available:**
- Date range
- Content type
- Category/Subject
- User segment
- Platform (web/app)
- Geographic region

**Export Formats:** CSV, PDF, JSON

---

## 11. Search, Filtering & Categorization

### 11.1 Admin Category Management

**Feature Name:** Category & Subject Management  
**Objective:** Manage content organization taxonomy.

**Category Types:**

| Type | Examples | Admin Control |
|---|---|---|
| **Subjects** | Mathematics, Science, History, Programming | Full CRUD |
| **Categories** | School, College, Competitive Exams, Self-Development | Full CRUD |
| **Exam Tags** | JEE, NEET, UPSC, SSC, CBSE, ICSE, State Boards | Full CRUD |
| **Study Packs** | "Physics Class 12 — Complete Pack" | Create, assign content, publish |
| **Collections** | "Best Beginner Programming Books" | Editorial groupings |
| **Learning Paths** | "Learn Python: Basics → Advanced" | Sequenced curricula |

### 11.2 User-Facing Search

**Feature Name:** Cross-Content Search  
**Objective:** Enable users to find content across all types from a single search.

**Search spans:** Book title, author, subject, topic, chapter, question text, keyword.

**Example:** Searching "photosynthesis" returns matches across Books, PDFs, Questions, Chapters, and Study Material — grouped by type in one results view.

**Search Features:**
- Autocomplete suggestions
- Recent searches
- Popular searches
- Spelling correction
- Category-scoped search

**Validation Rules:**
- Minimum 2 characters for search
- Maximum 200 characters
- Special characters sanitized
- SQL injection prevention
- Rate limiting (max 30 searches/minute per user)

---

## 12. Notifications Management

### 12.1 Admin Notification Panel

**Feature Name:** Push Notification Management  
**Objective:** Allow admin to create, schedule, and manage push notifications.

**Notification Types:**

| Type | Example | Trigger |
|---|---|---|
| **New Content** | "12 new books added to Science!" | Admin manual/scheduled |
| **Reading Reminder** | "You're 12 pages from finishing this chapter" | Automated rule |
| **Quiz Reminder** | "Your saved quiz is waiting" | Automated rule |
| **Revision Reminder** | "Review your saved highlights from Chemistry" | Automated rule |
| **Announcement** | "TF Study Shelf v2.0 is here!" | Admin manual |
| **Study Goal** | "You're 70% to your daily goal!" | Automated rule |

**Admin UI — Notification Creator:**
```
┌─────────────────────────────────────────────────┐
│  Create Notification                             │
│                                                  │
│  Title: [_________________________________]      │
│  Body:  [_________________________________]      │
│                                                  │
│  Target: [All Users ▼]                           │
│    OR                                            │
│  Topic: [New Content ▼]                          │
│  User Segment: [Active Last 7 Days ▼]            │
│                                                  │
│  Schedule: [Send Now ▼]                          │
│    OR                                            │
│  Date: [__/__/____]  Time: [__:__]               │
│                                                  │
│  Deep Link: [Book/Chapter/Quiz URL]              │
│                                                  │
│  [ Preview ] [ Schedule ] [ Send Now ]           │
└─────────────────────────────────────────────────┘
```

### 12.2 Notification Settings (User-Facing)

Users can opt in/out per category (not just one global toggle):
- New content alerts
- Reading reminders
- Quiz reminders
- Revision reminders
- Study goal notifications
- Announcements

---

## 13. SEO Requirements

### 13.1 Technical SEO

| Requirement | Implementation |
|---|---|
| Unique title tags | Each page has a descriptive, unique `<title>` |
| Meta descriptions | Compelling descriptions per page |
| Heading hierarchy | Single `<h1>` per page, proper hierarchy |
| Semantic HTML | HTML5 semantic elements (`<nav>`, `<main>`, `<article>`, `<section>`) |
| Canonical URLs | `<link rel="canonical">` on all pages |
| Sitemap | Auto-generated `sitemap.xml` |
| Robots.txt | Properly configured for crawlers |
| Open Graph tags | For social sharing |
| Structured data | Schema.org Book/Article markup |
| Mobile-friendly | Responsive design (Google Mobile-First Indexing) |

### 13.2 Content SEO

| Requirement | Implementation |
|---|---|
| Book pages | Individual, crawlable pages per book |
| Category pages | Browsable category/subject pages |
| Search-friendly URLs | `/books/physics-class-12` not `/books?id=abc123` |
| Breadcrumbs | Navigation trail on all content pages |
| Internal linking | Related books, category links |
| Alt text | All images have descriptive alt attributes |

### 13.3 Performance SEO

| Requirement | Target |
|---|---|
| Core Web Vitals - LCP | < 2.5 seconds |
| Core Web Vitals - FID | < 100 milliseconds |
| Core Web Vitals - CLS | < 0.1 |
| Page load time | < 3 seconds on 3G |

---

## 14. Responsive Design Requirements

### 14.1 Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | 320px – 767px | Single column, stacked |
| Tablet | 768px – 1023px | Two columns, sidebar collapsible |
| Desktop | 1024px – 1439px | Full layout with sidebar |
| Wide | 1440px+ | Full layout, max-width container |

### 14.2 Responsive Rules

| Element | Mobile | Tablet | Desktop |
|---|---|---|---|
| Navigation | Bottom bar / hamburger | Side rail | Top nav + sidebar |
| Content grid | 1 column | 2-3 columns | 3-4 columns |
| Reader | Full width | Comfortable width | Constrained width |
| Admin panel | Not optimized (desktop-first) | Functional | Full featured |
| Book cards | Horizontal scroll | Grid | Grid |
| Search | Full-screen overlay | Inline | Inline with dropdown |

### 14.3 Admin Panel Responsive Strategy

The admin panel is **desktop-first** and fully functional on tablet. Mobile access is a read-only dashboard with limited management capability — full content management requires tablet or desktop.

---

## 15. Performance & Scalability

### 15.1 Performance Targets

| Metric | Target |
|---|---|
| Initial page load | < 2 seconds (Cloudflare edge) |
| Time to interactive | < 3 seconds |
| API response time | < 200ms (Workers) |
| PDF load time | < 5 seconds for first page |
| Search response | < 500ms |
| Image loading | Progressive/lazy loading |

### 15.2 Scalability Considerations

| Strategy | Implementation |
|---|---|
| Edge caching | Cloudflare CDN for static assets |
| API caching | Workers KV for frequently accessed data |
| Pagination | All lists paginate (20 items default) |
| Lazy loading | Images, PDFs, non-critical content |
| Asset optimization | Minified CSS/JS, WebP images, compressed PDFs |
| Database indexing | Proper indexes on D1 tables |
| Connection pooling | D1 connection management |

### 15.3 Cloudflare Workers Optimization

| Strategy | Implementation |
|---|---|
| Route optimization | Minimal Worker invocations |
| Edge computing | Process close to user |
| KV caching | Cache API responses in Workers KV |
| Request batching | Combine related API calls |
| Error caching | Cache error responses briefly to prevent thundering herd |

---

## 16. Error Handling & Edge Cases

### 16.1 Network Error States

| Scenario | Handling |
|---|---|
| No internet | "No internet connection. Check your network and try again." with retry |
| Slow connection | Loading skeleton + timeout after 30s |
| API error (500) | "Something went wrong. Please try again." with retry |
| API error (404) | "Content not found. It may have been removed." |
| API error (403) | "You don't have permission to access this." |
| API error (429) | "Too many requests. Please wait a moment." |

### 16.2 Content Edge Cases

| Scenario | Handling |
|---|---|
| PDF not on Drive | "This document is currently unavailable." + admin notification |
| YouTube video deleted | "This video is no longer available." + admin notification |
| Content version mismatch | Serve latest version, clear stale cache |
| Empty search results | "No results for 'X'" + suggested categories |
| Corrupted upload | Validation + error message + retry option |

### 16.3 Admin Edge Cases

| Scenario | Handling |
|---|---|
| Concurrent editing | Last-write-wins with conflict notification |
| Session timeout | Auto-save draft + redirect to login |
| Bulk operation failure | Partial success report with failed items listed |
| API quota exceeded | Warning + queue remaining operations |
| Drive storage full | Block upload + alert with storage usage |

### 16.4 Empty States

| Context | Message | CTA |
|---|---|---|
| Empty shelf | "Your shelf is waiting." | Explore Books |
| Empty downloads | "Nothing downloaded yet." | Find Something to Read |
| No search results | "No results for 'X'" + suggested categories | — |
| No notes/highlights | "Start reading to add notes" | Start reading |
| No quiz results | "Take your first quiz!" | Browse Quizzes |
| No admin content | "No content yet. Start by adding a book." | + Add Book |

---

## 17. Deployment & Production

### 17.1 Deployment Architecture

```
Development → Staging → Production
    ↓            ↓          ↓
Local dev   Preview URL  Custom domain
    ↓            ↓          ↓
Test D1     Staging D1   Production D1
    ↓            ↓          ↓
Test ads    Test ads     Production ads
```

### 17.2 Cloudflare Pages Configuration

| Setting | Value |
|---|---|
| Build command | `npm run build` (if using build step) or static deploy |
| Output directory | `dist/` or `public/` |
| Environment variables | Firebase keys, Google API keys, AdMob IDs (via Cloudflare secrets) |
| Custom domain | To be configured |
| HTTPS | Automatic via Cloudflare |
| Cache policy | Aggressive for static, short TTL for API |

### 17.3 Environment Configuration

| Environment | D1 Database | Google Drive | Ads | Firebase |
|---|---|---|---|---|
| Development | Local SQLite | Test folder | Test ads | Dev project |
| Staging | Staging D1 | Test folder | Test ads | Staging project |
| Production | Production D1 | Production folder | Live ads | Production project |

→ See [12 Deployment & Release](./12_Deployment_Release.md) for complete deployment procedures.

---

## 18. Acceptance Criteria

### 18.1 Admin Panel

- [ ] Admin can log in with email/password and sees role-appropriate dashboard
- [ ] Admin can create/edit/delete/publish/unpublish books with all metadata fields
- [ ] Admin can upload PDFs to Google Drive and associate with books
- [ ] Admin can manage chapters with Q&A, quizzes, flashcards
- [ ] Admin can view/search/manage all users
- [ ] Admin can reset/change user passwords
- [ ] Admin can configure all ad units (enable/disable, change IDs)
- [ ] Admin can create and schedule push notifications
- [ ] Admin can manage categories, subjects, study packs, collections
- [ ] Admin can view analytics dashboard with real-time metrics
- [ ] Admin can perform emergency unpublish in one click
- [ ] Admin can monitor Google Drive storage and API quotas
- [ ] All admin actions are logged in audit trail
- [ ] Session timeout and rate limiting work correctly

### 18.2 User-Facing Web

- [ ] Users can browse and search content without logging in
- [ ] Users can read books in the in-browser reader with all controls
- [ ] Users can view PDFs in the in-browser PDF reader
- [ ] Users can access Q&A, quizzes, and flashcards
- [ ] Signed-in users have a personal shelf with saved content
- [ ] All pages are responsive (mobile, tablet, desktop)
- [ ] SEO requirements are met (titles, meta, schema, sitemap)
- [ ] Performance targets are met (LCP < 2.5s, FID < 100ms)
- [ ] Error states are handled gracefully with clear messages
- [ ] Empty states show encouraging messages with CTAs
- [ ] Ad placements follow all rules (no blocking, proper disclosure)
- [ ] Content rights are enforced (download/share/offline restrictions)

### 18.3 Infrastructure

- [ ] Cloudflare Pages serves the web application correctly
- [ ] Cloudflare Workers handle all API requests
- [ ] D1 database stores and serves data correctly
- [ ] Google Drive integration works for PDF upload and retrieval
- [ ] YouTube integration works for video management
- [ ] Firebase Auth handles login/registration
- [ ] FCM delivers push notifications
- [ ] Free tier limits are monitored with alerts

---

*This document defines the complete requirements for the TF Study Shelf Web Platform. For shared requirements, see [01 Shared Requirements](./01_Shared_Product_Business_Requirements.md). For mobile app requirements, see [03 Mobile App PRD](./03_Mobile_App_PRD_Flutter.md).*
