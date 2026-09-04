# TF StudyShelf — Complete Product Requirements Document (Master Spec)

**Document version:** 3.0 — Consolidated Master PRD
**Date:** September 2, 2026
**App name:** TF StudyShelf
**Package name:** `com.techilyfly.tfstudyshelf`
**Tagline:** Read. Learn. Remember.
**Platform (V1):** Android (Kotlin, Jetpack Compose)

> **What changed in this version:** This single document merges (1) the original TF StudyShelf product concept, (2) the 24‑hour temporary offline access system for offline reading, PDF download and offline study — each gated by an explicit rewarded video ad — and (3) the account‑linked cloud Backup & Restore system. Nothing from earlier rounds of discussion has been dropped. Sections marked **[NEW]** are gaps that were not fully specified before and have been added so the spec is build‑ready end‑to‑end.

---

## Table of Contents

0. [Executive Summary](#0-executive-summary)
- **Part A — Product Foundation:** Identity, Vision, Personas, Business Model, Competitive Frame
- **Part B — Brand & Design System:** Naming, Logo, Color, Typography, Gradients, Dark/Light, Visual Principles
- **Part C — Information Architecture:** Navigation, Screen Map, Onboarding, Empty States
- **Part D — Content Discovery:** Home, Explore, Search, Subjects/Packs, Book Detail, Content Rights Policy
- **Part E — Reading Experience:** Reader Settings, Gestures, Highlights, Notes, Comments, Bookmarks, TTS, Accessibility
- **Part F — Study & Learning Tools:** Q&A, Quiz, Flashcards, AI Assistant, Dashboard, Learning Paths, Goals, Revision, Mistake Bank
- **Part G — PDF System:** In‑app PDF Reader, PDF Rights & Security
- **Part H — Shelf / Library**
- **Part I — Account & Authentication:** Guest vs Account, Email/Password System, Screens
- **Part J — 24‑Hour Temporary Offline Access System (core feature)**
- **Part K — Backup & Restore System**
- **Part L — Advertising System:** Formats, Rewarded State Machine, Interstitial Rules, Server‑Side Verification, Anti‑Abuse
- **Part M — Content Management System**
- **Part N — Technical Architecture**
- **Part O — Engagement:** Notifications, Recommendations, Review Prompts, App Updates
- **Part P — Compliance, Privacy & Legal**
- **Part Q — Quality Assurance:** Error States, Analytics, Testing, Acceptance Criteria
- **Part R — Roadmap** (MVP / V2 / V3 / Backlog)
- **Part S — Success Metrics & Risk Register**
- **Appendix:** Glossary, Alternate Name Candidates, Full Screen Reference

---

## 0. Executive Summary

TF StudyShelf is a **completely free, ad‑supported** digital library and study companion. It combines **Books + PDFs + Q&A + Notes + Highlights + Quizzes + Flashcards + Progress Tracking** into one product, so a learner's journey is **Read → Highlight → Note → Understand → Practice → Revise → Remember**, not just "open a PDF."

There is no subscription, no premium tier, and no in‑app purchase anywhere in the product. Revenue comes only from banner, interstitial and rewarded ads.

Three systems sit at the center of this spec and need the most engineering care because they touch money, trust, and data safety:

1. **24‑Hour Temporary Offline Access** — Offline Reading, Offline PDF Download, and Offline Study are each unlocked by an **explicit, opt‑in rewarded video ad**, and each grant **auto‑expires exactly 24 hours later**, after which the user must watch another rewarded ad to re‑unlock. This is modelled as a real **entitlement with server‑checked expiry** — not "file exists = access allowed."
2. **Account‑Linked Cloud Backup & Restore** — A **complete backup is always built locally on the device first**; only after it is validated does it get encrypted and pushed to the cloud. Restore reverses this, with a safety snapshot taken before anything is overwritten. This requires an account, and the account system is **intentionally minimal: email + password only**, no social logins.
3. **Ad‑Gated Monetization Done Safely** — every rewarded flow must disclose the action/reward before showing the ad, must never grant the reward on ad‑request alone, and — **[NEW]** — should use AdMob's **Server‑Side Verification (SSV)** as the source of truth for granting entitlements, not just the client‑side callback, to prevent spoofed/faked "ad watched" states.

Everything else in the product (reader, highlights, Q&A, quizzes, flashcards, AI assistant, CMS, etc.) exists to make the "free library that pays for itself with ads" pillar feel like a **real study platform**, not a bare PDF viewer.

---

# PART A — Product Foundation

## A.1 Product Identity

| Field | Value |
|---|---|
| App name | **TF StudyShelf** |
| Package | `com.techilyfly.tfstudyshelf` |
| Tagline | Read. Learn. Remember. |
| Category | Education / Books & Reference |
| Pricing | 100% free, ad‑supported, no IAP |
| Platform | Android (Kotlin + Jetpack Compose), architecture designed so an iOS port later doesn't require a data‑model rewrite |

**Brand positioning statement:**
> A completely free, ad‑supported digital reading and study platform where users can discover authorized books and PDFs, read them online, temporarily use them offline, study chapter‑wise questions and answers, highlight and annotate content, create notes, practice quizzes, use flashcards, track progress, and build a personal learning library.

**Store positioning rule:** never market this as "free PDF downloader." Position it as **"Free Reading & Learning Library."** A PDF‑downloader framing invites users looking for unrestricted copyrighted downloads and creates real content‑rights and Play policy risk; the download feature is one feature of a study platform, not the identity of the app.

## A.2 Vision & Core Pillars

**Product goal:** don't build "a PDF reader." Build **Digital Library + PDF Reader + Study Platform + Annotation Tool + Q&A Platform + Quiz App + Personal Study Shelf**, combined.

**Four pillars:**

| Pillar | What it covers |
|---|---|
| **READ** | Books, PDFs, chapters, documents |
| **UNDERSTAND** | Q&A, summaries, key concepts, explanations |
| **STUDY** | Highlights, notes, bookmarks, flashcards, quizzes, revision |
| **REMEMBER** | Progress tracking, saved questions, spaced revision, study statistics |

**Core loop:** Discover → Read → Highlight → Note → Understand → Practice → Quiz → Revise → Remember → Continue Learning.

## A.3 Target Users & Personas **[NEW]**

| Persona | Profile | What they need most |
|---|---|---|
| **School Student** | Class 6–12, revising a textbook/board syllabus | Chapter Q&A, quizzes, flashcards, short study sessions |
| **College Student** | Reading assigned books/PDFs for a course | Highlights, notes, search inside PDFs, offline access before exams |
| **Competitive‑Exam Aspirant** | Preparing for JEE/NEET/UPSC/SSC/banking‑type exams | Study packs, mistake bank, timed quizzes, revision center |
| **Lifelong Learner** | Reading non‑fiction/self‑development books for personal growth | Reading goals, streaks, AI summaries, TTS for commute listening |

This persona table matters because it directly affects one open decision the team must make explicitly before launch: **whether "School Student" users are likely to be under 13**, which changes the ads/privacy configuration (see Part P.2).

## A.4 Business Model

**Completely free — forever:**
- ❌ No subscription
- ❌ No premium plan
- ❌ No in‑app purchases
- ❌ No coins/virtual currency
- ❌ No paid books or paid membership

**Revenue exclusively from three ad formats:**

1. **Banner ads** — persistent adaptive banner just above bottom navigation.
2. **Interstitial ads** — shown after a controlled number of qualifying activities, never during a critical action.
3. **Rewarded ads** — the gate for high‑value, voluntary actions: 24‑hour offline reading, 24‑hour PDF download, 24‑hour offline study, and cloud Backup/Restore.

**Core monetization rule:** *monetize access to extra value; never block basic app usage.* Anyone should be able to browse, search and read available online content without hitting an ad wall. Rewarded ads are reserved for genuinely valuable, optional actions the user opts into.

## A.5 Competitive Frame **[NEW — brief]**

TF StudyShelf sits between three existing categories, and should borrow the best of each without copying any one directly:

- **E‑readers (Kindle‑style):** reading customization, shelf/library metaphor, highlights/notes — TF StudyShelf matches this bar for reader settings.
- **PDF utility apps:** the "watch an ad, get a temporary download" pattern is common; TF StudyShelf's differentiator is that the *content itself* (Q&A, quizzes, flashcards) is structured, not just a raw file.
- **Exam‑prep apps:** these usually charge for content; TF StudyShelf's differentiator is being ad‑only and free, sourced from public‑domain/licensed material rather than a paid question bank.

The product should feel like a **premium reading app + a modern study workspace**, not a generic "education app" clone — see Part B.7 for the specific visual‑language guidance that supports this.

---

# PART B — Brand & Design System

## B.1 Naming & Branding

**Chosen name:** TF StudyShelf (package `com.techilyfly.tfstudyshelf`). The `TF` prefix is retained as permanent brand architecture; every future app in the family keeps `com.techilyfly.<appname>`.

**Why "StudyShelf" won:** it does not restrict the product to "books." A **shelf** naturally accommodates books, PDFs, highlights, notes, questions, bookmarks and study material — so new features fit the name instead of fighting it. Brand line: *TF StudyShelf — Read. Learn. Practice. Remember.*

Note: **avoid "TF Reader"** as a candidate — an existing, established Android app already uses that name on Google Play. Nine other candidate names that were evaluated and rejected are kept in the Appendix for reference.

## B.2 Logo Concept

- Mark: a stylized **T + F + open book**, where the book's spine/pages form the horizontal structure of the T/F letterforms.
- Primary lockup: `TF` mark above `STUDYSHELF` wordmark.
- Color treatment: the brand gradient, `#FF7759 → #212121`.
- Must work at small sizes across: app icon, splash screen, website, social avatars, admin dashboard favicon.

## B.3 Color System

**Strict palette — only these three base colors, plus derived alpha/gradient variants:**

| Token | Hex | Role |
|---|---|---|
| Primary dark | `#212121` | Text / background in dark mode |
| Accent | `#FF7759` | CTAs, highlights, active states, gradient |
| Off‑white | `#FAFAFA` | Background / text in dark mode |

**Hard rule:** no unrelated blue/green/purple accent families, ever. All secondary shades (borders, disabled states, highlight categories) must be **alpha variants of these three colors**, not new hues.

- **Light mode:** background `#FAFAFA`, text `#212121`, accent `#FF7759`. Cards → `#FAFAFA`; borders → `#212121` at low alpha; accent actions → `#FF7759`.
- **Dark mode:** background `#212121`, text `#FAFAFA`, accent `#FF7759`. **No pure black** — that would break the identity.

## B.4 Typography

| Font | Used for |
|---|---|
| **Manrope** (primary) | Titles, body text, buttons, navigation, descriptions |
| **Geist Mono** (secondary/technical) | Page numbers (`PAGE 048 / 320`), percentages (`76%`), reading time, statistics, quiz scores, other small technical metadata |

Never use Geist Mono for normal reading paragraphs — it is a technical/statistical accent font only.

**Font‑size settings:** Small / Default / Large / Extra Large / Huge, ideally as a slider (`A ←──●──→ A`) with a live preview, persisted across sessions and devices (once account sync exists).

## B.5 Gradient System

Primary signature gradient: **`#FF7759 → #212121`**. Use it *selectively*, not on every component, or the UI will look flat and cheap instead of premium:

- Hero banners, primary CTAs, featured/book‑hero cards, progress indicators, achievement/completion moments, empty states, selected cards, special section headers.
- Do **not** apply it to ordinary list rows, standard buttons, or backgrounds broadly — restraint is what keeps it feeling premium.

## B.6 Dark Mode / Light Mode Specification

Already captured in B.3; the important addition here is **theme = system / light / dark**, all three must be selectable in Settings → Appearance, with "System" as the sensible default for new installs.

## B.7 Visual Design Principles **[NEW — consolidated]**

**Design language:** Editorial + Academic + Modern. Explicitly *not*: an overly colorful "kids' education app," a cartoonish skin, or a generic Google‑Books clone. Think: a premium reading app crossed with a modern study workspace.

**Do:**
- Large, confident typography and generous whitespace
- Soft‑rounded cards, very subtle borders
- Orange accent used as punctuation, not wallpaper
- Warm off‑white / dark charcoal surfaces
- Controlled, purposeful gradients (per B.5)
- Minimal, consistent iconography

**Avoid:**
- Glassmorphism everywhere
- Heavy drop shadows
- "Rainbow" category chips (breaks the 3‑color rule)
- Pill overload
- Excessive motion/animation

---

# PART C — Information Architecture

## C.1 Navigation & Screen Map

**Bottom navigation — 5 tabs:**

1. **Home** — discovery + continuation
2. **Explore** — books / PDFs / subjects / categories / search entry point
3. **Study** — questions, quizzes, flashcards, revision, progress
4. **Shelf** — saved books, downloads, bookmarks, highlights, notes
5. **Profile** — statistics, settings, account, backup & restore

**Full screen tree:**

```text
Splash
 └── Onboarding (3 screens)
      └── Home
           ├── Continue Reading
           ├── Recommended for You
           ├── Browse (category rail)
           └── Study Today card

Explore
 ├── Books
 ├── PDFs
 ├── Subjects
 ├── Questions
 ├── Study Packs
 ├── Popular / Recently Added / Recommended
 └── Search results (cross-content)

Book Details
 ├── Read Now (→ Reader)
 ├── Save
 ├── Download PDF (→ 24h PDF flow)
 ├── Use Offline (→ 24h Offline Reading flow)
 ├── Summary
 ├── Questions & Answers
 ├── Key Concepts
 ├── Flashcards
 └── Quiz

Reader
 ├── Highlight / Note / Comment / Bookmark
 ├── Search in book
 ├── Ask (AI, contextual)
 ├── Reader Settings
 └── Listen (TTS)

Study
 ├── Quizzes
 ├── Flashcards
 ├── Saved Questions / Mistake Bank
 ├── Revision Center
 ├── Study Offline (→ 24h Offline Study flow)
 └── Progress / Study Dashboard

Shelf
 ├── Continue Reading
 ├── Saved Books
 ├── Downloads (PDF + Offline packages, with countdowns)
 ├── Highlights
 ├── Notes
 ├── Bookmarks
 ├── Comments
 └── Finished

Profile
 ├── Statistics
 ├── Reading Settings (Kindle-style)
 ├── Notifications
 ├── Accessibility
 ├── Storage Management
 ├── Backup & Restore
 ├── Privacy / Legal
 └── Account (Sign in / Sign up / Sign out / Delete account)
```

## C.2 Splash & Onboarding

**Splash:** extremely minimal — `TF` mark, then `TF StudyShelf`, then tagline `Read. Learn. Remember.` **No ad of any kind (interstitial or otherwise) may appear before or during the app's loading screen** — this is a hard platform‑policy rule, not just a UX preference.

**Onboarding — 3 screens, then Continue:**

1. *Read without limits* — "Books and PDFs in one place."
2. *Study smarter* — "Questions, highlights and notes."
3. *Always free* — "Free access supported by ads."

## C.3 Empty States

Empty states should feel encouraging, never like an error:

| Context | Message | CTA |
|---|---|---|
| Empty shelf | "Your shelf is waiting." | Explore Books |
| Empty downloads | "Nothing downloaded yet." | Find Something to Read |
| No search results | Neutral "no results for X" + suggested categories | — |
| No notes/highlights yet | Encouraging one-liner tied to that feature | Start reading |

---

# PART D — Content Discovery

## D.1 Home Screen

```text
Header
  "Good morning 👋"
  Search books, topics, questions…  (voice search — future idea, see Part R.4)

Continue Reading
  Large horizontal progress cards, e.g. "Atomic Habits — 72% completed"

Browse
  Horizontal category rail: Books · PDFs · Questions · Subjects · Exams · Popular

Recommended for You
  Personalized using reading history, saved books, subjects, searches,
  completed chapters, questions attempted (see Part O.2)

Study Today
  "Your Study Plan" card — e.g. 20 min reading · 10 questions · 5 saved concepts
```

## D.2 Explore

Sections: **Books, PDFs, Subjects, Questions, Study Packs, Popular, Recently Added, Recommended.**

## D.3 Search

Search spans: book title, author, subject, topic, chapter, question text, keyword. Example — searching `photosynthesis` should return matches across **Books, PDFs, Questions, Chapters, and Study Material** in one results view, grouped by type, not just book titles.

## D.4 Subjects, Collections & Study Packs

**Subject categories** (CMS‑driven, never hardcoded): School, College, Competitive Exams, Mathematics, Science, Programming, Business, History, Language, Literature, Self‑Development, Other.

**Study Packs** — an admin‑curated bundle, e.g. *"Physics Class 12 — Complete Pack"* containing Books + PDFs + Questions + MCQs + Flashcards + Quizzes + Revision notes as one unit, which can itself be unlocked offline as a single 24‑hour entitlement.

**Content Collections** — lighter, editorial groupings, e.g. *"Best Beginner Programming Books," "Complete Mathematics Collection," "Exam Revision Pack," "Personal Development Shelf."*

**[NEW — enhancement idea]** Since competitive‑exam prep is an explicit persona, consider adding **exam/board tags** to content (e.g. JEE, NEET, UPSC, SSC, CBSE, ICSE, State Board) as CMS metadata, so Explore and Search can filter by exam/board without needing new screens — this is a metadata addition, not a new feature surface.

## D.5 Book Detail Page

**Displayed:** cover, title, author, description, categories, difficulty, language, estimated reading time, page count, rating.

**Primary actions:** Read Now · Save · Download PDF · Questions · Summary · More.

**Signature section — "Learn from this book":**
```text
Chapter 1
 • Summary
 • Questions & Answers
 • Key Concepts
 • Important Quotes
 • Flashcards
 • Quiz
```
This section is what turns a book page from "a file" into "a lesson," and is a core differentiator worth protecting in every redesign.

## D.6 Content Rights & Sourcing Policy

**This is a mandatory, non‑negotiable architectural constraint**, not a nice‑to‑have. Publicly finding a PDF online does **not** grant redistribution rights. The catalog must be built from three sources only:

1. **Public‑domain** material (legally redistributable).
2. **Open‑license** content (license explicitly allows redistribution).
3. **Licensed/authorized** content (explicit permission from authors, publishers, or institutions).

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

The backend must **enforce** `canRead / canDownload / canShare / canOffline` from this metadata — never assume a PDF URL existing means it's safe to distribute. Google Play's Intellectual Property policy requires apps to be original or properly licensed/authorized, so this is also a store‑approval requirement, not only an ethical one. Store positioning should say **"Free Reading & Learning Library,"** never "free PDF downloader" (see A.1).

---

# PART E — Reading Experience

## E.1 Reader — Core Features & Settings

**Text**
- Font size (slider, Small → Huge), font family fixed to Manrope
- Line spacing, paragraph spacing, margins, text alignment

**Page**
- Page mode vs. scroll mode, page width, orientation, page‑turning style

**Appearance**
- Light / Dark / Dim / System

**Reading**
- Progress indicator, keep‑screen‑awake toggle, chapter navigation, in‑book search

**Accessibility** (also see E.8)
- Text scaling, reduced motion, TalkBack support

Settings persist per‑user (synced once signed in; local‑only for guests).

## E.2 Reader Gestures **[NEW — was implied, not specified]**

| Gesture | Action |
|---|---|
| Tap left edge | Previous page |
| Tap right edge | Next page |
| Tap center | Toggle reader controls |
| Long press on text | Start text selection |
| Pinch (PDF) | Zoom |
| Swipe | Chapter/page navigation |

## E.3 Highlighting System

Selection toolbar on text select: **Highlight · Note · Copy · Share · Ask.**

Highlight categories (all derived as alpha/gradient variants of `#FF7759` — never new hues): **Important, Question, Remember, Definition,** plus a default Primary Highlight.

Stored metadata: `bookId, chapterId, page, selectedText, position, createdAt, noteId`.

## E.4 Notes

Notes can attach to: Book, Chapter, Page, Paragraph, or a Highlight. Types: **Text, Checklist, Question, Idea.** Future: **Convert Note → Flashcard.**

## E.5 Comments / Annotations

**Phase 1 (launch): private annotations only** — user‑only, attached to a specific page and selected text, with Edit / Delete / Jump‑to‑text.

**Phase 2 (later): public community comments** — deliberately deferred, because public comments introduce moderation, reporting, and abuse‑handling requirements that should not block launch. When this phase ships, moderation/report/block tooling must exist from day one of that feature, not be retrofitted.

## E.6 Bookmarks

Simple page‑level bookmarks, synced like highlights/notes once signed in, visible in Shelf.

## E.7 Text‑to‑Speech

"Listen" mode for supported text content. Controls: Play / Pause / 10 sec back / 10 sec forward / Speed (0.75x, 1x, 1.25x, 1.5x, 2x). Sleep timer is a reasonable future addition (Part R.4).

## E.8 Accessibility

Target quality bar: TalkBack support and content descriptions, large touch targets, scalable text, reduced‑animation mode, sufficient contrast (within the 3‑color palette), portrait/landscape support, keep‑screen‑awake. This is both a UX commitment and a Play Store review consideration.

---

# PART F — Study & Learning Tools

## F.1 Book Q&A System — signature differentiator

Every supported book can carry structured questions.

**Types:** MCQ, Short answer, Long answer, True/False, Fill in the blank, Exam‑style, Conceptual, Chapter‑wise.
**Difficulty:** Easy / Medium / Hard.

This is one of the app's strongest differentiators versus a plain reader or PDF app — protect it in scoping decisions.

## F.2 Quiz Engine

Features: timed/untimed, random questions, chapter‑specific, subject‑specific, difficulty filter, instant explanation, final score, incorrect‑answer review, retry, saved quiz. After a chapter: **"Chapter Quiz — 10 Questions"** → **"Score: 8/10 · Accuracy: 80% · Needs revision: 2 topics"** → Review mistakes.

## F.3 Flashcard Engine

Front = question/concept, back = answer/explanation. Actions: **Got it / Review again.** Users can convert a saved question into a flashcard. Future: real spaced‑repetition scheduling (V2, Part R.2).

## F.4 AI Study Assistant

**Online‑only** (see the Offline Feature Matrix, Part J.6 — this must never be promised to work offline). Context‑aware: current book, current chapter, selected text, current page, available Q&A, the user's own notes — not a generic chatbot with no context.

**Example queries:** "Explain this simply," "Summarize this chapter," "Make 10 MCQs," "What should I remember?", "Give me revision notes."

**AI Safety & Quality requirements:**
- Clear AI‑generated labeling on any AI output
- A report/feedback control on AI answers
- No implying AI content is verified/authoritative
- Rate limits and abuse controls on the assistant
- Google Play maintains specific guidance for apps using generative AI around harmful/deceptive outputs — the team should review current Play policy for AI‑generated content before this ships, since store guidance in this area evolves.

## F.5 Study Dashboard & Progress Tracking

Profile/Study Dashboard shows: Books Read, Pages Read, Questions Answered, Quiz Accuracy, Study Time, Books Completed, Current Streak, Favorite/Weak Subjects, plus a simple weekly time chart (Mon → 20m, Tue → 35m, …).

## F.6 Learning Paths

A sequenced curriculum, e.g. **Learn Python:** Basics → Variables → Conditions → Functions → OOP → Data Structures → Projects → Final Quiz. Each step links to a Book / PDF / Chapter / Questions / Quiz / Notes. This is what turns the product into a *learning platform*, not just a document collection.

## F.7 Reading Goals

User sets a target: 10 / 20 / 30 minutes per day, or 10 pages/day. Dashboard shows `Today's goal: 70%`. Kept simple deliberately — encourages retention without turning into a heavy gamification layer.

## F.8 Revision Center & Mistake Bank

**Revision Center — "Review Today":** saved highlights, incorrect questions, due flashcards, weak topics, recent notes, all in one place — this closes the loop from "studied" to "revised."

**Mistake Bank — "My Mistakes":** every wrong quiz answer can optionally be saved here so the user can drill only what they got wrong — especially valuable for exam‑prep personas.

## F.9 Book Completion Flow

At 100% progress: **"Book Completed 🎉"** with actions **Review Highlights / Take Quiz / View Notes / Start Another Book.**

---

# PART G — PDF System

## G.1 In‑App PDF Reader

TF StudyShelf ships its **own internal PDF reader** — users are never sent to an external app to read a PDF. Features: zoom, page thumbnails, page number, in‑document search, bookmarks, highlight (where the PDF engine supports it), annotation, notes, comments, reading progress, fit‑width/fit‑page, landscape, rotation, dark reading treatment where technically feasible, jump‑to‑page, table of contents, text selection where supported, and share **only where the content license allows it.**

## G.2 PDF Rights & Security

A PDF that was only temporarily licensed for 24 hours must **not** silently become a permanent, unrestricted file once downloaded — whether sharing/exporting is permitted is decided by the content's rights metadata (Part D.6), not by the fact that a local copy exists on the device. See Part J.3 for the full temporary‑download flow and Part L for the ad gate in front of it.

---

# PART H — Shelf / Library

**My Shelf** sections: Continue Reading, Saved Books, Downloads (PDFs + offline packages, each showing live status/countdown — see Part J.10), Highlights, Notes, Bookmarks, Comments, Finished, Recently Added.

View: Grid / List. Sort: Recently opened, Recently added, Title, Author, Progress.

---

# PART I — Account & Authentication

## I.1 Guest vs. Account Capabilities

TF StudyShelf deliberately avoids forcing login at first launch.

| Capability | Guest (no account) | Signed‑in account |
|---|---|---|
| Browse, search, read available online content | ✅ | ✅ |
| Highlights, notes, bookmarks, comments | Local only | Synced across devices |
| Personal Shelf, cross‑device progress, study progress | ❌ | ✅ |
| 24‑hour Offline Reading / PDF / Study | ✅ (no account needed — see note below) | ✅ |
| Cloud Backup & Restore | ❌ — **account required** | ✅ |

> Note on offline access vs. account: the 24‑hour temporary offline/PDF/study entitlements are tied to the **device install** and do not strictly require an account (they are ad‑gated, not identity‑gated). **Cloud Backup & Restore is the one feature that mandatorily requires a signed‑in account**, because a cloud backup has to be associated with a secure identity (`Firebase Auth → UID → Cloud Backup`). Product/engineering should confirm this split explicitly before build, since it is the one place account‑requirement rules differ across features.

## I.2 Account System — Intentionally Minimal

Per the latest product decision, the account system is kept deliberately simple:

**Supported:** Email + Password only (Sign Up, Sign In, Forgot Password via Firebase reset email). Email verification may be used as an account‑security step but is **not** a separate login method.

**Explicitly NOT supported:** Google Sign‑In, Facebook, Apple Sign‑In, phone OTP, any other social login, and no anonymous‑identity cloud backup.

```text
Authentication Providers
✓ Email + Password
✗ Google
✗ Facebook
✗ Apple
✗ Phone OTP
✗ Anonymous cloud-backup identity
```

This keeps the auth architecture simple and predictable: `Firebase Auth (email/password) → UID → all account‑gated features (sync, personal shelf, cloud backup)`.

## I.3 Account Screens & Error Handling

**Welcome:** Sign in / Create account.

**Create Account:** Email, Password, Confirm Password → `[ Create Account ]`.
Error states to design for: invalid email, password too weak, passwords don't match, email already registered, network error.

**Sign In:** Email, Password → `[ Sign In ]` → "Forgot Password?" link.

**Forgot Password:** Email → `[ Send Reset Link ]` (Firebase's standard password‑reset email flow).

**[NEW] Account & Data Deletion:** Because the app creates accounts, Google Play policy requires an **in‑app path to delete the account and its data**, not just a "contact us" form. This must live in Profile → Account → **Delete Account**, and should clearly state what gets deleted (account, cloud backups, synced highlights/notes/progress) versus what may be retained per the privacy policy. See Part P.1 for the full data‑deletion requirement.

---

# PART J — 24‑Hour Temporary Offline Access System (Core Feature)

## J.1 Philosophy & Core Rule

This is the feature you asked to make sure is fully captured, so it's specified in full detail end‑to‑end. The core rule stated in the requirement:

> Offline Reading, PDF Download and Offline Study are each unlocked by a **rewarded video ad**. Once unlocked, everything works **exactly like online use** for **24 hours**, after which the content **auto‑removes**, and the user must **watch the ad again** to re‑unlock it.

One correction that matters technically: **an ad cannot be served while the device is offline**, because loading a rewarded ad itself requires connectivity. So every one of these three flows must **check connectivity before offering the ad**, and offer a clear "you're offline — connect to the internet" message instead of trying (and failing) to load an ad. This is reflected in every flow below.

**Modelling principle:** never treat "the file exists locally" as "access is allowed." Every open/use action re‑checks a real entitlement:

```text
CanOpen(content) =
    LocalFileExists
    AND EntitlementValid   (currentTime < expiresAt)
    AND ContentVersionAllowed
```

This prevents users from retaining access indefinitely just because a file is still sitting on disk after its 24 hours are up.

## J.2 Offline Reading Flow

**Entry point:** a **"Use Offline"** (or "Make Available Offline") button inside a book.

```text
User taps "Use Offline"
        ↓
App checks connectivity
        ↓
   ┌────────────────┴────────────────┐
   │                                 │
OFFLINE                            ONLINE
   │                                 │
"Internet connection required"    "Unlock 24-Hour Offline Reading"
To unlock offline reading,        Watch a rewarded ad to make this
connect to the internet           book available offline for the
and try again.                    next 24 hours.
[Turn On Internet] [Cancel]       [Watch Ad & Unlock] [Cancel]
                                       ↓
                                 FULL-SCREEN REWARDED VIDEO AD
                                       ↓
                                 Reward received
                                       ↓
                                 "Preparing your offline book…"  38%
                                       ↓
                                 Download: book content, chapters,
                                 images, reader metadata, Q&A,
                                 study data (see Feature Matrix, J.6)
                                       ↓
                                 "Available offline for 24 hours"
```

Once downloaded, the book is **fully readable offline with essentially all reader functionality** (exact scope in the Feature Matrix, J.6) for exactly 24 hours from grant time.

## J.3 Offline PDF Download Flow

**Entry point:** **"Download PDF"** on a book/PDF screen. This is a separate flow from J.2 because a PDF download is a distinct entitlement from "offline reading" of the structured book content.

```text
User taps "Download PDF"
        ↓
App checks connectivity FIRST — before attempting any ad
        ↓
   ┌────────────────┴────────────────┐
   │                                 │
OFFLINE                            ONLINE
   │                                 │
"Internet Required"                "Unlock PDF Download"
PDF downloads require an           Watch a rewarded ad to unlock
internet connection. Turn on       this PDF for 24 hours.
the internet and try again.
[Retry] [Cancel]                   [Watch Ad & Download] [Cancel]
No ad is attempted while offline.       ↓
                                   FULL-SCREEN REWARDED VIDEO AD
                                         ↓
                                   Reward received
                                         ↓
                                   "Preparing PDF…" → "Downloading 64%"
                                         ↓
                                   "PDF available offline for 24 hours"
```

This exactly matches the requirement: *"pdf download par click karte hi pehle video ad aayega; agar offline hai to popup ki online aa jaiye; online hone par video ad ke baad download hoga; 24 hours ke liye valid, fir auto remove."* The downloaded PDF is opened with TF StudyShelf's **own internal PDF reader** (Part G.1) — never handed off to a third‑party PDF app.

## J.4 Offline Study Flow

**Entry point:** **"Study Offline"** on the Study tab. Same connectivity‑first, ad‑gated, 24‑hour pattern as J.2/J.3:

```text
Study → "Study Offline"
        ↓
Connectivity check → (offline: internet-required message, same as above)
        ↓ (online)
"Unlock Offline Study for 24 Hours"
Watch a rewarded ad to continue studying offline.
[Watch Ad & Unlock] [Cancel]
        ↓
Reward received → Study Package downloads
(Questions · Answers · Quiz · Flashcards · Saved highlights ·
 Cached summaries · Study notes · Revision list · Selected chapters)
        ↓
"Available offline for 24 hours"
```

**Offline Quiz** is fully local — e.g. "10 Questions," progress "1/10," end score "8/10" — and locally saves score, questions attempted, incorrect questions, duration and completion date, syncing ("Syncing results…") once back online.

**Offline Flashcards** work the same way — "Remembered / Review Again," with spaced‑repetition state stored locally and synced later.

## J.5 24‑Hour Entitlement Data Model

Every one of the three grants above (Offline Reading, PDF, Study) creates the same shape of record, via a shared `OfflineEntitlementManager` service:

```text
entitlementId
userId (or deviceIdHash for guests)
contentId
contentType        (BOOK_OFFLINE | PDF | STUDY_PACKAGE)
grantedAt
expiresAt          (grantedAt + exactly 24h)
status             (ACTIVE | EXPIRED | REVOKED)
contentVersion
rewardTransactionId   (idempotency key — see Part L.6/L.7)
```

Example: `Granted: 2 Sep 2026, 08:30 → Expires: 3 Sep 2026, 08:30.` A **new** unlock after expiry creates a **new** window (e.g. `3 Sep 10:15 → 4 Sep 10:15`) — never silently extend the old expiry from a background event.

**Important:** this 24‑hour window must not be bypassable by uninstalling and reinstalling the app. Expiry should be validated against secure local storage **plus** a server‑side check whenever the device is online, not client `System.currentTimeMillis()` alone (see J.11).

## J.6 Offline Feature Matrix

The requirement says "sabhi functionalities working" (all functionality works) offline — this table is what makes that testable instead of vague:

| Feature | Offline |
|---|---|
| Read downloaded book | ✅ |
| Page/chapter navigation | ✅ |
| Reader settings, font scaling, theme | ✅ |
| Highlights, notes, bookmarks, local comments | ✅ |
| Reading progress | ✅ |
| Chapter summary / Q&A / Quiz / Flashcards | ✅ if cached with the package |
| Text‑to‑speech | ✅ where local TTS support exists |
| In‑book search | ✅ if a local index exists |
| AI cloud assistant | ❌ (always online‑only) |
| Cloud sync | ❌ until back online |
| New content / new PDF download | ❌ |
| Rewarded ad (naturally) | ❌ |
| Community comments / server recommendations | ❌ until online |

The UI must **never pretend** an online‑only feature (AI Assistant, sync, new downloads, community comments, server recommendations) works offline — it should visibly disable or explain, not silently fail.

## J.7 Offline Changes & Sync‑Back

Anything the user does offline — new note, new highlight, new bookmark, a quiz attempt, a changed reading position — saves **locally first**, queued as a `PendingOperation` (`CREATE_NOTE`, `CREATE_HIGHLIGHT`, `UPDATE_PROGRESS`, `SAVE_BOOKMARK`, `QUIZ_RESULT`, `FLASHCARD_REVIEW`). When connectivity returns: **"Syncing your study activity…"** → `Pending → Uploading → Synced`, with retry‑with‑backoff on failure.

**Conflict resolution:**
- Notes/highlights: unique IDs, so there's nothing to "merge."
- Reading progress: latest valid timestamp wins, or highest progress wins — pick one rule and apply it consistently.
- Quiz results: **never** overwritten — every attempt is appended to history.

## J.8 Auto‑Removal / Expiry Enforcement

When `currentTime >= expiryTime`, the entitlement becomes invalid and the app must not leave the content usable.

**Expiry UX** (shown the next time the user opens the expired book/PDF/study package):
> **Offline access expired** — Your 24‑hour offline access has ended. Connect to the internet and watch a rewarded ad to use this again.
> `[Unlock Offline Again]` `[Read Online]`

**Cleanup sequence:**
1. Mark the entitlement `EXPIRED`.
2. Remove/access‑block the temporary content package.
3. Delete the cached offline file(s).
4. **Retain** user‑created metadata where policy allows it — notes, highlights, bookmarks, progress — even though the underlying content itself is no longer available offline.
5. Clean up any orphaned files.

**Reliability requirement:** cleanup must work correctly even if the app was closed exactly when the entitlement expired. Use **WorkManager + a startup expiry check + a check at the moment of access** — never rely on a background scheduled task alone, since Android does not guarantee exact‑time execution. The access‑time check (`CanOpen`, J.1) is what actually enforces the rule; the scheduled cleanup is just tidiness.

## J.9 Re‑Unlock Flow

After expiry: user taps **"Use Offline Again"** → connectivity check → rewarded ad → **new** 24‑hour window is granted from the moment of the new reward, not extended from the old one.

## J.10 Offline UX States & Countdown Display

Every temporary resource needs a visible, honest status at all times — this is what makes the whole 24‑hour model feel understandable rather than surprising:

| State | Example display |
|---|---|
| Available Offline | `23h 41m remaining` |
| Expiring Soon | `1h 12m remaining` |
| Expired | `Offline access expired` |
| Downloading | `68%` |
| Waiting for network | `Waiting for internet` |
| Failed | `Couldn't prepare offline content` |

In Shelf, show either an absolute time (`Offline until · 03 Sep · 08:30`) or a relative countdown (`23h 42m remaining`) — update this periodically, not every millisecond.

## J.11 Clock‑Tampering Protection

A user can manually change the device clock, so expiry must **not** rely solely on `System.currentTimeMillis()`. Use a trusted‑time strategy whenever the device is online: server timestamp, last known trusted network time, and a monotonic elapsed‑time contribution, backed by secure local state — the goal is to prevent trivial clock‑forward/clock‑backward bypasses, not to claim perfect, unbeatable DRM. Be explicit internally that this system provides **access control + entitlement validation + expiry + controlled storage**, not absolute piracy prevention — don't market it as more than it is.

## J.12 Edge Cases

- **Expiry mid‑session:** if a user opens a book at `08:29` and it expires at `08:30`, the reader must not simply stay open indefinitely — validity is checked on open and at key transitions, and the session ends gracefully with the "Offline access expired" message once the entitlement lapses.
- **Content version changes while an offline package is active:** don't silently replace an active local file mid‑session in a way that breaks the user's current position; the *existing* offline package stays valid per its own granted window, and a fresh unlock always fetches the *latest* version.
- **Ad unavailable:** if a rewarded ad fails to load, never say "ad completed" and never grant the entitlement — show *"Rewarded ad isn't available right now"* with `[Try Again]` / `[Read Online]` (full detail in Part L.5).

---

# PART K — Backup & Restore System

## K.1 Overview & Local‑First Principle

Backup & Restore is **online/cloud‑based, but the complete backup is always generated locally on the device first** — only after that local backup exists and is validated does the cloud upload/restore process run. This slots naturally into the existing architecture (Room/local state, Firestore, Cloud Storage, sync queue) rather than requiring a parallel system.

Feature location: **Profile → Backup & Restore**, showing Backup Now, Restore Backup, Last Backup timestamp, and Backup Status ("Up to date").

**New components required:** `BackupManager`, `RestoreManager`, `BackupCryptoManager`, `BackupRepository` — added alongside the existing Room + cloud architecture, not replacing it.

**Requires an account** (Part I.1) — a cloud backup has to be tied to a secure identity: `Backup → Firebase Auth → UID → Cloud Backup`.

## K.2 Backup Flow (step by step)

```text
User taps "Backup Now"
        ↓
Account check → Internet check
        ↓
Explicit backup/reward consent dialog:
  "Backup Your Data — Your complete study data will first be
   prepared securely on this device and then backed up online.
   Watch a rewarded ad to continue."
  [Watch Ad & Backup]  [Cancel]
        ↓
FULL-SCREEN REWARDED AD  (not a plain interstitial — see Part L.2)
        ↓
Reward received
        ↓
CREATE COMPLETE LOCAL BACKUP  ← always happens before any upload
        ↓
VALIDATE BACKUP
        ↓
ENCRYPT / PACK BACKUP
        ↓
UPLOAD TO CLOUD
        ↓
VERIFY UPLOAD
        ↓
"Backup completed successfully"  ·  02 Sep 2026 · 08:53 AM
```

**Critical UX/product rule:** reward‑received and backup‑succeeded are **two separate states.** Never show "Your backup is complete" the moment the ad finishes — the correct sequence the UI must reflect is `Ad completed → Creating backup… → Uploading… → Verifying… → Backup completed`. Saying "complete" before the actual backup+upload+verify finished would be a misleading status, which this product should never do given how much trust users place in "backup succeeded."

**Backup progress screen (4 stages):**

| Stage | Label | Progress |
|---|---|---|
| 1 | Creating local backup… | 32% |
| 2 | Securing backup… | 64% |
| 3 | Uploading backup… | 82% |
| 4 | Verifying backup… | 100% |

**Manual only:** Backup Now is user‑triggered; the app does not silently auto‑upload backups in the background without an explicit tap. Optional auto‑sync could be a distinct, separately‑designed future mechanism (Part R.4), not part of this manual flow.

## K.3 What's Backed Up / Excluded

**Included** — this is deliberately *user‑generated/state data*, not large assets:

```text
manifest · profile · account-linked metadata
shelf (saved/finished/recently opened books)
reading (progress, positions, bookmarks, reading time)
annotations (highlights, notes, private comments)
study (quiz attempts/results, flashcard state, revision state)
preferences (theme, font size, reader settings, notifications)
sync (pending sync operations)
```

**Excluded on purpose:** PDF files, book cover cache, temporary downloaded content, image cache, temporary 24‑hour offline packages. These live in Cloud Storage / are re‑obtainable from the content system, so duplicating them into every backup would make backups unnecessarily huge for no benefit — this keeps backups small, fast, and focused on what can't be re‑fetched.

## K.4 Backup Data Schema

```text
TFStudyShelfBackup
├── manifest
├── profile
├── shelf
│   ├── savedBooks
│   ├── finishedBooks
│   └── recentlyOpened
├── reading
│   ├── progress
│   ├── positions
│   ├── bookmarks
│   └── readingTime
├── annotations
│   ├── highlights
│   ├── notes
│   └── privateComments
├── study
│   ├── quizAttempts
│   ├── quizResults
│   ├── flashcardState
│   └── revisionState
├── preferences
│   ├── theme
│   ├── fontSize
│   ├── lineSpacing
│   ├── margins
│   └── readerSettings
└── sync
    └── pendingOperations
```

## K.5 Encryption & Packaging Pipeline

Backups are never uploaded as a plain JSON/SQLite file:

```text
Local Data → Backup Builder → Canonical Backup Format → Compression
           → Encryption → Checksum → .tfsbackup file → Cloud Storage
```

Example filename: `TFStudyShelf_Backup_2026-09-02_0853.tfsbackup`

**The password is never stored in the backup file.** Only `userId`/Firebase UID, backup metadata and app data go into the package — authentication stays entirely within Firebase Auth.

## K.6 Cloud Storage Structure

```text
Cloud Storage
└── backups
    └── {uid}
        └── backup.tfsbackup

Firestore metadata document:
  backupId · uid · createdAt · backupVersion · appVersion
  schemaVersion · fileSize · checksum · deviceLabel · status
```

Access must be governed by authenticated Cloud Storage security rules, not open/public paths.

## K.7 Restore Flow (step by step)

```text
User taps "Restore Backup"
        ↓
Signed-in check → Internet check
        ↓
"Restore Backup? — This will replace your current app data
 with the selected backup."   [Restore Backup] [Cancel]
        ↓
FULL-SCREEN REWARDED AD
        ↓
Reward received
        ↓
Download cloud backup → Save locally
        ↓
Integrity / checksum validation → Decrypt
        ↓
Validate backup schema/version
        ↓
Show restore summary → User confirms
        ↓
Restore local database/state → Restart affected app state
        ↓
"Restore completed"
```

## K.8 Restore Validation & Safety Snapshot

**Before restoring anything**, take a safety snapshot of the existing local data:

```text
Existing local data → Create safety snapshot → Download cloud backup
                     → Validate → Restore
```

This prevents a corrupted or incompatible backup from destroying the user's current data immediately.

**Validate before restoring:** `backupVersion, schemaVersion, checksum, file integrity, user ownership, content structure, required fields, database compatibility.`

**If invalid:**
> **Backup couldn't be restored** — The backup appears incomplete or incompatible with this app version. Your current data has not been changed.

## K.9 Multiple Backup Versions

Don't keep a single overwriteable file. Retain the **latest 2 backups** by default (e.g. `02 Sep 2026 08:53` and `30 Aug 2026 18:21`), with an optional **"Delete old backup"** action — this materially improves recovery odds if the most recent backup turns out corrupted or failed partway.

## K.10 Backup & Restore Screen UI

```text
BACKUP & RESTORE
Your data — Everything synced to your account.

LAST BACKUP
02 Sep 2026 · 08:53 AM
✓ Backup available

BACKUP
Create a secure backup of your study data and save it online.
[ Backup Now ]

RESTORE
Restore your study data from your online backup.
[ Restore Backup ]

BACKUP STORAGE
Latest backup
Previous backup

Account
your@email.com
```

## K.11 Failure States

**Backup fails after local succeeded** (a very important distinct case — local backup already exists and should not be discarded):
> **Backup failed** — Your local backup was created successfully, but the online backup could not be uploaded.
> `[Retry Upload]` `[Keep Local Backup]` `[Cancel]`

**Offline for backup/restore:**
> Backup — *"Internet connection required — connect to the internet to upload your backup."*
> Restore — *"Internet connection required — connect to the internet to retrieve your online backup."*

**Difference from Android's own Auto Backup:** Android's built‑in system backup (to Google Drive) is system‑managed and outside app control. TF StudyShelf's Backup & Restore is a deliberate, **app‑controlled account backup** the user triggers explicitly, giving clear in‑app `Backup Now` / `Restore Backup` controls rather than relying on OS‑level behavior.

---

# PART L — Advertising System

## L.1 Ad Formats & Placement Rules

| Format | Placement | Rule |
|---|---|---|
| **Banner** | Persistent adaptive banner, just above bottom navigation | Must remain visually recognizable as an ad; never positioned where it could be mistaken for an interactive control |
| **Interstitial** | After a controlled number of qualifying activities (L.3) | Never during active reading, never unexpected/interruption-heavy |
| **Rewarded** | Explicit opt‑in gate for: 24h Offline Reading, 24h PDF Download, 24h Offline Study, Backup, Restore | Always disclosed before shown; reward only granted on verified completion |

**In‑content placement:** avoid a mechanical "ad every 2 pages" rule inside the reader — that is both an aggressive UX choice and a policy‑risk pattern (repetitive interstitial behavior draws extra scrutiny under Play's ad‑quality guidance). Prefer natural breaks instead: between recommendation cards, between book‑listing rows, between study modules, after a completed chapter, or roughly every 4–6 reading segments rather than a fixed page count — and always label the placement clearly as an ad.

**Never show a normal interstitial:** immediately after "Read Now," immediately before the first page, during text selection, during a quiz question, while submitting an answer, while downloading, immediately after a rewarded ad, during active annotation, or while the user is mid‑read. And never before the app's own splash/loading screen finishes (Part C.2).

## L.2 Rewarded Ad Disclosure & State Machine

**Disclosure copy pattern** (used consistently across every rewarded flow): *"Watch a rewarded ad to unlock \<X\> for 24 hours."* Avoid promising "you must watch a complete video" — rewarded inventory can be video, image, or interactive, so *"Watch a rewarded ad"* is both the accurate and the safer phrasing; implementation should gracefully handle whatever eligible format is actually served.

**Explicit state machine** — this exists specifically so the reward is never granted just because an ad was *requested*:

```text
IDLE → REQUESTED → AD_LOADING → AD_READY → USER_OPTED_IN
     → AD_SHOWING → REWARD_RECEIVED → ENTITLEMENT_GRANTED
     → DOWNLOAD_STARTED

Failure states: AD_FAILED · AD_CANCELLED · REWARD_NOT_RECEIVED · DOWNLOAD_FAILED
```

## L.3 Interstitial Rules & Activity Counting

Starting target: **15–25 qualifying activities** before an interstitial is eligible, using a randomized threshold rather than a fixed count, *plus* additional gates:

```text
randomThreshold = 15..25
PLUS: session cooldown · minimum time since last interstitial ·
      not mid-reading · not mid-quiz · not mid-download ·
      not mid-reward-flow · not during onboarding/startup ·
      not during an immediate content transition
```

**Counts as an activity:** open book, complete chapter, search, open PDF, save book, finish question set, complete quiz, open subject, finish a reading session.
**Does not count:** scroll, back press, settings change, font‑size adjustment — counting these would artificially inflate the activity counter and trigger interstitials too aggressively.

## L.4 AdManager & Configuration

Centralize all ad logic in one `AdManager` (with `Banner`, `Interstitial`, `Rewarded` sub‑components) and one `AdConfig.kt` holding all ad‑unit IDs, kept in clearly separate **TEST** and **PRODUCTION** sets so a test build can never accidentally serve — or accidentally fail to serve — real ads.

## L.5 Ad Failure Handling

If a rewarded ad fails to load:
> **"Rewarded ad isn't available right now."** `[Try Again]` `[Read Online]` (or the equivalent non‑offline fallback)

**Never** say "Ad completed" when it wasn't, and **never** grant a reward without a genuinely valid completion state — this applies uniformly across Offline Reading, PDF, Study, Backup and Restore.

## L.6 Server‑Side Reward Verification (Security) **[NEW]**

The existing anti‑abuse plan already calls for an idempotent `rewardTransactionId` so a reward is never granted twice for the same event (Part L.7) — the missing piece is *where that ID comes from and what actually authorizes the grant.*

**Recommendation: enable AdMob Server‑Side Verification (SSV) on every rewarded ad unit**, not just the client‑side reward callback. SSV works by having AdMob call a backend endpoint (e.g. a Firebase Cloud Function) with signed parameters after a user genuinely finishes a rewarded ad:

```text
Callback parameters include:
  ad_network · ad_unit · reward_amount · reward_item ·
  signature · key_id · timestamp · transaction_id ·
  user_id (if set) · custom_data (if set)
```

The backend verifies the `signature` against AdMob's published public keys (ECDSA) before treating the reward as authoritative. Recommended pattern for good UX **and** security together: grant the entitlement immediately from the client‑side callback so the user isn't kept waiting, but treat the **SSV callback's `transaction_id` as the true `rewardTransactionId`** used for idempotency and as the record that finalizes the entitlement server‑side — if SSV never arrives or fails verification, the entitlement can be flagged/revoked rather than trusted purely on the client's word. Set `custom_data` on the rewarded‑ad request to carry `userId + contentId + entitlementType`, so the callback tells the backend exactly what to unlock, for whom.

This closes the most realistic abuse path in the whole ads system: a modified/rooted client claiming "reward received" without Google ever actually confirming it.

## L.7 Anti‑Abuse / Revenue Protection

Guard against: fake ad completion, repeated callbacks, duplicate reward grants, rapid download abuse, automated API calls, content scraping, entitlement replay.

**Reward must be idempotent** — the same `rewardTransactionId` (ideally AdMob's own SSV `transaction_id`, L.6) must never grant the same entitlement twice.

---

# PART M — Content Management System

## M.1 Content Rights Metadata

Every book/PDF record: `rightsStatus (PUBLIC_DOMAIN | OPEN_LICENSE | AUTHORIZED | RESTRICTED)`, `licenseName`, `licenseSource`, `rightsHolder`, `permissionReference`, `allowedDownload`, `allowedOffline`, `allowedShare` (full detail and rationale in Part D.6).

## M.2 Content Publishing Workflow

```text
Draft → Review → Rights Verified → Published
```
A book cannot go public until: metadata is complete, cover is approved, content is checked, rights are checked, Q&A is checked, and the PDF is verified.

## M.3 Content Versioning

Books can be updated (`Version 1 → Version 2`). When a version changes: the online reader always gets the latest version; an *already‑active* offline package remains valid for its own granted window under defined content‑version rules; an expired package is simply removed; a fresh offline unlock always fetches the latest version. **Never** silently replace an active local file mid‑session in a way that would disrupt the user's current reading position.

## M.4 Admin CMS Functions

- **Content:** Books, PDFs, Chapters, Questions, Answers, Quizzes, Flashcards, Summaries, Authors, Subjects, Categories
- **Rights:** License info, proof/permission, download permission, offline permission
- **Operations:** Publish/unpublish, feature a book, schedule release, version content, replace PDF
- **Moderation:** Reports, comments, user reports, blocked content
- **[NEW] Emergency Unpublish:** for copyright complaints, incorrect content, safety issues, or license expiration — must be a fast, one‑click admin action, not a multi‑step process, since these situations are time‑sensitive.

## M.5 Download Manager

Dedicated service with clear states: `Queued → Downloading → Paused → Waiting for network → Completed → Expired → Failed → Cancelled`, with retry support built in from the start.

## M.6 Storage Management (User‑Facing)

Settings → Storage:
```text
Storage Used: 1.2 GB
  Offline Books · Temporary PDFs · Study Packs · Images/Assets · Cache
[ Clear Cache ]  [ Remove Expired Content ]  [ Manage Offline Content ]
```
Download preference options: Wi‑Fi only / Allow mobile data / Ask every time — noting that temporary offline access must still obey content rights regardless of network preference.

---

# PART N — Technical Architecture

## N.1 Technology Stack

Kotlin · Jetpack Compose · Material 3 · MVVM · Repository pattern · Room (local DB) · DataStore · WorkManager · Firebase Auth · Firestore · Cloud Storage · Crashlytics · Analytics · Remote Config · AdMob.

**Reader architecture** should isolate the UI from the network:
```text
UI → Reader ViewModel → Reader Repository → Content Provider → Local Cache / Remote API
```
so slow internet, network loss, or a server timeout degrade gracefully instead of crashing the app.

## N.2 Module Structure

```text
app
core
 ├── common · network · database · analytics
 ├── ads · security · connectivity

feature-home · feature-explore · feature-reader · feature-pdf
feature-study · feature-quiz · feature-flashcards
feature-shelf · feature-profile · feature-auth

domain
 ├── books · content · notes · highlights
 ├── offline · downloads · entitlements · sync
```

## N.3 Core Services

| Service | Responsibility |
|---|---|
| `ConnectivityManager` | Detect online / offline / captive‑portal‑or‑unstable states |
| `OfflineEntitlementManager` | 24‑hour access grant/verify/expire/purge (Part J) |
| `DownloadManager` | Temporary content download lifecycle (Part M.5) |
| `SyncManager` | Offline‑change sync queue (Part J.7) |
| `AdManager` | Banner / Interstitial / Rewarded (Part L) |
| `ReaderManager` | Book reading state |
| `PDFManager` | PDF reading/download state |
| `StudyEngine` | Quiz / flashcards / revision logic |
| `BackupManager` / `RestoreManager` / `BackupCryptoManager` / `BackupRepository` | Backup & Restore (Part K) |

## N.4 Data Separation

| Store | Holds |
|---|---|
| **Firestore** | Book/chapter metadata, questions, user state, notes, highlights, progress, entitlement metadata, backup metadata |
| **Cloud Storage** | PDFs, covers, content assets, audio assets, the `.tfsbackup` file itself |
| **Room (local)** | Local content cache, temporary offline package, local reading state, pending sync queue, temporary entitlement state |

## N.5 Security Model

- `CanOpen(content) = LocalFileExists AND EntitlementValid AND ContentVersionAllowed` (Part J.1) — never "file exists = access allowed."
- Where licensing permits: authenticated content access, short‑lived signed URLs, storage rules, rate limiting, download authorization; content should not sit behind permanently exposed public URLs.
- **Never** put Firebase/admin secrets inside the Android client.
- Rewarded‑ad rewards are authoritative only once verified server‑side (Part L.6).

## N.6 Push Notifications Infrastructure **[NEW]**

Notification content is already specified (Part O.1); the missing piece is the transport. Use **Firebase Cloud Messaging (FCM)**, with topic‑ or user‑targeted messages driven from the backend for: revision reminders, quiz reminders, new‑content alerts, and reading‑goal nudges. Respect a per‑category opt‑out in Settings → Notifications (not just one global on/off toggle), and never send a push that implies an offline entitlement can be extended remotely — that would contradict the entitlement model in Part J.

## N.7 Deep Linking **[NEW]**

Support deep links for: opening a specific book/chapter from a notification tap, sharing a book to another user (`tfstudyshelf://book/{bookId}`), and — where content rights allow sharing at all — a specific highlight or note. This should degrade gracefully (open the app to a sensible fallback screen) if the linked content no longer exists or isn't available in the user's region.

## N.8 Performance & Scalability

For a catalog that may reach thousands of books: pagination (e.g., load 20 at a time, never the whole catalog), lazy loading, image/metadata caching, background downloads, incremental search, local indexing, PDF streaming rather than full‑file loads where feasible, and memory‑safe rendering. Never load the entire catalog into memory at once.

## N.9 Device / OS Support Matrix **[NEW]**

Recommend a minimum of **Android 8.0 (API 26)** to keep the addressable market wide while still getting reliable WorkManager/notification‑channel behavior; confirm the actual floor against current Play Console device‑coverage data before locking it in. Support both phone and tablet layouts (Compose adaptive layouts), and both portrait and landscape, especially for the reader and PDF viewer.

---

# PART O — Engagement

## O.1 Notifications

Keep notifications genuinely useful, not spammy: continue‑reading nudges ("You are 12 pages away from finishing this chapter"), revision reminders ("Review your saved highlights from Chemistry"), new‑content alerts ("12 new books were added to Science"), and quiz reminders ("Your saved quiz is waiting"). See N.6 for delivery infrastructure.

## O.2 Recommendation System

**MVP:** simple rule‑based scoring using category, subject, reading history, saves, completion history, past searches, and quiz interests. **Later:** a proper ML‑based recommender can replace the rule‑based score without changing the UI contract.

## O.3 In‑App Review Prompts **[NEW]**

Use the Play Core **In‑App Review API** rather than a custom "rate us" dialog, and trigger it only after a clearly positive moment (e.g., completing a book or finishing a quiz with a good score) — never immediately after an ad, a failed action, or a backup/restore flow, since prompting right after friction produces both worse reviews and a worse impression of the ask itself.

## O.4 App Update Mechanism **[NEW]**

Use the Play Core **In‑App Update API** so schema‑breaking changes (e.g., a backup‑format version bump, Part K.4) can prompt an update rather than silently failing for users on an old client. Flexible updates for normal releases; consider a blocking/immediate update only for changes that would otherwise corrupt data (e.g., an incompatible backup schema change).

---

# PART P — Compliance, Privacy & Legal

> **Note:** this section is product/engineering guidance, not legal advice. Final sign‑off on privacy policy wording, age‑rating declarations, and regional compliance should come from qualified legal counsel and the current Play Console policy pages at submission time, since platform policy and privacy law both change.

## P.1 Privacy Policy, Terms & Data Deletion

Required documents/flows: Privacy Policy, Terms of Use, Content Rights Policy, cookie/consent handling where applicable, a documented data‑deletion process, in‑app **account deletion** (Part I.3), and ad/privacy controls. Play requires privacy disclosures and an ads declaration that accurately reflects the app's actual ad usage — the declared ad formats/SDKs must match what's really implemented.

**Regional data‑protection laws to account for** given the app's likely primary market: India's **Digital Personal Data Protection Act (DPDP Act, 2023)**, alongside GDPR if the catalog/user base extends to the EU/UK. Confirm current applicability and rules‑implementation status with counsel before launch, since implementation timelines for data‑protection law can shift.

## P.2 Google Play Families Policy & Child‑Directed Considerations **[NEW]**

This is a genuinely important open decision, not boilerplate: the persona list (Part A.3) explicitly includes **"School Student,"** and content categories include "School" — meaning a meaningful share of real users could plausibly be **under 13**. Google Play requires every app to **declare a target age group** in Play Console's "Target audience and content" section, and:

- If the declared target audience **includes children under 13** (either "designed primarily for children" or "designed for everyone, including children"), the app must comply with **Google Play Families Policy**: use only **Families Self‑Certified Ads SDKs**, serve **only non‑personalized ads** to children (a mixed‑audience app needs a **neutral age screen** so it can tell who should get non‑personalized ads), avoid transmitting device identifiers (AAID, IMEI, etc.) from children or users of unknown age, and keep app content/marketing appropriate for the youngest audience declared.
- If the app is declared **not designed for children** (e.g., "18+" or a general audience declaration with content clearly for teens/adults), it must still avoid **unintentionally appealing to children** in its store marketing and functionality — Google reviews this independently of the developer's self‑declaration.

**Recommendation:** decide this explicitly as a product decision before the first Play Console submission — don't let it default silently. Given competitive‑exam and college personas are adults/older teens, one reasonable option is to declare the target audience as teens‑and‑up rather than "designed for children," while still keeping content appropriate and ad SDKs configured conservatively; but this is exactly the kind of call that should be made deliberately with the actual expected age distribution of real users, not assumed.

## P.3 Data Safety Form & Content Rating

Play Console's **Data Safety** section must accurately list every category of data collected (account email, usage analytics, crash data, etc.) and how it's used/shared — this should be generated from the real analytics event list (Part Q.2) and Firebase configuration, not written independently of the implementation. The app will also need an **IARC content rating questionnaire** completed truthfully (education content with user‑generated private notes/comments typically rates low, but the questionnaire itself determines the final rating).

## P.4 Content Moderation & Emergency Takedown

Phase 1 ships with **private annotations only** (Part E.5) specifically to avoid needing public‑comment moderation tooling at launch. Whenever public/community comments ship (V3, Part R.3), reporting, blocking and moderator‑review tooling must exist from day one of that feature, not be retrofitted after abuse appears. Separately, Admin needs an **Emergency Unpublish** action available at all times (Part M.4) for copyright complaints, incorrect content, safety issues, or license expiry — and a documented process for handling copyright takedown requests and any counter‑notice from a rights holder.

## P.5 Localization Strategy **[NEW]**

Given the product's working language in planning has been Hindi/English (Hinglish), decide the **UI localization** scope explicitly: at minimum, ship the interface in **English**, with **Hindi** as a strong candidate second locale given the likely primary market — this is separate from *content* language, which is whatever language each book/PDF is actually written in (already covered by the `language` field on a Book record, Part M.1 content schema in the original DB structure). Don't conflate "the app supports Hindi UI" with "the catalog contains Hindi‑language books" — these are two independent decisions.

---

# PART Q — Quality Assurance

## Q.1 Error Handling States

Every network‑dependent action needs explicit states — no blank screens, ever: **Loading, Success, Offline, Timeout, Retry, Cancelled, Permission denied, Content unavailable.**

## Q.2 Analytics Events (reference list)

```text
app_opened · book_opened · chapter_opened · pdf_opened
search_performed · book_saved
highlight_created · note_created · bookmark_created
quiz_started · quiz_completed · question_answered
flashcard_reviewed
offline_unlock_requested · rewarded_ad_started · rewarded_ad_completed
offline_package_downloaded · offline_package_expired
pdf_download_requested · pdf_download_completed · pdf_download_expired
interstitial_shown
backup_started · backup_completed · backup_failed
restore_started · restore_completed · restore_failed
account_created · account_deleted
```
Collect no more personal data than these events require, and make sure this exact list is what gets declared in the Play Console Data Safety form (Part P.3) — the two must stay in sync as features change.

## Q.3 QA & Testing Strategy **[NEW]**

| Layer | Focus |
|---|---|
| Unit tests | Entitlement expiry math (J.5/J.8), backup checksum/validation logic (K.8), reward idempotency (L.7) |
| Integration tests | Offline → online transition sync (J.7), AdMob SSV callback handling (L.6), Firestore/Cloud Storage read/write rules |
| UI tests | The three rewarded‑ad flows end‑to‑end (Offline Reading, PDF, Study), Backup/Restore happy path and failure path |
| Manual QA checklist | Clock‑tampering scenarios (J.11), expiry‑at‑exact‑boundary (J.12), app killed mid‑expiry, ad SDK failure simulation, restore of a deliberately corrupted backup |
| Device matrix | A representative spread of Android versions/screen sizes per N.9, with particular attention to low‑end devices given the free/ad‑supported, broad‑reach audience |

## Q.4 Acceptance Criteria

**Offline Reading**
- [ ] Offline button exists and always checks connectivity first
- [ ] Offline state shows a clear internet‑required message; no ad is attempted
- [ ] Online state shows the reward disclosure before any ad loads
- [ ] Reward completion is verified (client callback + SSV, Part L.6) before the entitlement is granted
- [ ] Offline package downloads and opens with no internet
- [ ] All Feature‑Matrix items (J.6) work exactly as specified offline
- [ ] Entitlement lasts exactly 24 hours and expiry is enforced on open, not just by a background job
- [ ] Expired package is removed/locked and re‑unlock requires another rewarded action
- [ ] No path exists to infinite/unintended offline access

**PDF Download**
- [ ] Offline attempt shows the internet‑required state with no ad attempt
- [ ] Online attempt shows the rewarded unlock dialog
- [ ] Reward must genuinely complete before download starts
- [ ] The app's own internal PDF reader opens the file, with reader tools functional
- [ ] Expiry metadata is stored and enforced at exactly 24 hours
- [ ] Expired PDF's temporary content is removed; re‑download requires a fresh unlock
- [ ] A failed ad never grants a download; a failed download can be retried

**Offline Study**
- [ ] Reward unlock required before package download
- [ ] Questions, quiz, and flashcards all function against the downloaded package
- [ ] Local results (score, attempts, incorrect items) save correctly offline
- [ ] Notes/highlights created offline save locally
- [ ] Expiry enforced at 24 hours; re‑unlock available afterward
- [ ] Results sync correctly after reconnection, with quiz history appended, never overwritten

**Backup & Restore [NEW]**
- [ ] Local backup is always created and validated *before* any cloud upload is attempted
- [ ] Reward completion never itself implies backup success — the four‑stage progress UI (K.2) is shown and accurate
- [ ] A failed cloud upload after a successful local backup offers Retry Upload / Keep Local Backup, and never discards the local backup
- [ ] Restore takes a safety snapshot before overwriting local data
- [ ] Invalid/incompatible backups are rejected with the current data left untouched
- [ ] No plaintext password ever appears inside a backup file
- [ ] Latest 2 backups are retained by default, with a manual delete‑old‑backup option

---

# PART R — Roadmap

## R.1 MVP (V1)

**Content:** Books, authorized PDFs, chapters, Q&A.
**Reading:** Reader, bookmarks, highlights, notes, dark/light mode, font scaling.
**Study:** Questions, basic quiz, progress tracking.
**Offline:** 24‑hour offline reading, 24‑hour PDF download, 24‑hour offline study (Part J, in full).
**Backup:** Local‑first backup + cloud restore (Part K, in full) — included in V1 given how central it is to this spec, not deferred to V2.
**Ads:** Banner, rewarded (with SSV, Part L.6), controlled interstitial.
**Platform:** Firebase, Room, sync, Admin CMS, Analytics, Crashlytics.
**Account:** Email/password auth, guest browsing.

## R.2 V2

AI Study Assistant · Flashcards (if not already in V1 scope) · Advanced quiz · Study streak · Mistake Bank · Text‑to‑speech · Learning Paths · Smarter recommendations · Advanced statistics · Study Packs.

## R.3 V3

Community discussions · shared annotations · study groups · teacher‑created questions · content collections at scale · challenges/achievements · proper spaced‑repetition scheduling · multi‑language content expansion. **Any public/community feature in this phase ships with moderation/report/block tooling from day one** (Part P.4).

## R.4 Future Ideas Backlog **[NEW — not scoped, just captured so nothing is lost]**

- Voice search on Home/Explore
- TTS sleep timer
- Optional background auto‑sync (distinct from manual Backup Now)
- Home‑screen widget (e.g., "Continue Reading")
- Referral/invite‑a‑friend sharing
- Exam/board metadata tags on content (JEE/NEET/UPSC/SSC/CBSE/ICSE/State Boards) for finer Explore/Search filtering
- iOS port (architecture in Part N is written to make this realistic later)

---

# PART S — Success Metrics & Risk Register

## S.1 Success Metrics / KPIs **[NEW]**

| Category | Metric |
|---|---|
| Engagement | DAU/MAU, average session length, D1/D7/D30 retention |
| Monetization | ARPDAU (ad revenue per daily active user), rewarded‑ad completion rate, fill rate by ad format |
| Feature adoption | % of sessions using Offline Reading/PDF/Study, backup adoption rate among signed‑in users, restore success rate |
| Study outcomes | Quiz completion rate, average quiz accuracy, flashcard review frequency, revision‑center weekly usage |
| Quality | Crash‑free session rate, ANR rate, backup/restore failure rate, expired‑content cleanup reliability |

## S.2 Risk Register **[NEW]**

| Risk | Impact | Mitigation |
|---|---|---|
| Rewarded ad fill rate is low in some markets/times, blocking a core feature | Users can't get offline access when they need it most | Always offer a graceful "Read Online" fallback (Part L.5); never hard‑block basic reading behind an ad |
| Content licensing gaps (a book turns out not properly rights‑cleared) | Takedown, policy strike, reputational risk | Rights metadata mandatory at ingestion (Part D.6/M.1); Emergency Unpublish always available (Part M.4) |
| Play Families Policy misdeclaration | App rejection or suspension | Decide target audience explicitly pre‑submission (Part P.2), don't default silently |
| Client‑side reward spoofing | Free entitlements without real ad revenue | AdMob SSV as the authoritative reward source (Part L.6) |
| 24‑hour expiry frustrates heavy users (e.g., mid‑exam‑prep) | Churn, negative reviews | Clear countdowns (J.10) and a frictionless re‑unlock flow (J.9); consider longer windows for Study Packs later if data supports it |
| Backup/restore data loss due to a bad restore | Severe trust damage | Safety snapshot before every restore (K.8) is mandatory, not optional |
| Ad load required before backup/restore blocks users with poor connectivity from ever backing up | Users lose data if device is lost with no backup ever completed | Same graceful offline messaging pattern as offline content (K.11); consider whether backup should eventually get an ad‑free path for reliability, as a product decision to revisit post‑launch |

---

# Appendix

## Glossary **[NEW]**

| Term | Meaning |
|---|---|
| **Entitlement** | A time‑boxed grant of access to a piece of content (offline book, PDF, or study package), always re‑checked against `expiresAt`, never assumed from a file's mere presence |
| **Rewarded ad** | An ad format the user opts into watching in exchange for a defined reward; contrasted with an interstitial, which is not opt‑in |
| **SSV (Server‑Side Verification)** | AdMob's backend callback that cryptographically confirms a rewarded ad was genuinely completed, used as the authoritative source for granting a reward |
| **`.tfsbackup`** | The app's packaged, encrypted backup file format |
| **Safety snapshot** | A backup of current local data taken immediately before a restore, so a bad restore can't destroy existing data |
| **Rights status** | The licensing category of a piece of content (`PUBLIC_DOMAIN`, `OPEN_LICENSE`, `AUTHORIZED`, `RESTRICTED`) that governs whether it can be read, downloaded, or shared |
| **Qualifying activity** | A meaningful user action (opening a book, finishing a quiz, etc.) that counts toward the interstitial‑ad threshold; trivial taps/scrolls do not count |

## Alternate App Name Candidates (historical reference)

For context on how the current name was chosen — kept here for the record, not as an active decision to revisit:

| Rank | Name | Package | Notes |
|---|---|---|---|
| 1 | **TF StudyShelf** (chosen) | `com.techilyfly.tfstudyshelf` | "Shelf" scales naturally to books+PDFs+highlights+notes+questions |
| 2 | TF BookSpace | `com.techilyfly.tfbookspace` | Entire book universe |
| 3 | TF Scholar | `com.techilyfly.tfscholar` | Academic/serious tone |
| 4 | TF BookVerse | `com.techilyfly.tfbookverse` | Ecosystem framing |
| 5 | TF StudyBooks | `com.techilyfly.tfstudybooks` | Very literal |
| 6 | TF ReadHub | `com.techilyfly.tfreadhub` | Reading + community framing |
| 7 | TF BookNest | `com.techilyfly.tfbooknest` | Friendly/casual |
| 8 | TF Pages | `com.techilyfly.tfpages` | Minimal |
| 9 | TF OpenBooks | `com.techilyfly.tfopenbooks` | Emphasizes open/free content |
| 10 | TF LearnLibrary | `com.techilyfly.tflearnlibrary` | Descriptive but generic |

**Avoided:** "TF Reader" — an existing, established app already uses that name on Google Play.

## Full Screen Reference

See Part C.1 for the navigable screen tree. Key screens not to lose track of during implementation planning: Backup & Restore (Part K.10), the three rewarded‑unlock dialogs (Part J.2/J.3/J.4), the Offline/Downloads view in Shelf with live countdowns (Part J.10), Account & Data Deletion (Part I.3), and Storage Management (Part M.6).

---

*End of document. This spec supersedes all prior partial drafts; nothing from the original concept, the offline‑access requirements, or the backup/restore requirements has been removed — only reorganized, cross‑referenced, and completed where gaps existed.*
