# TF Study Shelf — Admin & Content Management Requirements

**Document:** 10 — Admin & Content Management Requirements  
**Version:** 1.0  
**Date:** September 2, 2026  
**Applies to:** [WEB] Web Platform (Admin Panel)  

---

## 1. Admin Panel Overview

### 1.1 Core Principle

> **Every single feature, content element, and configuration across the entire TF Study Shelf product must be manageable from the admin panel.** From books to ad units, from user passwords to notification templates — everything is A-to-Z manageable.

### 1.2 Admin Capabilities Matrix

| Capability | Super Admin | Content Manager | Moderator |
|---|---|---|---|
| **Content CRUD** | ✅ | ✅ | 👁️ View only |
| **Publish/Unpublish** | ✅ | ✅ | ❌ |
| **Emergency Unpublish** | ✅ | ✅ | ❌ |
| **Q&A Management** | ✅ | ✅ | 👁️ View only |
| **Quiz/Flashcard Management** | ✅ | ✅ | 👁️ View only |
| **Category/Subject Management** | ✅ | ✅ | ❌ |
| **User Management** | ✅ | ❌ | ❌ |
| **User Password Change** | ✅ | ❌ | ❌ |
| **User Ban/Delete** | ✅ | ❌ | ❌ |
| **Ad Configuration** | ✅ | ❌ | ❌ |
| **Notification Management** | ✅ | ✅ | ❌ |
| **Analytics/Reports** | ✅ | ✅ (content only) | ✅ (limited) |
| **System Settings** | ✅ | ❌ | ❌ |
| **Admin Account Management** | ✅ | ❌ | ❌ |
| **Audit Log Access** | ✅ | ❌ | ❌ |
| **Content Reports/Moderation** | ✅ | ✅ | ✅ |
| **Google Drive Management** | ✅ | ✅ | ❌ |
| **YouTube Management** | ✅ | ✅ | ❌ |
| **Feature Flags** | ✅ | ❌ | ❌ |
| **Data Export** | ✅ | ❌ | ❌ |

---

## 2. Content Manageable Items

### 2.1 Complete List of Manageable Content

| Content Type | Operations | Storage |
|---|---|---|
| Books | CRUD, Publish, Unpublish, Feature, Version | D1 + Google Drive (PDF/covers) |
| Chapters | CRUD, Reorder | D1 |
| Questions & Answers | CRUD, Bulk Import | D1 |
| Quizzes | CRUD, Assign Questions | D1 |
| Flashcard Sets | CRUD, Manage Cards | D1 |
| Summaries | CRUD per chapter | D1 |
| Key Concepts | CRUD per chapter | D1 |
| Videos | CRUD, YouTube Link | D1 + YouTube |
| Categories | CRUD, Reorder | D1 |
| Subjects | CRUD, Reorder, Assign to Category | D1 |
| Exam Tags | CRUD | D1 |
| Study Packs | CRUD, Assign Content | D1 |
| Collections | CRUD, Assign Books | D1 |
| Learning Paths | CRUD, Sequence Steps | D1 |
| Authors | CRUD | D1 |

### 2.2 Complete List of Manageable Settings

| Setting | Operations | Scope |
|---|---|---|
| Ad Units (all types) | CRUD, Enable/Disable, Configure | Global |
| Ad Thresholds | Update min/max, cooldown | Global |
| Feature Flags | Toggle on/off | Global |
| Notification Templates | CRUD | Global |
| App Configuration | Update settings | Global |
| User Accounts | View, Password Reset/Change, Ban, Delete | Per-user |
| Admin Accounts | CRUD (Super Admin only) | Per-admin |

---

## 3. Content Publishing Workflow

### 3.1 Publishing States

```
DRAFT → REVIEW → PUBLISHED → UNPUBLISHED → ARCHIVED
                     ↑              │
                     └──────────────┘ (Republish)
                     
EMERGENCY_UNPUBLISH (one-click from any Published state)
```

### 3.2 Publishing Checklist

Before a book can be published, all checks must pass:

| Check | Validation |
|---|---|
| ✅ Title present | Non-empty, 1-200 characters |
| ✅ Author present | Non-empty, 1-100 characters |
| ✅ Description present | Non-empty, 10-5000 characters |
| ✅ Cover image uploaded | Valid image file on Google Drive |
| ✅ At least one category | Category assigned |
| ✅ Rights status set | Not RESTRICTED |
| ✅ Rights metadata complete | License info if not PUBLIC_DOMAIN |
| ✅ PDF uploaded (if applicable) | Valid PDF on Google Drive |
| ✅ Content quality reviewed | Manual admin check |
| ✅ At least one chapter (if book) | Chapters created |

### 3.3 Emergency Unpublish

**Feature Name:** Emergency Content Removal  
**Objective:** Rapidly remove content for copyright, safety, or license issues.

