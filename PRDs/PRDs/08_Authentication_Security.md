# TF Study Shelf — Authentication & Security Requirements

**Document:** 08 — Authentication & Security Requirements  
**Version:** 1.0  
**Date:** September 2, 2026  
**Applies to:** [SHARED] Web Platform + Mobile App  

---

## 1. Authentication System

### 1.1 Provider: Firebase Auth

| Feature | Support |
|---|---|
| Email + Password | ✅ Supported (only method) |
| Google Sign-In | ❌ Not supported |
| Facebook | ❌ Not supported |
| Apple Sign-In | ❌ Not supported |
| Phone OTP | ❌ Not supported |
| Anonymous Auth | ❌ Not supported for cloud features |

### 1.2 Guest vs. Authenticated Capabilities

| Capability | Guest | Signed-In |
|---|---|---|
| Browse, search, read online content | ✅ | ✅ |
| Highlights, notes, bookmarks | Local only | Synced across devices |
| Personal shelf, cross-device progress | ❌ | ✅ |
| 24-hour offline access (ad-gated) | ✅ (device-tied) | ✅ |
| Cloud backup & restore | ❌ (account required) | ✅ |
| Study statistics sync | ❌ | ✅ |

### 1.3 Password Requirements

| Requirement | Value |
|---|---|
| Minimum length | 8 characters |
| Character requirements | At least 1 letter + 1 number |
| Maximum length | 128 characters |
| Case sensitivity | Case-sensitive |
| Common passwords | Reject top 10,000 common passwords |

### 1.4 Account Lifecycle

```
Create Account
    ↓
Active Account (email + password)
    ↓
├── Sign Out → Guest mode (local data retained)
├── Forgot Password → Reset email → New password
├── Delete Account → Confirmation → Data deletion → Guest mode
└── Admin Ban → Account suspended
```

### 1.5 Account Deletion (Google Play Requirement)

**Location:** Profile → Account → Delete Account

**Must be in-app, not a "contact us" form.**

**What gets deleted:**
- Firebase Auth account
- Cloud backups (Firebase Cloud Storage)
- Synced data (Firestore: progress, highlights, notes, bookmarks, quiz results)
- Backup metadata

**What gets retained (per privacy policy):**
- Anonymized analytics data
- Audit logs (admin actions on user)

**Process:**
1. User taps "Delete Account"
2. Clear warning dialog listing what will be deleted
3. Re-authentication required (enter password)
4. Server-side deletion triggered
5. Local data cleared
6. Navigate to Welcome screen

---

## 2. Admin Authentication [WEB]

### 2.1 Admin Roles

| Role | Description | Permissions |
|---|---|---|
| **Super Admin** | Full system access | Everything including user password changes, admin management |
| **Content Manager** | Content operations | Create/edit/publish content, Q&A, quizzes. No user management |
| **Moderator** | Review operations | Review content, handle reports. No publish/delete |

### 2.2 Admin Account Management

- Admin accounts created by Super Admin only
- Admin role stored in D1 `admin_users` table
- Firebase custom claims for role-based JWT tokens
- Session timeout: 30 minutes of inactivity
- Login attempt rate limiting: max 5 per 15 minutes
- All logins/logouts recorded in audit log

### 2.3 Admin Password Policy

- Same requirements as user passwords (minimum 8 chars, letter + number)
- Password rotation recommended every 90 days (advisory, not enforced V1)
- Super Admin can reset any admin's password

---

## 3. Security Model

### 3.1 API Security

| Measure | Implementation |
|---|---|
| Transport | HTTPS only (Cloudflare auto-SSL) |
| Authentication | Firebase Auth JWT in `Authorization: Bearer <token>` header |
| JWT Validation | Verify signature, issuer, audience, expiry on every request |
| Admin authorization | Check Firebase custom claims for admin role |
| Rate limiting | Per-endpoint, per-user limits (see [06 Backend API](./06_Backend_API_Requirements.md)) |
| Input validation | Server-side validation on all inputs |
| SQL injection | Parameterized queries only (D1) |
| XSS prevention | Input sanitization + Content-Security-Policy header |
| CORS | Strict origin allowlist |

