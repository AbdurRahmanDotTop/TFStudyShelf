# TF Study Shelf — User Flows & Navigation

**Document:** 04 — User Flows & Navigation  
**Version:** 1.0  
**Date:** September 2, 2026  
**Applies to:** [SHARED] Web Platform + Mobile App  

---

## 1. Application Flow Overview

### 1.1 First Launch Flow

```
App Launch
    ↓
Splash Screen (2-5 seconds)
  • Initialize Firebase
  • Check auth state
  • Preload remote config
  • Run expired entitlement cleanup
    ↓
┌───────────────┴───────────────┐
│                               │
First Launch?                   Returning User?
│                               │
Onboarding (3 pages)            ↓
  1. Read without limits        Check Auth
  2. Study smarter              ├── Signed in → Home
  3. Always free                └── Guest → Home
│
[Continue] → Home
```

### 1.2 Master Navigation Tree

```
┌── Splash
│   └── Onboarding (first launch only)
│
├── Main Shell (Bottom Navigation)
│   ├── Tab 1: Home
│   │   ├── Continue Reading → Reader
│   │   ├── Search → Search Results → Book Detail
│   │   ├── Category Rail → Category Listing
│   │   ├── Recommended → Book Detail
│   │   └── Study Today → Study Dashboard
│   │
│   ├── Tab 2: Explore
│   │   ├── Books Listing → Book Detail
│   │   ├── PDFs Listing → PDF Detail
│   │   ├── Subjects → Subject Listing → Book Detail
│   │   ├── Questions → Q&A Screen
│   │   ├── Study Packs → Pack Detail
│   │   ├── Search → Search Results
│   │   └── Filters / Sort
│   │
│   ├── Tab 3: Study
│   │   ├── Study Dashboard
│   │   ├── Quizzes → Quiz Screen → Result Screen
│   │   ├── Flashcards → Flashcard Screen
│   │   ├── Q&A → Q&A Screen
│   │   ├── Revision Center
│   │   ├── Mistake Bank
│   │   └── Study Offline (→ Offline unlock flow)
│   │
│   ├── Tab 4: Shelf
│   │   ├── Continue Reading → Reader
│   │   ├── Saved Books → Book Detail
│   │   ├── Downloads (with countdowns)
│   │   ├── Highlights
│   │   ├── Notes
│   │   ├── Bookmarks → Reader at bookmark
│   │   ├── Comments
│   │   └── Finished → Book Detail
│   │
│   └── Tab 5: Profile
│       ├── Statistics Dashboard
│       ├── Reading Settings
│       ├── Notifications Settings
│       ├── Accessibility Settings
│       ├── Storage Management
│       ├── Backup & Restore
│       ├── Privacy & Legal
│       ├── Account
│       │   ├── Sign In / Sign Up
│       │   ├── Forgot Password
│       │   └── Delete Account
│       ├── Appearance (Theme)
│       └── About
│
├── Detail Screens (pushed over navigation)
│   ├── Book Detail
│   │   ├── [Read Now] → Reader
│   │   ├── [Save] → Add to Shelf
│   │   ├── [Download PDF] → PDF Download Flow
│   │   ├── [Use Offline] → Offline Reading Flow
│   │   ├── [Questions] → Q&A Screen
│   │   ├── [Summary] → Summary Screen
│   │   ├── [Quiz] → Quiz Screen
│   │   └── [Flashcards] → Flashcard Screen
│   │
│   ├── Reader
│   │   ├── Reader Controls Overlay
│   │   ├── Reader Settings (Bottom Sheet)
│   │   ├── Highlight Toolbar (Floating)
│   │   ├── Note Editor (Bottom Sheet)
│   │   ├── Chapter Navigation (Side Drawer)
│   │   ├── In-Book Search (App Bar)
│   │   ├── Bookmarks Panel
│   │   └── TTS Controls
│   │
│   └── PDF Reader
│       ├── PDF Controls
│       ├── Page Thumbnails
│       ├── Jump to Page
│       ├── PDF Search
│       └── PDF Annotations
│
└── Auth Screens (full-screen routes)
    ├── Welcome
    ├── Sign In
    ├── Sign Up
    └── Forgot Password
```

