# TF Study Shelf — Mobile App PRD (Flutter + Dart)

**Document:** 03 — Mobile App PRD  
**Version:** 1.0  
**Date:** September 2, 2026  
**Applies to:** [APP] Mobile App  
**Technology:** Flutter + Dart (Android)  
**Package:** `com.techilyfly.tfstudyshelf`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Flutter Architecture & Project Structure](#2-flutter-architecture--project-structure)
3. [Screen-by-Screen Requirements](#3-screen-by-screen-requirements)
4. [Navigation & Routing](#4-navigation--routing)
5. [Authentication](#5-authentication)
6. [Books & Reading Experience](#6-books--reading-experience)
7. [PDF System](#7-pdf-system)
8. [Study Tools](#8-study-tools)
9. [24-Hour Temporary Offline Access System](#9-24-hour-temporary-offline-access-system)
10. [Backup & Restore System](#10-backup--restore-system)
11. [Search, Filtering & Sorting](#11-search-filtering--sorting)
12. [Favorites, Bookmarks & History](#12-favorites-bookmarks--history)
13. [Notifications](#13-notifications)
14. [Ads & Monetization (App)](#14-ads--monetization-app)
15. [Offline/Online Behavior](#15-offlineonline-behavior)
16. [Local Storage & Caching](#16-local-storage--caching)
17. [API Integration](#17-api-integration)
18. [State Management](#18-state-management)
19. [Error & Exception Handling](#19-error--exception-handling)
20. [Performance & Battery](#20-performance--battery)
21. [Security & Privacy](#21-security--privacy)
22. [Accessibility](#22-accessibility)
23. [Android-Specific Requirements](#23-android-specific-requirements)
24. [Dependency Management](#24-dependency-management)
25. [Build Configurations](#25-build-configurations)
26. [Testing Strategy](#26-testing-strategy)
27. [Release & Production](#27-release--production)
28. [Acceptance Criteria](#28-acceptance-criteria)

---

## 1. Executive Summary

TF Study Shelf Mobile App is a **completely free, ad-supported** digital library and study companion built with **Flutter and Dart** for Android. It combines Books + PDFs + Q&A + Notes + Highlights + Quizzes + Flashcards + Progress Tracking into one product.

### 1.1 Technology Decision

| Aspect | Decision |
|---|---|
| Framework | **Flutter** (latest stable SDK) |
| Language | **Dart** |
| Target Platform | Android (V1), iOS potential (V2+) |
| Minimum Android | API 26 (Android 8.0) |

### 1.2 Why Flutter + Dart

- Single codebase for potential multi-platform expansion (iOS future)
- Rich widget library for premium UI/UX
- Hot reload for rapid development
- Strong type system (Dart) for maintainability
- Extensive package ecosystem
- Custom rendering engine for consistent UI across devices

### 1.3 Three Critical Systems

| System | Description |
|---|---|
| **24-Hour Temporary Offline Access** | Offline Reading, PDF Download, and Study — each gated by rewarded ad, each auto-expires after 24 hours |
| **Account-Linked Cloud Backup & Restore** | Complete backup always built locally first, then encrypted and pushed to cloud |
| **Ad-Gated Monetization with SSV** | Every rewarded flow uses AdMob Server-Side Verification as the source of truth |

→ See [01 Shared Requirements](./01_Shared_Product_Business_Requirements.md) for product identity and business model.

---

## 2. Flutter Architecture & Project Structure

### 2.1 Architecture Pattern

**Clean Architecture with Feature-First Organization**

```
┌──────────────────────────────────────┐
│           PRESENTATION               │
│  (Widgets, Screens, ViewModels)      │
├──────────────────────────────────────┤
│           APPLICATION                │
│  (Use Cases, Services, BLoCs)        │
├──────────────────────────────────────┤
│             DOMAIN                   │
│  (Entities, Repositories Interfaces) │
├──────────────────────────────────────┤
│         INFRASTRUCTURE               │
│  (API, DB, Storage, Platform)        │
└──────────────────────────────────────┘
```

### 2.2 Project Structure

```
lib/
├── main.dart
├── app/
│   ├── app.dart                      # MaterialApp configuration
│   ├── router.dart                   # GoRouter configuration
│   ├── theme/
│   │   ├── app_theme.dart            # ThemeData (light/dark)
│   │   ├── app_colors.dart           # Color constants (#212121, #FF7759, #FAFAFA)
│   │   ├── app_typography.dart       # Manrope + Geist Mono
│   │   └── app_gradients.dart        # Gradient definitions
│   └── di/
│       └── injection_container.dart  # GetIt dependency injection
│
├── core/
│   ├── constants/
│   │   ├── api_constants.dart        # API endpoints
│   │   ├── ad_constants.dart         # Ad unit IDs (test + production)
│   │   └── app_constants.dart        # App-wide constants
│   ├── errors/
│   │   ├── exceptions.dart           # Custom exceptions
│   │   └── failures.dart             # Failure classes
│   ├── network/
│   │   ├── api_client.dart           # Dio HTTP client
│   │   ├── network_info.dart         # Connectivity checker
│   │   └── interceptors/
│   │       ├── auth_interceptor.dart
│   │       ├── cache_interceptor.dart
│   │       └── error_interceptor.dart
│   ├── utils/
│   │   ├── date_utils.dart
│   │   ├── string_utils.dart
│   │   └── validators.dart
│   └── widgets/
│       ├── loading_widget.dart
│       ├── error_widget.dart
│       ├── empty_state_widget.dart
│       └── ad_banner_widget.dart
│
├── features/
│   ├── splash/
│   │   ├── presentation/
│   │   │   └── screens/
│   │   │       └── splash_screen.dart
│   │   └── splash_module.dart
│   │
│   ├── onboarding/
│   │   ├── presentation/
│   │   │   ├── screens/
│   │   │   │   └── onboarding_screen.dart
│   │   │   └── widgets/
│   │   │       └── onboarding_page.dart
│   │   └── onboarding_module.dart
│   │
│   ├── auth/
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   └── auth_remote_datasource.dart
│   │   │   ├── models/
│   │   │   │   └── user_model.dart
│   │   │   └── repositories/
│   │   │       └── auth_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user_entity.dart
│   │   │   ├── repositories/
│   │   │   │   └── auth_repository.dart
│   │   │   └── usecases/
│   │   │       ├── sign_in_usecase.dart
│   │   │       ├── sign_up_usecase.dart
│   │   │       ├── sign_out_usecase.dart
│   │   │       ├── forgot_password_usecase.dart
│   │   │       └── delete_account_usecase.dart
│   │   ├── presentation/
│   │   │   ├── bloc/
│   │   │   │   ├── auth_bloc.dart
│   │   │   │   ├── auth_event.dart
│   │   │   │   └── auth_state.dart
│   │   │   ├── screens/
│   │   │   │   ├── welcome_screen.dart
│   │   │   │   ├── sign_in_screen.dart
│   │   │   │   ├── sign_up_screen.dart
│   │   │   │   └── forgot_password_screen.dart
│   │   │   └── widgets/
│   │   │       └── auth_form_field.dart
│   │   └── auth_module.dart
│   │
│   ├── home/
│   │   ├── data/
│   │   ├── domain/
│   │   ├── presentation/
│   │   │   ├── bloc/
│   │   │   ├── screens/
│   │   │   │   └── home_screen.dart
│   │   │   └── widgets/
│   │   │       ├── continue_reading_card.dart
│   │   │       ├── category_rail.dart
│   │   │       ├── recommended_section.dart
│   │   │       └── study_today_card.dart
│   │   └── home_module.dart
│   │
│   ├── explore/
│   │   ├── data/
│   │   ├── domain/
│   │   ├── presentation/
│   │   │   ├── bloc/
│   │   │   ├── screens/
│   │   │   │   ├── explore_screen.dart
│   │   │   │   ├── search_screen.dart
│   │   │   │   ├── category_screen.dart
│   │   │   │   └── subject_screen.dart
│   │   │   └── widgets/
│   │   │       ├── book_card.dart
│   │   │       ├── search_bar.dart
│   │   │       ├── filter_sheet.dart
│   │   │       └── sort_options.dart
│   │   └── explore_module.dart
│   │
│   ├── book_detail/
│   │   ├── data/
│   │   ├── domain/
│   │   ├── presentation/
│   │   │   ├── bloc/
│   │   │   ├── screens/
│   │   │   │   └── book_detail_screen.dart
│   │   │   └── widgets/
│   │   │       ├── book_info_header.dart
│   │   │       ├── chapter_list.dart
│   │   │       ├── learn_section.dart
│   │   │       └── action_buttons.dart
│   │   └── book_detail_module.dart
│   │
│   ├── reader/
│   │   ├── data/
│   │   ├── domain/
│   │   ├── presentation/
│   │   │   ├── bloc/
│   │   │   ├── screens/
│   │   │   │   └── reader_screen.dart
│   │   │   └── widgets/
│   │   │       ├── reader_controls.dart
│   │   │       ├── reader_settings_sheet.dart
│   │   │       ├── highlight_toolbar.dart
│   │   │       ├── note_editor.dart
│   │   │       ├── chapter_navigation.dart
│   │   │       └── reading_progress_bar.dart
│   │   └── reader_module.dart
│   │
│   ├── pdf_reader/
│   │   ├── data/
│   │   ├── domain/
│   │   ├── presentation/
│   │   │   ├── bloc/
│   │   │   ├── screens/
│   │   │   │   └── pdf_reader_screen.dart
│   │   │   └── widgets/
│   │   │       ├── pdf_controls.dart
│   │   │       ├── pdf_thumbnails.dart
│   │   │       ├── pdf_search.dart
│   │   │       └── pdf_annotations.dart
│   │   └── pdf_reader_module.dart
│   │
│   ├── study/
│   │   ├── data/
│   │   ├── domain/
│   │   ├── presentation/
│   │   │   ├── bloc/
│   │   │   ├── screens/
│   │   │   │   ├── study_screen.dart
│   │   │   │   ├── quiz_screen.dart
│   │   │   │   ├── quiz_result_screen.dart
│   │   │   │   ├── flashcard_screen.dart
│   │   │   │   ├── qa_screen.dart
│   │   │   │   ├── revision_center_screen.dart
│   │   │   │   ├── mistake_bank_screen.dart
│   │   │   │   └── study_dashboard_screen.dart
│   │   │   └── widgets/
│   │   │       ├── question_card.dart
│   │   │       ├── quiz_progress.dart
│   │   │       ├── flashcard_widget.dart
│   │   │       ├── score_card.dart
│   │   │       └── study_stats_chart.dart
│   │   └── study_module.dart
│   │
│   ├── shelf/
│   │   ├── data/
│   │   ├── domain/
│   │   ├── presentation/
│   │   │   ├── bloc/
│   │   │   ├── screens/
│   │   │   │   └── shelf_screen.dart
│   │   │   └── widgets/
│   │   │       ├── shelf_section.dart
│   │   │       ├── download_item.dart
│   │   │       ├── highlight_list.dart
│   │   │       ├── note_list.dart
│   │   │       └── bookmark_list.dart
│   │   └── shelf_module.dart
│   │
│   ├── profile/
│   │   ├── data/
│   │   ├── domain/
│   │   ├── presentation/
│   │   │   ├── bloc/
│   │   │   ├── screens/
│   │   │   │   ├── profile_screen.dart
│   │   │   │   ├── settings_screen.dart
│   │   │   │   ├── backup_restore_screen.dart
│   │   │   │   ├── storage_management_screen.dart
│   │   │   │   ├── notification_settings_screen.dart
│   │   │   │   └── account_screen.dart
│   │   │   └── widgets/
│   │   │       ├── stats_overview.dart
│   │   │       ├── settings_tile.dart
│   │   │       └── backup_status_card.dart
│   │   └── profile_module.dart
│   │
│   └── offline/
│       ├── data/
│       │   ├── datasources/
│       │   │   └── offline_local_datasource.dart
│       │   ├── models/
│       │   │   └── entitlement_model.dart
│       │   └── repositories/
│       │       └── offline_repository_impl.dart
│       ├── domain/
│       │   ├── entities/
│       │   │   └── entitlement_entity.dart
│       │   ├── repositories/
│       │   │   └── offline_repository.dart
│       │   └── usecases/
│       │       ├── check_entitlement_usecase.dart
│       │       ├── grant_entitlement_usecase.dart
│       │       ├── expire_entitlement_usecase.dart
│       │       └── cleanup_expired_usecase.dart
│       ├── presentation/
│       │   ├── bloc/
│       │   │   ├── offline_bloc.dart
│       │   │   ├── offline_event.dart
│       │   │   └── offline_state.dart
│       │   └── widgets/
│       │       ├── offline_unlock_dialog.dart
│       │       ├── offline_status_badge.dart
│       │       └── countdown_timer.dart
│       └── offline_module.dart
│
├── services/
│   ├── ad_service.dart               # AdMob integration
│   ├── connectivity_service.dart     # Network monitoring
│   ├── download_service.dart         # Content download management
│   ├── sync_service.dart             # Offline change sync
│   ├── backup_service.dart           # Backup & Restore
│   ├── notification_service.dart     # FCM & local notifications
│   ├── analytics_service.dart        # Firebase Analytics
│   ├── crash_service.dart            # Crashlytics
│   ├── tts_service.dart              # Text-to-Speech
│   └── deep_link_service.dart        # Deep link handling
│
└── l10n/
    ├── app_en.arb                    # English strings
    └── app_hi.arb                    # Hindi strings (future)
```

### 2.3 Dart Coding Requirements

| Requirement | Standard |
|---|---|
| Dart SDK | Latest stable (≥ 3.x) |
| Null Safety | Fully sound null safety required |
| Analysis | `flutter_lints` or `very_good_analysis` |
| Code Style | Follow effective Dart guidelines |
| Documentation | All public APIs documented with `///` doc comments |
| Naming | `lowerCamelCase` for variables/functions, `UpperCamelCase` for classes/enums, `snake_case` for files |
| Constants | `static const` for compile-time, `final` for runtime constants |
| Error Handling | Typed exceptions, never catch `Exception` without rethrow or logging |
| Immutability | Prefer immutable data classes (use `freezed` or `equatable`) |
| Code Generation | `build_runner` for generated code (JSON serialization, freezed, etc.) |

### 2.4 Layer Communication Rules

```
Presentation Layer
    │ Uses BLoC/Cubit
    │ Never imports data layer directly
    ↓
Domain Layer
    │ Defines repository interfaces
    │ Contains use cases / entities
    │ No Flutter/platform imports
    ↓
Data Layer
    │ Implements repository interfaces
    │ Contains data sources, models
    │ Handles API calls, database, caching
    ↓
Infrastructure
    Platform channels, plugins, native code
```

**Rules:**
1. Presentation layer communicates with domain layer via BLoC/Cubit
2. Domain layer defines abstract repository interfaces
3. Data layer implements repository interfaces
4. Domain layer has NO dependency on data layer or Flutter
5. Dependency injection (GetIt) wires everything at startup
6. Models in data layer extend/map to entities in domain layer

---

## 3. Screen-by-Screen Requirements

### 3.1 Splash Screen

**Feature Name:** App Splash  
**Objective:** Display brand identity during app initialization.  
**User Story:** As a user, I want to see the app loading quickly so that I can start using it without delay.

**Screen Elements:**
1. `TF` mark (animated fade-in)
2. `TF Study Shelf` text (animated slide-up)
3. `Read. Learn. Remember.` tagline (animated fade-in)

**Functional Requirements:**

| ID | Requirement |
|---|---|
| SPL-01 | Display for minimum 2 seconds, maximum 5 seconds |
| SPL-02 | Initialize Firebase, check auth state, preload config |
| SPL-03 | No ads of any kind before or during splash |
| SPL-04 | Run expired entitlement cleanup on startup |
| SPL-05 | Check for pending sync operations |
| SPL-06 | Navigate to: Onboarding (first launch), Home (returning user) |

**Edge Cases:**
- Firebase init fails → Retry with backoff, fallback to offline mode
- Slow network → Continue after timeout, degrade gracefully

### 3.2 Onboarding Screen

**Feature Name:** First-Time Onboarding  
**Objective:** Introduce the app's value proposition to new users.

**3 pages with swipe navigation + Continue button:**

| Page | Title | Subtitle | Visual |
|---|---|---|---|
| 1 | "Read without limits" | "Books and PDFs in one place." | Book/shelf illustration |
| 2 | "Study smarter" | "Questions, highlights and notes." | Study tools illustration |
| 3 | "Always free" | "Free access supported by ads." | Free/open illustration |

**Functional Requirements:**

| ID | Requirement |
|---|---|
| ONB-01 | Show only on first launch (persisted flag) |
| ONB-02 | Swipe between pages with page indicator dots |
| ONB-03 | "Skip" option on pages 1-2 |
| ONB-04 | "Continue" button on page 3 → Navigate to Home |
| ONB-05 | No ads during onboarding |
| ONB-06 | Smooth page transition animations |

### 3.3 Home Screen

**Feature Name:** Home / Discovery  
**Objective:** Provide personalized content discovery and continuation.

**Screen Layout (top to bottom):**

```
┌─────────────────────────────────────┐
│ Good morning 👋                      │
│ [🔍 Search books, topics...]         │
├─────────────────────────────────────┤
│ Continue Reading                     │
│ ┌────────┐ ┌────────┐ ┌────────┐   │
│ │Atomic  │ │Physics │ │Calc    │   │
│ │Habits  │ │XII     │ │Basics  │   │
│ │ 72% ▓▓ │ │ 45% ▓░ │ │ 12% ░░ │   │
│ └────────┘ └────────┘ └────────┘   │
├─────────────────────────────────────┤
│ Browse                               │
│ [Books] [PDFs] [Subjects] [Q&A]     │
│ [Study Packs] [Popular]             │
├─────────────────────────────────────┤
│ Recommended for You                  │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ 📘   │ │ 📗   │ │ 📕   │         │
│ │Title │ │Title │ │Title │         │
│ └──────┘ └──────┘ └──────┘         │
├─────────────────────────────────────┤
│ Study Today                          │
│ ┌────────────────────────────────┐  │
│ │ 📚 20 min reading              │  │
│ │ ❓ 10 questions                │  │
│ │ 💡 5 saved concepts            │  │
│ └────────────────────────────────┘  │
├─────────────────────────────────────┤
│ [Banner Ad]                          │
├─────────────────────────────────────┤
│ [🏠] [🔍] [📖] [📚] [👤]           │
│ Home Explore Study Shelf Profile     │
└─────────────────────────────────────┘
```

**Functional Requirements:**

| ID | Requirement |
|---|---|
| HOME-01 | Time-based greeting (Good morning/afternoon/evening/night) |
| HOME-02 | Search bar triggers navigation to search screen |
| HOME-03 | "Continue Reading" shows last 5 books with progress bars |
| HOME-04 | "Browse" horizontal category rail |
| HOME-05 | "Recommended for You" based on reading history, saves, searches |
| HOME-06 | "Study Today" card with daily study plan |
| HOME-07 | Pull-to-refresh for content updates |
| HOME-08 | Lazy loading for images and cards |
| HOME-09 | Banner ad placement above bottom navigation |

### 3.4 Explore Screen

**Feature Name:** Content Exploration  
**Objective:** Browse the complete content catalog.

**Tabs:** Books | PDFs | Subjects | Questions | Study Packs | Popular | Recent

**Filtering:**
- Category/Subject multi-select
- Difficulty (Easy / Medium / Hard)
- Language
- Content type
- Author

**Sorting:**
- Most Popular
- Recently Added
- Title (A-Z / Z-A)
- Rating
- Reading Time

**UI/UX:**
- Grid view (default) / List view toggle
- Infinite scroll with pagination (20 items per page)
- Filter sheet (bottom sheet)
- Sort dropdown

### 3.5 Book Detail Screen

**Feature Name:** Book Detail  
**Objective:** Comprehensive book information with all available actions.

**Screen Layout:**
```
┌─────────────────────────────────────┐
│ [←]                          [⋮]    │
│                                      │
│     ┌──────────────┐                │
│     │   📘 Cover   │                │
│     │    Image     │                │
│     └──────────────┘                │
│                                      │
│  "Atomic Habits"                     │
│  by James Clear                      │
│                                      │
│  ⭐ 4.8  •  📄 320 pages  •  ⏱ 8h   │
│  📂 Self-Development  •  🟡 Medium   │
│                                      │
│  [  Read Now  ] [♥ Save] [⬇ PDF]    │
│                                      │
│  Description                         │
│  An atomic habit is a regular...     │
│  [Read more]                         │
│                                      │
│  ── Learn from this book ──          │
│                                      │
│  Chapter 1: The Surprising Power     │
│    • Summary                         │
│    • Questions & Answers (24)        │
│    • Key Concepts (8)                │
│    • Flashcards (12)                 │
│    • Quiz (10 questions)             │
│                                      │
│  Chapter 2: How Your Habits...       │
│    • Summary                         │
│    ...                               │
└─────────────────────────────────────┘
```

**Actions:**

| Action | Behavior | Condition |
|---|---|---|
| Read Now | Open reader at last position | Always available |
| Save | Add to personal shelf | Always available |
| Download PDF | Ad-gated 24h PDF download | Only if `allowedDownload = true` |
| Use Offline | Ad-gated 24h offline reading | Only if `allowedOffline = true` |
| Questions | Navigate to book Q&A | If questions exist |
| Summary | View book/chapter summary | If summary exists |
| Quiz | Start book quiz | If quiz exists |
| Flashcards | Open flashcard set | If flashcards exist |

### 3.6 Reader Screen

**Feature Name:** Book Reader  
**Objective:** Premium, immersive reading experience.

**Reader Controls:**
- Font size slider (Small → Huge)
- Font family: Manrope (fixed)
- Line spacing: Compact / Normal / Relaxed / Loose
- Paragraph spacing: Small / Medium / Large
- Margins: Narrow / Normal / Wide
- Text alignment: Left / Justify
- Page mode: Paged / Scroll
- Theme: Light / Dark / Dim / System
- Keep screen awake toggle

**Reader Gestures:**

| Gesture | Action |
|---|---|
| Tap left edge (20% width) | Previous page |
| Tap right edge (20% width) | Next page |
| Tap center (60% width) | Toggle reader controls overlay |
| Long press on text | Start text selection mode |
| Pinch (PDF mode) | Zoom in/out |
| Swipe left/right | Page navigation (paged mode) |
| Scroll | Content navigation (scroll mode) |

**Text Selection Toolbar:**

When text is selected, show floating toolbar:
```
[ Highlight ] [ Note ] [ Copy ] [ Share ] [ Ask ]
```

**Highlight Categories (all `#FF7759` alpha variants):**
- Primary Highlight (default)
- Important (darker shade)
- Question (lighter shade)
- Remember (medium shade)
- Definition (subtle shade)

**Highlight Data Model:**
```dart
class Highlight {
  final String id;
  final String bookId;
  final String chapterId;
  final int page;
  final String selectedText;
  final TextPosition startPosition;
  final TextPosition endPosition;
  final HighlightCategory category;
  final String? noteId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final SyncStatus syncStatus;
}
```

**Notes:**
- Attach to: Book, Chapter, Page, Paragraph, or Highlight
- Types: Text, Checklist, Question, Idea
- Future: Convert Note → Flashcard

**Bookmarks:**
- Simple page-level bookmarks
- Synced when signed in
- Visible in Shelf

**Reading Progress:**
- Percentage complete (shown in reader header)
- Page counter: `PAGE 048 / 320` (Geist Mono font)
- Chapter progress bar
- Estimated time remaining

### 3.7 PDF Reader Screen

**Feature Name:** In-App PDF Reader  
**Objective:** Full-featured PDF reading without external apps.

**User Story:** As a user, I want to read PDFs within the app so that I never need to use an external PDF app.

**Features:**

| Feature | Description |
|---|---|
| Zoom | Pinch-to-zoom, fit-width, fit-page, custom zoom level |
| Page thumbnails | Sidebar/bottom strip with page previews |
| Page navigation | Jump-to-page, page number display |
| In-document search | Text search within PDF |
| Bookmarks | Save specific pages |
| Annotations | Highlight and notes (where PDF engine supports) |
| Reading progress | Track pages read / total |
| Orientation | Portrait and landscape support |
| Rotation | Rotate PDF pages |
| Dark mode | Invert colors for dark reading (where feasible) |
| Table of contents | Navigate by chapter/section |
| Text selection | Copy text (where PDF supports it) |

**Flutter Package:** Use `syncfusion_flutter_pdfviewer` or `pdfx` or equivalent mature Flutter PDF package.

**Security:**
- PDFs opened with app's own reader only
- Share action only available if `allowedShare = true`
- No export to external apps unless rights permit

### 3.8 Study Screen

**Feature Name:** Study Hub  
**Objective:** Central place for all study tools and activities.

**Screen Layout:**
```
┌─────────────────────────────────────┐
│  Study                               │
├─────────────────────────────────────┤
│  Your Study Progress                 │
│  ┌─────────────────────────────────┐│
│  │ 📊 Weekly: 4h 23m studied       ││
│  │ 📝 47 questions answered         ││
│  │ ✅ 82% quiz accuracy             ││
│  │ 🔥 5-day streak                  ││
│  └─────────────────────────────────┘│
│                                      │
│  ┌────────┐ ┌────────┐             │
│  │📝      │ │🃏      │             │
│  │Quizzes │ │Flash-  │             │
│  │        │ │cards   │             │
│  └────────┘ └────────┘             │
│  ┌────────┐ ┌────────┐             │
│  │📖      │ │🔄      │             │
│  │Q&A     │ │Revision│             │
│  │        │ │Center  │             │
│  └────────┘ └────────┘             │
│  ┌────────┐ ┌────────┐             │
│  │❌      │ │📴      │             │
│  │Mistake │ │Study   │             │
│  │Bank    │ │Offline │             │
│  └────────┘ └────────┘             │
│                                      │
│  Recent Study Activity               │
│  • Completed "Physics Ch. 5 Quiz"   │
│  • Reviewed 12 flashcards           │
│  • Answered 8 questions             │
└─────────────────────────────────────┘
```

### 3.9 Quiz Screen

**Feature Name:** Quiz Engine  
**Objective:** Interactive quiz experience with scoring and review.

**Quiz Flow:**
```
Quiz Selection
    ↓
Quiz Start Screen
  Title, question count, time limit, difficulty
  [ Start Quiz ]
    ↓
Question Screen (1/10)
  Question text
  [ Option A ]
  [ Option B ]  ← selected
  [ Option C ]
  [ Option D ]
  [ Next → ]
    ↓
(repeat for each question)
    ↓
Quiz Result Screen
  Score: 8/10 · Accuracy: 80%
  Time: 4m 23s
  Needs revision: 2 topics
  [ Review Mistakes ] [ Retry ] [ Save to Mistake Bank ] [ Done ]
```

**Features:**
- Timed/untimed mode
- Random question ordering (configurable)
- Chapter-specific, subject-specific, or mixed
- Difficulty filter
- Instant explanation after each answer
- Final score with percentage
- Incorrect-answer review
- Retry quiz
- Save quiz results
- Add wrong answers to Mistake Bank

### 3.10 Flashcard Screen

**Feature Name:** Flashcard Viewer  
**Objective:** Spaced-repetition-ready flashcard study tool.

**Interaction:**
```
┌─────────────────────────────────────┐
│  Flashcards: Physics Ch. 1          │
│  Card 4 of 12                        │
│                                      │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │   What is Newton's First       │  │
│  │   Law of Motion?               │  │
│  │                                │  │
│  │        [Tap to flip]           │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  [ 👎 Review Again ]  [ 👍 Got it ] │
│                                      │
│  ━━━━━━━━━━━━━░░░░░░ 33%           │
└─────────────────────────────────────┘
```

**Card flip animation:** 3D flip effect, front → back

### 3.11 Shelf Screen

**Feature Name:** Personal Library  
**Objective:** Users' personal collection of saved content and annotations.

**Sections:**
1. **Continue Reading** — Books with active progress
2. **Saved Books** — Bookmarked/favorited books
3. **Downloads** — PDFs + offline packages with countdowns
4. **Highlights** — All highlights across books
5. **Notes** — All notes across books
6. **Bookmarks** — All page bookmarks
7. **Comments** — User's private annotations
8. **Finished** — Completed books

**View Options:** Grid / List  
**Sort Options:** Recently opened, Recently added, Title, Author, Progress

**Download Items Display:**
```
┌─────────────────────────────────────┐
│  📄 Physics Class 12                 │
│  PDF · 23h 41m remaining            │
│  ━━━━━━━━━━━━━━━━━━━░ Offline       │
│  Expires: 03 Sep · 08:30            │
├─────────────────────────────────────┤
│  📖 Organic Chemistry               │
│  Book · 1h 12m remaining ⚠️          │
│  ━━━━━━━━━━━━━━━━━━━━ Expiring Soon │
├─────────────────────────────────────┤
│  📝 Math Study Pack                  │
│  Study · Expired                     │
│  [ Unlock Again ]                    │
└─────────────────────────────────────┘
```

### 3.12 Profile Screen

**Feature Name:** User Profile & Settings  
**Objective:** Account management, statistics, and app settings.

**Screen Layout:**
```
┌─────────────────────────────────────┐
│  Profile                             │
├─────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ 📊 Statistics                  │  │
│  │ Books: 12 │ Pages: 2,340      │  │
│  │ Quizzes: 23 │ Accuracy: 78%   │  │
│  │ Study Time: 42h │ Streak: 5d  │  │
│  └────────────────────────────────┘  │
│                                      │
│  📖 Reading Settings                 │
│  🔔 Notifications                    │
│  ♿ Accessibility                     │
│  💾 Storage Management               │
│  ☁️ Backup & Restore                 │
│  🔒 Privacy & Legal                  │
│  👤 Account                          │
│  🎨 Appearance (Theme)               │
│  ℹ️ About                            │
└─────────────────────────────────────┘
```

**Statistics Dashboard:**
- Books Read / In Progress / Finished
- Total Pages Read
- Questions Answered
- Quiz Accuracy (%)
- Total Study Time
- Current Reading Streak
- Favorite Subjects
- Weak Subjects
- Weekly time chart (Mon–Sun, Geist Mono font for numbers)

### 3.13 Backup & Restore Screen

**Feature Name:** Cloud Backup & Restore  
**Objective:** Secure backup and restoration of user study data.

**Screen Layout:**
```
┌─────────────────────────────────────┐
│  Backup & Restore                    │
│  Your data — Everything synced       │
│  to your account.                    │
│                                      │
│  LAST BACKUP                         │
│  02 Sep 2026 · 08:53 AM             │
│  ✓ Backup available                  │
│                                      │
│  BACKUP                              │
│  Create a secure backup of your      │
│  study data and save it online.      │
│  [ Backup Now ]                      │
│                                      │
│  RESTORE                             │
│  Restore your study data from        │
│  your online backup.                 │
│  [ Restore Backup ]                  │
│                                      │
│  BACKUP STORAGE                      │
│  Latest: 02 Sep 2026 · 08:53 AM     │
│  Previous: 30 Aug 2026 · 06:21 PM   │
│  [ Delete Old Backup ]              │
│                                      │
│  Account                             │
│  user@email.com                      │
└─────────────────────────────────────┘
```

→ See [Section 10](#10-backup--restore-system) for complete backup/restore specification.

### 3.14 Storage Management Screen

**Feature Name:** Storage Usage  
**Objective:** Let users manage local storage consumption.

```
┌─────────────────────────────────────┐
│  Storage                             │
│                                      │
│  Storage Used: 1.2 GB                │
│  ━━━━━━━━━━░░░░░░░░░░ 12%          │
│                                      │
│  Offline Books    480 MB             │
│  Temporary PDFs   320 MB             │
│  Study Packs      240 MB             │
│  Images/Assets     96 MB             │
│  Cache             64 MB             │
│                                      │
│  [ Clear Cache ]                     │
│  [ Remove Expired Content ]          │
│  [ Manage Offline Content ]          │
│                                      │
│  Download Preference                 │
│  ( ) Wi-Fi only                      │
│  (●) Allow mobile data               │
│  ( ) Ask every time                  │
└─────────────────────────────────────┘
```

---

## 4. Navigation & Routing

### 4.1 Bottom Navigation

**5 tabs using `NavigationBar` (Material 3):**

| Tab | Icon | Label | Root Screen |
|---|---|---|---|
| 1 | 🏠 `Icons.home_outlined` | Home | `HomeScreen` |
| 2 | 🔍 `Icons.explore_outlined` | Explore | `ExploreScreen` |
| 3 | 📖 `Icons.school_outlined` | Study | `StudyScreen` |
| 4 | 📚 `Icons.library_books_outlined` | Shelf | `ShelfScreen` |
| 5 | 👤 `Icons.person_outlined` | Profile | `ProfileScreen` |

### 4.2 Routing (GoRouter)

```dart
// Route configuration using GoRouter
final router = GoRouter(
  initialLocation: '/',
  routes: [
    // Splash & Onboarding
    GoRoute(path: '/', builder: (_, __) => SplashScreen()),
    GoRoute(path: '/onboarding', builder: (_, __) => OnboardingScreen()),
    
    // Auth routes
    GoRoute(path: '/welcome', builder: (_, __) => WelcomeScreen()),
    GoRoute(path: '/sign-in', builder: (_, __) => SignInScreen()),
    GoRoute(path: '/sign-up', builder: (_, __) => SignUpScreen()),
    GoRoute(path: '/forgot-password', builder: (_, __) => ForgotPasswordScreen()),
    
    // Main shell with bottom navigation
    ShellRoute(
      builder: (_, __, child) => MainShell(child: child),
      routes: [
        GoRoute(path: '/home', builder: (_, __) => HomeScreen()),
        GoRoute(path: '/explore', builder: (_, __) => ExploreScreen()),
        GoRoute(path: '/study', builder: (_, __) => StudyScreen()),
        GoRoute(path: '/shelf', builder: (_, __) => ShelfScreen()),
        GoRoute(path: '/profile', builder: (_, __) => ProfileScreen()),
      ],
    ),
    
    // Detail routes
    GoRoute(path: '/book/:bookId', builder: (_, state) => BookDetailScreen(...)),
    GoRoute(path: '/reader/:bookId', builder: (_, state) => ReaderScreen(...)),
    GoRoute(path: '/pdf/:pdfId', builder: (_, state) => PdfReaderScreen(...)),
    GoRoute(path: '/quiz/:quizId', builder: (_, state) => QuizScreen(...)),
    GoRoute(path: '/flashcards/:setId', builder: (_, state) => FlashcardScreen(...)),
    GoRoute(path: '/qa/:bookId', builder: (_, state) => QAScreen(...)),
    
    // Settings routes
    GoRoute(path: '/settings', builder: (_, __) => SettingsScreen()),
    GoRoute(path: '/backup-restore', builder: (_, __) => BackupRestoreScreen()),
    GoRoute(path: '/storage', builder: (_, __) => StorageManagementScreen()),
    GoRoute(path: '/account', builder: (_, __) => AccountScreen()),
  ],
);
```

### 4.3 Deep Link Support

| Link Pattern | Target |
|---|---|
| `tfstudyshelf://book/{bookId}` | Book detail screen |
| `tfstudyshelf://reader/{bookId}` | Reader for specific book |
| `tfstudyshelf://quiz/{quizId}` | Quiz screen |
| `tfstudyshelf://explore` | Explore screen |

**Fallback:** If linked content doesn't exist or isn't available, navigate to Home with a snackbar message.

---

## 5. Authentication

### 5.1 Auth System

**Provider:** Firebase Auth (Email + Password only)

**Supported:**
- ✅ Email + Password (Sign Up, Sign In)
- ✅ Forgot Password (Firebase reset email)
- ✅ Email verification (optional account security step)

**Explicitly NOT Supported:**
- ❌ Google Sign-In
- ❌ Facebook
- ❌ Apple Sign-In
- ❌ Phone OTP
- ❌ Anonymous auth for cloud features

### 5.2 Auth Flow

```
App Launch
    ↓
Check Auth State (FirebaseAuth.currentUser)
    ↓
├── Signed In → Home Screen
└── Not Signed In → Continue as Guest
        ↓
    Guest can browse, read, use offline features
        ↓
    Prompted to sign in for: sync, backup, cross-device
```

### 5.3 Sign Up Screen

**Fields:**
- Email (validated: proper format)
- Password (validated: minimum 8 characters, mixed case + number)
- Confirm Password (validated: matches password)

**Error States:**

| Error | Message |
|---|---|
| Invalid email | "Please enter a valid email address" |
| Weak password | "Password must be at least 8 characters with letters and numbers" |
| Passwords don't match | "Passwords do not match" |
| Email already registered | "An account with this email already exists. Sign in instead?" |
| Network error | "Unable to connect. Check your internet and try again." |

### 5.4 Sign In Screen

**Fields:** Email, Password  
**Actions:** `[ Sign In ]`, "Forgot Password?" link

### 5.5 Account Deletion

**Location:** Profile → Account → Delete Account

**Flow:**
```
User taps "Delete Account"
    ↓
Confirmation dialog:
  "Delete your account? This will permanently delete:
   • Your account and login
   • Cloud backups
   • Synced highlights, notes, and progress
   
   Local data on this device will be removed.
   This action cannot be undone."
    ↓
Re-authenticate (enter password)
    ↓
Delete account + all associated data
    ↓
Navigate to Welcome screen
```

→ See [08 Authentication & Security](./08_Authentication_Security.md) for complete auth specification.

---

## 6. Books & Reading Experience

### 6.1 Book Data Model

```dart
class Book {
  final String id;
  final String title;
  final String author;
  final String description;
  final String coverImageUrl;
  final String language;
  final int pageCount;
  final Difficulty difficulty;
  final int estimatedReadTimeMinutes;
  final List<String> categoryIds;
  final List<String> subjectIds;
  final RightsStatus rightsStatus;
  final String? licenseName;
  final String? licenseSource;
  final String? rightsHolder;
  final bool allowedDownload;
  final bool allowedOffline;
  final bool allowedShare;
  final String? pdfGoogleDriveId;
  final ContentStatus status;
  final int version;
  final double? rating;
  final List<String>? tags;
  final List<String>? examTags;
  final DateTime createdAt;
  final DateTime updatedAt;
}
```

### 6.2 Reading Progress Model

```dart
class ReadingProgress {
  final String id;
  final String userId;
  final String bookId;
  final int currentPage;
  final int totalPages;
  final double progressPercent;
  final String? currentChapterId;
  final Duration totalReadTime;
  final DateTime lastReadAt;
  final SyncStatus syncStatus;
}
```

### 6.3 Book Completion Flow

At 100% progress:

```
┌─────────────────────────────────────┐
│  🎉 Book Completed!                 │
│                                      │
│  "Atomic Habits"                     │
│  by James Clear                      │
│                                      │
│  Reading Time: 8h 23m               │
│  Highlights: 34                      │
│  Notes: 12                           │
│                                      │
│  [ Review Highlights ]               │
│  [ Take Quiz ]                       │
│  [ View Notes ]                      │
│  [ Start Another Book ]              │
└─────────────────────────────────────┘
```

### 6.4 Text-to-Speech

**Feature Name:** Listen Mode  
**Objective:** Enable audio reading for supported text content.

**Controls:**
- ▶️ Play / ⏸ Pause
- ⏪ 10 sec back / ⏩ 10 sec forward
- Speed: 0.75x / 1.0x / 1.25x / 1.5x / 2.0x

**Flutter Implementation:** Use `flutter_tts` package with device's built-in TTS engine.

---

## 7. PDF System

### 7.1 PDF Download Flow (24-Hour)

→ Full specification in [Section 9.3](#93-offline-pdf-download-flow)

### 7.2 PDF Access Rules

| Rule | Enforcement |
|---|---|
| Never open in external app | App's own PDF reader always used |
| Download gated by ad | Rewarded ad required for PDF download |
| 24-hour expiry | PDF access expires after 24 hours |
| Rights-based sharing | Share only if `allowedShare = true` |
| No permanent local copy | Expired PDFs cleaned up |

### 7.3 Google Drive PDF Retrieval

```
App requests PDF
    ↓
Cloudflare Worker receives request
    ↓
Worker authenticates with Google Drive API
    ↓
Worker fetches PDF bytes
    ↓
Worker streams PDF to app
    ↓
App renders in internal PDF viewer
```

PDFs are never exposed via public Google Drive URLs — always proxied through authenticated Workers.

---

## 8. Study Tools

### 8.1 Q&A System

**Question Types:**
- MCQ (Multiple Choice)
- Short Answer
- Long Answer
- True/False
- Fill in the Blank
- Exam-Style
- Conceptual
- Chapter-wise

**Difficulty Levels:** Easy / Medium / Hard

### 8.2 Quiz Engine

**Features:**
- Timed/untimed modes
- Random question ordering
- Chapter-specific, subject-specific, mixed
- Difficulty filter
- Instant explanation after answer
- Final score card
- Incorrect-answer review
- Retry quiz
- Save quiz result to history
- Add wrong answers to Mistake Bank

### 8.3 Flashcard Engine

- Front: Question/concept
- Back: Answer/explanation
- Actions: Got it / Review Again
- Convert saved question → Flashcard
- Future: Spaced-repetition scheduling (V2)

### 8.4 AI Study Assistant (V2)

**Online-only** — never promised to work offline.

**Context-aware:** Current book, current chapter, selected text, available Q&A, user's notes.

**Example queries:**
- "Explain this simply"
- "Summarize this chapter"
- "Make 10 MCQs"
- "What should I remember?"
- "Give me revision notes"

**Requirements:**
- Clear "AI-generated" labeling
- Report/feedback control on AI answers
- Never imply AI content is verified/authoritative
- Rate limits and abuse controls

### 8.5 Study Dashboard

**Metrics:**
- Books Read / In Progress / Completed
- Total Pages Read
- Questions Answered
- Quiz Accuracy (%)
- Total Study Time
- Current Streak
- Favorite / Weak Subjects
- Weekly time chart (Mon → Sun)

### 8.6 Revision Center

**"Review Today" section combining:**
- Saved highlights
- Incorrect quiz questions
- Due flashcards
- Weak topics
- Recent notes

### 8.7 Mistake Bank

**"My Mistakes" — every wrong quiz answer can be saved here for focused revision.**

**Display:**
```
┌─────────────────────────────────────┐
│  My Mistakes (23 saved)              │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Physics Ch. 3 · Medium         │  │
│  │ Q: What is the SI unit of...   │  │
│  │ Your answer: Watt              │  │
│  │ Correct: Joule                 │  │
│  │ [ View Explanation ] [ Remove ]│  │
│  └────────────────────────────────┘  │
│  ...                                 │
└─────────────────────────────────────┘
```

### 8.8 Reading Goals

User sets target:
- 10 / 20 / 30 minutes per day
- OR 10 / 20 / 50 pages per day

Dashboard shows: `Today's goal: 70% ▓▓▓▓▓▓▓░░░`

### 8.9 Learning Paths (V2)

Sequenced curriculum, e.g.:
```
Learn Python:
  1. ✅ Basics → [Book: Python Intro Ch. 1]
  2. ✅ Variables → [Book: Python Intro Ch. 2]
  3. 🔄 Conditions → [Quiz: Python Conditions]
  4. ⬜ Functions → [Book: Python Intro Ch. 4]
  5. ⬜ OOP → [Book: Python Advanced Ch. 1]
  ...
```

---

## 9. 24-Hour Temporary Offline Access System

### 9.1 Core Rule

> Offline Reading, PDF Download, and Offline Study are each unlocked by a **rewarded video ad**. Once unlocked, everything works **exactly like online use** for **24 hours**, after which the content **auto-removes**, and the user must **watch the ad again** to re-unlock.

**Critical Technical Note:** An ad cannot be served while offline. Every flow must check connectivity before offering the ad.

### 9.2 Offline Reading Flow

**Entry Point:** "Use Offline" button in a book.

```
User taps "Use Offline"
    ↓
connectivity_service.checkConnectivity()
    ↓
┌────────────────┴────────────────┐
│                                 │
OFFLINE                          ONLINE
│                                 │
AlertDialog:                     AlertDialog:
"Internet connection             "Unlock 24-Hour
 required"                        Offline Reading"
"To unlock offline               "Watch a rewarded ad
 reading, connect to              to make this book
 the internet and                 available offline for
 try again."                      the next 24 hours."
[Turn On Internet]               [Watch Ad & Unlock]
[Cancel]                         [Cancel]
                                     ↓
                               ad_service.showRewarded()
                                     ↓
                               Reward verified
                                     ↓
                               LinearProgressIndicator:
                               "Preparing offline book… 38%"
                                     ↓
                               Download: book content,
                               chapters, images, reader
                               metadata, Q&A, study data
                                     ↓
                               SnackBar: "Available
                               offline for 24 hours"
```

### 9.3 Offline PDF Download Flow

**Entry Point:** "Download PDF" button in book/PDF detail.

```
User taps "Download PDF"
    ↓
connectivity_service.checkConnectivity()
    ↓
┌────────────────┴────────────────┐
│                                 │
OFFLINE                          ONLINE
│                                 │
AlertDialog:                     AlertDialog:
"Internet Required"              "Unlock PDF Download"
"PDF downloads require           "Watch a rewarded ad
 an internet connection."         to unlock this PDF
[Retry] [Cancel]                  for 24 hours."
                                 [Watch Ad & Download]
                                 [Cancel]
                                     ↓
                               ad_service.showRewarded()
                                     ↓
                               "Preparing PDF…"
                               "Downloading 64%"
                                     ↓
                               "PDF available offline
                                for 24 hours"
```

### 9.4 Offline Study Flow

**Entry Point:** "Study Offline" on Study tab.

```
Study → "Study Offline"
    ↓
connectivity_service.checkConnectivity()
    ↓
(offline → internet-required dialog)
    ↓ (online)
AlertDialog:
"Unlock Offline Study for 24 Hours"
"Watch a rewarded ad to continue
 studying offline."
[Watch Ad & Unlock] [Cancel]
    ↓
ad_service.showRewarded()
    ↓
Study package downloads:
  Questions · Answers · Quiz · Flashcards ·
  Saved highlights · Cached summaries ·
  Study notes · Revision list
    ↓
"Available offline for 24 hours"
```

### 9.5 Entitlement Data Model

```dart
class OfflineEntitlement {
  final String id;
  final String userId;     // or deviceIdHash for guests
  final String contentId;
  final EntitlementType type; // BOOK_OFFLINE | PDF | STUDY_PACKAGE
  final DateTime grantedAt;
  final DateTime expiresAt;  // grantedAt + 24 hours
  final EntitlementStatus status; // ACTIVE | EXPIRED | REVOKED
  final int contentVersion;
  final String rewardTransactionId; // idempotency key
}
```

### 9.6 Entitlement Validation

```dart
bool canOpen(String contentId) {
  return localFileExists(contentId)
      && entitlementValid(contentId)  // currentTime < expiresAt
      && contentVersionAllowed(contentId);
}
```

**Validation Points:**
1. On content open
2. At key reading transitions (chapter change, page milestone)
3. On WorkManager scheduled check
4. On app startup

### 9.7 Offline Feature Matrix

| Feature | Offline Available |
|---|---|
| Read downloaded book | ✅ |
| Page/chapter navigation | ✅ |
| Reader settings, font, theme | ✅ |
| Highlights, notes, bookmarks | ✅ |
| Reading progress | ✅ |
| Chapter summary / Q&A / Quiz / Flashcards | ✅ if cached |
| Text-to-speech | ✅ (local TTS) |
| In-book search | ✅ if local index |
| AI cloud assistant | ❌ (always online) |
| Cloud sync | ❌ (until online) |
| New content / downloads | ❌ |
| Rewarded ads | ❌ |
| Community features | ❌ |

### 9.8 Offline Change Sync

Offline changes saved as `PendingOperation`:
```dart
class PendingOperation {
  final String id;
  final OperationType type; // CREATE_NOTE, CREATE_HIGHLIGHT, etc.
  final String entityId;
  final Map<String, dynamic> data;
  final DateTime createdAt;
  final SyncStatus status; // PENDING | UPLOADING | SYNCED | FAILED
  final int retryCount;
}
```

When connectivity returns: "Syncing your study activity…" → retry with exponential backoff.

**Conflict Resolution:**
- Notes/highlights: Unique IDs, no merge needed
- Reading progress: Latest timestamp wins (or highest progress)
- Quiz results: Never overwritten — every attempt appended

### 9.9 Auto-Removal / Expiry

**Expiry UX:**
```
AlertDialog:
"Offline access expired"
"Your 24-hour offline access has ended.
 Connect to the internet and watch a
 rewarded ad to use this again."
[Unlock Offline Again] [Read Online]
```

**Cleanup Sequence:**
1. Mark entitlement `EXPIRED`
2. Remove/access-block temporary content
3. Delete cached offline files
4. **Retain** user-created metadata (notes, highlights, bookmarks, progress)
5. Clean up orphaned files

**Implementation:** `WorkManager` (via `workmanager` Flutter package) + startup check + access-time check

### 9.10 Clock-Tampering Protection

- Server timestamp when online
- Last known trusted network time
- Monotonic elapsed time contribution
- Secure local storage (encrypted shared preferences)
- Re-validate against server on next online connection

### 9.11 Offline UX States

| State | Display |
|---|---|
| Available Offline | `23h 41m remaining` |
| Expiring Soon | `1h 12m remaining` ⚠️ |
| Expired | `Offline access expired` |
| Downloading | `68%` progress bar |
| Waiting for network | `Waiting for internet` |
| Failed | `Couldn't prepare offline content` |

### 9.12 Edge Cases

| Scenario | Handling |
|---|---|
| Expiry mid-session | Check on transitions; graceful "expired" message |
| Content version change during active | Existing package stays valid; new unlock fetches latest |
| Ad unavailable | "Rewarded ad isn't available right now" + [Try Again] / [Read Online] |
| App killed during download | Resume on relaunch |
| Low storage | Warning before download; fail gracefully |
| Multiple concurrent downloads | Queue system; one at a time |

---

## 10. Backup & Restore System

### 10.1 Overview

**Location:** Profile → Backup & Restore  
**Requires:** Signed-in account  
**Philosophy:** Complete backup always built locally first, then encrypted and uploaded.

### 10.2 Backup Flow

```
User taps "Backup Now"
    ↓
Check: signed in? → Check: internet?
    ↓
AlertDialog:
"Backup Your Data"
"Your complete study data will first be
 prepared securely on this device and then
 backed up online. Watch a rewarded ad
 to continue."
[Watch Ad & Backup] [Cancel]
    ↓
ad_service.showRewarded()
    ↓
Reward received
    ↓
Stage 1: "Creating local backup…" 32%
Stage 2: "Securing backup…" 64%
Stage 3: "Uploading backup…" 82%
Stage 4: "Verifying backup…" 100%
    ↓
"Backup completed successfully"
02 Sep 2026 · 08:53 AM
```

**Critical Rule:** Reward-received and backup-succeeded are TWO SEPARATE STATES. Never show "complete" at ad finish.

### 10.3 What's Backed Up

**Included:**
```
manifest · profile · account metadata
shelf (saved/finished/recently opened books)
reading (progress, positions, bookmarks, reading time)
annotations (highlights, notes, private comments)
study (quiz attempts/results, flashcard state, revision state)
preferences (theme, font size, reader settings, notifications)
sync (pending sync operations)
```

**Excluded (re-obtainable from server):**
- PDF files
- Book cover cache
- Downloaded offline packages
- Image cache
- Temporary files

### 10.4 Encryption Pipeline

```
Local Data → Backup Builder → Canonical Format → Compression
    → Encryption (AES-256) → Checksum → .tfsbackup → Cloud Storage
```

### 10.5 Restore Flow

```
User taps "Restore Backup"
    ↓
Signed-in check → Internet check
    ↓
"Restore Backup?"
"This will replace your current app data
 with the selected backup."
[Restore Backup] [Cancel]
    ↓
ad_service.showRewarded()
    ↓
CREATE SAFETY SNAPSHOT of current data
    ↓
Download cloud backup → Validate checksum → Decrypt
    ↓
Validate schema/version
    ↓
Show restore summary → User confirms
    ↓
Restore to local database
    ↓
"Restore completed"
```

### 10.6 Failure States

| Scenario | Message | Actions |
|---|---|---|
| Upload fails after local success | "Your local backup was created, but online upload failed." | [Retry Upload] [Keep Local] [Cancel] |
| Offline for backup | "Internet connection required to upload your backup." | [Turn On Internet] [Cancel] |
| Offline for restore | "Internet connection required to retrieve your online backup." | [Turn On Internet] [Cancel] |
| Corrupted backup | "Backup couldn't be restored. Your current data has not been changed." | [OK] |
| Schema mismatch | "Backup incompatible with this app version. Update the app." | [Update App] [Cancel] |

### 10.7 Multiple Backup Versions

Retain **latest 2 backups** per user. Optional "Delete old backup" action.

---

## 11. Search, Filtering & Sorting

### 11.1 Cross-Content Search

**Search spans:** Book title, author, subject, topic, chapter, question text, keyword

**Search Results Grouping:**
```
Results for "photosynthesis"

📘 Books (3)
  • Biology Class 11 — Chapter 13
  • Plant Science — Chapter 5
  • Exam Prep Biology

📄 PDFs (2)
  • Photosynthesis Notes.pdf
  • Biology Revision Guide.pdf

❓ Questions (12)
  • "Explain the process of photosynthesis..."
  • "What are the products of photosynthesis?"
  ...

📖 Chapters (4)
  • Biology Ch. 13: Photosynthesis
  ...
```

### 11.2 Search Features

- Autocomplete suggestions
- Recent searches (stored locally)
- Popular searches (from server)
- Debounced input (300ms delay)
- Minimum 2 characters
- Maximum 200 characters

### 11.3 Filter System

**Filter Sheet (BottomSheet):**
```
┌─────────────────────────────────────┐
│  Filters                     [Clear]│
│                                      │
│  Content Type                        │
│  [Books] [PDFs] [Q&A] [All]        │
│                                      │
│  Subject                             │
│  [Physics] [Chemistry] [Math] [+]   │
│                                      │
│  Difficulty                          │
│  [Easy] [Medium] [Hard] [All]       │
│                                      │
│  Language                            │
│  [English ▼]                         │
│                                      │
│  [ Apply Filters ]                   │
└─────────────────────────────────────┘
```

---

## 12. Favorites, Bookmarks & History

### 12.1 Save/Favorite System

- Tap ♥ to save a book to shelf
- Saved books appear in Shelf → Saved Books
- Synced when signed in

### 12.2 Bookmarks

- Page-level bookmarks within reader
- Quick-add via reader toolbar
- Visible in Shelf → Bookmarks

### 12.3 Reading History

- Automatic tracking of opened books
- "Continue Reading" on Home shows recent books with progress
- Full history in Shelf → Recently Opened

### 12.4 Highlights & Notes

- All highlights accessible in Shelf → Highlights
- All notes accessible in Shelf → Notes
- Filter by book, chapter, category, date
- Search within highlights and notes

---

## 13. Notifications

### 13.1 Notification Types

| Type | Example | Trigger |
|---|---|---|
| Reading Reminder | "You're 12 pages from finishing this chapter" | Automated |
| Revision Reminder | "Review your saved highlights from Chemistry" | Automated |
| New Content | "12 new books were added to Science" | Admin push |
| Quiz Reminder | "Your saved quiz is waiting" | Automated |
| Study Goal | "You're 70% to today's goal!" | Automated |
| Offline Expiry | "Your offline access expires in 1 hour" | Local |

### 13.2 Implementation

**Push Notifications:** Firebase Cloud Messaging (`firebase_messaging` package)  
**Local Notifications:** `flutter_local_notifications` package

### 13.3 User Settings

Per-category opt-in/out:
- ✅ New content alerts
- ✅ Reading reminders
- ✅ Quiz reminders
- ✅ Revision reminders
- ✅ Study goal notifications
- ✅ Announcements

### 13.4 Offline Expiry Notifications

Local scheduled notification at:
- 1 hour before expiry: "Your offline access to 'Book Title' expires in 1 hour"
- At expiry: "Your offline access has expired. Go online to renew."

---

## 14. Ads & Monetization (App)

### 14.1 Ad Formats

| Format | Package | Placement |
|---|---|---|
| Banner | `google_mobile_ads` | Persistent, above bottom navigation |
| Interstitial | `google_mobile_ads` | After qualifying activities |
| Rewarded | `google_mobile_ads` | Opt-in gate for offline/backup features |

### 14.2 AdService Implementation

```dart
class AdService {
  // Banner
  BannerAd? _bannerAd;
  
  // Interstitial
  InterstitialAd? _interstitialAd;
  int _activityCount = 0;
  int _threshold; // randomized 15-25
  
  // Rewarded
  RewardedAd? _rewardedAd;
  
  // State machine
  AdState _state = AdState.idle;
  
  Future<void> initialize();
  Widget buildBanner();
  Future<bool> showInterstitialIfReady();
  Future<RewardResult> showRewarded({
    required String customData, // userId + contentId + type
    required VoidCallback onRewarded,
  });
  void incrementActivity();
  void dispose();
}
```

### 14.3 Rewarded Ad State Machine

```
IDLE → REQUESTED → AD_LOADING → AD_READY → USER_OPTED_IN
     → AD_SHOWING → REWARD_RECEIVED → ENTITLEMENT_GRANTED
     → DOWNLOAD_STARTED

Failures: AD_FAILED · AD_CANCELLED · REWARD_NOT_RECEIVED · DOWNLOAD_FAILED
```

### 14.4 Interstitial Rules

**Threshold:** Random 15-25 qualifying activities  
**Additional gates:**
- Session cooldown
- Minimum time since last interstitial
- Not during reading, quiz, download, reward flow, onboarding

**Qualifying Activities:** Open book, complete chapter, search, open PDF, save book, finish Q&A set, complete quiz, open subject, finish reading session

**NOT qualifying:** Scroll, back press, settings change, font adjustment

### 14.5 SSV Configuration

AdMob SSV enabled on all rewarded ad units. `customData` carries `userId + contentId + entitlementType`.

→ See [09 Ads & Monetization](./09_Ads_Monetization.md) for complete specification.

---

## 15. Offline/Online Behavior

### 15.1 Connectivity Monitoring

```dart
class ConnectivityService {
  Stream<ConnectivityStatus> get statusStream;
  Future<bool> get isOnline;
  Future<bool> get hasInternetAccess; // actual ping, not just Wi-Fi
}
```

**Package:** `connectivity_plus` + manual ping check for actual internet access

### 15.2 Behavior Matrix

| Action | Online | Offline |
|---|---|---|
| Browse/search | ✅ Live data | ✅ Cached data |
| Read (online book) | ✅ | ❌ "Go online to read" |
| Read (offline book) | ✅ | ✅ (if entitlement valid) |
| Highlights/notes | ✅ Synced | ✅ Local, queued for sync |
| Quiz (online) | ✅ | ❌ |
| Quiz (offline) | ✅ | ✅ (if study offline active) |
| PDF download | ✅ (ad required) | ❌ "Internet required" |
| Backup/Restore | ✅ (ad required) | ❌ "Internet required" |
| AI Assistant | ✅ | ❌ |
| Sign in/up | ✅ | ❌ "Internet required" |
| Shelf (saved items) | ✅ | ✅ (cached) |

### 15.3 Offline UI Rules

- Never pretend an online-only feature works offline
- Visibly disable or explain with message
- Show offline indicator in app bar when offline
- Queue sync operations silently
- Show sync status on reconnection

---

## 16. Local Storage & Caching

### 16.1 Storage Architecture

| Storage Type | Technology | Purpose |
|---|---|---|
| **Structured Data** | Drift (SQLite) | Books, chapters, Q&A, quizzes, user data, entitlements |
| **Key-Value** | SharedPreferences / Hive | Settings, flags, tokens, small config |
| **Secure Storage** | `flutter_secure_storage` | Auth tokens, encryption keys, entitlement secrets |
| **File Storage** | App documents directory | PDFs, offline packages, backups |
| **Cache** | App cache directory | Images, API responses, temporary files |

### 16.2 Drift Database Schema

```dart
// Core tables
@DataClassName('BookEntry')
class Books extends Table {
  TextColumn get id => text()();
  TextColumn get title => text()();
  TextColumn get author => text()();
  TextColumn get description => text()();
  TextColumn get coverUrl => text()();
  IntColumn get pageCount => integer()();
  TextColumn get difficulty => text()();
  IntColumn get version => integer()();
  TextColumn get status => text()();
  DateTimeColumn get cachedAt => dateTime()();
}

@DataClassName('EntitlementEntry')
class Entitlements extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get contentId => text()();
  TextColumn get type => text()();
  DateTimeColumn get grantedAt => dateTime()();
  DateTimeColumn get expiresAt => dateTime()();
  TextColumn get status => text()();
  IntColumn get contentVersion => integer()();
  TextColumn get rewardTransactionId => text()();
}

@DataClassName('PendingOpEntry')
class PendingOperations extends Table {
  TextColumn get id => text()();
  TextColumn get type => text()();
  TextColumn get entityId => text()();
  TextColumn get data => text()(); // JSON
  DateTimeColumn get createdAt => dateTime()();
  TextColumn get syncStatus => text()();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
}
```

### 16.3 Caching Strategy

| Data | Cache Duration | Strategy |
|---|---|---|
| Book list | 1 hour | Stale-while-revalidate |
| Book detail | 30 minutes | Stale-while-revalidate |
| Cover images | 7 days | LRU cache with limit |
| Q&A content | 1 hour | Cache-first |
| User progress | Real-time | Write-through |
| Search results | 5 minutes | Network-first |
| PDF files | Until entitlement expires | Manual lifecycle |

---

## 17. API Integration

### 17.1 API Client

**Package:** `dio` (HTTP client with interceptors)

```dart
class ApiClient {
  late final Dio _dio;
  
  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: Duration(seconds: 10),
      receiveTimeout: Duration(seconds: 30),
    ));
    
    _dio.interceptors.addAll([
      AuthInterceptor(),
      CacheInterceptor(),
      ErrorInterceptor(),
      LogInterceptor(),
    ]);
  }
}
```

### 17.2 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/books` | GET | List books (paginated) |
| `/api/books/:id` | GET | Book detail |
| `/api/books/:id/chapters` | GET | Book chapters |
| `/api/books/:id/questions` | GET | Book Q&A |
| `/api/books/:id/quiz` | GET | Book quiz |
| `/api/books/:id/flashcards` | GET | Book flashcards |
| `/api/categories` | GET | All categories |
| `/api/subjects` | GET | All subjects |
| `/api/search` | GET | Cross-content search |
| `/api/pdf/:fileId` | GET | PDF file (proxied from Drive) |
| `/api/user/progress` | POST | Sync reading progress |
| `/api/user/highlights` | POST | Sync highlights |
| `/api/user/notes` | POST | Sync notes |
| `/api/user/bookmarks` | POST | Sync bookmarks |
| `/api/user/quiz-results` | POST | Submit quiz results |
| `/api/backup` | POST/GET | Backup operations |
| `/api/config` | GET | Remote configuration |
| `/api/ssv/verify` | POST | Ad reward verification |

### 17.3 Error Handling

```dart
class ApiException implements Exception {
  final int? statusCode;
  final String message;
  final dynamic data;
}

// Interceptor maps HTTP errors to typed exceptions
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    switch (err.response?.statusCode) {
      case 401: throw UnauthorizedException();
      case 403: throw ForbiddenException();
      case 404: throw NotFoundException();
      case 429: throw RateLimitException();
      case 500: throw ServerException();
      default: throw NetworkException(err.message);
    }
  }
}
```

→ See [06 Backend & API](./06_Backend_API_Requirements.md) for complete API specification.

---

## 18. State Management

### 18.1 Approach: BLoC Pattern

**Package:** `flutter_bloc`

**Why BLoC:**
- Clear separation of business logic and UI
- Testable (events in, states out)
- Predictable state transitions
- Excellent tooling (`bloc_test`, DevTools)
- Scales well with feature complexity

### 18.2 BLoC Architecture

```dart
// Event
abstract class BookDetailEvent {}
class LoadBookDetail extends BookDetailEvent {
  final String bookId;
}
class SaveBook extends BookDetailEvent {
  final String bookId;
}

// State
abstract class BookDetailState {}
class BookDetailInitial extends BookDetailState {}
class BookDetailLoading extends BookDetailState {}
class BookDetailLoaded extends BookDetailState {
  final Book book;
  final List<Chapter> chapters;
  final bool isSaved;
}
class BookDetailError extends BookDetailState {
  final String message;
}

// BLoC
class BookDetailBloc extends Bloc<BookDetailEvent, BookDetailState> {
  final GetBookDetailUseCase _getBookDetail;
  final SaveBookUseCase _saveBook;
  
  BookDetailBloc(this._getBookDetail, this._saveBook)
      : super(BookDetailInitial()) {
    on<LoadBookDetail>(_onLoadBookDetail);
    on<SaveBook>(_onSaveBook);
  }
}
```

### 18.3 Global State

| State | Scope | Manager |
|---|---|---|
| Auth state | Global | `AuthBloc` |
| Connectivity | Global | `ConnectivityCubit` |
| Theme | Global | `ThemeCubit` |
| Ad state | Global | `AdService` (singleton) |
| Reading settings | Global | `ReaderSettingsCubit` |

### 18.4 Feature-Scoped State

Each feature has its own BLoC/Cubit that is scoped to the feature's widget tree and disposed when the feature is popped from navigation.

---

## 19. Error & Exception Handling

### 19.1 Error Categories

| Category | Example | UI Behavior |
|---|---|---|
| Network | No internet, timeout, server error | Retry button + clear message |
| Auth | Session expired, unauthorized | Redirect to login |
| Content | Not found, unavailable, restricted | Informative message |
| Storage | Disk full, permission denied | Warning + guidance |
| Ad | Failed to load, cancelled, not available | Fallback option |
| Validation | Invalid input, missing fields | Inline field errors |

### 19.2 Error UI Pattern

```dart
Widget buildErrorState(String message, VoidCallback onRetry) {
  return Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.error_outline, size: 48, color: AppColors.accent),
        SizedBox(height: 16),
        Text(message, style: AppTypography.body),
        SizedBox(height: 24),
        ElevatedButton(onPressed: onRetry, child: Text('Try Again')),
      ],
    ),
  );
}
```

### 19.3 Crash Reporting

**Package:** `firebase_crashlytics`

```dart
void main() {
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();
    await Firebase.initializeApp();
    
    FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
    
    runApp(const TFStudyShelfApp());
  }, (error, stack) {
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
  });
}
```

---

## 20. Performance & Battery

### 20.1 Performance Targets

| Metric | Target |
|---|---|
| Cold start time | < 3 seconds |
| Hot start time | < 1 second |
| Screen transition | < 300ms |
| Image loading | Progressive + placeholder |
| List scroll | 60fps consistently |
| Memory usage | < 150MB typical |
| APK size | < 30MB (download) |

### 20.2 Optimization Strategies

| Strategy | Implementation |
|---|---|
| Lazy loading | `ListView.builder`, on-demand content loading |
| Image caching | `cached_network_image` with memory + disk cache |
| Pagination | Load 20 items per page, infinite scroll |
| Background tasks | `workmanager` for cleanup, sync (not excessive) |
| Battery | Avoid frequent location/sensor access (not needed) |
| Efficient rebuilds | `const` widgets, `Selector`/`BlocSelector` for granular rebuilds |
| PDF streaming | Load pages on demand, not entire PDF |
| Memory management | Dispose controllers, close streams, cancel subscriptions |

### 20.3 Battery Considerations

| Action | Battery Impact | Mitigation |
|---|---|---|
| Background sync | Low | Batch operations, respect doze mode |
| Offline cleanup | Minimal | WorkManager with flex period |
| Network requests | Moderate | Cache aggressively, batch API calls |
| PDF rendering | Moderate-High | Load visible pages only |
| TTS | Moderate | Use system TTS engine |
| Keep screen awake | High | User opt-in toggle only |

---

## 21. Security & Privacy

### 21.1 Security Measures

| Measure | Implementation |
|---|---|
| Auth tokens | Stored in `flutter_secure_storage` (Keystore-backed) |
| API communication | HTTPS only |
| PDF access | Proxied through authenticated Workers, not direct URLs |
| Entitlement validation | Server-verified, not client-only |
| Backup encryption | AES-256 before cloud upload |
| No secrets in client | Firebase/admin secrets never in Dart code |
| Code obfuscation | `--obfuscate --split-debug-info` in release builds |
| Root detection | Optional (warn, don't block) |

### 21.2 Privacy

- Privacy policy link in Profile → Privacy & Legal
- Data collection disclosure (Firebase Analytics events)
- Account deletion with full data removal
- No unnecessary permissions
- DPDP Act / GDPR compliance considerations

→ See [08 Authentication & Security](./08_Authentication_Security.md) for complete specification.

---

## 22. Accessibility

### 22.1 Requirements

| Feature | Implementation |
|---|---|
| Screen reader | TalkBack support via `Semantics` widgets |
| Content descriptions | All images, icons, buttons labeled |
| Touch targets | Minimum 48x48dp |
| Text scaling | Respect system text scale |
| Color contrast | Minimum 4.5:1 ratio (within 3-color palette) |
| Reduced motion | Respect `MediaQuery.disableAnimations` |
| Portrait + Landscape | Both supported, especially reader/PDF |
| Focus management | Logical tab/focus order |
| Large text | Reader font size slider works independently of system |
| Keep screen awake | Toggle in reader settings |

---

## 23. Android-Specific Requirements

### 23.1 Platform Configuration

| Setting | Value |
|---|---|
| Min SDK | 26 (Android 8.0) |
| Target SDK | Latest stable (34+) |
| Compile SDK | Latest stable (34+) |
| Package name | `com.techilyfly.tfstudyshelf` |
| Version code | Auto-incremented |
| Version name | Semantic versioning (e.g., 1.0.0) |

### 23.2 Permissions

| Permission | Reason |
|---|---|
| `INTERNET` | Network access |
| `ACCESS_NETWORK_STATE` | Connectivity monitoring |
| `WRITE_EXTERNAL_STORAGE` | PDF downloads (below API 29) |
| `READ_EXTERNAL_STORAGE` | File access (below API 29) |
| `RECEIVE_BOOT_COMPLETED` | Restart WorkManager tasks |
| `FOREGROUND_SERVICE` | Download service |
| `POST_NOTIFICATIONS` | Push notifications (API 33+) |

### 23.3 ProGuard / R8 Rules

```proguard
# Keep Firebase
-keep class com.google.firebase.** { *; }

# Keep Google Mobile Ads
-keep class com.google.android.gms.ads.** { *; }

# Keep Dart obfuscation info
-keep class io.flutter.** { *; }
```

### 23.4 App Icon & Adaptive Icon

- Foreground: TF mark (vector)
- Background: `#212121` or brand gradient
- Adaptive icon layers for Android 8.0+
- Round icon variant for legacy launchers

### 23.5 Notification Channels

| Channel | Name | Importance |
|---|---|---|
| `reading_reminders` | Reading Reminders | Default |
| `study_reminders` | Study Reminders | Default |
| `new_content` | New Content | Default |
| `offline_expiry` | Offline Expiry | High |
| `announcements` | Announcements | Low |
| `sync_status` | Sync Status | Low |

---

## 24. Dependency Management

### 24.1 Core Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_bloc: ^8.x
  equatable: ^2.x
  
  # Navigation
  go_router: ^13.x
  
  # Networking
  dio: ^5.x
  connectivity_plus: ^5.x
  
  # Firebase
  firebase_core: ^2.x
  firebase_auth: ^4.x
  cloud_firestore: ^4.x
  firebase_storage: ^11.x
  firebase_messaging: ^14.x
  firebase_analytics: ^10.x
  firebase_crashlytics: ^3.x
  firebase_remote_config: ^4.x
  
  # Local Database
  drift: ^2.x
  sqlite3_flutter_libs: ^0.x
  path_provider: ^2.x
  
  # Local Storage
  shared_preferences: ^2.x
  flutter_secure_storage: ^9.x
  
  # Ads
  google_mobile_ads: ^5.x
  
  # PDF
  syncfusion_flutter_pdfviewer: ^x.x  # or pdfx
  
  # UI
  cached_network_image: ^3.x
  shimmer: ^3.x
  lottie: ^2.x
  
  # Utilities
  intl: ^0.x
  uuid: ^4.x
  path: ^1.x
  
  # Notifications
  flutter_local_notifications: ^17.x
  
  # Background Tasks
  workmanager: ^0.x
  
  # TTS
  flutter_tts: ^4.x
  
  # Dependency Injection
  get_it: ^7.x
  injectable: ^2.x

dev_dependencies:
  flutter_test:
    sdk: flutter
  bloc_test: ^9.x
  mocktail: ^1.x
  build_runner: ^2.x
  drift_dev: ^2.x
  injectable_generator: ^2.x
  flutter_lints: ^3.x
```

### 24.2 Dependency Rules

- Pin major versions to prevent breaking changes
- Review changelogs before updating
- Run full test suite after dependency updates
- No abandoned/unmaintained packages
- Prefer official Google packages for Firebase/Ads

---

## 25. Build Configurations

### 25.1 Flavors

| Flavor | Description | Ads | API |
|---|---|---|---|
| `development` | Local development | Test ads | Dev API |
| `staging` | Pre-release testing | Test ads | Staging API |
| `production` | Play Store release | Live ads | Production API |

### 25.2 Build Commands

```bash
# Development
flutter run --flavor development --dart-define=ENV=dev

# Staging
flutter build apk --flavor staging --dart-define=ENV=staging

# Production
flutter build appbundle --flavor production --dart-define=ENV=prod \
  --obfuscate --split-debug-info=build/debug-info/
```

### 25.3 Environment Configuration

```dart
class EnvConfig {
  static const String env = String.fromEnvironment('ENV', defaultValue: 'dev');
  
  static String get apiBaseUrl => switch (env) {
    'prod' => 'https://api.tfstudyshelf.com',
    'staging' => 'https://staging-api.tfstudyshelf.com',
    _ => 'http://localhost:8787',
  };
  
  static String get bannerAdId => switch (env) {
    'prod' => 'ca-app-pub-xxxxx/banner',
    _ => 'ca-app-pub-3940256099942544/6300978111', // test
  };
  
  // ... other env-specific config
}
```

---

## 26. Testing Strategy

### 26.1 Test Layers

| Layer | Focus | Package |
|---|---|---|
| **Unit Tests** | BLoCs, use cases, repositories, utilities | `flutter_test`, `bloc_test`, `mocktail` |
| **Widget Tests** | Individual widgets, screens | `flutter_test` |
| **Integration Tests** | Full user flows | `integration_test` |
| **Golden Tests** | UI regression (optional) | `golden_toolkit` |

### 26.2 Critical Test Cases

**Entitlement System:**
- Entitlement grants correctly after reward
- Entitlement expires at exactly 24 hours
- Expired entitlement blocks content access
- Re-unlock creates new window (not extension)
- Clock tampering detected

**Backup/Restore:**
- Local backup created before upload
- Corrupted backup rejected
- Safety snapshot taken before restore
- Restore failure leaves data untouched

**Ads:**
- Reward never granted without completion
- Duplicate reward transaction rejected
- Ad failure shows fallback options
- Interstitial respects all gates

→ See [11 Testing & QA](./11_Testing_QA.md) for complete test specification.

---

## 27. Release & Production

### 27.1 Play Store Submission Checklist

- [ ] App bundle signed with upload key
- [ ] ProGuard/R8 enabled
- [ ] Dart code obfuscated
- [ ] Debug info split for crash symbolication
- [ ] All test ad IDs replaced with production IDs
- [ ] Firebase production project configured
- [ ] Privacy policy URL set
- [ ] Data safety form completed
- [ ] Content rating questionnaire completed
- [ ] Target age group declared
- [ ] Store listing (description, screenshots, feature graphic)
- [ ] Release notes prepared
- [ ] Internal testing → Closed testing → Open testing → Production rollout

### 27.2 App Signing

- Use Google Play App Signing
- Keep upload key secure and backed up
- Never commit keystore to version control

### 27.3 Release Process

```
Development → Feature Branch → Pull Request → Code Review
    ↓
Merge to main → CI builds staging flavor → QA testing
    ↓
Create release branch → Build production AAB → Sign
    ↓
Upload to Play Console → Internal testing → Closed testing
    ↓
Staged rollout (10% → 25% → 50% → 100%)
    ↓
Monitor Crashlytics + reviews → Full rollout
```

→ See [12 Deployment & Release](./12_Deployment_Release.md) for complete specification.

---

## 28. Acceptance Criteria

### 28.1 Core Reading

- [ ] User can browse and discover books from Home and Explore
- [ ] Book detail page shows all metadata, chapters, and study content
- [ ] Reader opens with all controls (font, theme, spacing, page mode)
- [ ] Reader gestures work correctly (tap edges, center, long press)
- [ ] Highlights, notes, bookmarks can be created and accessed
- [ ] PDF reader opens PDFs with zoom, search, navigation, bookmarks
- [ ] Reading progress tracks and displays correctly

### 28.2 Study Tools

- [ ] Q&A displays questions by book/chapter with answers
- [ ] Quiz engine runs timed/untimed with correct scoring
- [ ] Flashcards flip and track Got it / Review Again
- [ ] Mistake Bank saves incorrect answers
- [ ] Study Dashboard shows accurate statistics
- [ ] Revision Center aggregates items for review

### 28.3 Offline Access

- [ ] "Use Offline" checks connectivity first
- [ ] Offline state shows clear internet-required message
- [ ] Online state shows reward disclosure before ad
- [ ] Reward verified before entitlement granted
- [ ] Offline package downloads and works without internet
- [ ] All feature matrix items work as specified offline
- [ ] Entitlement expires at exactly 24 hours
- [ ] Expired content blocked and cleanup runs
- [ ] Re-unlock requires fresh rewarded ad
- [ ] No path to infinite offline access

### 28.4 Backup & Restore

- [ ] Backup creates local copy before cloud upload
- [ ] Four-stage progress UI shown accurately
- [ ] Failed upload preserves local backup
- [ ] Restore takes safety snapshot first
- [ ] Corrupted backup rejected with data untouched
- [ ] 2 backup versions retained
- [ ] Requires signed-in account

### 28.5 Authentication

- [ ] Guest browsing works for all read/study features
- [ ] Sign up creates account with email/password
- [ ] Sign in authenticates correctly
- [ ] Forgot password sends reset email
- [ ] Account deletion removes all associated data
- [ ] Sync works correctly for signed-in users

### 28.6 Ads

- [ ] Banner shows above bottom navigation
- [ ] Interstitial respects all gates and thresholds
- [ ] Rewarded ad state machine transitions correctly
- [ ] Failed ad never grants reward
- [ ] SSV configured and functional

### 28.7 Performance

- [ ] Cold start < 3 seconds
- [ ] Smooth scrolling at 60fps
- [ ] APK size < 30MB
- [ ] Memory usage < 150MB typical
- [ ] No memory leaks on navigation

---

*This document defines the complete requirements for the TF Study Shelf Mobile App built with Flutter + Dart. For shared requirements, see [01 Shared Requirements](./01_Shared_Product_Business_Requirements.md). For web platform requirements, see [02 Web Platform PRD](./02_Web_Platform_PRD.md).*