### 3.2 Content Security

| Measure | Implementation |
|---|---|
| PDF access control | PDFs proxied through Workers, not exposed via public Drive URLs |
| Rights enforcement | Backend checks `canRead/canDownload/canShare/canOffline` from rights metadata |
| Download authorization | Rewarded ad + SSV verification required |
| Temporary access | Entitlements with server-verified expiry |
| Content integrity | Version checking on offline packages |

### 3.3 Entitlement Security

**Entitlement validation formula:**
```
CanOpen(content) = LocalFileExists AND EntitlementValid AND ContentVersionAllowed
```

- **Never** treat "file exists locally" as "access is allowed"
- Entitlement expiry checked: on open, on key transitions, on startup, on scheduled job
- Clock-tampering protection using server time + monotonic time
- Entitlement records stored in secure local storage (encrypted)

### 3.4 Backup Security

| Measure | Implementation |
|---|---|
| Encryption | AES-256 encryption before cloud upload |
| Password handling | User password never stored in backup file |
| Cloud Storage rules | Only authenticated user can read/write their own backups |
| Integrity checking | SHA-256 checksum on backup file |
| Schema validation | Version and compatibility check before restore |
| Safety snapshot | Current data snapshot before restore |

### 3.5 Client Security [APP]

| Measure | Implementation |
|---|---|
| Token storage | `flutter_secure_storage` (Android Keystore-backed) |
| Code obfuscation | `--obfuscate --split-debug-info` in release builds |
| ProGuard/R8 | Enabled for release builds |
| No secrets in client | Firebase/admin/API secrets never in Dart code |
| Certificate pinning | Consider for V2 (adds operational complexity) |
| Root detection | Optional warning (don't block, as it affects legitimate users) |
| Secure communication | All API calls over HTTPS |
| Local database | Encrypted SharedPreferences for sensitive data |

### 3.6 Ad Security

| Measure | Implementation |
|---|---|
| SSV verification | AdMob Server-Side Verification on all rewarded ad units |
| Idempotency | `transaction_id` prevents duplicate reward grants |
| Custom data | `userId + contentId + entitlementType` sent with ad request |
| Server authority | SSV callback is the source of truth, not client callback |
| Anti-abuse | Rate limiting, pattern detection for suspicious reward patterns |

---

## 4. Data Protection

### 4.1 Data Classification

| Category | Examples | Protection Level |
|---|---|---|
| **Authentication** | Passwords, tokens, session IDs | Highest — encrypted, never logged |
| **Personal** | Email, user preferences | High — encrypted in transit, access-controlled |
| **User Content** | Notes, highlights, bookmarks | High — user-scoped access only |
| **Usage Data** | Analytics events, reading progress | Medium — anonymizable |
| **Public Content** | Book metadata, Q&A | Low — publicly accessible |

### 4.2 Data in Transit

- All API communication: HTTPS (TLS 1.2+)
- Firebase: HTTPS by default
- Google Drive API: HTTPS with OAuth2
- WebSocket (if used): WSS

### 4.3 Data at Rest

| Storage | Encryption |
|---|---|
| Cloudflare D1 | Encrypted by Cloudflare |
| Firebase Firestore | Encrypted by Google |
| Firebase Cloud Storage | Encrypted by Google |
| Local database (Drift) | OS-level encryption + app sandbox |
| flutter_secure_storage | Android Keystore encryption |
| Backup files | AES-256 by app before upload |

### 4.4 Data Minimization

- Collect only necessary data
- Analytics events: no PII beyond user ID
- No unnecessary permissions requested
- No device identifiers transmitted for children/unknown age (if Families Policy applies)

---

## 5. Session Management

### 5.1 App Sessions

| Setting | Value |
|---|---|
| Token type | Firebase Auth ID token (JWT) |
| Token refresh | Auto-refresh via Firebase SDK |
| Session persistence | `Persistence.LOCAL` (persists across app restarts) |
| Force sign-out | On account deletion, admin ban |
| Multiple devices | Supported (same account, synced data) |

### 5.2 Web Sessions

| Setting | Value |
|---|---|
| Token type | Firebase Auth ID token |
| Session timeout | 30 minutes inactivity (admin panel) |
| Cookie policy | SameSite=Strict, Secure, HttpOnly |
| CSRF protection | Origin validation on state-changing requests |

---

## 6. Audit & Monitoring

### 6.1 Audit Log Events

| Event | Logged Data |
|---|---|
| Admin login/logout | Admin ID, timestamp, IP |
| Content create/update/delete | Admin ID, entity type, entity ID, changes |
| Content publish/unpublish | Admin ID, book ID, reason |
| Emergency unpublish | Admin ID, book ID, reason, timestamp |
| User password reset | Admin ID, target user ID |
| User ban/delete | Admin ID, target user ID, reason |
| Ad config change | Admin ID, ad unit, changes |
| Notification sent | Admin ID, target, content |
| SSV reward verified | Transaction ID, user ID, content ID |
| Suspicious activity | User ID, activity type, details |

### 6.2 Security Monitoring

| Monitor | Action |
|---|---|
| Failed login attempts (>5) | Temporary lockout + admin alert |
| Unusual reward patterns | Flag for review |
| API rate limit exceeded | Log + block |
| Admin action from new IP | Notification to Super Admin |
| Backup anomalies | Log and alert |

---

## 7. Privacy & Compliance

### 7.1 Required Documents

| Document | Location |
|---|---|
| Privacy Policy | Web (URL), In-app (Profile → Privacy) |
| Terms of Use | Web (URL), In-app (Profile → Privacy) |
| Content Rights Policy | Web (admin-facing) |
| Data Safety Form | Google Play Console |

### 7.2 Google Play Data Safety

**Data collected and declared:**
- Email (account creation)
- Usage analytics (Firebase Analytics events)
- Crash data (Crashlytics)
- Device information (for analytics/ads)
- Ad interaction data (AdMob)

**Data NOT collected:**
- Location
- Contacts
- Phone number
- Photos/media (beyond user's own uploads)
- Financial information

### 7.3 DPDP Act (India) Compliance

| Requirement | Implementation |
|---|---|
| Consent | Clear consent for data collection at signup |
| Purpose limitation | Data used only for stated purposes |
| Data access | User can view their data in Profile |
| Data correction | User can edit profile/preferences |
| Data erasure | Account deletion removes all personal data |
| Notice | Privacy policy available in-app |
| Data breach notification | Process defined for breach communication |

### 7.4 GDPR Considerations (if EU users)

| Requirement | Implementation |
|---|---|
| Lawful basis | Consent (explicit) + legitimate interest (analytics) |
| Right to access | Data export via admin (user request) |
| Right to erasure | Account deletion |
| Data portability | Backup file is portable format |
| Cookie consent | Banner for web (if cookies used) |
| DPO | Not required under 10M users threshold |

### 7.5 Google Play Families Policy Considerations

**Decision Required:** Target age group declaration.

If target includes children under 13:
- Use Families Self-Certified Ads SDKs only
- Non-personalized ads for children
- Neutral age screen for mixed-audience apps
- No device identifier transmission from children
- Content appropriate for youngest declared audience

**Recommendation:** Declare 13+ (teens and adults) given competitive exam and college personas are the primary audience.

### 7.6 Content Rating

IARC content rating questionnaire must be completed truthfully. Education content with private annotations typically rates low (E/Everyone), but the questionnaire determines the final rating.

---

*This document defines the complete authentication and security requirements. For API security implementation, see [06 Backend & API](./06_Backend_API_Requirements.md). For ad security (SSV), see [09 Ads & Monetization](./09_Ads_Monetization.md).*
