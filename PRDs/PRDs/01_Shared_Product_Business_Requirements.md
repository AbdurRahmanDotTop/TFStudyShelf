# TF Study Shelf — Shared Product & Business Requirements

**Document:** 01 — Shared Product & Business Requirements  
**Version:** 1.0  
**Date:** September 2, 2026  
**Applies to:** [SHARED] Web Platform + Mobile App  

---

## Table of Contents

1. [Product Identity](#1-product-identity)
2. [Vision & Core Pillars](#2-vision--core-pillars)
3. [Target Users & Personas](#3-target-users--personas)
4. [Business Model & Monetization](#4-business-model--monetization)
5. [Competitive Frame](#5-competitive-frame)
6. [Brand & Design System](#6-brand--design-system)
7. [Content Rights & Sourcing Policy](#7-content-rights--sourcing-policy)
8. [Feature Prioritization & Roadmap](#8-feature-prioritization--roadmap)
9. [Success Metrics & KPIs](#9-success-metrics--kpis)
10. [Risk Register](#10-risk-register)
11. [Glossary](#11-glossary)

---

## 1. Product Identity

### 1.1 Core Identity

| Field | Value |
|---|---|
| Product Name | **TF Study Shelf** |
| Mobile App Package | `com.techilyfly.tfstudyshelf` |
| Web Domain | Hosted on Cloudflare Pages |
| Tagline | **Read. Learn. Remember.** |
| Category | Education / Books & Reference / E-Learning |
| Pricing | 100% free, ad-supported, no IAP, no premium tier |

### 1.2 Brand Positioning Statement

> A completely free, ad-supported digital reading and study platform where users can discover authorized books and PDFs, read them online, temporarily use them offline, study chapter-wise questions and answers, highlight and annotate content, create notes, practice quizzes, use flashcards, track progress, and build a personal learning library — all managed through a comprehensive admin panel with Google Drive, YouTube, and Cloudflare integration.

### 1.3 Store & Marketing Positioning Rule

**Feature Name:** Brand Positioning  
**Objective:** Ensure the product is perceived as a study platform, not a piracy tool.  
**User Story:** As a product stakeholder, I want the app to be positioned as "Free Reading & Learning Library" so that we attract genuine learners and avoid policy/legal risks.

**Business Rules:**
- Never market this as "free PDF downloader"
- Position it as **"Free Reading & Learning Library"**
- A PDF-downloader framing invites users looking for unrestricted copyrighted downloads and creates content-rights and Play policy risk
- The download feature is one feature of a study platform, not the identity of the product

### 1.4 Platform Distribution

| Platform | Technology Stack | Primary Focus |
|---|---|---|
| **Web** | Cloudflare Pages/Workers, D1 Database, HTML/CSS/JS | Admin content management (A-to-Z), user-facing content consumption |
| **Mobile App** | **Flutter + Dart** (Android) | End-user content consumption, offline access, study tools |

### 1.5 Key Product Requirement — Admin Manageability

> **Every single feature and content element across the entire product must be manageable from the admin panel (web platform).** This includes but is not limited to:
> - All content (books, PDFs, videos, questions, answers, quizzes, flashcards, summaries)
> - All ad units and placements
> - User accounts and passwords
> - Categories, subjects, study packs, collections
> - App configuration and feature flags
> - Notifications and announcements

This is a **non-negotiable architectural requirement** — → See [10 Admin & Content Management](./10_Admin_Content_Management.md).

---

## 2. Vision & Core Pillars

### 2.1 Product Vision

Don't build "a PDF reader." Build **Digital Library + PDF Reader + Study Platform + Annotation Tool + Q&A Platform + Quiz App + Personal Study Shelf**, combined into a single coherent product.

### 2.2 Five Core Pillars

| Pillar | What It Covers | Key Features |
|---|---|---|
| **READ** | Books, PDFs, chapters, documents | In-app reader, PDF viewer, chapter navigation, bookmarks |
| **UNDERSTAND** | Q&A, summaries, key concepts, explanations | Structured questions per book/chapter, AI assistant, summaries |
| **STUDY** | Active learning tools | Highlights, notes, flashcards, quizzes, revision center |
| **REMEMBER** | Retention and progress | Progress tracking, mistake bank, spaced revision, study statistics |
| **MANAGE** | Admin control | Content CMS, user management, ad management, analytics |

### 2.3 Core Learning Loop

```
Discover → Read → Highlight → Note → Understand → Practice → Quiz → Revise → Remember → Continue Learning
```

### 2.4 Admin Management Loop

```
Login → Manage Content (Books/PDFs/Videos) → Upload to Google Drive/YouTube → Configure Ad Units → Monitor Analytics → Manage Users
```

---

## 3. Target Users & Personas

### 3.1 Persona Table

| Persona | Profile | Needs | Platform Usage |
|---|---|---|---|
| **Admin / Content Manager** | Manages all content, users, ads | Full CMS, user management, analytics | Web (primary) |
| **School Student** | Class 6–12, revising textbook/board syllabus | Chapter Q&A, quizzes, flashcards, short study sessions | App (primary), Web |
| **College Student** | Reading assigned books/PDFs for courses | Highlights, notes, search inside PDFs, offline access before exams | App (primary), Web |
| **Competitive-Exam Aspirant** | Preparing for JEE/NEET/UPSC/SSC/banking exams | Study packs, mistake bank, timed quizzes, revision center | App (primary), Web |
| **Lifelong Learner** | Reading non-fiction/self-development books | Reading goals, streaks, AI summaries, TTS for commute listening | App (primary), Web |

### 3.2 Age Considerations

**Feature Name:** Age Group Declaration  
**Objective:** Comply with Google Play Families Policy and relevant privacy laws.

The persona list includes "School Student" (Class 6–12), meaning a meaningful share of users could be **under 13**. This directly impacts:
- Google Play target age group declaration
- Ad SDK configuration (Families Self-Certified Ads SDKs)
- Personalized vs. non-personalized ads
- Data collection and privacy controls
- COPPA / DPDP Act compliance

**Decision Required:** The team must explicitly decide the target age group before first Play Console submission.

**Recommendation:** Declare target audience as teens-and-up (13+) rather than "designed for children," while keeping content appropriate and ad SDKs configured conservatively.

→ See [08 Authentication & Security](./08_Authentication_Security.md) § 7 for full privacy/compliance requirements.

---

## 4. Business Model & Monetization

### 4.1 Pricing — Completely Free, Forever

| Pricing Element | Status |
|---|---|
| Subscription | ❌ Not supported — ever |
| Premium plan | ❌ Not supported — ever |
| In-app purchases | ❌ Not supported — ever |
| Coins / virtual currency | ❌ Not supported — ever |
| Paid books / paid membership | ❌ Not supported — ever |

### 4.2 Revenue — Ad-Only

Revenue comes exclusively from three ad formats:

| Ad Format | Placement | Purpose |
|---|---|---|
| **Banner Ads** | Persistent adaptive banner (above bottom nav on app; header/footer/sidebar on web) | Ambient revenue from all sessions |
| **Interstitial Ads** | After controlled number of qualifying activities | Revenue from engaged users, never during critical actions |
| **Rewarded Ads** | Gate for high-value voluntary actions | Revenue from opt-in actions: offline reading, PDF download, offline study, backup, restore |

### 4.3 Core Monetization Rule

> **Monetize access to extra value; never block basic app usage.** Anyone should be able to browse, search, and read available online content without hitting an ad wall. Rewarded ads are reserved for genuinely valuable, optional actions the user opts into.

### 4.4 Ad Revenue Channels by Platform

| Channel | Web | App |
|---|---|---|
| Banner Ads | ✅ Header/footer/sidebar | ✅ Above bottom navigation |
| Interstitial Ads | ✅ Between page transitions | ✅ After qualifying activities |
| Rewarded Ads | ✅ For bonus features | ✅ For offline access, backup/restore |

→ See [09 Ads & Monetization](./09_Ads_Monetization.md) for complete ad system specification.

---

## 5. Competitive Frame

### 5.1 Market Position

TF Study Shelf sits between three existing categories:

| Category | What We Borrow | Our Differentiator |
|---|---|---|
| **E-Readers** (Kindle-style) | Reading customization, shelf/library metaphor, highlights/notes | We add structured study tools (Q&A, quizzes, flashcards) |
| **PDF Utility Apps** | "Watch ad, get temporary download" pattern | Our content itself (Q&A, quizzes) is structured, not just raw files |
| **Exam-Prep Apps** | Study tools, question banks | We're ad-only and free, sourced from public-domain/licensed material |

### 5.2 Design Bar

The product should feel like a **premium reading app + a modern study workspace**, not a generic "education app" clone.

→ See [05 UI/UX Requirements](./05_UI_UX_Requirements.md) for visual language guidance.

---

## 6. Brand & Design System

### 6.1 Naming & Branding

| Element | Value |
|---|---|
| Chosen Name | **TF Study Shelf** |
| Package Name | `com.techilyfly.tfstudyshelf` |
| Brand Prefix | `TF` — retained as permanent brand architecture |
| Brand Line | *TF Study Shelf — Read. Learn. Practice. Remember.* |

**Why "StudyShelf":** It does not restrict the product to "books." A shelf naturally accommodates books, PDFs, highlights, notes, questions, bookmarks and study material — new features fit the name instead of fighting it.

**Avoided:** "TF Reader" — an existing, established Android app already uses that name.

### 6.2 Logo Concept

- **Mark:** A stylized **T + F + open book**, where the book's spine/pages form the horizontal structure of the T/F letterforms
- **Primary lockup:** `TF` mark above `STUDYSHELF` wordmark
- **Color treatment:** Brand gradient `#FF7759 → #212121`
- **Size requirements:** Must work at small sizes across: app icon, splash screen, website, social avatars, admin dashboard favicon

### 6.3 Color System

**Strict palette — only three base colors plus derived alpha/gradient variants:**

| Token | Hex | Role |
|---|---|---|
| Primary Dark | `#212121` | Text / background in dark mode |
| Accent | `#FF7759` | CTAs, highlights, active states, gradient |
| Off-White | `#FAFAFA` | Background / text in dark mode |

**Hard Rule:** No unrelated blue/green/purple accent families, ever. All secondary shades (borders, disabled states, highlight categories) must be **alpha variants of these three colors**, not new hues.

**Light Mode:**
- Background: `#FAFAFA`
- Text: `#212121`
- Accent: `#FF7759`
- Cards: `#FAFAFA` with subtle border
- Borders: `#212121` at low alpha
- Accent actions: `#FF7759`

**Dark Mode:**
- Background: `#212121` — **no pure black**
- Text: `#FAFAFA`
- Accent: `#FF7759`
- Cards: Slightly lighter than `#212121`

### 6.4 Typography

| Font | Used For | Platform |
|---|---|---|
| **Manrope** (primary) | Titles, body text, buttons, navigation, descriptions | Both |
| **Geist Mono** (secondary/technical) | Page numbers, percentages, reading time, statistics, quiz scores, technical metadata | Both |

**Rule:** Never use Geist Mono for normal reading paragraphs — it is a technical/statistical accent font only.

**Font-Size Settings:** Small / Default / Large / Extra Large / Huge, as a slider with live preview, persisted across sessions and devices (once account sync exists).

### 6.5 Gradient System

**Primary Signature Gradient:** `#FF7759 → #212121`

**Use selectively:**
- ✅ Hero banners, primary CTAs, featured book cards, progress indicators, achievement moments, empty states, selected cards, special section headers
- ❌ Ordinary list rows, standard buttons, backgrounds broadly

**Restraint is what keeps it feeling premium.**

### 6.6 Theme System

Three theme options: **System / Light / Dark** — all selectable in Settings → Appearance, with "System" as default for new installs.

### 6.7 Visual Design Principles

**Design Language:** Editorial + Academic + Modern

**Do:**
- Large, confident typography and generous whitespace
- Soft-rounded cards, very subtle borders
- Orange accent used as punctuation, not wallpaper
- Warm off-white / dark charcoal surfaces
- Controlled, purposeful gradients
- Minimal, consistent iconography

**Avoid:**
- Glassmorphism everywhere
- Heavy drop shadows
- "Rainbow" category chips (breaks the 3-color rule)
- Pill overload
- Excessive motion/animation
- Cartoonish or overly colorful "kids' education app" aesthetic

---

## 7. Content Rights & Sourcing Policy

### 7.1 Core Constraint

**This is a mandatory, non-negotiable architectural constraint**, not a nice-to-have. Publicly finding a PDF online does **not** grant redistribution rights.

### 7.2 Allowed Content Sources

The catalog must be built from three sources only:

| Source Type | Description | Example |
|---|---|---|
| **Public Domain** | Material legally redistributable with no copyright restrictions | Classic literature, government publications |
| **Open License** | Content with license explicitly allowing redistribution | Creative Commons, MIT-licensed educational material |
| **Licensed / Authorized** | Explicit permission from authors, publishers, or institutions | Publisher agreements, author permissions |

### 7.3 Rights Metadata Schema

Every book/PDF record **must** carry the following rights metadata:

```
rightsStatus:          PUBLIC_DOMAIN | OPEN_LICENSE | AUTHORIZED | RESTRICTED
licenseName:          String (e.g., "CC BY-SA 4.0")
licenseSource:        URL or reference
rightsHolder:         String (person or organization)
permissionReference:  String (document/email reference)
allowedDownload:      Boolean
allowedOffline:       Boolean
allowedShare:         Boolean
```

### 7.4 Enforcement Rules

| Rule | Description |
|---|---|
| Backend enforcement | The backend must enforce `canRead / canDownload / canShare / canOffline` from rights metadata |
| No URL assumptions | Never assume a PDF URL existing means it's safe to distribute |
| Play Store compliance | Google Play's Intellectual Property policy requires properly licensed/authorized content |
| Download restriction | Download button only appears for content where `allowedDownload = true` |
| Share restriction | Share action only appears for content where `allowedShare = true` |
| Offline restriction | Offline access only offered for content where `allowedOffline = true` |

### 7.5 Content Publishing Gate

A book/PDF cannot be published until:
1. ✅ Metadata is complete
2. ✅ Cover image is approved
3. ✅ Content is quality-checked
4. ✅ Rights are verified
5. ✅ Q&A content is reviewed
6. ✅ PDF is verified (if applicable)

→ See [10 Admin & Content Management](./10_Admin_Content_Management.md) § 3 for the full publishing workflow.

---

## 8. Feature Prioritization & Roadmap

### 8.1 MVP (V1)

| Area | Features |
|---|---|
| **Content** | Books, authorized PDFs, chapters, Q&A |
| **Reading** | Reader, bookmarks, highlights, notes, dark/light mode, font scaling |
| **Study** | Questions, basic quiz, progress tracking |
| **Offline** | 24-hour offline reading, 24-hour PDF download, 24-hour offline study |
| **Backup** | Local-first backup + cloud restore |
| **Ads** | Banner, rewarded (with SSV), controlled interstitial |
| **Platform** | Firebase Auth, Firestore, Cloud Storage, sync, Admin CMS, Analytics, Crashlytics |
| **Account** | Email/password auth, guest browsing |
| **Web Admin** | Full CMS, user management, ad configuration, content upload |

### 8.2 V2

- AI Study Assistant
- Flashcards (if not in V1)
- Advanced quiz engine
- Study streaks
- Mistake Bank
- Text-to-Speech
- Learning Paths
- Smarter recommendations
- Advanced statistics
- Study Packs

### 8.3 V3

- Community discussions
- Shared annotations
- Study groups
- Teacher-created questions
- Content collections at scale
- Challenges/achievements
- Spaced-repetition scheduling
- Multi-language content expansion

### 8.4 Future Ideas Backlog

- Voice search on Home/Explore
- TTS sleep timer
- Optional background auto-sync
- Home-screen widget ("Continue Reading")
- Referral/invite-a-friend sharing
- Exam/board metadata tags (JEE/NEET/UPSC/SSC/CBSE/ICSE/State Boards)
- iOS port (Flutter enables this naturally)

---

## 9. Success Metrics & KPIs

### 9.1 Engagement Metrics

| Metric | Target (V1) | Measurement |
|---|---|---|
| DAU/MAU Ratio | > 20% | Firebase Analytics |
| Average Session Length | > 8 minutes | Firebase Analytics |
| D1 Retention | > 40% | Firebase Analytics |
| D7 Retention | > 25% | Firebase Analytics |
| D30 Retention | > 15% | Firebase Analytics |

### 9.2 Monetization Metrics

| Metric | Target | Measurement |
|---|---|---|
| ARPDAU | Market benchmark | AdMob reporting |
| Rewarded Ad Completion Rate | > 70% | AdMob + SSV |
| Ad Fill Rate | > 90% | AdMob reporting |
| Interstitial Click-Through | Healthy range per market | AdMob reporting |

### 9.3 Feature Adoption Metrics

| Metric | Target | Measurement |
|---|---|---|
| % Sessions Using Offline Access | > 15% | Custom analytics |
| Backup Adoption (signed-in users) | > 30% | Custom analytics |
| Restore Success Rate | > 95% | Custom analytics |
| Quiz Completion Rate | > 60% | Custom analytics |

### 9.4 Quality Metrics

| Metric | Target | Measurement |
|---|---|---|
| Crash-Free Session Rate | > 99.5% | Crashlytics |
| ANR Rate | < 0.5% | Play Console |
| Backup/Restore Failure Rate | < 2% | Custom analytics |
| Expired Content Cleanup Reliability | > 99% | Custom analytics |

---

## 10. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Low rewarded ad fill rate in some markets | Users can't get offline access | Medium | Always offer "Read Online" fallback; never hard-block basic reading behind an ad |
| Content licensing gaps | Takedown, policy strike, reputation damage | Medium | Rights metadata mandatory at ingestion; Emergency Unpublish always available |
| Play Families Policy misdeclaration | App rejection or suspension | Low | Decide target audience explicitly pre-submission |
| Client-side reward spoofing | Free entitlements without real ad revenue | Medium | AdMob SSV as authoritative reward source |
| 24-hour expiry frustration | Churn, negative reviews | Medium | Clear countdowns, frictionless re-unlock; consider longer windows for Study Packs later |
| Backup/restore data loss | Severe trust damage | Low | Safety snapshot before every restore is mandatory |
| Poor connectivity blocking backup | Users lose data if device is lost | Medium | Graceful offline messaging; consider ad-free backup path post-launch |
| Google Drive API quota limits | Content delivery disruption | Medium | Implement caching, CDN fallback, quota monitoring |
| YouTube video unavailability | Video content gaps | Low | Mirror critical videos; admin notifications for unavailable content |
| Flutter framework breaking changes | Development delays | Low | Pin Flutter SDK version; regular update cycles |

---

## 11. Glossary

| Term | Meaning |
|---|---|
| **Entitlement** | A time-boxed grant of access to content (offline book, PDF, or study package), always re-checked against `expiresAt` |
| **Rewarded Ad** | An ad format the user opts into watching in exchange for a defined reward |
| **SSV (Server-Side Verification)** | AdMob's backend callback that cryptographically confirms a rewarded ad was genuinely completed |
| **`.tfsbackup`** | The app's packaged, encrypted backup file format |
| **Safety Snapshot** | A backup of current local data taken before a restore, so a bad restore can't destroy existing data |
| **Rights Status** | Licensing category of content (`PUBLIC_DOMAIN`, `OPEN_LICENSE`, `AUTHORIZED`, `RESTRICTED`) |
| **Qualifying Activity** | A meaningful user action that counts toward the interstitial ad threshold |
| **CMS** | Content Management System — the admin panel for managing all content and settings |
| **D1** | Cloudflare's serverless SQL database |
| **Workers** | Cloudflare's serverless compute platform |
| **Study Pack** | An admin-curated bundle of books, PDFs, questions, quizzes, and flashcards as one unit |
| **Content Collection** | A lighter, editorial grouping of related content |
| **Learning Path** | A sequenced curriculum of study content |

---

*This document serves as the foundation for all other PRDs. All platform-specific documents must be consistent with the requirements defined here.*
