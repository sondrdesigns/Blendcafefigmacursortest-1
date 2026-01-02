# Blend Cafe App - Backend Integration Setup Guide

This guide will help you set up Firebase authentication, Firestore database, and Google Maps/Places API for your cafe discovery app.

## 🚀 Features Integrated

✅ Firebase Authentication (Email/Password + Google OAuth)  
✅ Firestore Database for user profiles and favorites  
✅ Google Maps JavaScript API for interactive maps  
✅ Google Places API for real cafe data  
✅ Real-time filtering and search  
✅ Profile management with backend sync  

---

## 📋 Prerequisites

- Node.js and npm installed
- A Google account for Firebase and Google Cloud Platform
- Basic knowledge of React and Firebase

---

## 🔧 Step 1: Firebase Setup

### 1.1 Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `blend-cafe-app` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication

1. In your Firebase project, click "Authentication" in the left sidebar
2. Click "Get started"
3. Enable **Email/Password**:
   - Click "Email/Password"
   - Toggle "Enable"
   - Click "Save"
4. Enable **Google** sign-in:
   - Click "Google"
   - Toggle "Enable"
   - Enter support email
   - Click "Save"

### 1.3 Set Up Firestore Database

1. Click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select your preferred location
5. Click "Enable"

### 1.4 Configure Security Rules

Go to the "Rules" tab and replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Cafes collection (read-only for all, write for authenticated users)
    match /cafes/{cafeId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Reviews collection
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.userId;
    }
  }
}
```

### 1.5 Get Firebase Configuration

1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps"
4. Click the web icon `</>`
5. Register your app (name: "Blend Cafe Web")
6. Copy the `firebaseConfig` object

---

## 🗺️ Step 2: Google Maps & Places API Setup

### 2.1 Enable APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to "APIs & Services" → "Library"
4. Search and enable:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API** (optional but recommended)

### 2.2 Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy your API key
4. Click "Restrict Key" (recommended):
   - Under "Application restrictions": Choose "HTTP referrers"
   - Add: `http://localhost:*` and your production domain
   - Under "API restrictions": Select "Restrict key"
   - Choose:
     - Maps JavaScript API
     - Places API
     - Geocoding API
5. Click "Save"

### 2.3 Enable Billing (Required for Places API)

⚠️ **Important**: Google Places API requires a billing account, but includes $200 free credit per month.

1. Go to "Billing" in Google Cloud Console
2. Link a billing account
3. The free tier covers most development and small-scale usage

---

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Update `.env` File

Open `/Users/toshin/Desktop/Blendcafefigmacursortest/.env` and replace with your actual keys:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Google Maps & Places API
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX

# App Configuration (Optional - adjust to your location)
VITE_APP_NAME=Blend
VITE_DEFAULT_LAT=40.7589
VITE_DEFAULT_LNG=-73.9851
```

### 3.2 Verify `.env` is in `.gitignore`

Make sure `.env` is listed in your `.gitignore` file (already done ✅)

---

## 🚀 Step 4: Run the Application

### 4.1 Install Dependencies (if not done)

```bash
cd ~/Desktop/Blendcafefigmacursortest
npm install
```

### 4.2 Start Development Server

```bash
npm run dev
```

The app should open at `http://localhost:5173`

---

## 🧪 Step 5: Test the Integration

### 5.1 Test Authentication

1. Click "Sign Up" and create an account
2. Try signing in with your credentials
3. Try "Sign in with Google"
4. Check Firebase Console → Authentication to see your user

### 5.2 Test Map

1. Navigate to the Map page
2. Grant location permissions when prompted
3. You should see real cafes near you on the map
4. Click on markers to see cafe details

### 5.3 Test Explore Page

1. Navigate to the Explore page
2. Real cafes should load automatically
3. Try filtering by categories
4. Try the search functionality

### 5.4 Test Favorites

1. Add a cafe to favorites
2. Check Firebase Console → Firestore → users → [your-user-id]
3. You should see a `favorites` array

---

## 🐛 Troubleshooting

### Issue: "Firebase API key not configured"

**Solution**: Make sure you've updated the `.env` file with your actual Firebase config and restarted the dev server.

### Issue: "Google Maps API key not configured"

**Solution**: 
1. Verify your Google Maps API key is in `.env`
2. Check that Maps JavaScript API and Places API are enabled
3. Verify billing is enabled on your Google Cloud project
4. Restart the dev server

### Issue: No cafes showing on map

**Solution**:
1. Check browser console for errors
2. Verify Places API is enabled
3. Check that your API key has proper restrictions
4. Make sure billing is enabled (Places API requirement)

### Issue: "Authentication error"

**Solution**:
1. Verify Firebase Authentication is enabled
2. Check that your domain is authorized in Firebase Console
3. For Google sign-in, verify OAuth is properly configured

### Issue: Firestore permission denied

**Solution**:
1. Check your Firestore security rules
2. Verify the user is authenticated
3. Check browser console for detailed error

---

## 📱 Features Available

### ✅ Working Features

- **Authentication**: Email/password and Google OAuth
- **Real-time cafe data**: From Google Places API
- **Interactive map**: Google Maps with markers
- **Search & Filter**: Real-time filtering by categories, rating, distance
- **Favorites**: Synced to Firestore database
- **Profile management**: Update settings with backend sync
- **Responsive UI**: Works on mobile and desktop

### 🔜 Future Enhancements

- Add reviews and ratings
- Social features (friends, check-ins)
- Custom collections
- Business dashboard analytics
- Push notifications
- Photo uploads

---

## 📚 Key Files Structure

```
src/
├── lib/
│   ├── firebase.ts              # Firebase initialization
│   ├── AppContext.tsx           # Global state with Firebase auth
│   └── types.ts                 # TypeScript types
├── services/
│   ├── authService.ts           # Authentication logic
│   ├── cafeService.ts           # Cafe data management
│   └── googleMapsService.ts     # Maps and Places API
├── components/
│   ├── AuthPage.tsx             # Login/Sign up with Firebase
│   ├── MapPageReal.tsx          # Real Google Maps
│   ├── ExplorePage.tsx          # Browse cafes
│   └── SettingsPage.tsx         # Profile management
└── App.tsx                      # Main app component
```

---

## 💰 Cost Estimates

### Firebase
- **Authentication**: Free (50k MAU included)
- **Firestore**: Free tier includes:
  - 1 GB storage
  - 50k reads/day
  - 20k writes/day

### Google Maps/Places
- **$200 free credit/month** covers:
  - ~28,500 map loads
  - ~5,000 Places API calls
- Most small apps stay within free tier

---

## 🔒 Security Best Practices

1. ✅ Never commit `.env` to git (already in `.gitignore`)
2. ✅ Restrict API keys in Google Cloud Console
3. ✅ Set up proper Firestore security rules
4. ✅ Use HTTPS in production
5. ⚠️ Change Firestore rules from "test mode" to production rules before launch

---

## 🎉 You're All Set!

Your cafe discovery app now has:
- ✅ Real authentication
- ✅ Live cafe data
- ✅ Interactive maps
- ✅ Backend database
- ✅ Full filtering system

**Need Help?** Check the Firebase and Google Maps documentation or open an issue in your repository.

---

## 📞 Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- [React Documentation](https://react.dev/)

Happy coding! ☕🗺️


