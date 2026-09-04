# TF Study Shelf — Deployment & Release Requirements

**Document:** 12 — Deployment & Release Requirements  
**Version:** 1.0  
**Date:** September 2, 2026  
**Applies to:** [SHARED] Web Platform + Mobile App  

---

## 1. Deployment Architecture

### 1.1 Environment Strategy

| Environment | Purpose | Web Host | Database | Ads | Firebase |
|---|---|---|---|---|---|
| **Development** | Local development | localhost / Wrangler dev | Local SQLite / D1 dev | Test ads | Dev project |
| **Staging** | Pre-release testing | Cloudflare preview URL | Staging D1 | Test ads | Staging project |
| **Production** | Live users | Custom domain | Production D1 | Live ads | Production project |

### 1.2 Deployment Pipeline

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Developer │ ──→ │  Code    │ ──→ │  Build   │ ──→ │  Deploy  │
│  Machine  │     │  Review  │     │  & Test  │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │                │                │                │
  Feature          Pull            CI/CD           Staged
  Branch          Request          Pipeline        Rollout
     │                │                │                │
  Local            Code              Unit           Internal →
  Testing          Review +          Tests +        Closed →
                   Approval         Widget +         Open →
                                   Integration     Production
```

---

## 2. Web Platform Deployment [WEB]

### 2.1 Cloudflare Pages Setup

| Setting | Value |
|---|---|
| Framework preset | None (static HTML/CSS/JS) or Vite (if build step needed) |
| Build command | `npm run build` (if applicable) |
| Output directory | `dist/` or `public/` |
| Root directory | `/web` |
| Node version | 18.x (LTS) |
| Auto deployments | On push to `main` branch |
| Preview deployments | On pull requests |

### 2.2 Cloudflare Workers Deployment

```bash
# Development
wrangler dev

# Staging
wrangler deploy --env staging

# Production
wrangler deploy --env production
```

**`wrangler.toml` Configuration:**
```toml
name = "tf-study-shelf-api"
main = "src/index.ts"
compatibility_date = "2026-09-01"

[env.staging]
name = "tf-study-shelf-api-staging"
d1_databases = [
  { binding = "DB", database_name = "tf-study-shelf-staging", database_id = "xxx" }
]

[env.production]
name = "tf-study-shelf-api"
d1_databases = [
  { binding = "DB", database_name = "tf-study-shelf-prod", database_id = "yyy" }
]
```

### 2.3 D1 Database Migrations

```bash
# Create migration
wrangler d1 migrations create tf-study-shelf-prod "add_exam_tags"

# Apply migrations (staging)
wrangler d1 migrations apply tf-study-shelf-staging --env staging

# Apply migrations (production)
wrangler d1 migrations apply tf-study-shelf-prod --env production
```

**Migration Rules:**
- All migrations are forward-only (no rollback)
- Test on staging D1 before production
- Schema-breaking changes require app update coordination
- Migration log maintained in version control

### 2.4 Environment Variables & Secrets

| Variable | Type | Storage |
|---|---|---|
| `GOOGLE_DRIVE_SERVICE_ACCOUNT` | Secret | Cloudflare Worker secret |
| `FIREBASE_ADMIN_SDK_KEY` | Secret | Cloudflare Worker secret |
| `ADMOB_SSV_PUBLIC_KEYS_URL` | Config | `wrangler.toml` var |
| `CORS_ALLOWED_ORIGINS` | Config | `wrangler.toml` var |
| `JWT_AUDIENCE` | Config | `wrangler.toml` var |

**Set secrets:**
```bash
wrangler secret put GOOGLE_DRIVE_SERVICE_ACCOUNT --env production
wrangler secret put FIREBASE_ADMIN_SDK_KEY --env production
```

### 2.5 CDN & Caching

| Asset Type | Cache TTL | Strategy |
|---|---|---|
| HTML pages | 1 hour | Stale-while-revalidate |
| CSS/JS (hashed) | 1 year | Immutable |
| Images (covers) | 7 days | Cache-first |
| API responses | 5 minutes | Network-first with cache fallback |
| PDF content | Session | Streaming, no full-file cache |
| Config API | 15 minutes | Stale-while-revalidate |

### 2.6 Custom Domain

| Setting | Value |
|---|---|
| Domain | To be configured (e.g., `studyshelf.techilyfly.com`) |
| SSL | Automatic via Cloudflare (free) |
| DNS | Cloudflare DNS |
| Redirects | `www` → apex domain |

---

## 3. Mobile App Release [APP]

### 3.1 Flutter Build Configuration

**Build for release:**
```bash
# Android App Bundle (for Play Store)
flutter build appbundle \
  --flavor production \
  --dart-define=ENV=prod \
  --obfuscate \
  --split-debug-info=build/debug-info/ \
  --release

