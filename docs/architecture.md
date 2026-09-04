# TF Study Shelf Architecture

## Overview
TF Study Shelf is a cross-platform educational platform consisting of:
1. **Mobile Application (Flutter)**: Primary user interface for reading, studying, and taking quizzes.
2. **Web Platform (Vanilla JS + HTML/CSS)**: Dual-purpose web application serving both users (reading/studying) and administrators (content management).
3. **Backend (Firebase)**: Serverless backend providing Authentication, Firestore database, Cloud Storage, and Cloud Messaging.

## Core Components

### 1. Mobile App (Flutter)
- **State Management**: BLoC (Business Logic Component) pattern.
- **Routing**: `go_router` for declarative routing and deep linking.
- **Architecture**: Feature-first structure (e.g., `lib/features/auth`, `lib/features/book_detail`).
- **Offline Capabilities**: Uses `sqflite` and `shared_preferences` for local caching. Allows downloading PDFs for offline reading using `dio`.
- **Ad Integration**: Centralized `AdConfig` and `AdService` managing Interstitial and Rewarded ads.

### 2. Web Platform (Vanilla JS)
- **Frontend Architecture**: Single Page Application (SPA) built without heavy frameworks. Uses a simple router and modular JS files.
- **UI System**: Custom CSS variables, responsive grid system, and utility classes.
- **Admin Panel**: Secure dashboard (`admin.html`) for managing books, Q&A, users, and categories.
- **User Dashboard**: Web version of the library (`index.html`), including a custom PDF viewer via `pdf.js`.

### 3. Backend (Firebase)
- **Authentication**: Email/Password and Google Sign-in.
- **Firestore Database**: NoSQL database holding collections for `books`, `categories`, `users`, and nested `qna` collections under books.
- **Cloud Messaging (FCM)**: Push notifications to engage users.

## Data Flow
- **Client to Backend**: Both mobile and web clients communicate directly with Firebase services using the official Firebase SDKs.
- **Real-time Updates**: Firestore real-time listeners are used to sync progress and content updates instantaneously.
