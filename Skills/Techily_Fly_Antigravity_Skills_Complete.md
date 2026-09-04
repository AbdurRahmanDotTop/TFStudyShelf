# TF Study Shelf — Complete Antigravity Skills Knowledge Base

**Document Version:** 1.0
**Date:** September 3, 2026
**Product:** TF Study Shelf
**Tagline:** Read. Learn. Remember.
**Scope:** Complete skill coverage for both platforms — Flutter Mobile App + Cloudflare Web Platform

---

## Purpose

This file is the **comprehensive Antigravity agent skill knowledge base** for the TF Study Shelf project. It defines every technology, framework, pattern, tool, and engineering practice the AI agent needs to effectively build, test, secure, optimize, deploy, and maintain the TF Study Shelf product ecosystem.

---

## Source-of-Truth Documents

The agent must use these documents as primary implementation references, in this priority order:

1. **PRD Suite** (`PRDs/PRDs/00-12`) — All 13 Product Requirements Documents
2. **TF Study Shelf Tech Stacks** (`Private/Tech Stacks/tech_stacks.md`) — Authoritative technology list
3. **TF Study Shelf Design System** (`Private/private/designandlayout/design_and_layout.md`) — Complete design tokens and component library
4. **TF Study Shelf User Flows** (`Private/private/Walkthrough/walkthrough.md`) — Complete user flow diagrams
5. **This Skills File** — Agent capability map and skill definitions

When sources conflict, follow the priority order above. PRDs always override this file.

---

## Platform Architecture Summary

| Platform | Technology | Role |
|---|---|---|
| **Mobile App** | Flutter + Dart (Android) | End-user content consumption, offline access, study tools |
| **Web Platform** | Cloudflare Pages/Workers, HTML/CSS/JS, D1 | Admin CMS (A-to-Z), user-facing content consumption |
| **Backend** | Cloudflare Workers (serverless API) | API layer, SSV verification, PDF proxy |
| **Database** | Cloudflare D1 (server), Drift/SQLite (local) | Content catalog, user data |
| **Cloud Services** | Firebase (Auth, Firestore, Storage, FCM, Analytics, Crashlytics, Remote Config) | User sync, auth, push, analytics, crash reporting |
| **Content Storage** | Google Drive API | PDF files, cover images, assets |
| **Video** | YouTube Data API | Video content hosting and metadata |
| **Ads** | Google AdMob (Banner, Interstitial, Rewarded + SSV) | Revenue, ad-gated features |

---

# 1. Core Development & Dart

### 1.1 Dart Language
Dart programming language fundamentals including sound null safety, type system, async/await patterns, streams, isolates, generics, mixins, and extension methods. TF StudyShelf uses Dart ≥ 3.x with strict null safety enforced throughout the codebase.

### 1.2 Dart Code Style & Linting
Effective Dart guidelines, naming conventions (`lowerCamelCase`, `UpperCamelCase`, `snake_case` for files), documentation with `///` doc comments, `flutter_lints` or `very_good_analysis` for static analysis. Every public API must be documented.

### 1.3 Code Generation
`build_runner` based code generation for JSON serialization (`json_serializable`), immutable data classes (`freezed`), database schemas (`drift_dev`), and dependency injection (`injectable_generator`). The agent must understand when to run `dart run build_runner build` and how to resolve generation conflicts.

### 1.4 Error Handling Patterns
Typed exception hierarchies (`ApiException`, `NetworkException`, `UnauthorizedException`, `NotFoundException`, etc.), `Either<Failure, Success>` pattern for use cases, `runZonedGuarded` for global error capture, and proper error propagation through BLoC states.

### 1.5 Immutability & Data Classes
Prefer immutable data classes using `freezed` or `equatable` for entities, events, and states. Use `const` constructors where possible. Dart records and sealed classes for pattern matching in state handling.

---

# 2. Flutter Framework

### 2.1 Flutter SDK & Widget System
Flutter framework fundamentals — widget tree, build lifecycle, `StatelessWidget`, `StatefulWidget`, `InheritedWidget`, keys, `const` widget optimization. TF StudyShelf targets Android (API 26+) with potential iOS expansion.

### 2.2 Material 3 & Material Design
Material 3 component library — `NavigationBar` (5-tab bottom nav), `ThemeData`, `ColorScheme`, adaptive components, `MaterialApp.router`, `Scaffold`, `AppBar`, `BottomSheet`, `AlertDialog`, `SnackBar`, `Chip`, `Card`, etc. All themed to TF StudyShelf's 3-color palette.

### 2.3 Flutter Widgets & Custom Components
Building custom reusable widgets: `BookCard`, `QuizProgress`, `FlashcardWidget`, `OfflineStatusBadge`, `CountdownTimer`, `EmptyStateWidget`, `AdBannerWidget`, `ReaderControls`, `BackupStatusCard`, shimmer loading placeholders, and study-specific components.

