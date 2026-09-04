# TF Study Shelf — Ads & Monetization Requirements

**Document:** 09 — Ads & Monetization Requirements  
**Version:** 1.0  
**Date:** September 2, 2026  
**Applies to:** [SHARED] Web Platform + Mobile App  

---

## 1. Monetization Strategy

### 1.1 Core Rule

> **Monetize access to extra value; never block basic app usage.** Anyone should be able to browse, search, and read available online content without hitting an ad wall.

### 1.2 Revenue Sources — Ad-Only

| Source | ❌ Not Used |
|---|---|
| Subscriptions | ❌ |
| In-app purchases | ❌ |
| Premium tiers | ❌ |
| Paid content | ❌ |
| Virtual currency | ❌ |

| Source | ✅ Used |
|---|---|
| Banner ads | ✅ |
| Interstitial ads | ✅ |
| Rewarded ads | ✅ |

---

## 2. Ad Formats & Placement

### 2.1 Banner Ads

**Platform:** Both Web and App  
**Ad Network:** Google AdMob (App), Google AdSense (Web)

| Setting | App | Web |
|---|---|---|
| Position | Persistent, above bottom navigation | Header/footer/sidebar |
| Size | Adaptive banner | Responsive display |
| Frequency | Always visible (when ad available) | Always visible |
| Reload | Auto-refresh per AdMob policy | Standard auto-refresh |

**Rules:**
- Must remain visually recognizable as an ad
- Never positioned where it could be mistaken for interactive content
- Must not overlap navigation controls
- Must have sufficient contrast from app content

### 2.2 Interstitial Ads

**Feature Name:** Controlled Interstitial Ads  
**Objective:** Generate revenue from engaged users without disrupting flow.

**Activity Counting:**

| Counts as Activity | Does NOT Count |
|---|---|
| Open book | Scroll |
| Complete chapter | Back press |
| Search | Settings change |
| Open PDF | Font size adjustment |
| Save book | Theme toggle |
| Finish question set | Tab switch |
| Complete quiz | Pull-to-refresh |
| Open subject | Passive content load |
| Finish reading session | |

**Threshold Configuration:**
```
randomThreshold = random(15, 25)  // randomized per session
PLUS ALL of these gates must pass:
  - Session cooldown met
  - Minimum time since last interstitial (>= 3 minutes)
  - Not during: reading, quiz, download, reward flow, onboarding, startup
  - Not immediately after: another ad, a failed action
  - Not during: content transition, annotation, text selection
```

**NEVER show interstitial:**
- Immediately after "Read Now" tap
- Before first page of content
- During text selection
- During quiz question
- While submitting an answer
- While downloading
- Immediately after a rewarded ad
- During active annotation
- Before splash/loading finishes
- During backup/restore flow

### 2.3 Rewarded Ads

**Feature Name:** Opt-In Rewarded Ads  
**Objective:** Gate high-value features behind voluntary ad viewing.

**Rewarded Ad Mapping:**

| Reward | Trigger | Duration | Entry Point |
|---|---|---|---|
| Offline Reading | "Use Offline" on book | 24 hours | Book Detail |
| PDF Download | "Download PDF" on book/PDF | 24 hours | Book/PDF Detail |
| Offline Study | "Study Offline" on Study tab | 24 hours | Study Tab |
| Cloud Backup | "Backup Now" | One-time action | Profile → Backup |
| Cloud Restore | "Restore Backup" | One-time action | Profile → Backup |

**Disclosure Copy Pattern:**
> "Watch a rewarded ad to unlock \<feature\> for 24 hours."

**Important:** Avoid promising "you must watch a complete video" — rewarded inventory can be video, image, or interactive. "Watch a rewarded ad" is the accurate and safe phrasing.

---

## 3. Rewarded Ad State Machine

### 3.1 State Transitions

```
IDLE
  ↓ User taps unlock button
REQUESTED
  ↓ Check connectivity
  ├── Offline → Show "internet required" dialog → IDLE
  └── Online → Continue
AD_LOADING
  ↓ Load rewarded ad
  ├── Success → AD_READY
  └── Failure → AD_FAILED (show retry option) → IDLE
AD_READY
  ↓ Show disclosure dialog to user
  ├── User accepts → USER_OPTED_IN
  └── User cancels → IDLE
USER_OPTED_IN
  ↓ Show ad
AD_SHOWING
  ↓ User interacts with ad
  ├── Completed → REWARD_RECEIVED
  └── Cancelled → AD_CANCELLED → IDLE
REWARD_RECEIVED
  ↓ Verify reward (client callback + SSV pending)
ENTITLEMENT_GRANTED
  ↓ Start download/action
DOWNLOAD_STARTED
  ↓ Download completes
COMPLETED
```

