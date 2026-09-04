# TF Study Shelf — Testing & QA Requirements

**Document:** 11 — Testing & QA Requirements  
**Version:** 1.0  
**Date:** September 2, 2026  
**Applies to:** [SHARED] Web Platform + Mobile App  

---

## 1. Testing Strategy Overview

### 1.1 Test Pyramid

```
         ╱╲
        ╱  ╲
       ╱ E2E╲         ← Few, high-value integration/E2E tests
      ╱──────╲
     ╱ Widget ╲        ← Moderate widget/component tests
    ╱──────────╲
   ╱ Integration╲      ← Integration tests for critical paths
  ╱──────────────╲
 ╱   Unit Tests   ╲    ← Many unit tests for business logic
╱──────────────────╲
```

### 1.2 Testing Layers

| Layer | Focus | Tools | Coverage Target |
|---|---|---|---|
| **Unit Tests** | Business logic, BLoCs, use cases, utilities | `flutter_test`, `bloc_test`, `mocktail` | > 80% of domain/logic |
| **Widget Tests** | Individual widgets, screen rendering | `flutter_test` | Key screens and components |
| **Integration Tests** | Multi-component flows | `integration_test` | Critical user journeys |
| **API Tests** | Worker endpoints | Vitest / Wrangler test | All endpoints |
| **Manual QA** | Edge cases, device-specific | Manual checklist | All critical paths |
| **Performance Tests** | Load times, memory, battery | Flutter DevTools, Lighthouse | Performance targets met |

---

## 2. Unit Test Requirements

### 2.1 Critical Unit Tests [APP]

**Entitlement System (Highest Priority):**

| Test Case | Expected Result |
|---|---|
| Grant entitlement with valid reward | Entitlement created, status = ACTIVE, expiresAt = now + 24h |
| Check valid entitlement | `canOpen()` returns true |
| Check expired entitlement | `canOpen()` returns false |
| Entitlement expiry math (exact 24h) | expiresAt is exactly 24 hours after grantedAt |
| Re-unlock after expiry | Creates NEW entitlement, not extension of old |
| Duplicate reward transaction ID | Rejected, entitlement NOT granted twice |
| Clock tampering detected | Entitlement flagged/invalidated |
| Content version check | Old version entitlement valid for its window |

**Backup System:**

| Test Case | Expected Result |
|---|---|
| Backup checksum generation | Consistent checksum for same data |
| Backup checksum validation | Corrupted backup detected |
| Backup schema version check | Incompatible version rejected |
| Backup encryption/decryption | Round-trip produces identical data |
| Safety snapshot creation | Snapshot exists before restore starts |
| Restore from valid backup | Data correctly restored |
| Restore from invalid backup | Current data unchanged |

**Reward Idempotency:**

| Test Case | Expected Result |
|---|---|
| First reward transaction | Entitlement granted |
| Same transaction ID again | Rejected, no duplicate grant |
| Different transaction ID | New entitlement granted |

**Quiz Scoring:**

| Test Case | Expected Result |
|---|---|
| 8/10 correct | Score: 80%, accuracy: 80% |
| All correct | Score: 100%, passed |
| All incorrect | Score: 0%, needs revision |
| Timed quiz timeout | Unanswered marked incorrect |
| Quiz results never overwritten | New attempt appended, not replaced |

**Offline Sync:**

| Test Case | Expected Result |
|---|---|
| Note created offline | PendingOperation created with PENDING status |
| Sync when online | PendingOperation uploaded, status → SYNCED |
| Sync with retry on failure | Exponential backoff, retry count incremented |
| Reading progress conflict | Latest timestamp wins |

### 2.2 BLoC Tests [APP]