# APK (for direct distribution / testing)
flutter build apk \
  --flavor production \
  --dart-define=ENV=prod \
  --obfuscate \
  --split-debug-info=build/debug-info/ \
  --release
```

### 3.2 App Signing

| Setting | Value |
|---|---|
| Signing method | Google Play App Signing |
| Upload key | Generated locally, kept secure |
| Keystore format | `.jks` (Java KeyStore) |
| Key algorithm | RSA 2048-bit |
| Key validity | 25+ years |

**Security Rules:**
- ❌ Never commit keystore to version control
- ❌ Never share keystore password in plaintext
- ✅ Store keystore in secure, backed-up location
- ✅ Use CI/CD secrets for automated signing
- ✅ Enroll in Google Play App Signing for key management

### 3.3 ProGuard / R8

```proguard
# Flutter
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }

# Google Mobile Ads
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }

# Crashlytics
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
```

### 3.4 Play Store Submission

**Pre-Submission Checklist:**

| Item | Status |
|---|---|
| App bundle signed with upload key | ☐ |
| R8/ProGuard enabled | ☐ |
| Dart code obfuscated | ☐ |
| Debug info split for Crashlytics | ☐ |
| Production ad unit IDs configured | ☐ |
| Production Firebase project configured | ☐ |
| Production API URL configured | ☐ |
| All test ad IDs removed from production build | ☐ |
| App icon (adaptive) configured | ☐ |
| Splash screen configured | ☐ |
| Version code incremented | ☐ |
| Version name updated | ☐ |

**Play Console Configuration:**

| Setting | Value |
|---|---|
| Package name | `com.techilyfly.tfstudyshelf` |
| Category | Education |
| Content rating | Complete IARC questionnaire |
| Target audience | 13+ (or as decided, see [01 Shared](./01_Shared_Product_Business_Requirements.md) §3.2) |
| Privacy policy URL | Required (hosted on web) |
| Data safety form | Complete based on actual data collection |
| Ad declaration | Declare AdMob usage |
| Families policy | Complete if applicable |

**Store Listing:**

| Element | Requirement |
|---|---|
| Title | "TF Study Shelf — Read. Learn. Remember." (max 30 chars for short title) |
| Short description | Compelling summary (max 80 chars) |
| Full description | Feature-rich description (max 4000 chars) |
| Screenshots | Min 2, recommended 8 (phone + tablet) |
| Feature graphic | 1024×500 px |
| App icon | 512×512 px (hi-res) |
| Category | Education |
| Tags | Education, Books, Study, PDF, Quiz |

### 3.5 Release Tracks

| Track | Purpose | Audience |
|---|---|---|
| Internal testing | Developer/team testing | Up to 100 testers |
| Closed testing | Beta testing with selected users | Invited testers |
| Open testing | Public beta | Anyone can join |
| Production | Live release | All users |

### 3.6 Staged Rollout Strategy

```
Day 1:  Internal testing → Team validation
Day 2-3: Closed testing → Beta feedback collection
Day 4-5: Fix critical issues from beta
Day 6:  Production rollout → 10% of users
Day 7:  Monitor Crashlytics, reviews, ANR rate
Day 8:  25% rollout (if metrics healthy)
Day 10: 50% rollout
Day 14: 100% rollout (if all metrics healthy)
```

**Rollout Halt Criteria:**
- Crash-free rate drops below 99%
- ANR rate exceeds 1%
- Critical bug reported by multiple users
- Ad integration failure
- Data loss or corruption reported
- Security vulnerability discovered

### 3.7 In-App Update

| Update Type | Trigger | User Experience |
|---|---|---|
| Flexible update | Normal releases | Notification, update when convenient |
| Immediate update | Schema-breaking changes, security fixes | Blocking, must update to continue |

**Implementation:** Play Core In-App Update API (`in_app_update` Flutter package)

**Minimum supported version** tracked in remote config; if user's version < minimum, show immediate update prompt.

---

## 4. CI/CD Pipeline

### 4.1 CI Pipeline (On Pull Request)

```yaml
# GitHub Actions workflow
name: CI
on: [pull_request]

