# TF StudyShelf — Web Application Product Requirements Document

**Document version:** 1.0 — Initial Web PRD
**Date:** September 2, 2026
**App name:** TF StudyShelf Web
**Platform:** Web Application (Cloudflare Pages/Hosted)
**Tagline:** Read. Learn. Remember.

## 0. Executive Summary

TF StudyShelf Web is the cloud-hosted web version of the completely free, ad-supported digital library and study companion. It provides web-based access to all the features of the Android mobile app while adding enhanced admin capabilities, content management, and integration with cloud services (Google Drive, YouTube, Cloudflare).

**Core Requirement from text.md:**
- Web version hosted on Cloudflare
- All PDF uploads to Google Drive
- Video uploads to YouTube
- Text data storage in Cloudflare D1/Workers database
- Always-free tech stacks (Cloudflare free tier)
- Web version is admin-only (for managing all content A to Z)
- Ad units managed from admin panel
- Admin can manage user passwords and permissions

---

## 1. Product Foundation

### 1.1 Product Identity

| Field | Value |
|---|---|
| App name | **TF StudyShelf Web** |
| Platform | Web Application (Cloudflare Pages/Workers) |
| Tagline | Read. Learn. Remember. |
| Category | Education / E-learning Platform |
| Pricing | 100% free, ad-supported, no premium features |
| Host | Cloudflare Pages (global CDN edge deployment) |

**Brand positioning statement:**
> A completely free, ad-supported digital reading and study platform where users can discover authorized books and PDFs, read them online, access structured study content, and build a personal learning library. Managed by a comprehensive admin panel with Google Drive, YouTube, and Cloudflare integration.

### 1.2 Vision & Core Pillars

**Four Core Pillars (Web Extension):**

| Pillar | What it covers |
|---|---|
| **READ** | Web-based reader, chapter navigation, bookmarks, highlights, notes |
| **UNDERSTAND** | Q&A, summaries, key concepts, explanations (study content) |
| **STUDY** | Highlights, notes, bookmarks, flashcards, quizzes, revision |
| **REMEMBER** | Progress tracking, saved questions, spaced revision, study statistics |
| **MANAGE** | Admin panel for content, users, ad units, analytics (admin-only) |

**Core loop:** Discover → Read → Highlight → Note → Understand → Practice → Quiz → Revise → Remember → Continue Learning.

**Admin loop:** Login → Manage Content (Books/PDFs/Videos) → Upload to Google Drive/YouTube → Configure Ad Units → Monitor Analytics → Manage Users.

### 1.3 Target Users & Personas

| Persona | Profile | Web Use Case |
|---|---|---|
| **Admin/Content Manager** | Manages books, PDFs, videos, users | Primary user of web version (admin panel) |
| **School Student** | Class 6–12, revising syllabus | Web reader for desktop study, Q&A, quizzes |
| **College Student** | Reading assigned books/PDFs | Desktop reading, highlights, notes, search |
| **Competitive-Exam Aspirant** | JEE/NEET/UPSC/SSC prep | Study packs, mistake bank, timed quizzes |
| **Lifelong Learner** | Reading non-fiction/self-development | Reading goals, streaks, AI summaries, TTS |

**Note:** Web version focuses on **admin/content management use cases** while still providing user access to content consumption features.

### 1.4 Business Model

**Completely free — forever (web parity with mobile app):**
- ❌ No subscription
- ❌ No premium plan
- ❌ No in-app purchases
- ❌ No coins/virtual currency
- ❌ No paid books or paid membership

**Revenue exclusively from three ad formats (web):**
1. **Banner ads** — header/footer/sidebar placements
2. **Interstitial ads** — between page transitions, after qualifying activities
3. **Rewarded ads** — for bonus features (unlimited reads, premium content access)

**Core monetization rule:** *monetize access to extra value; never block basic app usage.* Anyone should be able to browse, search and read available content without hitting an ad wall.

---

## 2. Information Architecture

### 2.1 Screen Map & Navigation

**Top navigation (admin) — 5 tabs:**
1. **Dashboard** — Overview, analytics, recent activity
2. **Content** — Books, PDFs, Videos management
3. **Users** — User list, stats, password management
4. **Ads** — Ad unit configuration, performance, SSV settings
5. **Profile** — App settings, data management, logout

**User navigation (guest/authenticated):**
- **Home** — Featured books, recommendations, continue reading
- **Explore** — Browse books/PDFs/subjects, search
- **Reader** — Online reading with highlighting, notes, bookmarks
- **Shelf** — Saved books, downloads, highlights, notes, bookmarks