```dart
blocTest<BookDetailBloc, BookDetailState>(
  'emits [loading, loaded] when book loaded successfully',
  build: () {
    when(() => getBookDetail(any())).thenAnswer((_) async => Right(testBook));
    return BookDetailBloc(getBookDetail, saveBook);
  },
  act: (bloc) => bloc.add(LoadBookDetail('book_123')),
  expect: () => [
    BookDetailLoading(),
    BookDetailLoaded(book: testBook, chapters: [], isSaved: false),
  ],
);

blocTest<OfflineBloc, OfflineState>(
  'emits error state when ad fails to load',
  build: () {
    when(() => adService.showRewarded(any())).thenThrow(AdFailedException());
    return OfflineBloc(adService, offlineRepo);
  },
  act: (bloc) => bloc.add(RequestOfflineAccess('book_123')),
  expect: () => [
    OfflineLoading(),
    OfflineAdFailed(message: "Rewarded ad isn't available right now."),
  ],
);
```

### 2.3 Unit Tests [WEB]

**API Worker Tests:**

| Test Case | Expected Result |
|---|---|
| GET /api/v1/books with pagination | Returns paginated list, correct meta |
| GET /api/v1/books/:id with valid ID | Returns full book detail |
| GET /api/v1/books/:id with invalid ID | Returns 404 |
| POST /api/v1/admin/books without auth | Returns 401 |
| POST /api/v1/admin/books with Content Manager role | Returns 201 |
| POST /api/v1/admin/users/:id/set-password with Content Manager | Returns 403 |
| POST /api/v1/ssv/verify with valid signature | Returns 200, entitlement finalized |
| POST /api/v1/ssv/verify with invalid signature | Returns 403 |
| POST /api/v1/ssv/verify with duplicate transaction | Returns 200 (idempotent) |
| GET /api/v1/search with query | Returns grouped results |
| Rate limit exceeded | Returns 429 |

---

## 3. Widget / Component Tests [APP]

### 3.1 Key Widget Tests

| Widget | Test Cases |
|---|---|
| `BookCard` | Renders title, author, cover; tap triggers navigation |
| `QuizProgress` | Shows correct progress (4/10); updates on answer |
| `FlashcardWidget` | Flips on tap; shows front/back correctly |
| `OfflineStatusBadge` | Shows countdown, expired state, downloading state |
| `CountdownTimer` | Displays correct time remaining; updates periodically |
| `EmptyStateWidget` | Shows message and CTA; CTA triggers navigation |
| `SearchBar` | Input debounce works; clear button resets |
| `ReaderControls` | Font size slider updates; theme toggle works |
| `BackupStatusCard` | Shows last backup date; progress stages display |
| `AdBannerWidget` | Renders without overflow; handles ad failure gracefully |

### 3.2 Screen Tests

| Screen | Test Cases |
|---|---|
| `SplashScreen` | Shows brand elements; navigates after timeout |
| `OnboardingScreen` | Pages swipe; skip works; continue navigates to Home |
| `HomeScreen` | Sections render; pull-to-refresh triggers reload |
| `BookDetailScreen` | Book info displays; actions trigger correct flows |
| `SignInScreen` | Validation errors show; submit calls auth |
| `SignUpScreen` | Password mismatch detected; weak password rejected |
| `BackupRestoreScreen` | Backup status shown; buttons trigger correct flows |

---

## 4. Integration Tests

### 4.1 Critical Integration Paths [APP]

| Flow | Steps | Validation |
|---|---|---|
| **Offline Reading E2E** | Tap Use Offline → Ad mock → Download → Read offline → Expiry | Content accessible then blocked |
| **PDF Download E2E** | Tap Download → Ad mock → Download → Open in reader → Expiry | PDF opens and expires correctly |
| **Offline Study E2E** | Tap Study Offline → Ad mock → Download → Quiz offline → Sync | Quiz works offline, results sync |
| **Backup E2E** | Tap Backup → Ad mock → Create → Encrypt → Upload → Verify | Backup file exists in cloud |
| **Restore E2E** | Tap Restore → Ad mock → Download → Validate → Restore | Data correctly restored |
| **Auth E2E** | Sign up → Verify → Sign in → Use features → Sign out | Account works correctly |
| **Search E2E** | Type query → See results → Tap book → Open detail | Search finds content correctly |
| **Reading E2E** | Open book → Read → Highlight → Note → Bookmark → Close → Reopen | All annotations preserved |

