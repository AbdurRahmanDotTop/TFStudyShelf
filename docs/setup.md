# TF Study Shelf Setup & Deployment

## Environment Setup

### 1. Prerequisites
- **Flutter SDK** (v3.16.0 or higher)
- **Node.js** (for running local dev server for Web App)
- **Firebase CLI** (optional, for deploying Web App)
- **Android Studio / Xcode** (for mobile builds)

### 2. Firebase Configuration
The project is connected to the Firebase Project: `tf-study-shelf-b1a08`.

#### Mobile
- Configuration is auto-generated via FlutterFire CLI in `App/lib/firebase_options.dart`.
- Do not manually edit the `firebase_options.dart` file. Re-run `flutterfire configure` if you need to update the configuration.

#### Web
- Configuration is hardcoded in the Web HTML files:
  - `Web/public/index.html` (User App)
  - `Web/public/admin.html` (Admin App)
- Ensure the `projectId` is `tf-study-shelf-b1a08`.

### 3. Local Development

#### Mobile App
```bash
cd App
flutter pub get
flutter run
```

#### Web App
```bash
cd Web
npm install -g serve
serve public
```

## Deployment

### Android Release Build
The project is configured for Android Release Builds.
1. Create a `key.properties` file in `App/android/` with your signing configurations.
2. Build the AppBundle:
   ```bash
   cd App
   flutter build appbundle --release
   ```
3. Upload the resulting `.aab` file to the Google Play Console.

### Web Hosting Deployment (Firebase)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize hosting (if not done): `firebase init hosting`
4. Deploy:
   ```bash
   cd Web
   firebase deploy --only hosting
   ```