### 2.2 Splash & Onboarding

**Splash:** Minimal — TF mark, then TF StudyShelf, then tagline Read. Learn. Remember. No ad of any kind before or during loading.

**Onboarding:** 3 screens, then Continue.
1. Read without limits — Books and PDFs in one place
2. Study smarter — Questions, highlights and notes
3. Always free — Free access supported by ads

### 2.3 Empty States

| Context | Message | CTA |
|---|---|---|
| Empty shelf | "Your shelf is waiting." | Explore Books |
| Empty downloads | "Nothing downloaded yet." | Find Something to Read |

---

## 3. Content Discovery

### 3.1 Home Screen

**Header**
- "Good morning 👋" (or appropriate greeting)
- Search books, topics, questions (voice search — future idea)

**Featured Sections:**
- **Continue Reading** — Large horizontal progress cards, e.g. "Atomic Habits — 72% completed"
- **Browse** — Horizontal category rail: Books · PDFs · Subjects · Questions · Study Packs
- **Recommended for You** — Personalized using reading history, saved books, subjects, searches
- **Study Today** — "Your Study Plan" card — e.g. 20 min reading · 10 questions · 5 saved concepts

### 3.2 Explore

Sections: **Books, PDFs, Subjects, Questions, Study Packs, Popular, Recently Added, Recommended.**

### 3.3 Search

Search spans: book title, author, subject, topic, chapter, question text, keyword. 
Example — searching `photosynthesis` should return matches across **Books, PDFs, Questions, Chapters, and Study Material** in one results view, grouped by type.

### 3.4 Subjects, Collections & Study Packs

**Subject categories** (CMS-driven): School, College, Competitive Exams, Mathematics, Science, Programming, Business, History, Language, Literature, Self-Development, Other.

**Study Packs** — Admin-curated bundles, e.g. *"Physics Class 12 — Complete Pack"* containing Books + PDFs + Questions + MCQs + Flashcards + Quizzes + Revision notes as one unit.

**Content Collections** — Editorial groupings, e.g. *"Best Beginner Programming Books," "Complete Mathematics Collection," "Exam Revision Pack."*

---

## 4. Reading Experience

### 4.1 Reader — Core Features & Settings

**Text:**
- Font size (slider, Small → Huge), font family (Manrope)
- Line spacing, paragraph spacing, margins, text alignment

**Page:**
- Page mode vs. scroll mode, page width, orientation

**Appearance:**
- Light / Dark / Dim / System

**Reading:**
- Progress indicator, keep-screen-awake toggle, chapter navigation, in-book search

### 4.2 Reader Gestures

| Gesture | Action |
|---|---|
| Click left edge | Previous page |
| Click right edge | Next page |
| Click center | Toggle reader controls |
| Text selection | Start text selection for highlighting |
| Scroll | Page/chapter navigation |
| Pinch (PDF) | Zoom |

### 4.3 Highlighting System

Selection toolbar on text select: **Highlight · Note · Copy · Share · Ask.**

Highlight categories: **Important, Question, Remember, Definition,** plus default Primary Highlight.

### 4.4 Notes

Notes can attach to: Book, Chapter, Page, Paragraph, or a Highlight. Types: **Text, Checklist, Question, Idea.**

### 4.5 Bookmarks

Simple page-level bookmarks, synced like highlights/notes once signed in.

### 4.6 Text-to-Speech

"Listen" mode for supported text content. Controls: Play / Pause / 10 sec back / 10 sec forward / Speed (0.75x, 1x, 1.25x, 1.5x, 2x).

---

## 5. Study & Learning Tools

### 5.1 Book Q&A System

Every supported book can carry structured questions.

**Types:** MCQ, Short answer, Long answer, True/False, Fill in the blank, Exam-style, Conceptual, Chapter-wise.
**Difficulty:** Easy / Medium / Hard.

### 5.2 Quiz Engine

Features: timed/untimed, random questions, chapter-specific, subject-specific, difficulty filter, instant explanation, final score, incorrect-answer review, retry, saved quiz.

Example: **"Chapter Quiz — 10 Questions"** → **"Score: 8/10 · Accuracy: 80% · Needs revision: 2 topics"** → Review mistakes.

### 5.3 Flashcard Engine

Front = question/concept, back = answer/explanation. Actions: **Got it / Review again.**

### 5.4 AI Study Assistant

**Online-only** (cloud-based, requires internet connectivity). Context-aware: current book, current chapter, selected text, available Q&A, user's own notes.