---

## 2. Core User Flows

### 2.1 Content Discovery Flow

```
User opens app → Home Screen
    ↓
Option A: Tap search bar → Type query → See grouped results
    ↓                                         ↓
    │                               Tap book → Book Detail
    │                               Tap PDF → PDF Detail
    │                               Tap question → Q&A Screen
    │
Option B: Scroll home → Tap "Recommended" book → Book Detail
    ↓
Option C: Tap "Explore" tab → Browse by category/subject → Book Detail
    ↓
Option D: Tap category chip → Category listing → Book Detail
```

### 2.2 Reading Flow

```
Book Detail → [Read Now]
    ↓
Reader opens at last position
    ↓
User reads (swipe/tap for pages)
    ↓
During reading:
  ├── Long press text → Selection toolbar
  │   ├── [Highlight] → Choose category → Saved
  │   ├── [Note] → Note editor → Saved
  │   ├── [Copy] → Clipboard
  │   ├── [Share] → Share sheet (if allowed)
  │   └── [Ask] → AI assistant (online only)
  │
  ├── Tap center → Toggle controls
  │   ├── Settings gear → Reader settings sheet
  │   ├── Chapter list → Navigate chapter
  │   ├── Search icon → In-book search
  │   ├── Bookmark icon → Toggle bookmark
  │   └── Listen icon → TTS mode
  │
  ├── Progress auto-saves every page turn
  │
  └── At 100% → Book Completion screen
      ├── [Review Highlights]
      ├── [Take Quiz]
      ├── [View Notes]
      └── [Start Another Book]
```

### 2.3 Offline Reading Unlock Flow

```
Book Detail → [Use Offline]
    ↓
Check connectivity
    ↓
┌────────────────┴────────────────┐
│                                 │
OFFLINE                          ONLINE
│                                 │
Dialog:                          Dialog:
"Internet connection             "Unlock 24-Hour Offline Reading"
 required"                       "Watch a rewarded ad to make
[Turn On Internet]                this book available offline
[Cancel]                          for the next 24 hours."
                                 [Watch Ad & Unlock] [Cancel]
                                     ↓
                                 Show rewarded ad
                                     ↓
                                 ┌────┴────┐
                                 │         │
                              Success   Failed/Cancelled
                                 │         │
                              Download   "Ad unavailable"
                              content    [Try Again]
                                 │       [Read Online]
                              Progress bar
                              (0% → 100%)
                                 │
                              "Available offline
                               for 24 hours"
                                 │
                              Book now readable
                              offline with all
                              features (see matrix)
                                 │
                              After 24 hours:
                              "Offline access expired"
                              [Unlock Again] [Read Online]
```

### 2.4 PDF Download Flow

```
Book Detail → [Download PDF]
    ↓
Check: allowedDownload == true?
    ├── false → Button not visible
    └── true → Continue
    ↓
Check connectivity
    ↓
┌────────────────┴────────────────┐
│                                 │
OFFLINE                          ONLINE
│                                 │
Dialog:                          Dialog:
"Internet Required"              "Unlock PDF Download"
[Retry] [Cancel]                 "Watch a rewarded ad to
                                  unlock this PDF for
                                  24 hours."
                                 [Watch Ad & Download]
                                 [Cancel]
                                     ↓
                                 Rewarded ad
                                     ↓
                                 Success → Download PDF
                                 → Open in internal PDF reader
                                 → Expires after 24h
```

### 2.5 Study Flow