**Requirements:**
- One-click action (not multi-step)
- Immediately removes from all public views (< 30 seconds)
- Logs: admin, reason, timestamp
- Notifies all admins
- Content preserved (hidden, not deleted) for review
- Can be republished after resolution

**Triggers:**
- Copyright complaint
- Incorrect/harmful content discovered
- License expiration
- Safety concern
- Legal requirement

---

## 4. Google Drive Management

### 4.1 Admin Google Drive Interface

**Feature Name:** Google Drive File Manager  
**Objective:** Upload, organize, and manage all content files on Google Drive.

**Operations:**

| Operation | Description |
|---|---|
| Upload PDF | Select file → Upload to Drive → Get file ID → Associate with book |
| Upload Cover | Select image → Upload → Optimize → Associate with book |
| Browse files | View Drive folder structure and files |
| Delete file | Remove from Drive (with confirmation) |
| Storage monitor | View used/available storage |
| Folder management | Create/organize content folders |

### 4.2 Upload Flow

```
Admin Panel → Content → Book → Upload PDF
    ↓
Option A: Upload from local machine
    → File picker → Upload to Google Drive → Processing
    ↓
Option B: Select existing Drive file
    → Google Drive Picker → Select file
    ↓
File ID saved to book record
    ↓
PDF preview available in admin
```

### 4.3 Storage Alerts

| Level | Threshold | Action |
|---|---|---|
| Info | 50% used | Display usage bar |
| Warning | 80% used (12 GB / 15 GB) | Yellow alert in dashboard |
| Critical | 93% used (14 GB / 15 GB) | Red alert, block new uploads |

---

## 5. YouTube Management

### 5.1 Video Management Interface

| Operation | Description |
|---|---|
| Add video by URL | Paste YouTube URL → Auto-fetch metadata |
| Upload video | Upload via YouTube Data API |
| Associate with content | Link video to book/chapter |
| Monitor availability | Periodic check for deleted/private videos |
| View analytics | View count, engagement (from YouTube API) |

### 5.2 Video Availability Monitoring

- Scheduled check every 24 hours
- If video unavailable: mark in DB, admin notification
- Admin dashboard shows unavailable videos list
- Admin can replace video URL or remove association

---

## 6. Bulk Operations

### 6.1 Bulk Import

| Content Type | Import Format | Fields |
|---|---|---|
| Questions | CSV / JSON | question_text, type, difficulty, answer, explanation, options |
| Flashcards | CSV | front_text, back_text, set_id |
| Books metadata | CSV | title, author, description, category, subject, difficulty |

### 6.2 Bulk Actions

| Action | Content Types |
|---|---|
| Publish multiple | Books, Q&A, Quizzes |
| Unpublish multiple | Books, Q&A, Quizzes |
| Assign category | Books |
| Change difficulty | Questions, Quizzes |
| Delete multiple | Any (with confirmation) |
| Export | Any → CSV/JSON |

---

## 7. Content Versioning

### 7.1 Version Management

| Rule | Description |
|---|---|
| Version tracking | Every book update increments version number |
| Online always latest | Online reader serves latest version |
| Offline package valid | Active offline package stays valid for its window |
| New unlock = latest | Fresh offline unlock fetches latest version |
| No mid-session replace | Never replace active local file while user is reading |
| Version history | Admin can view version history and changes |

### 7.2 Version Conflict Resolution

- If offline user has v1 and server has v2: offline v1 stays valid until expiry
- When user goes online: auto-update to v2 for online reading
- Next offline unlock: downloads v2

---

## 8. Moderation (Future — V3)

### 8.1 Phase 1 (V1): Private Annotations Only

- No public comments → No moderation needed
- Private notes/highlights visible only to their creator

### 8.2 Phase 2 (V3): Public Comments

When community comments ship, these must be ready from day one:
- Report content (spam, inappropriate, offensive)
- Report user (harassment, abuse)
- Admin review queue
- Block/mute user
- Delete comment
- Shadow ban capability
- Automated content filtering (basic)
- Appeal process

---

## 9. Acceptance Criteria

- [ ] Admin can log in and access role-appropriate dashboard
- [ ] Every content type listed in §2.1 is fully CRUD-manageable
- [ ] Every setting listed in §2.2 is configurable without code changes
- [ ] Content publishing workflow enforces all checklist items
- [ ] Emergency unpublish works in one click with < 30s propagation
- [ ] Google Drive file upload/management works end-to-end
- [ ] YouTube video management works (add, associate, monitor)
- [ ] Bulk operations (import, publish, export) work correctly
- [ ] Content versioning tracks and serves correct versions
- [ ] All admin actions are logged in audit trail
- [ ] Super Admin can manage other admin accounts
- [ ] Super Admin can change user passwords
- [ ] Storage monitoring displays accurate usage with alerts

---

*This document defines the complete admin and content management requirements. For the admin panel UI, see [02 Web Platform PRD](./02_Web_Platform_PRD.md). For API endpoints, see [06 Backend & API](./06_Backend_API_Requirements.md).*