**Example queries:** "Explain this simply," "Summarize this chapter," "Make 10 MCQs," "What should I remember?", "Give me revision notes."

### 5.5 Study Dashboard & Progress Tracking

Profile/Study Dashboard shows: Books Read, Pages Read, Questions Answered, Quiz Accuracy, Study Time, Books Completed, Current Streak, Favorite/Weak Subjects, weekly time chart.

### 5.6 Revision Center & Mistake Bank

**Revision Center — "Review Today":** saved highlights, incorrect questions, due flashcards, weak topics, recent notes, all in one place.

**Mistake Bank — "My Mistakes":** every wrong quiz answer can optionally be saved for focused revision.

---

## 6. PDF System (Web)

### 6.1 In-Browser PDF Reader

TF StudyShelf ships its **own internal PDF reader** — users are never sent to an external app. Features: zoom, page thumbnails, page number, in-document search, bookmarks, highlight, annotation, notes, reading progress, fit-width/fit-page, landscape, rotation, dark reading treatment where feasible, jump-to-page, table of contents, text selection where supported, share **only where the content license allows it.**

### 6.2 Google Drive PDF Upload & Management

**All PDF uploads go to Google Drive** (admin-initiated or CMS-driven):

1. Admin uploads PDF via web admin panel
2. PDF is stored in Google Drive (Cloudflare Workers fetch via Google Drive API)
3. Rights metadata is assigned (see Content Rights section)
4. PDF is accessible via the web reader

**Google Drive integration flow:**
```text
Admin clicks "Upload PDF" → Select file from Google Drive picker (auth) → Upload to Drive
→ File stored in Drive → Rights metadata assigned → Published/Unpublished via CMS
```

**Google Drive access rules:**
- PDFs are never directly exposed via public Google Drive URLs
- Web Workers fetch PDFs via authenticated Google Drive API calls
- Download permission controlled by content rights metadata
- Temporary offline access governed by entitlement system (if enabled)

### 6.3 Content Rights & Sourcing Policy

**This is a mandatory, non-negotiable architectural constraint.** Publicly finding a PDF online does **not** grant redistribution rights. The catalog must be built from three sources only:

1. **Public-domain** material (legally redistributable).
2. **Open-license** content (license explicitly allows redistribution).
3. **Licensed/authorized** content (explicit permission from authors/publishers/institutions).

Every book/PDF record must carry rights metadata:

```text
rightsStatus: PUBLIC_DOMAIN | OPEN_LICENSE | AUTHORIZED | RESTRICTED
licenseName
licenseSource
rightsHolder
permissionReference
allowedDownload: boolean
allowedOffline: boolean
allowedShare: boolean
```

---

## 7. Shelf / Library

**My Shelf** sections: Continue Reading, Saved Books, Highlights, Notes, Bookmarks, Comments, Finished, Recently Added.

View: Grid / List. Sort: Recently opened, Recently added, Title, Author, Progress.

---

## 8. Account & Authentication

### 8.1 Guest vs. Account Capabilities

| Capability | Guest (no account) | Signed-in account |
|---|---|---|
| Browse, search, read available online content | ✅ | ✅ |
| Highlights, notes, bookmarks, comments | Local only | Synced across devices |
| Personal Shelf, cross-device progress, study progress | ❌ | ✅ |
| Cloud Backup & Restore | ❌ — **account required** | ✅ |

### 8.2 Account System — Intentionally Minimal

**Supported:** Email + Password only (Sign Up, Sign In, Forgot Password via email reset link).

**Explicitly NOT supported:** Google Sign-In, Facebook, Apple Sign-In, phone OTP, any other social login.

```text
Authentication Providers
✓ Email + Password
✗ Google
✗ Facebook
✗ Apple
✗ Phone OTP
```

### 8.3 Account Screens & Error Handling

**Welcome:** Sign in / Create account.

**Create Account:** Email, Password, Confirm Password → `[ Create Account ]`.
Error states: invalid email, password too weak, passwords don't match, email already registered, network error.

**Sign In:** Email, Password → `[ Sign In ]` → "Forgot Password?" link.

**Forgot Password:** Email → `[ Send Reset Link ]`

**Account & Data Deletion:** Profile → Account → **Delete Account**, with clear statement of what gets deleted (account, cloud backups, synced data).

---
| No search results | Neutral "no results for X" + suggested categories | — |
| No notes/highlights yet | Encouraging one-liner tied to that feature | Start reading |

---