# Quick Start Guide - 5 Minutes ⚡

Get your cafe app running with real backend in 5 minutes!

## Step 1: Get Firebase Config (2 min)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Click Settings ⚙️ → Project settings → Scroll down
4. Click `</>` to add a web app
5. Copy the config values

## Step 2: Get Google Maps API Key (2 min)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Maps JavaScript API** and **Places API**
3. Create an API key under "Credentials"
4. ⚠️ Enable billing (includes $200 free/month)

## Step 3: Configure `.env` (1 min)

Open `.env` and paste your keys:

```env
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

## Step 4: Enable Auth Methods

In Firebase Console → Authentication → Sign-in method:
- Enable **Email/Password**
- Enable **Google**

## Step 5: Create Firestore Database

In Firebase Console → Firestore Database:
- Click "Create database"
- Choose "Test mode"
- Click "Enable"

## Step 6: Run! 🚀

```bash
npm run dev
```

Open http://localhost:5173 and sign up!

---

## ✅ What Works Now

- Sign up / Sign in (Email + Google)
- Real cafes from Google Places
- Interactive Google Maps
- Search & filter cafes
- Save favorites to database
- Profile management

## 📖 Need More Details?

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete instructions and troubleshooting.

## 🐛 Common Issues

**Map not loading?**
- Enable Maps JavaScript API + Places API
- Enable billing in Google Cloud
- Restart dev server after updating `.env`

**Authentication error?**
- Enable Email/Password + Google in Firebase
- Check your Firebase config in `.env`

**No cafes showing?**
- Places API requires billing (free tier available)
- Check browser console for errors