```
Study Tab
    ↓
├── [Quizzes] → Select quiz → Start
│   ↓
│   Question 1/10 → Answer → Next
│   ↓ (repeat)
│   Result: Score 8/10 · 80% accuracy
│   ↓
│   [Review Mistakes] → See wrong answers
│   [Save to Mistake Bank] → Saved
│   [Retry] → Start again
│   [Done] → Back to Study
│
├── [Flashcards] → Select set
│   ↓
│   Card front (question) → Tap to flip
│   Card back (answer)
│   [Got it ✓] → Next card
│   [Review Again ↺] → Queue for later
│   ↓ (repeat)
│   Set complete → Summary
│
├── [Q&A] → Select book/chapter
│   ↓
│   Question list → Tap question
│   → Expand answer + explanation
│
├── [Revision Center]
│   ↓
│   "Review Today" aggregation:
│   ├── Saved highlights (tap → reader at highlight)
│   ├── Incorrect questions (tap → review)
│   ├── Due flashcards (tap → flashcard screen)
│   ├── Weak topics (tap → study material)
│   └── Recent notes (tap → note detail)
│
└── [Study Offline] → Offline Study unlock flow
```

### 2.6 Backup & Restore Flow

```
Profile → Backup & Restore
    ↓
├── [Backup Now]
│   ↓
│   Check: signed in? → No → "Sign in to backup"
│   Check: internet? → No → "Internet required"
│   ↓
│   Dialog: "Watch a rewarded ad to backup"
│   [Watch Ad & Backup] [Cancel]
│   ↓
│   Rewarded ad
│   ↓
│   Stage 1: "Creating local backup…" (32%)
│   Stage 2: "Securing backup…" (64%)
│   Stage 3: "Uploading backup…" (82%)
│   Stage 4: "Verifying backup…" (100%)
│   ↓
│   ┌──────┴──────┐
│   │             │
│   Success      Upload Failed
│   │             │
│   "Backup       "Local backup OK,
│    completed"    upload failed."
│   with timestamp [Retry Upload]
│                  [Keep Local]
│                  [Cancel]
│
└── [Restore Backup]
    ↓
    Check: signed in? → No → "Sign in to restore"
    Check: internet? → No → "Internet required"
    ↓
    Dialog: "This will replace current data"
    [Restore Backup] [Cancel]
    ↓
    Rewarded ad
    ↓
    Create safety snapshot of current data
    ↓
    Download cloud backup
    ↓
    Validate checksum + schema + version
    ↓
    ┌──────┴──────┐
    │             │
    Valid        Invalid
    │             │
    Show restore  "Backup couldn't
    summary       be restored. Your
    ↓             current data has
    Confirm →     not been changed."
    Restore →
    "Restore completed"
```

### 2.7 Authentication Flow

```
Guest user taps feature requiring account
(e.g., Backup, Sync)
    ↓
"Sign in to access this feature"
[Sign In] [Create Account]
    ↓
┌────────┴────────┐
│                 │
Sign In           Create Account
│                 │
Email +           Email + Password +
Password          Confirm Password
↓                 ↓
Validate          Validate all fields
↓                 ↓
Firebase Auth     Firebase Auth
↓                 ↓
┌──┴──┐          ┌──┴──┐
│     │          │     │
OK    Error      OK    Error
│     │          │     │
Home  Show       Home  Show
      message          message
      (invalid         (email exists,
       creds,           weak password,
       network          network error)
       error)
```

### 2.8 Search Flow

```
Tap search bar (Home or Explore)
    ↓
Search screen opens
    ↓
Show: Recent searches + Popular searches
    ↓
User types query (debounced 300ms)
    ↓
Results grouped by type:
  📘 Books (3 results)
  📄 PDFs (2 results)
  ❓ Questions (12 results)
  📖 Chapters (4 results)
    ↓
Tap result → Navigate to appropriate screen
    ↓
Save to recent searches
```

---

## 3. Admin User Flows [WEB]

### 3.1 Content Publishing Flow