### 4.2 Integration Tests [WEB]

| Flow | Steps | Validation |
|---|---|---|
| **Content Publish** | Create book → Add chapters → Add Q&A → Publish | Content appears in public API |
| **User Management** | Find user → Reset password → Verify email sent | Password reset works |
| **Ad Config** | Create ad unit → Enable → Verify in config API | Ad config served to clients |
| **Emergency Unpublish** | Select published book → Emergency unpublish | Content removed from public < 30s |
| **Bulk Import** | Upload CSV questions → Assign to book → Verify | Questions created correctly |

---

## 5. Manual QA Checklist

### 5.1 Critical Manual Tests

**Entitlement Edge Cases:**
- [ ] Clock forward by 25 hours → Check if expired content is blocked
- [ ] Clock backward by 12 hours → Check if entitlement still valid
- [ ] App killed exactly at expiry time → Relaunch → Content should be expired
- [ ] Airplane mode during download → Graceful failure
- [ ] Low storage (< 100MB) → Warning before download
- [ ] Multiple downloads queued → Processed sequentially
- [ ] Content version changes while offline → Existing package stays valid

**Ad Edge Cases:**
- [ ] No internet → "Internet required" (no ad attempt)
- [ ] Ad loads but user cancels → No reward granted
- [ ] Ad fails to load → "Ad unavailable" with retry
- [ ] Ad completed but network lost → Reward still honored (local grant)
- [ ] Same ad watched twice rapidly → Only one entitlement granted
- [ ] All ad types disabled in config → Fallback behavior works

**Backup/Restore Edge Cases:**
- [ ] Backup on Wi-Fi, restore on mobile data → Both work
- [ ] Restore corrupted backup → Current data untouched
- [ ] Restore with different app version → Appropriate error message
- [ ] App killed during backup upload → Local backup preserved
- [ ] App killed during restore → Safety snapshot allows recovery
- [ ] Two backups exist → Correct one restored

**Reader Edge Cases:**
- [ ] Very long book (1000+ pages) → No memory issues
- [ ] Large PDF (50MB+) → Loads without crash
- [ ] Rapid page turning → No rendering issues
- [ ] Text selection across pages → Works correctly
- [ ] Theme change during reading → Immediate, no flicker
- [ ] Orientation change → Layout adapts, position preserved
- [ ] Keep screen awake → Works, battery warning if needed

### 5.2 Accessibility QA

- [ ] TalkBack navigation through all screens
- [ ] All interactive elements have content descriptions
- [ ] Touch targets ≥ 48dp
- [ ] Text scales with system font size
- [ ] Color contrast ≥ 4.5:1 (WCAG AA)
- [ ] Reduced motion preference honored
- [ ] Keyboard navigation works (web)
- [ ] Focus indicators visible (web)

---

## 6. Device Matrix

### 6.1 Android Device Coverage [APP]

| Category | Example Devices | Priority |
|---|---|---|
| **Low-end** | Samsung Galaxy A03, Redmi 9A | High (large user base in India) |
| **Mid-range** | Samsung Galaxy A54, Redmi Note 12 | High |
| **High-end** | Samsung Galaxy S24, Pixel 8 | Medium |
| **Tablets** | Samsung Galaxy Tab A9 | Medium |
| **Old Android** | Any device on Android 8.0 (API 26) | Low (minimum supported) |

### 6.2 Screen Sizes

| Size | Resolution | Test Priority |
|---|---|---|
| Small phone | 5.0" (720×1280) | Medium |
| Standard phone | 6.1" (1080×2400) | High |
| Large phone | 6.7" (1440×3200) | High |
| Tablet | 10.1" (1200×2000) | Medium |

