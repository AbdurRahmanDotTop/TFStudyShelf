# TF Study Shelf — PRD Suite Index

**Document Version:** 1.0  
**Date:** September 2, 2026  
**Product:** TF Study Shelf  
**Tagline:** Read. Learn. Remember.

---

## Overview

This directory contains the complete, production-ready Product Requirements Documents (PRDs) for the **TF Study Shelf** product ecosystem. The documentation covers two platforms:

| Platform | Technology | Primary Users |
|---|---|---|
| **TF Study Shelf Web Platform** | Cloudflare Pages/Workers, HTML/CSS/JS, Cloudflare D1, Google Drive API, YouTube API | Admin (content management), End Users (content consumption) |
| **TF Study Shelf Mobile App** | **Flutter + Dart** (Android) | End Users (reading, studying, offline access) |

---

## PRD Document Map

### Core Platform PRDs

| # | Document | Description |
|---|---|---|
| 01 | [Shared Product & Business Requirements](./01_Shared_Product_Business_Requirements.md) | Product identity, vision, personas, business model, brand & design system, content rights policy |
| 02 | [Web Platform PRD](./02_Web_Platform_PRD.md) | Complete web platform requirements — admin panel, content management, user-facing web features |
| 03 | [Mobile App PRD — Flutter + Dart](./03_Mobile_App_PRD_Flutter.md) | Complete mobile app requirements — screen-by-screen, Flutter architecture, offline/online behavior |

### Feature-Area PRDs

| # | Document | Description |
|---|---|---|
| 04 | [User Flows & Navigation](./04_User_Flows_Navigation.md) | All user flows, navigation maps, screen trees for both platforms |
| 05 | [UI/UX Requirements](./05_UI_UX_Requirements.md) | Design system, component library, responsive/adaptive layouts, accessibility |
| 06 | [Backend & API Requirements](./06_Backend_API_Requirements.md) | API design, Cloudflare Workers, Firebase integration, Google Drive/YouTube APIs |
| 07 | [Database & Data Model Requirements](./07_Database_Data_Model.md) | Complete data schemas, Cloudflare D1, Firestore, Room/Drift, storage architecture |
| 08 | [Authentication & Security Requirements](./08_Authentication_Security.md) | Auth system, security model, encryption, entitlements, privacy |
| 09 | [Ads & Monetization Requirements](./09_Ads_Monetization.md) | Ad formats, rewarded flows, SSV, interstitial rules, anti-abuse |
| 10 | [Admin & Content Management Requirements](./10_Admin_Content_Management.md) | CMS features, content workflows, Google Drive/YouTube integration, admin panel |
| 11 | [Testing & QA Requirements](./11_Testing_QA.md) | Test strategy, acceptance criteria, QA checklists, device matrix |
| 12 | [Deployment & Release Requirements](./12_Deployment_Release.md) | CI/CD, Play Store submission, Cloudflare deployment, release processes |

---

## Cross-Reference Guide

All documents use consistent section identifiers and cross-reference each other. When a requirement in one document depends on or relates to another, it includes a reference like:

> **→ See [08 Authentication & Security](./08_Authentication_Security.md) § 3.2**

---

## Platform Distinction

Throughout all documents, requirements are clearly tagged:

| Tag | Meaning |
|---|---|
| **[WEB]** | Applies only to the Web Platform |
| **[APP]** | Applies only to the Mobile App (Flutter) |
| **[SHARED]** | Applies to both platforms |
| **[ADMIN]** | Admin-only functionality (primarily Web) |

---

## Version History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | September 2, 2026 | TF Study Shelf Product Team | Initial complete PRD suite |

---

*This index should be updated whenever new PRD documents are added or existing ones are significantly revised.*