### 3.2 Failure States

| State | UI Message | Actions |
|---|---|---|
| `AD_FAILED` | "Rewarded ad isn't available right now." | [Try Again] [Read Online] |
| `AD_CANCELLED` | (Return to previous screen) | — |
| `REWARD_NOT_RECEIVED` | "Unable to verify ad completion." | [Try Again] |
| `DOWNLOAD_FAILED` | "Download failed. Please try again." | [Retry Download] [Cancel] |

### 3.3 Critical Rules

1. **NEVER** say "ad completed" when it wasn't
2. **NEVER** grant reward without verified completion
3. **NEVER** grant reward on `AD_LOADING` or `AD_READY` state alone
4. **ALWAYS** show disclosure before ad
5. **ALWAYS** verify both client callback AND SSV before finalizing entitlement
6. Reward transaction ID must be idempotent

---

## 4. Server-Side Verification (SSV)

### 4.1 Overview

AdMob SSV provides cryptographic proof that a rewarded ad was genuinely completed, closing the most realistic abuse path: a modified/rooted client claiming "reward received" without Google confirming it.

### 4.2 SSV Flow

```
1. App sets custom_data on rewarded ad request:
   customData = "{userId}:{contentId}:{entitlementType}"

2. User watches rewarded ad

3. AdMob calls backend SSV endpoint:
   POST /api/v1/ssv/verify
   Parameters:
     ad_network, ad_unit, reward_amount, reward_item,
     signature, key_id, timestamp, transaction_id,
     user_id, custom_data

4. Backend verifies:
   a. Verify signature against AdMob ECDSA public keys
   b. Parse custom_data → extract userId, contentId, type
   c. Check idempotency (transaction_id not already processed)
   d. Finalize entitlement grant

5. Result:
   - Valid → Entitlement confirmed server-side
   - Invalid → Flag/revoke entitlement
```

### 4.3 Implementation Pattern