### 6.3 Network Conditions

| Condition | Test Scenario |
|---|---|
| Fast Wi-Fi | Normal operation baseline |
| Slow 3G | Content loading, progressive display |
| Intermittent | Connection drops during download/sync |
| Offline | All offline features, entitlement enforcement |
| Captive portal | Detection and user notification |

### 6.4 Web Browser Coverage [WEB]

| Browser | Version | Priority |
|---|---|---|
| Chrome | Latest 2 versions | High |
| Firefox | Latest 2 versions | Medium |
| Safari | Latest 2 versions | Medium |
| Edge | Latest 2 versions | Low |
| Chrome Mobile | Latest | High |
| Safari Mobile | Latest | Medium |

---

## 7. Performance Test Requirements

### 7.1 App Performance [APP]

| Metric | Target | Test Method |
|---|---|---|
| Cold start | < 3 seconds | Flutter DevTools |
| Hot start | < 1 second | Flutter DevTools |
| Screen transition | < 300ms | Visual inspection + DevTools |
| List scroll FPS | 60fps consistently | Flutter DevTools (Performance overlay) |
| Memory usage (typical) | < 150MB | Flutter DevTools |
| Memory usage (PDF open) | < 250MB | Flutter DevTools |
| APK download size | < 30MB | Play Console |
| Battery drain (1h reading) | < 10% | Device testing |

### 7.2 Web Performance [WEB]

| Metric | Target | Test Method |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5 seconds | Lighthouse |
| FID (First Input Delay) | < 100ms | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| Page load (3G) | < 3 seconds | Lighthouse (throttled) |
| API response time | < 200ms | Worker logs |
| Search response | < 500ms | Load testing |
| PDF first page load | < 5 seconds | Manual testing |

### 7.3 Load Testing [WEB]

| Scenario | Target |
|---|---|
| Concurrent users (API) | 1000 simultaneous |
| Books list requests/second | 100 req/s |
| Search queries/second | 50 req/s |
| PDF streaming concurrent | 50 concurrent |
| D1 read capacity | < 5M reads/day (free tier) |
| D1 write capacity | < 100K writes/day (free tier) |

---

## 8. Analytics Event Validation

### 8.1 Required Analytics Events

Every event must fire correctly and be verified:

```
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

### 8.2 Event Validation Checklist

- [ ] Each event fires at the correct trigger point
- [ ] Event parameters contain expected data
- [ ] No PII in event parameters
- [ ] Events match Play Console Data Safety declaration
- [ ] Events fire correctly in both online and offline modes
- [ ] Offline events queue and sync when online

---

## 9. Regression Test Suite

### 9.1 Smoke Tests (Run Every Build)

- [ ] App launches without crash
- [ ] Home screen renders with content
- [ ] Book detail page loads
- [ ] Reader opens and text displays
- [ ] Bottom navigation works
- [ ] Sign in / sign out works
- [ ] Search returns results
- [ ] Banner ad displays

### 9.2 Full Regression (Run Before Release)

All items in:
- §2 (Unit tests)
- §3 (Widget tests)
- §4 (Integration tests)
- §5.1 (Manual QA — critical tests)
- §5.2 (Accessibility QA)
- §7 (Performance tests)
- §8 (Analytics validation)

---

## 10. Acceptance Criteria Summary

### 10.1 Release Readiness Criteria

- [ ] All unit tests pass (> 80% coverage on domain/logic)
- [ ] All critical integration tests pass
- [ ] Manual QA checklist completed with no P0/P1 bugs
- [ ] Performance targets met on target devices
- [ ] Accessibility checklist completed
- [ ] Analytics events validated
- [ ] No crash on cold start across device matrix
- [ ] Crash-free session rate > 99.5% in testing
- [ ] All acceptance criteria from other PRDs verified

---

*This document defines the complete testing and QA requirements. For specific acceptance criteria per feature, see the respective PRD documents.*
