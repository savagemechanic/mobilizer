# Firebase Setup Guide

This guide explains how to set up Firebase for the Mobilizer app, including Firebase Storage for image uploads and Firebase Cloud Messaging (FCM) for push notifications.

## Prerequisites

1. A Google account
2. Access to the Firebase Console (https://console.firebase.google.com)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: "Mobilizer" (or your preferred name)
4. Enable/disable Google Analytics as needed
5. Click "Create project"

## Step 2: Add Apps to Firebase

### iOS App
1. In Firebase Console, click "Add app" and select iOS
2. Enter iOS bundle ID: `com.mobilizer.app`
3. Download `GoogleService-Info.plist`
4. Place it in `apps/mobile/` directory

### Android App
1. Click "Add app" and select Android
2. Enter Android package name: `com.mobilizer.app`
3. Download `google-services.json`
4. Place it in `apps/mobile/` directory

## Step 3: Configure Firebase Storage

1. In Firebase Console, go to "Build" > "Storage"
2. Click "Get started"
3. Choose your security rules (start with test mode for development)
4. Select your preferred location

### Storage Security Rules (Production)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Avatars - authenticated users can upload their own
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Posts - authenticated users can upload
    match /posts/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Organizations - admin can upload
    match /organizations/{orgId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Events - admin can upload
    match /events/{eventId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Step 4: Get Firebase Configuration for Mobile App

1. In Firebase Console, go to Project Settings (gear icon)
2. Under "Your apps", select your web app or create one
3. Copy the Firebase configuration object

### Update `apps/mobile/app.json`

Replace the placeholder values with your Firebase config:

```json
{
  "expo": {
    "extra": {
      "FIREBASE_API_KEY": "your-api-key",
      "FIREBASE_AUTH_DOMAIN": "your-project.firebaseapp.com",
      "FIREBASE_PROJECT_ID": "your-project-id",
      "FIREBASE_STORAGE_BUCKET": "your-project.appspot.com",
      "FIREBASE_MESSAGING_SENDER_ID": "your-sender-id",
      "FIREBASE_APP_ID": "your-app-id"
    }
  }
}
```

## Step 5: Set Up FCM for Push Notifications

### Generate Service Account Key

1. In Firebase Console, go to Project Settings
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file

### Add to Backend Environment

The service account JSON needs to be added as a single-line string in your backend environment:

1. Stringify the JSON (remove newlines)
2. Add to backend `.env`:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}
```

Or use a file reference:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json
```

## Step 6: Configure Cloud Messaging

### iOS (APNs)
1. In Firebase Console, go to Project Settings > Cloud Messaging
2. Under "Apple app configuration", upload your APNs key:
   - Go to Apple Developer Console
   - Create a new Key with Apple Push Notifications service (APNs)
   - Download the .p8 file
   - Upload to Firebase with your Key ID and Team ID

### Android
Android FCM works automatically once `google-services.json` is in place.

## Step 7: Build with EAS

After adding the Firebase config files, rebuild your app:

```bash
# For development build
eas build --profile development --platform ios
eas build --profile development --platform android

# For production
eas build --profile production --platform all
```

## Environment Variables Summary

### Mobile App (`apps/mobile/app.json` extra section)
```json
{
  "FIREBASE_API_KEY": "AIza...",
  "FIREBASE_AUTH_DOMAIN": "project.firebaseapp.com",
  "FIREBASE_PROJECT_ID": "project-id",
  "FIREBASE_STORAGE_BUCKET": "project.appspot.com",
  "FIREBASE_MESSAGING_SENDER_ID": "123456789",
  "FIREBASE_APP_ID": "1:123456789:web:abc123"
}
```

### Backend (`apps/backend/.env`)
```env
# Firebase Service Account (stringify the entire JSON)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## Testing

### Test Firebase Storage
1. Open the app and try changing your profile picture
2. Check Firebase Console > Storage to see if the file appears

### Test Push Notifications
1. Open the app on a physical device
2. Grant notification permissions
3. Use the backend to send a test notification
4. Verify you receive the push notification

## Troubleshooting

### Storage Upload Fails
- Check Firebase Storage rules
- Verify FIREBASE_STORAGE_BUCKET is correct
- Check network connectivity

### Push Notifications Not Working
- Ensure you're on a physical device (not simulator)
- Verify notification permissions are granted
- Check FIREBASE_SERVICE_ACCOUNT is valid JSON
- For iOS, ensure APNs is configured correctly

### Build Errors
- Make sure GoogleService-Info.plist and google-services.json are in the correct location
- Run `npx expo prebuild --clean` to regenerate native projects
