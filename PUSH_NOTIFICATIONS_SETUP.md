# Push Notifications Setup Guide

This guide will help you set up push notifications for Blend Cafe.

## Prerequisites
- Firebase project already set up
- Firebase CLI installed (`npm install -g firebase-tools`)

## Step 1: Enable Cloud Messaging in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Click on **Cloud Messaging** tab
5. Under **Web configuration**, click **Generate key pair** to create a VAPID key
6. Copy the generated key (you'll need this later)

## Step 2: Update Service Worker Config

Edit `public/firebase-messaging-sw.js` and replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

These values are the same as in your `.env` file (VITE_FIREBASE_* variables).

## Step 3: Add VAPID Key to Environment Variables

Add the VAPID key from Step 1 to your environment:

### Local Development (.env file)
```
VITE_FIREBASE_VAPID_KEY=your-vapid-key-here
```

### Vercel (Production)
1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add:
   - Name: `VITE_FIREBASE_VAPID_KEY`
   - Value: Your VAPID key from Step 1

## Step 4: Deploy Cloud Functions

The notification system uses Firebase Cloud Functions to send push notifications.

### Install dependencies
```bash
cd functions
npm install
```

### Login to Firebase
```bash
firebase login
```

### Initialize Firebase in your project (if not already done)
```bash
firebase init
# Select: Functions, Firestore
# Choose your existing Firebase project
# Use TypeScript
# Don't overwrite existing files
```

### Deploy functions
```bash
firebase deploy --only functions
```

## Step 5: Test Notifications

1. Open the website and log in
2. Go to **Settings** → **Notifications** tab
3. Click **Enable** on Push Notifications
4. Allow notifications when prompted by the browser
5. Have another user send you a message or friend request
6. You should receive a notification!

## Troubleshooting

### Notifications not appearing?
- Check browser console for errors
- Ensure notifications are allowed in browser settings
- Check that the VAPID key is correct
- Verify Cloud Functions are deployed successfully

### Cloud Functions errors?
```bash
firebase functions:log
```

### Service Worker not registering?
- Service workers require HTTPS (or localhost)
- Check browser DevTools → Application → Service Workers

## How It Works

1. **User enables notifications** → Browser asks for permission → FCM token is generated and saved to Firestore
2. **New message/friend request** → Cloud Function triggers → Looks up recipient's FCM tokens → Sends push notification
3. **User receives notification** → Clicks it → App opens to relevant page

## Files Created

- `public/firebase-messaging-sw.js` - Service worker for background notifications
- `src/services/notificationService.ts` - Client-side notification handling
- `functions/src/index.ts` - Cloud Functions for sending notifications
- Updated `src/lib/firebase.ts` - FCM initialization
- Updated `src/lib/AppContext.tsx` - Notification state management
- Updated `src/components/SettingsPage.tsx` - UI for enabling notifications