jobs:
  analyze:
    - flutter analyze
    - flutter format --set-exit-if-changed

  test:
    - flutter test (unit + widget tests)
    - flutter test --coverage
    - coverage threshold check (> 80%)

  build:
    - flutter build apk --flavor staging --debug
    - Verify build succeeds
```

### 4.2 CD Pipeline (On Merge to Main)

```yaml
name: CD
on:
  push:
    branches: [main]

jobs:
  test:
    - Full test suite

  build-staging:
    - flutter build apk --flavor staging
    - Upload to Firebase App Distribution

  deploy-web-staging:
    - wrangler deploy --env staging
    - D1 migrations (if any)

  # Manual trigger for production
  build-production:
    - flutter build appbundle --flavor production --obfuscate
    - Sign with upload key
    - Upload to Play Console (internal testing track)

  deploy-web-production:
    - wrangler deploy --env production
    - D1 migrations (if any)
```

### 4.3 Automated Checks

| Check | Trigger | Failure Action |
|---|---|---|
| Lint (flutter analyze) | Every PR | Block merge |
| Format (flutter format) | Every PR | Block merge |
| Unit tests | Every PR | Block merge |
| Widget tests | Every PR | Block merge |
| Build (staging) | Every PR | Block merge |
| Coverage threshold | Every PR | Warning (not blocking V1) |
| Integration tests | Pre-release | Block release |

---

## 5. Monitoring & Observability

### 5.1 App Monitoring [APP]

| Tool | Purpose | Alerts |
|---|---|---|
| Firebase Crashlytics | Crash reporting | New crash cluster > 10 users |
| Firebase Analytics | Usage tracking | DAU drop > 20% |
| Firebase Performance | App performance | Startup time > 5s |
| Play Console | ANR, ratings, reviews | ANR rate > 0.5% |
| AdMob Dashboard | Ad revenue, fill rates | Revenue drop > 30% |

### 5.2 Web Monitoring [WEB]

| Tool | Purpose | Alerts |
|---|---|---|
| Cloudflare Analytics | Traffic, performance | Error rate > 5% |
| Worker Analytics | API performance | Response time > 500ms avg |
| D1 Dashboard | Database performance | Quota > 80% |
| Google Drive API | Storage, quota | Storage > 80% |
| YouTube API | Quota usage | Quota > 80% |
| Firebase Console | Auth, Firestore, FCM | Unusual patterns |

### 5.3 Alerting

| Severity | Response Time | Channel |
|---|---|---|
| Critical | < 1 hour | Email + Slack/Teams + SMS |
| High | < 4 hours | Email + Slack/Teams |
| Medium | < 24 hours | Email |
| Low | Next business day | Dashboard review |

**Critical Alerts:**
- App crash rate > 1%
- API outage (Workers down)
- D1 quota exceeded
- Google Drive storage full
- Security incident detected
- Production ad config error (serving test ads, or no ads at all)

---

## 6. Rollback Procedures

### 6.1 Web Rollback

```bash
# Rollback to previous deployment
wrangler rollback --env production