```
Admin logs in → Dashboard
    ↓
Content → [+ Add Book]
    ↓
Fill metadata:
  Title, Author, Description, Cover, PDF
  Language, Difficulty, Pages, Categories
    ↓
Content Rights:
  Rights Status, License, Holder, Permission
  Download/Offline/Share toggles
    ↓
[Save Draft]
    ↓
Add Chapters → Add Q&A per chapter
    ↓
Add Quizzes → Add Flashcards
    ↓
[Submit for Review]
    ↓
Review checklist:
  ✅ Metadata complete
  ✅ Cover approved
  ✅ Content checked
  ✅ Rights verified
  ✅ Q&A reviewed
  ✅ PDF verified
    ↓
[Publish]
    ↓
Content live on web + app
```

### 3.2 User Management Flow

```
Admin → Users → Search/browse users
    ↓
Select user → User detail view
    ↓
Available actions:
  ├── View Details → Full activity history
  ├── Reset Password → Send reset email
  ├── Change Password → Set new password (Super Admin)
  ├── Ban/Suspend → Confirm → Account suspended
  ├── Delete Account → Confirm (2x) → Account deleted
  └── Export Data → Generate export → Download
```

### 3.3 Ad Configuration Flow

```
Admin → Ads
    ↓
View all ad units (list)
    ↓
├── [+ Add New Ad Unit]
│   ↓
│   Select type (Banner/Interstitial/Rewarded)
│   Enter Ad Unit ID
│   Select platform (Web/App/Both)
│   Configure placement
│   Set frequency/limits
│   Enable/disable test mode
│   [Save]
│
├── Edit existing unit
│   ↓
│   Modify settings → [Save]
│
└── View performance
    ↓
    Impressions, clicks, revenue, fill rate
    Charts and trends
```

### 3.4 Emergency Unpublish Flow

```
Content flagged (copyright, safety, error)
    ↓
Admin → Content → Find content → [⚠️ Emergency Unpublish]
    ↓
Confirmation: "Immediately unpublish?"
    ↓
[Confirm Emergency Unpublish]
    ↓
Content removed from all public views (< 30 seconds)
    ↓
Log entry created with reason and timestamp
    ↓
Admin notification sent
```

---

## 4. Error & Edge Case Flows

### 4.1 Network Loss During Action

```
User performing action → Internet lost
    ↓
┌────────────────┴────────────────┐
│                                 │
Reading                          Other actions
(offline package)                │
│                                "No internet
Continue reading                  connection."
(all offline                     [Retry] [Cancel]
features work)                    │
│                                Wait for network
When online:                     → Retry automatically
"Syncing your
study activity…"
```

### 4.2 Ad Failure Flow

```
User opts to watch rewarded ad
    ↓
Ad fails to load
    ↓
"Rewarded ad isn't available right now."
[Try Again] [Read Online]
    ↓
Never grant reward without completion
Never show "ad completed" when it wasn't
```

### 4.3 Expiry Mid-Session Flow

```
User reading offline book at 08:29
Entitlement expires at 08:30
    ↓
Next page turn / chapter change → Check entitlement
    ↓
Entitlement expired
    ↓
"Offline access expired"
"Your 24-hour offline access has ended.
 Connect to the internet and watch a
 rewarded ad to use this again."
[Unlock Offline Again] [Read Online]
    ↓
Reader session ends gracefully
Reading progress saved
```

---

## 5. Cross-Platform Navigation Comparison

| Flow | Mobile (App) | Web |
|---|---|---|
| Primary navigation | Bottom navigation (5 tabs) | Top navigation bar |
| Admin access | N/A (user-only) | Primary purpose (admin panel) |
| Reader controls | Overlay + bottom sheet | Sidebar + toolbar |
| Search | Full-screen with keyboard | Inline with dropdown |
| Settings | Stacked screens (push) | Settings page with sections |
| Offline unlock | Dialog → Ad → Download | Dialog → Ad → Access |
| PDF viewer | Full-screen immersive | In-page viewer |

---

*This document defines all user flows and navigation patterns. For platform-specific details, see [02 Web Platform PRD](./02_Web_Platform_PRD.md) and [03 Mobile App PRD](./03_Mobile_App_PRD_Flutter.md).*