**Best UX + Security:**
1. Grant entitlement **immediately** from client-side callback (so user isn't kept waiting)
2. Treat SSV callback's `transaction_id` as the **true record** that finalizes the entitlement server-side
3. If SSV never arrives or fails verification, flag/revoke the entitlement

### 4.4 SSV Endpoint Implementation

```javascript
// Cloudflare Worker - SSV verification
export async function handleSSV(request) {
  const params = new URL(request.url).searchParams;
  
  // 1. Get AdMob public keys
  const keys = await getAdMobPublicKeys();
  
  // 2. Verify signature
  const isValid = await verifyECDSASignature(
    params.get('signature'),
    params.get('key_id'),
    keys,
    buildMessageToVerify(params)
  );
  
  if (!isValid) {
    return new Response('Invalid signature', { status: 403 });
  }
  
  // 3. Check idempotency
  const txId = params.get('transaction_id');
  const existing = await db.query('SELECT id FROM reward_transactions WHERE transaction_id = ?', [txId]);
  if (existing.length > 0) {
    return new Response('Already processed', { status: 200 });
  }
  
  // 4. Parse custom_data
  const [userId, contentId, entitlementType] = params.get('custom_data').split(':');
  
  // 5. Record transaction
  await db.execute(`
    INSERT INTO reward_transactions (id, transaction_id, user_id, content_id, entitlement_type, ...)
    VALUES (?, ?, ?, ?, ?, ...)
  `, [generateId(), txId, userId, contentId, entitlementType, ...]);
  
  // 6. Finalize entitlement
  await finalizeEntitlement(userId, contentId, entitlementType);
  
  return new Response('OK', { status: 200 });
}
```

---

## 5. Anti-Abuse & Revenue Protection

### 5.1 Threat Vectors

| Threat | Risk | Mitigation |
|---|---|---|
| Fake ad completion | Free entitlements without revenue | SSV as source of truth |
| Repeated callbacks | Duplicate rewards | Idempotent transaction IDs |
| Rapid download abuse | Content scraping | Rate limiting + pattern detection |
| Modified client | Spoofed reward states | SSV server verification |
| Clock tampering | Extended entitlements | Server time + monotonic time |
| Automated API calls | Ad fraud | Rate limiting + authentication |
| Entitlement replay | Re-use expired entitlements | Server-verified expiry |

### 5.2 Idempotency

- Same `rewardTransactionId` (from SSV `transaction_id`) must NEVER grant the same entitlement twice
- Transactions table serves as deduplification log
- Check-before-insert pattern on every reward grant

### 5.3 Rate Limiting for Rewards

| Limit | Value |
|---|---|
| Rewarded ads per user per hour | Max 10 |
| Concurrent offline entitlements per user | Max 5 |
| Backup/restore per user per day | Max 5 |
| Failed ad attempts per session | Max 10 before cooldown |

---

## 6. Ad Configuration (Admin-Manageable)

### 6.1 Admin Controls

Every ad setting is configurable from the admin panel without code changes:

| Setting | Type | Admin Control |
|---|---|---|
| Banner ad unit IDs | String | ✅ Editable per platform |
| Interstitial ad unit IDs | String | ✅ Editable per platform |
| Rewarded ad unit IDs | String | ✅ Editable per reward type |
| Banner enabled/disabled | Toggle | ✅ |
| Interstitial enabled/disabled | Toggle | ✅ |
| Rewarded enabled/disabled | Toggle | ✅ |
| Interstitial threshold range | Min/Max Integer | ✅ |
| Interstitial cooldown (minutes) | Integer | ✅ |
| Test mode | Toggle | ✅ |
| SSV callback URL | String | ✅ |

### 6.2 Test vs. Production Ad IDs

```
Ad Configuration:
├── TEST (Development/Staging)
│   ├── Banner: ca-app-pub-3940256099942544/6300978111
│   ├── Interstitial: ca-app-pub-3940256099942544/1033173712
│   └── Rewarded: ca-app-pub-3940256099942544/5224354917
│
└── PRODUCTION (Live)
    ├── Banner: ca-app-pub-XXXXX/YYYYY
    ├── Interstitial: ca-app-pub-XXXXX/ZZZZZ
    └── Rewarded:
        ├── Offline Reading: ca-app-pub-XXXXX/RRRRR1
        ├── PDF Download: ca-app-pub-XXXXX/RRRRR2
        ├── Offline Study: ca-app-pub-XXXXX/RRRRR3
        ├── Backup: ca-app-pub-XXXXX/RRRRR4
        └── Restore: ca-app-pub-XXXXX/RRRRR5
```

**Critical:** Test build must NEVER use production ad IDs. Production build must NEVER use test ad IDs.

---

## 7. Ad Performance Monitoring

### 7.1 Metrics Dashboard (Admin)

| Metric | Display | Granularity |
|---|---|---|
| Impressions | Per ad unit | Daily, weekly, monthly |
| Click-through rate | Per ad format | Daily |
| Rewarded completion rate | Per reward type | Daily |
| Fill rate | Per ad unit | Daily |
| Revenue estimate | Total, per format | Daily, weekly, monthly |
| ARPDAU | Revenue / daily active users | Daily |
| SSV success rate | Verified / total | Daily |
| Ad error rate | Failed loads / attempts | Daily |

### 7.2 Alerts

| Condition | Alert |
|---|---|
| Fill rate drops below 70% | ⚠️ Warning to admin |
| Rewarded completion rate drops below 50% | ⚠️ Warning |
| Revenue drops > 30% day-over-day | 🚨 Critical |
| SSV verification failures spike | 🚨 Critical |
| Unusual reward patterns detected | ⚠️ Investigate |

---

## 8. In-Content Ad Placement [WEB]

### 8.1 Web Ad Placement Rules

| Position | Format | Frequency |
|---|---|---|
| Page header | Banner | Every page |
| Page footer | Banner | Every page |
| Sidebar | Banner/display | Desktop only |
| Between book listings | Native/display | Every 6-8 items |
| Between recommendation cards | Native | Every 4-6 items |
| After chapter completion | Interstitial | Controlled threshold |
| Between study modules | Banner | Every 3-4 modules |

### 8.2 Avoid

- **NO** ad every 2 pages inside the reader
- **NO** ads that look like content (deceptive placement)
- **NO** ads that block the close button
- **NO** pop-up/pop-under ads
- **NO** auto-playing video ads with sound
- Every ad clearly labeled

---

## 9. Acceptance Criteria

- [ ] Banner ad displays correctly in designated positions
- [ ] Interstitial shows only after qualifying activity threshold with all gates passing
- [ ] Rewarded ad state machine follows all transitions correctly
- [ ] Failed ad never grants reward
- [ ] SSV endpoint receives and verifies callbacks
- [ ] Duplicate transaction IDs are rejected (idempotency)
- [ ] Admin can configure all ad unit IDs without code changes
- [ ] Admin can enable/disable any ad format
- [ ] Admin can adjust interstitial threshold
- [ ] Test ads used in development, production ads in release
- [ ] Ad performance metrics visible in admin dashboard
- [ ] No ads shown during splash, onboarding, or in contexts listed as "NEVER show"
- [ ] Anti-abuse measures active and logging
- [ ] "Read Online" fallback always available when ad fails

---

*This document defines the complete ads and monetization requirements. For admin ad management UI, see [02 Web Platform PRD](./02_Web_Platform_PRD.md) § 8. For SSV backend implementation, see [06 Backend & API](./06_Backend_API_Requirements.md) § 3.8.*