# D1 rollback (manual — forward-only migrations)
# Must apply fix-forward migration
wrangler d1 migrations create tf-study-shelf-prod "rollback_fix"
```

### 6.2 App Rollback

| Scenario | Action |
|---|---|
| Critical bug in latest release | Halt staged rollout immediately |
| Bug affects all users | Push hotfix build to accelerated review |
| Data corruption | Push emergency update with data recovery |

**Play Console allows:**
- Halting a staged rollout
- Rolling back to previous version (deferred rollout)
- Expedited review request for critical fixes

### 6.3 Firebase Rollback

| Service | Rollback Method |
|---|---|
| Firestore rules | Deploy previous rules version |
| Storage rules | Deploy previous rules version |
| Remote Config | Roll back config changes in console |
| Auth | No rollback needed (user data preserved) |

---

## 7. Post-Launch Operations

### 7.1 Daily Operations Checklist

- [ ] Review Crashlytics for new crashes
- [ ] Check ANR rate in Play Console
- [ ] Review new user reviews and respond
- [ ] Monitor ad revenue and fill rates
- [ ] Check D1/Drive/YouTube API quotas
- [ ] Review error logs from Workers

### 7.2 Weekly Operations

- [ ] Analytics review (DAU, retention, feature adoption)
- [ ] Content report (new content, popular content, gaps)
- [ ] Performance review (load times, error rates)
- [ ] Security scan (unusual patterns, failed logins)
- [ ] Backup health check (success rates)

### 7.3 Monthly Operations

- [ ] Full analytics report
- [ ] Revenue analysis
- [ ] User feedback summary
- [ ] Technical debt review
- [ ] Dependency update assessment
- [ ] Flutter SDK update evaluation
- [ ] Firebase SDK update evaluation
- [ ] Play policy change review

---

## 8. Disaster Recovery

### 8.1 Data Backup Strategy

| Data | Backup Frequency | Retention | Method |
|---|---|---|---|
| D1 Database | Daily | 30 days | Cloudflare automatic + manual export |
| Firestore | Continuous | Per Google SLA | Google automatic |
| Cloud Storage | Continuous | Per Google SLA | Google automatic |
| Google Drive content | Weekly | 90 days | Manual backup to secondary account |
| Source code | Continuous | Unlimited | Git (GitHub/GitLab) |
| Secrets/keys | Versioned | Unlimited | Secure vault (1Password, etc.) |

### 8.2 Recovery Scenarios

| Scenario | RTO | RPO | Recovery Steps |
|---|---|---|---|
| Worker outage | < 30 min | 0 | Cloudflare auto-recovery / redeploy |
| D1 corruption | < 1 hour | < 24h | Restore from backup |
| Firebase outage | Dependent on Google | 0 | Wait for Google recovery |
| Google Drive access lost | < 4 hours | 0 | Use backup service account |
| Source code loss | < 1 hour | 0 | Restore from Git remote |
| Key compromise | < 2 hours | 0 | Rotate keys, revoke old |

---

## 9. Acceptance Criteria

### 9.1 Deployment Readiness

- [ ] CI/CD pipeline runs automatically on push/PR
- [ ] All automated checks pass before merge
- [ ] Staging environment mirrors production architecture
- [ ] Environment variables and secrets properly configured
- [ ] Database migrations tested on staging before production
- [ ] Rollback procedures documented and tested

### 9.2 Release Readiness

- [ ] All PRD acceptance criteria from other documents met
- [ ] Play Store submission checklist completed
- [ ] Store listing reviewed and approved
- [ ] Staged rollout plan defined
- [ ] Monitoring and alerting configured
- [ ] Post-launch operations checklist ready
- [ ] Disaster recovery plan documented

---

*This document defines the complete deployment and release requirements for both platforms. For testing prerequisites, see [11 Testing & QA](./11_Testing_QA.md). For platform-specific details, see [02 Web Platform PRD](./02_Web_Platform_PRD.md) and [03 Mobile App PRD](./03_Mobile_App_PRD_Flutter.md).*