### 2.4 Responsive & Adaptive Layout
`MediaQuery`, `LayoutBuilder`, `OrientationBuilder` for supporting phones (5"–6.7") and tablets (10.1"+), portrait and landscape orientations. Reader and PDF viewer must adapt intelligently. Grid columns adjust from 2 (mobile) to 4–5 (tablet).

### 2.5 Animations & Motion
`AnimationController`, `Tween`, `Hero`, implicit animations, `Lottie` package for splash/onboarding, 3D flashcard flip effect (400ms ease-in-out), page transitions (300ms), card tap feedback (150ms). Respect `MediaQuery.disableAnimations` for accessibility.

### 2.6 Hot Reload & Development Workflow
Flutter hot reload/restart, DevTools for performance profiling, widget inspector, memory analysis, network profiling. Use `flutter run --flavor development` for local development with test ads and dev API.

---

# 3. Architecture & Patterns

### 3.1 Clean Architecture
Four-layer architecture: Presentation → Application → Domain → Infrastructure. Domain layer has zero dependency on data layer or Flutter. Feature-first folder organization (`lib/features/auth/`, `lib/features/reader/`, etc.). Each feature encapsulates its own data, domain, and presentation layers.

### 3.2 Repository Pattern
Abstract repository interfaces defined in domain layer, implemented in data layer. Repositories abstract data sources (API, local database, cache) and handle data transformation between models (data) and entities (domain). Single source of truth principle.

### 3.3 Use Case Pattern
Each business operation encapsulated in a single-responsibility use case class (e.g., `SignInUseCase`, `GrantEntitlementUseCase`, `CheckEntitlementUseCase`). Use cases orchestrate repository calls and contain business rules independent of UI.

### 3.4 Dependency Injection (GetIt + Injectable)
`GetIt` as the service locator with `injectable` for compile-time registration generation. Singleton services (`AdService`, `ConnectivityService`), lazy singletons for repositories, factory registration for BLoCs. All wiring happens in `injection_container.dart` at startup.

### 3.5 Feature Module Pattern
Each feature has a `_module.dart` file that registers its dependencies. Features are self-contained with their own BLoC, screens, widgets, data sources, models, entities, repositories, and use cases. Cross-feature communication goes through shared services or domain events.

---

# 4. UI/UX & Design System

### 4.1 TF StudyShelf Color System
Strict 3-color palette: Primary Dark `#212121`, Accent `#FF7759`, Off-White `#FAFAFA`. All derived colors are alpha variants only — no unrelated hues. Light mode: `#FAFAFA` background, `#212121` text. Dark mode: `#212121` background (no pure black), `#FAFAFA` text. Accent used as punctuation, not wallpaper.

### 4.2 Typography (Manrope + Geist Mono)
Manrope (Google Fonts) for all human-facing text — headings, body, buttons, navigation, UI. Geist Mono for technical/statistical contexts only — page numbers (`PAGE 048 / 320`), percentages, reading time, quiz scores, countdowns, statistics. Never use Geist Mono for reading paragraphs.

### 4.3 Gradient & Visual Effects
Primary signature gradient: `#FF7759 → #212121` at 135°. Use selectively for hero banners, primary CTAs, featured cards, progress indicators, achievement moments. Never for ordinary list rows, standard buttons, or full backgrounds. Restraint keeps it premium.

### 4.4 Theme System (Light / Dark / Dim)
Three theme options: System (default), Light, Dark. Dim mode (reader-only) with `#1A1A1A` background and `#D4D4D4` text for comfortable night reading. Theme selection in Settings → Appearance. Persisted across sessions. All components must render correctly in all themes.

### 4.5 Component Library
Standardized components: Primary/Secondary/Text/Gradient buttons, BookCard (3:4 image ratio), ProgressCard (280px horizontal scroll), StudyCard, TextInput (accent focus), SearchBar, AlertDialog (16px radius), BottomSheet (24px top radius), CategoryChip, StatusBadge, ReadingProgressBar (gradient fill), EmptyState.

### 4.6 Spacing, Radius & Elevation
Spacing tokens: xs(4px), sm(8px), md(16px), lg(24px), xl(32px), 2xl(48px), 3xl(64px). Border radius: sm(8px), md(12px), lg(16px), xl(24px), full(999px). Elevation: 4 levels from none to `0 8px 32px rgba(0,0,0,0.20)`. Subtle shadows, clean aesthetic.

---

# 5. State Management

### 5.1 BLoC Pattern (flutter_bloc)
Primary state management using `Bloc<Event, State>` and `Cubit<State>`. Clear separation: Events in → States out. Each feature has its own BLoC (e.g., `BookDetailBloc`, `OfflineBloc`, `AuthBloc`). Use `BlocBuilder`, `BlocListener`, `BlocConsumer`, `BlocSelector` for granular UI rebuilds.

### 5.2 Global vs Feature-Scoped State
Global state: `AuthBloc`, `ConnectivityCubit`, `ThemeCubit`, `AdService` (singleton), `ReaderSettingsCubit`. Feature-scoped: BLoCs created and disposed with feature's widget tree. Avoid global state bloat — scope BLoCs to the narrowest possible widget subtree.

### 5.3 BLoC Testing
`bloc_test` package for verifying event → state transitions. Mock dependencies with `mocktail`. Test all state transitions including loading, loaded, error, edge cases. Verify side effects (repository calls, analytics events). Every BLoC must have corresponding test coverage.

---

# 6. Navigation & Routing

### 6.1 GoRouter
Declarative routing with `GoRouter`. Route configuration: splash (`/`), onboarding, auth routes, `ShellRoute` for main 5-tab navigation, detail routes (`/book/:bookId`, `/reader/:bookId`, `/quiz/:quizId`), settings routes. Deep link support for `tfstudyshelf://` scheme.

### 6.2 Deep Linking & Navigation Patterns
URL-based deep links (`tfstudyshelf://book/{bookId}`). Fallback to Home with snackbar if linked content unavailable. Bottom navigation preserves tab state. Detail screens pushed over shell. Auth screens are full-screen routes. Proper back-stack management.

---

# 7. Local Data & Offline Storage

### 7.1 Drift (SQLite) Database
Type-safe SQLite database for Flutter. Core tables: `Books`, `Entitlements`, `PendingOperations`, plus reading progress, highlights, notes, bookmarks, quiz results. Schema versioning with migration support. `drift_dev` for code generation. The agent must understand Drift's table definition syntax and migration patterns.

### 7.2 SharedPreferences & Hive
Key-value storage for settings, flags, onboarding completion status, theme preference, font size, reader settings. Small config data. SharedPreferences for simple key-value, Hive for structured small data where needed.

### 7.3 Flutter Secure Storage
`flutter_secure_storage` for sensitive data — Firebase auth tokens, AES-256 encryption keys, entitlement secrets. Backed by Android Keystore. Never store auth tokens in SharedPreferences. Never log sensitive values.

### 7.4 File Storage & Cache Management
`path_provider` for app documents directory (PDFs, offline packages, backups) and cache directory (images, API responses, temp files). LRU cache for cover images (7-day expiry). Manual lifecycle management for PDF files tied to entitlement expiry. `cached_network_image` for network image caching.

### 7.5 Offline-First Architecture
Stale-while-revalidate for book lists (1h), cache-first for Q&A content (1h), network-first for search (5min), write-through for user progress. Offline changes queued as `PendingOperation` records with exponential backoff retry. Conflict resolution: latest timestamp wins for progress, unique IDs for notes/highlights, quiz results always appended.

---

# 8. Firebase & Cloud Services

### 8.1 Firebase Core & Initialization
`firebase_core` initialization in `main.dart` before `runApp`. Firebase project configuration for dev/staging/production environments. `google-services.json` management per flavor. Error handling for Firebase init failures with retry and offline fallback.

### 8.2 Firebase Authentication
Email + password only (no Google/Facebook/Apple/Phone). `firebase_auth` package. Guest mode with local-only features. Sign up with email validation and password strength (8+ chars, letter + number). Forgot password via Firebase reset email. Account deletion with full data removal (Play Store requirement). Session persistence via `Persistence.LOCAL`.

### 8.3 Cloud Firestore
Real-time sync for user data: reading progress, highlights, notes, bookmarks, quiz results, flashcard states, preferences. 10 document collections. Security rules enforce user-scoped access. Offline persistence enabled. Free tier: 50K reads, 20K writes, 20K deletes/day.

### 8.4 Firebase Cloud Storage
Stores encrypted `.tfsbackup` files. Storage rules: only authenticated user can read/write their own backups. Latest 2 backups retained per user. File size monitoring. Secure upload/download with progress tracking.

### 8.5 Firebase Cloud Messaging (FCM)
Push notifications via `firebase_messaging`. Notification types: reading reminders, revision reminders, new content alerts, quiz reminders, study goal notifications, announcements. 6 Android notification channels with appropriate importance levels. Per-category opt-in/out in settings.

### 8.6 Firebase Analytics
Custom analytics events: `app_opened`, `book_opened`, `search_performed`, `quiz_completed`, `offline_unlock_requested`, `rewarded_ad_completed`, `backup_started`, `backup_completed`, `account_created`, `account_deleted`, etc. No PII in parameters. Offline events queued.

### 8.7 Firebase Crashlytics
`firebase_crashlytics` with `runZonedGuarded` setup. Custom crash keys for debugging context. Alerts for new crash clusters >10 users. Target: >99.5% crash-free rate. Play Console ANR monitoring (target <0.5%). Debug symbols uploaded for symbolication.

### 8.8 Firebase Remote Config
Feature flags, dynamic settings, forced update version tracking, ad configuration overrides, A/B testing parameters. Minimum fetch interval. Default values for offline fallback. Used to control interstitial ad thresholds, enable/disable features remotely, force app updates.

---

# 9. Cloudflare & Web Platform

### 9.1 Cloudflare Pages
Static site hosting for web platform frontend. HTML5 + CSS3 + Vanilla JavaScript. Auto-deployment on push to `main`. Preview deployments on pull requests. CDN caching with appropriate TTLs. Custom domain with auto-SSL. Free tier: unlimited sites, 500 builds/month.

### 9.2 Cloudflare Workers
Serverless API backend. All API endpoints (`/api/v1/books`, `/api/v1/search`, `/api/v1/ssv/verify`, etc.). Request routing, authentication, rate limiting, error handling. JavaScript/TypeScript runtime. Free tier: 100K requests/day. `wrangler` CLI for development and deployment.

### 9.3 Cloudflare D1 (Serverless SQL)
SQLite-compatible serverless database. 13 SQL tables + FTS5 virtual tables for full-text search. Content catalog, admin data, quiz data, ad configurations. Parameterized queries only (SQL injection prevention). Forward-only migrations via `wrangler d1 migrations`. Free tier: 5M reads/day, 100K writes/day, 5GB storage.

### 9.4 Cloudflare KV
Edge key-value store for API response caching, config caching, PDF metadata caching. Fast reads at edge locations. Used for frequently accessed but infrequently changing data.

### 9.5 Wrangler CLI
Local development (`wrangler dev`), deployment (`wrangler deploy --env production`), D1 migrations, secrets management (`wrangler secret put`), environment configuration. `wrangler.toml` for project configuration with staging/production environments.

### 9.6 Web Frontend (HTML/CSS/JS)
Admin panel and user-facing web built with pure HTML5, CSS3, and vanilla JavaScript. Zero framework cost. Admin panel with 7-section top navigation: Dashboard, Content, Users, Categories, Ads, Notifications, Settings. Responsive design across mobile/tablet/desktop breakpoints (320px – 1440px+).

---

# 10. API Integration & Networking

### 10.1 Dio HTTP Client
`dio` package for HTTP requests with interceptors. `AuthInterceptor` (JWT Bearer token injection), `CacheInterceptor` (response caching), `ErrorInterceptor` (HTTP error mapping to typed exceptions), `LogInterceptor`. Base configuration: 10s connect timeout, 30s receive timeout.

### 10.2 API Architecture & Endpoints
RESTful API design with versioned endpoints (`/api/v1/`). 30+ endpoints covering books, PDFs, search, user data sync, backup, config, SSV verification, admin operations. JSON request/response format. Pagination with `page`, `limit`, `total` metadata. Standard error response format.

### 10.3 Connectivity Monitoring
`connectivity_plus` package with manual ping check for actual internet access (not just Wi-Fi signal). `ConnectivityService` with `statusStream` for reactive UI updates. Offline indicator in app bar. Features degraded or disabled based on connectivity state.

### 10.4 API Security & Rate Limiting
HTTPS only. Firebase Auth JWT in `Authorization: Bearer` header. Server-side JWT validation (signature, issuer, audience, expiry). Per-endpoint, per-user rate limits. CORS strict origin allowlist. Input validation. Content-Security-Policy header. XSS prevention.

---

# 11. Google APIs (Drive & YouTube)

### 11.1 Google Drive API Integration
Server-to-server authentication via Service Account. PDF files, cover images, and assets stored in organized folder structure (`TF_Study_Shelf/Books/{Subject}/`, `Covers/`, `Assets/`). PDFs never exposed via public Drive URLs — always proxied through authenticated Workers. Storage monitoring with warning at 12GB/15GB.

### 11.2 YouTube Data API
Video metadata fetching, search, and embedding. Admin can add videos by pasting YouTube URL (auto-fetch metadata) or uploading via API. Video availability monitoring for deleted/private/blocked videos. Admin notifications for unavailable content. Quota monitoring (10,000 units/day).

### 11.3 Content Proxy & Streaming
Cloudflare Workers proxy all content access. Workers authenticate with Google Drive API, fetch PDF bytes, and stream to the client. Edge caching for frequently accessed content. Download control enforced by content rights metadata. No direct Drive links ever reach the client.

---

# 12. AI & Gemini Integration

### 12.1 AI Study Assistant (V2)
Online-only AI assistant using Gemini API. Context-aware: current book, chapter, selected text, user's notes and Q&A. Example queries: "Explain this simply", "Summarize this chapter", "Make 10 MCQs". Clear "AI-generated" labeling. Rate limits and abuse controls. Report/feedback control on AI answers.

### 12.2 AI Content Generation
Admin-side AI assistance for generating Q&A, summaries, key concepts, flashcard content from book/chapter text. Quality review gate before publishing AI-generated content. Never imply AI content is verified/authoritative without admin review.

---

# 13. Reader & PDF System

### 13.1 Book Reader Implementation
Premium immersive reading experience. Font controls (Small → Huge, Manrope fixed), line/paragraph spacing, margins, text alignment (Left/Justify), page mode (Paged/Scroll), theme (Light/Dark/Dim/System). Gesture handling: tap edges (20% width) for page navigation, tap center (60%) for controls toggle, long press for text selection.

### 13.2 Text Selection & Annotation System
Floating toolbar on text selection: Highlight (5 categories, all `#FF7759` alpha variants), Note (text/checklist/question/idea types), Copy, Share, Ask. Annotations attached to book/chapter/page/paragraph/highlight. All synced via Firestore when signed in, local-only for guests.

### 13.3 PDF Reader (Syncfusion/pdfx)
Full-featured in-app PDF viewing: pinch-to-zoom, fit-width/fit-page, page thumbnails, jump-to-page, in-document search, bookmarks, annotations, reading progress, orientation support, rotation, dark mode inversion, table of contents, text selection. `syncfusion_flutter_pdfviewer` or `pdfx` package.

### 13.4 Text-to-Speech
`flutter_tts` package using device's built-in TTS engine. Controls: Play/Pause, 10s skip forward/back, speed adjustment (0.75x → 2.0x). Works offline with local TTS engine. Battery impact consideration — user opt-in only.

---

# 14. Study & Learning Engine

### 14.1 Q&A System
Structured questions per book/chapter. 7 question types: MCQ, Short Answer, Long Answer, True/False, Fill in the Blank, Exam-Style, Conceptual. 3 difficulty levels (Easy/Medium/Hard). Filterable and searchable. Admin bulk import from CSV/JSON.

### 14.2 Quiz Engine
Timed/untimed modes. Random question ordering (configurable). Chapter-specific, subject-specific, or mixed quizzes. Difficulty filter. Instant explanation after each answer. Final score card with percentage. Incorrect-answer review. Retry capability. Results saved to history. Wrong answers to Mistake Bank. Passing score configurable (default 60%).

### 14.3 Flashcard Engine
Front (question/concept) / Back (answer/explanation) card format. 3D flip animation (400ms). Actions: Got it / Review Again. Convert saved question → Flashcard. Set-level progress tracking. Future: spaced-repetition scheduling (V2).

### 14.4 Revision Center
"Review Today" aggregation combining: saved highlights, incorrect quiz questions, due flashcards, weak topics, recent notes. Single entry point for daily revision. Context-sensitive — navigating to source material from any revision item.

### 14.5 Mistake Bank
Every wrong quiz answer saved for focused revision. Display: question, user's wrong answer, correct answer, explanation, source (book/chapter/quiz). Remove individual items. Filter by subject/difficulty. Bridge to targeted revision.

### 14.6 Study Dashboard & Progress Tracking
Metrics: Books Read/In Progress/Completed, Total Pages Read, Questions Answered, Quiz Accuracy (%), Total Study Time, Current Streak, Favorite/Weak Subjects. Weekly time chart (Mon–Sun, Geist Mono for numbers). Reading goals: 10/20/30 min per day or 10/20/50 pages per day.

---

# 15. Search & Content Discovery

### 15.1 Cross-Content Search
Unified search spanning: book title, author, subject, topic, chapter, question text, keyword. Results grouped by type: Books, PDFs, Questions, Chapters. Autocomplete suggestions. Debounced input (300ms delay). Minimum 2 characters, maximum 200.

### 15.2 Full-Text Search (FTS5)
SQLite FTS5 virtual tables within Cloudflare D1 for server-side full-text search. Tokenization, ranking, snippet extraction. Used for content catalog search, question search, and admin content management search.

### 15.3 Filtering, Sorting & Categorization
Filter by: Category/Subject (multi-select), Difficulty, Language, Content Type, Author. Sort by: Most Popular, Recently Added, Title (A-Z/Z-A), Rating, Reading Time. Admin-managed categories, subjects, study packs, collections, learning paths. Grid/List view toggle. Infinite scroll with pagination (20 items/page).

---

# 16. Notifications & Background Processing

### 16.1 Push Notifications (FCM)
Firebase Cloud Messaging for server-initiated notifications. Admin-configurable push for new content, announcements. Automated notifications for reading/revision/quiz reminders and study goals. Per-category opt-in/out settings. 6 notification channels with appropriate importance.

### 16.2 Local Notifications
`flutter_local_notifications` for offline expiry warnings. Scheduled at: 1 hour before entitlement expiry, at expiry. Also for reading reminders, study goal tracking. Works without internet.

### 16.3 WorkManager (Background Tasks)
`workmanager` Flutter package for scheduled background work. Tasks: expired entitlement cleanup (startup + scheduled), offline change sync on connectivity restore, background data validation. Respects Android Doze mode. Flex periods for battery efficiency. One-off and periodic task scheduling.

---

# 17. Monetization & Advertising

### 17.1 Google AdMob Integration
`google_mobile_ads` package. Three ad formats: Banner (persistent, above bottom nav), Interstitial (after qualifying activities), Rewarded (opt-in gate for offline/backup features). `AdService` singleton managing ad lifecycle, preloading, and state transitions. Test ad IDs for dev/staging, production IDs for release.

### 17.2 Rewarded Ad System & State Machine
10-state state machine: IDLE → REQUESTED → AD_LOADING → AD_READY → USER_OPTED_IN → AD_SHOWING → REWARD_RECEIVED → ENTITLEMENT_GRANTED → DOWNLOAD_STARTED. Failure states: AD_FAILED, AD_CANCELLED, REWARD_NOT_RECEIVED, DOWNLOAD_FAILED. Reward-received and entitlement-granted are separate states. Clear disclosure before ad ("Watch a rewarded ad to unlock 24-hour offline access").

### 17.3 AdMob Server-Side Verification (SSV)
Cryptographic verification via Cloudflare Worker callback. `customData` carries `userId + contentId + entitlementType`. SSV is the authoritative source of truth — never trust client callback alone. Idempotency via `transaction_id` to prevent duplicate reward grants. Anti-abuse pattern detection.

### 17.4 Interstitial Ad Logic
Random threshold (15–25 qualifying activities). Additional gates: session cooldown, minimum time between interstitials. Blocked contexts: reading, quiz, download, reward flow, onboarding. Qualifying activities: open book, complete chapter, search, open PDF, save book, finish Q&A set, complete quiz. NOT qualifying: scroll, back press, settings change.

---

# 18. Analytics & Monitoring

### 18.1 Firebase Analytics Events
Complete event taxonomy: `app_opened`, `book_opened`, `chapter_opened`, `pdf_opened`, `search_performed`, `book_saved`, `highlight_created`, `note_created`, `quiz_started`, `quiz_completed`, `flashcard_reviewed`, `offline_unlock_requested`, `rewarded_ad_completed`, `backup_started`, `backup_completed`, `account_created`, `account_deleted`, etc. No PII in parameters. Offline events queued.

### 18.2 Crash Reporting & Monitoring
Firebase Crashlytics with `runZonedGuarded` setup. Custom crash keys for debugging context. Alerts for new crash clusters >10 users. Target: >99.5% crash-free rate. Play Console ANR monitoring (target <0.5%). Debug symbols uploaded for symbolication.

### 18.3 Production Monitoring & Alerting
App: Crashlytics, Firebase Analytics (DAU drop >20%), Firebase Performance (startup >5s), Play Console, AdMob Dashboard. Web: Cloudflare Analytics (error rate >5%), Worker Analytics (response time >500ms avg), D1 Dashboard (quota >80%), Drive/YouTube API quota monitoring. Severity-based alerting: Critical (<1h), High (<4h), Medium (<24h).

---

# 19. Security & Privacy

### 19.1 Authentication Security
Firebase Auth email/password only. Password policy: 8+ chars with letter + number, reject top 10K common passwords. Rate limiting: max 5 login attempts per 15 minutes. Session management via Firebase Auth JWT with auto-refresh. Admin roles (Super Admin, Content Manager, Moderator) via Firebase custom claims.

### 19.2 API & Transport Security
HTTPS only (Cloudflare auto-SSL, TLS 1.2+). JWT validation on every request. Parameterized queries (SQL injection prevention). Input sanitization + Content-Security-Policy. CORS strict origin allowlist. Cookie policy: SameSite=Strict, Secure, HttpOnly for web sessions. CSRF protection via origin validation.

### 19.3 Content & Entitlement Security
PDFs proxied through Workers — never exposed via public Drive URLs. Rights enforcement: backend checks `canRead/canDownload/canShare/canOffline` from rights metadata. Entitlement validation formula: `CanOpen = LocalFileExists AND EntitlementValid AND ContentVersionAllowed`. Clock-tampering protection using server time + monotonic time + secure local storage.

### 19.4 Client Security (App)
Token storage in `flutter_secure_storage` (Android Keystore-backed). Code obfuscation (`--obfuscate --split-debug-info`). ProGuard/R8 for release builds. No secrets in Dart code — all API keys/service accounts in Cloudflare Worker secrets. Optional root detection (warn, don't block).

### 19.5 Backup Encryption & Data Protection
AES-256 encryption before cloud upload. SHA-256 checksum for integrity verification. Schema and version validation before restore. Safety snapshot of current data before any restore. User password never stored in backup file. Data classification: Authentication (highest), Personal (high), User Content (high), Usage Data (medium), Public Content (low).

---

# 20. Content Rights & Licensing

### 20.1 Content Rights Enforcement
Three allowed source types only: Public Domain, Open License, Licensed/Authorized. Mandatory rights metadata on every content record: `rightsStatus`, `licenseName`, `licenseSource`, `rightsHolder`, `permissionReference`, `allowedDownload`, `allowedOffline`, `allowedShare`. Backend enforcement — never assume a PDF URL existing means it's safe to distribute.

### 20.2 Publishing Workflow & Content Gate
5-state publishing workflow: DRAFT → REVIEW → PUBLISHED → UNPUBLISHED → ARCHIVED. Publication gate: metadata complete, cover approved, content quality-checked, rights verified, Q&A reviewed, PDF verified. Emergency unpublish: one-click, immediate removal from all public views, logged with reason and timestamp. Content never deleted — only hidden.

---

# 21. Performance Optimization

### 21.1 App Performance Targets
Cold start <3s, hot start <1s, screen transition <300ms, list scroll 60fps, memory <150MB typical (<250MB with PDF), APK size <30MB download, battery drain <10% per hour of reading.

### 21.2 Flutter Performance Techniques
`ListView.builder` for lazy loading, `const` widgets for efficient rebuilds, `BlocSelector` for granular state-based rebuilds, pagination (20 items/page), image caching with `cached_network_image`, PDF page-on-demand loading, proper controller/stream disposal, memory leak prevention through lifecycle management.

### 21.3 Web Performance (Core Web Vitals)
LCP <2.5s, FID <100ms, CLS <0.1, page load (3G) <3s, API response <200ms, search response <500ms. Cloudflare CDN caching with appropriate TTLs. Asset hashing for immutable caching (1 year). Minimal JavaScript. Progressive enhancement.

### 21.4 Caching Strategy
Book list: 1h stale-while-revalidate. Book detail: 30min stale-while-revalidate. Cover images: 7 days LRU. Q&A content: 1h cache-first. User progress: real-time write-through. Search results: 5min network-first. PDF files: until entitlement expires (manual lifecycle). API responses (web): 5min network-first with cache fallback.

---

# 22. Testing & QA

### 22.1 Unit Testing
Business logic, BLoCs, use cases, utilities. `flutter_test` + `bloc_test` + `mocktail`. >80% coverage on domain/logic. Critical test areas: entitlement system (grant, expiry, clock tampering, idempotency), backup (checksum, encryption, schema validation, safety snapshot), quiz scoring, offline sync (pending operations, conflict resolution).

### 22.2 Widget & Screen Testing
Individual widget rendering and behavior. Key widgets: `BookCard`, `QuizProgress`, `FlashcardWidget`, `OfflineStatusBadge`, `CountdownTimer`. Screen tests: SplashScreen, OnboardingScreen, HomeScreen, BookDetailScreen, SignInScreen, SignUpScreen, BackupRestoreScreen. Verify render, interaction, navigation, error states.

### 22.3 Integration & E2E Testing
`integration_test` package for full user flows. 8 critical E2E paths: Offline Reading, PDF Download, Offline Study, Backup, Restore, Auth, Search, Reading (with annotations). Web integration: Content Publish, User Management, Ad Config, Emergency Unpublish, Bulk Import.

### 22.4 API & Backend Testing
Cloudflare Worker endpoint testing with Vitest / Wrangler test. All 30+ endpoints tested. Auth validation (401/403), CRUD operations, SSV verification (valid/invalid/duplicate), search, rate limiting (429), pagination, error responses.

### 22.5 Manual QA & Device Testing
Edge case checklists: entitlement expiry mid-session, clock tampering, low storage, concurrent downloads, content version changes, ad failures, backup interruptions, reader stress tests (1000+ pages, 50MB+ PDFs). Device matrix: low-end (Galaxy A03), mid-range (Galaxy A54), high-end (Galaxy S24), tablets. Network conditions: fast Wi-Fi, slow 3G, intermittent, offline, captive portal.

---

# 23. Accessibility

### 23.1 App Accessibility (WCAG AA)
TalkBack support via `Semantics` widgets. Content descriptions for all images, icons, buttons. Touch targets minimum 48x48dp. Text scaling respects system settings. Color contrast minimum 4.5:1 (within 3-color palette). Reduced motion support via `MediaQuery.disableAnimations`. Portrait + landscape support. Logical focus order. Reader font size slider independent of system.

### 23.2 Web Accessibility
WCAG AA target. Keyboard navigation with visible focus states. Semantic HTML5 elements. Labels for all form inputs. Accessible names for controls. Sufficient contrast. Alt text for images. Screen-reader compatible. `prefers-reduced-motion` media query support. Touch targets usable. Errors communicated through text/icon, not color alone.

---

# 24. Build System & Dependencies

### 24.1 Flutter Build Flavors
Three flavors: `development` (test ads, dev API), `staging` (test ads, staging API), `production` (live ads, production API). `--dart-define=ENV=` for environment switching. `EnvConfig` class for environment-specific values (API URL, ad unit IDs, Firebase project).

### 24.2 Gradle & Android Configuration
Min SDK 26 (Android 8.0), Target/Compile SDK 34+. Package: `com.techilyfly.tfstudyshelf`. ProGuard/R8 enabled for release builds with keep rules for Flutter, Firebase, and Google Mobile Ads. Adaptive app icon with TF mark foreground and `#212121` background. Semantic versioning with auto-incremented version code.

### 24.3 Dependency Management (pubspec.yaml)
Pin major versions. Core dependencies: `flutter_bloc`, `go_router`, `dio`, `connectivity_plus`, Firebase suite (`firebase_core/auth/firestore/storage/messaging/analytics/crashlytics/remote_config`), `drift`, `shared_preferences`, `flutter_secure_storage`, `google_mobile_ads`, PDF viewer, `cached_network_image`, `shimmer`, `lottie`, `workmanager`, `flutter_tts`, `get_it`, `injectable`. Dev: `bloc_test`, `mocktail`, `build_runner`, `drift_dev`, `injectable_generator`, `flutter_lints`.

### 24.4 Vite & npm (Web Platform)
Web platform build tools if needed: Vite for bundling, npm/Node 18.x LTS for package management. Cloudflare Pages build command: `npm run build`. Output directory: `dist/` or `public/`. Wrangler for Workers deployment.

---

# 25. Git, CI/CD & Release Management

### 25.1 Git & Version Control
Git with GitHub/GitLab. Feature branch workflow: feature branches → pull requests → code review → merge to main. Release branches for production builds. Commit message conventions. `.gitignore` for build artifacts, keystores, generated files, secrets.

### 25.2 GitHub Actions CI Pipeline
Automated on pull request: `flutter analyze`, `flutter format --set-exit-if-changed`, `flutter test` (unit + widget), coverage threshold check (>80%), staging build verification. Block merge on any failure.

### 25.3 GitHub Actions CD Pipeline
On merge to main: full test suite → staging APK build → Firebase App Distribution upload → web staging deployment (`wrangler deploy --env staging`). Manual trigger for production: production AAB build with obfuscation → Play Console upload (internal testing track) → web production deployment.

### 25.4 Environment Variables & Secrets Management
Cloudflare Worker secrets for API keys and service accounts (`wrangler secret put`). GitHub Actions secrets for signing keys, Firebase tokens. Separate configs per environment (dev/staging/production). Never commit secrets, keystores, or `google-services.json` to version control.

### 25.5 Release Process
Development → Feature Branch → PR → Code Review → Merge to main → CI builds staging → QA testing → Release branch → Production AAB → Sign → Play Console → Internal testing → Closed testing → Staged rollout (10% → 25% → 50% → 100%) → Monitor Crashlytics/reviews → Full rollout.

---

# 26. Play Store & Production

### 26.1 Play Store Submission
Pre-submission checklist: signed AAB, R8/ProGuard enabled, Dart obfuscation, debug info split, production ad IDs, production Firebase, production API URL, no test IDs in production build, adaptive app icon, version code incremented. Store listing: title ("TF Study Shelf — Read. Learn. Remember."), screenshots (8 phone + tablet), feature graphic (1024x500), full description.

### 26.2 Staged Rollout & Monitoring
Day 1: Internal testing → Team validation. Day 2-3: Closed testing → Beta feedback. Day 4-5: Fix critical issues. Day 6: Production 10%. Day 7: Monitor. Day 8: 25%. Day 10: 50%. Day 14: 100%. Halt criteria: crash-free <99%, ANR >1%, critical bugs, ad failure, data loss, security vulnerability.

### 26.3 In-App Updates & Forced Updates
Play Core In-App Update API (`in_app_update` package). Flexible update for normal releases (notification, update when convenient). Immediate update for schema-breaking changes/security fixes (blocking). Minimum supported version tracked in Remote Config — force update if below minimum.

---

# 27. Documentation & Development Workflow

### 27.1 PRD-Driven Development
All implementation must trace back to PRD requirements. Cross-reference using `→ See [XX Title](./XX_File.md) § Section` format. Platform tags: `[WEB]`, `[APP]`, `[SHARED]`, `[ADMIN]`. Feature IDs used throughout (e.g., `HOME-01`, `ADM-AUTH-03`).

### 27.2 Code Documentation
`///` doc comments on all public APIs. Inline comments for non-obvious logic. README files in feature directories. Architecture decision records for significant design choices.

### 27.3 Agent Context & Source Priority
When sources conflict: PRDs > Tech Stacks > Design System > Walkthrough > This Skills File > Generic framework conventions. Always prefer project-specific patterns over generic solutions. Verify current framework documentation before non-trivial architectural decisions.

### 27.4 Post-Launch Operations
Daily: Review Crashlytics, check ANR rate, review user reviews, monitor ad revenue, check API quotas, review error logs. Weekly: Analytics review (DAU, retention, feature adoption), performance review, security scan, backup health check. Monthly: Full analytics report, revenue analysis, dependency update assessment, Flutter/Firebase SDK evaluation, Play policy review.

---

# 28. TF StudyShelf Project-Specific Skills

### 28.1 24-Hour Temporary Offline Access System
Core product differentiator. Three offline access types (Reading, PDF Download, Study), each gated by rewarded ad, each auto-expires after 24 hours. Connectivity check before ad (ads can't be served offline). Entitlement data model with `grantedAt`, `expiresAt`, `status`, `rewardTransactionId`. Validation at: content open, key transitions, WorkManager scheduled check, app startup. Auto-removal retains user-created metadata (notes, highlights, progress) but deletes cached content files.

### 28.2 Backup & Restore System
Account-linked cloud backup. Flow: local backup creation → compression → AES-256 encryption → checksum → upload to Firebase Cloud Storage. Four-stage progress UI. Restore flow: download → validate checksum → decrypt → validate schema/version → show summary → safety snapshot → restore. Failed upload preserves local backup. Corrupted/incompatible backup rejected with data untouched. Latest 2 backups per user.

### 28.3 Admin CMS (Content Management System)
Web-based admin panel managing everything A-to-Z. 7-section navigation: Dashboard, Content (Books/PDFs/Videos/Chapters/Q&A/Quizzes/Flashcards/Summaries), Users, Categories, Ads, Notifications, Settings. 3 admin roles. Complete CRUD for all content types. Google Drive file management. YouTube video management. Real-time analytics dashboard. Emergency unpublish capability.

### 28.4 Content Rights & Monetization Model
100% free, ad-supported, no IAP, no premium. Three ad formats (Banner, Interstitial, Rewarded). Core rule: monetize access to extra value, never block basic app usage. Rewarded ads gate: offline reading, PDF download, offline study, backup, restore. Admin-configurable ad units, placements, thresholds. SSV as authoritative reward source.

### 28.5 Study Learning Loop
Core learning loop: Discover → Read → Highlight → Note → Understand → Practice → Quiz → Revise → Remember → Continue Learning. Five pillars: READ (books, PDFs, chapters), UNDERSTAND (Q&A, summaries, concepts), STUDY (highlights, notes, flashcards, quizzes), REMEMBER (progress tracking, mistake bank, spaced revision, statistics), MANAGE (admin control).

---

# Skill Dependency Map

```
TF STUDY SHELF AGENT
│
├── MOBILE APP (Flutter + Dart)
│   ├── Dart Language ← Code Style, Error Handling, Immutability
│   ├── Flutter Framework ← Material 3, Widgets, Animations, Responsive
│   ├── Architecture
│   │   ├── Clean Architecture
│   │   ├── BLoC Pattern ← BLoC Testing
│   │   ├── Repository Pattern ← Use Cases
│   │   ├── GetIt + Injectable (DI)
│   │   └── Feature Modules
│   ├── Data & Storage
│   │   ├── Drift (SQLite) ← Code Generation
│   │   ├── SharedPreferences / Hive
│   │   ├── Flutter Secure Storage
│   │   └── File Storage & Cache
│   ├── Networking
│   │   ├── Dio HTTP Client
│   │   ├── Connectivity Monitoring
│   │   └── Offline-First Architecture
│   ├── Firebase Ecosystem
│   │   ├── Auth (Email+Password)
│   │   ├── Firestore (Sync)
│   │   ├── Cloud Storage (Backups)
│   │   ├── FCM (Push)
│   │   ├── Analytics
│   │   ├── Crashlytics
│   │   └── Remote Config
│   ├── Features
│   │   ├── Reader + Annotations
│   │   ├── PDF Viewer
│   │   ├── Study Engine (Quiz, Flashcards, Q&A, Revision, Mistakes)
│   │   ├── Search
│   │   ├── Offline System (Entitlements, 24h Expiry)
│   │   ├── Backup & Restore (AES-256)
│   │   ├── TTS
│   │   └── Notifications (FCM + Local)
│   ├── Monetization
│   │   ├── AdMob (Banner, Interstitial, Rewarded)
│   │   └── SSV Verification
│   └── Production
│       ├── Build Flavors (dev/staging/prod)
│       ├── ProGuard / R8
│       ├── Play Store Submission
│       └── In-App Updates
│
├── WEB PLATFORM (Cloudflare)
│   ├── HTML/CSS/JS Frontend
│   ├── Cloudflare Pages (Hosting)
│   ├── Cloudflare Workers (API)
│   ├── Cloudflare D1 (Database)
│   ├── Cloudflare KV (Cache)
│   ├── Google Drive API (Files)
│   ├── YouTube Data API (Videos)
│   ├── Admin CMS Panel
│   └── Web Performance (CWV)
│
├── SHARED
│   ├── Firebase Auth (Email+Password)
│   ├── Content Rights & Licensing
│   ├── Design System (3 colors, Manrope, Geist Mono)
│   ├── Security (HTTPS, JWT, Encryption)
│   └── Analytics
│
├── QUALITY
│   ├── Testing (Unit, Widget, Integration, E2E, API)
│   ├── Accessibility (WCAG AA)
│   ├── Performance Optimization
│   └── Manual QA & Device Matrix
│
└── DELIVERY
    ├── Git (GitHub)
    ├── CI/CD (GitHub Actions)
    ├── Staged Rollout
    ├── Monitoring & Alerting
    └── Post-Launch Operations
```

---

# Final Validation Checklist

### ✅ Check 1 — PRD Technology Coverage
Every technology across all 13 PRDs (Flutter, Dart, BLoC, Drift, GoRouter, Dio, Firebase suite, Cloudflare suite, AdMob, SSV, Google Drive API, YouTube API, AES-256, WorkManager, TTS, etc.) has a corresponding skill.

### ✅ Check 2 — Private Folder Coverage
All technologies from `tech_stacks.md` (Flutter, Dart, Clean Architecture, BLoC/Cubit, GetIt, Drift, Dio, Syncfusion PDF, In-App Update, build_runner, Cloudflare Pages/Workers/D1/KV, Firebase Auth/Firestore/Storage/FCM/Analytics/Crashlytics/Remote Config, Google Drive API, YouTube API, AdMob+SSV, GitHub Actions, Wrangler, ProGuard/R8) are covered.

### ✅ Check 3 — Existing Skills Preserved
Useful skills from `Techily_Fly_Antigravity_Skills_Setup.md` retained and adapted:
- Cloudflare skills (Pages, Workers, D1, KV, Wrangler, Web Perf) → Category 9
- Web Design & Accessibility → Categories 4, 23
- SEO concepts → Category 9.6 (web frontend)
- Testing & QA → Category 22
- Brand design tokens → Category 4
- Performance optimization → Category 21
- Security → Category 19
- Admin CMS requirements → Category 28.3

### ✅ Check 4 — No Duplicate Skills
Each skill has a unique responsibility. No two skills cover the same ground. Related skills are in the same category with clear scope boundaries.

### ✅ Check 5 — Lifecycle Coverage
Development (Categories 1-6) → Data/Storage (7-8) → Features (13-16) → Monetization (17) → Security (19-20) → Testing (22) → Performance (21) → Build (24) → CI/CD (25) → Deployment (26) → Monitoring (18) → Maintenance (27.4) — complete lifecycle covered.

### ✅ Check 6 — Project Specificity
Skills are specific to TF StudyShelf's actual architecture: Flutter + Cloudflare + Firebase, 24-hour entitlement system, rewarded ad state machine, AES-256 backup encryption, 3-color design system, SSV verification, Clean Architecture with BLoC, specific dependency list from pubspec.yaml.

### ✅ Check 7 — AI Agent Guidance
Each skill includes: what it is, where it's used in the project, what type of work it handles. The dependency map shows relationships. The agent can use this file to understand the complete project context before any implementation task.

---

*This document serves as the complete Antigravity skill knowledge base for the TF Study Shelf project. For specific implementation requirements, always refer to the PRD suite in `PRDs/PRDs/`.*
