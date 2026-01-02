# 🎯 Setup Checklist

Use this checklist to track your setup progress!

## ☑️ Pre-Setup

- [ ] Node.js and npm installed
- [ ] Google account ready
- [ ] Text editor open (Cursor/VS Code)

---

## 🔥 Firebase Setup

### Create Project
- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Click "Add project"
- [ ] Name it (e.g., "blend-cafe-app")
- [ ] Disable Analytics (optional)
- [ ] Click "Create project"

### Enable Authentication
- [ ] Open "Authentication" in sidebar
- [ ] Click "Get started"
- [ ] Enable "Email/Password"
- [ ] Enable "Google" sign-in
- [ ] Add support email for Google sign-in

### Create Firestore
- [ ] Open "Firestore Database" in sidebar
- [ ] Click "Create database"
- [ ] Select "Start in test mode"
- [ ] Choose location (closest to you)
- [ ] Click "Enable"

### Copy Firebase Config
- [ ] Click gear icon ⚙️ → "Project settings"
- [ ] Scroll to "Your apps"
- [ ] Click web icon `</>`
- [ ] Register app (name: "Blend Cafe Web")
- [ ] Copy all config values:
  - [ ] apiKey
  - [ ] authDomain
  - [ ] projectId
  - [ ] storageBucket
  - [ ] messagingSenderId
  - [ ] appId

---

## 🗺️ Google Maps Setup

### Create/Select Project
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create new project OR select existing Firebase project

### Enable APIs
- [ ] Navigate to "APIs & Services" → "Library"
- [ ] Search "Maps JavaScript API" → Click → Enable
- [ ] Search "Places API" → Click → Enable
- [ ] (Optional) Search "Geocoding API" → Click → Enable

### Create API Key
- [ ] Go to "APIs & Services" → "Credentials"
- [ ] Click "Create Credentials" → "API Key"
- [ ] Copy the API key
- [ ] Click "Restrict Key" (recommended)
- [ ] Under "Application restrictions":
  - [ ] Choose "HTTP referrers"
  - [ ] Add `http://localhost:*`
  - [ ] Add your domain (if deploying)
- [ ] Under "API restrictions":
  - [ ] Choose "Restrict key"
  - [ ] Select: Maps JavaScript API
  - [ ] Select: Places API
  - [ ] Select: Geocoding API (if enabled)
- [ ] Click "Save"

### Enable Billing ⚠️
- [ ] Go to "Billing" in menu
- [ ] Click "Link a billing account"
- [ ] Add payment method
- [ ] Note: $200 free credit/month included

---

## ⚙️ Configure Your App

### Update Environment Variables
- [ ] Open project in code editor
- [ ] Open `.env` file
- [ ] Replace `VITE_FIREBASE_API_KEY` with your Firebase API key
- [ ] Replace `VITE_FIREBASE_AUTH_DOMAIN` with your auth domain
- [ ] Replace `VITE_FIREBASE_PROJECT_ID` with your project ID
- [ ] Replace `VITE_FIREBASE_STORAGE_BUCKET` with your storage bucket
- [ ] Replace `VITE_FIREBASE_MESSAGING_SENDER_ID` with sender ID
- [ ] Replace `VITE_FIREBASE_APP_ID` with app ID
- [ ] Replace `VITE_GOOGLE_MAPS_API_KEY` with your Google Maps key
- [ ] (Optional) Update default location coordinates

### Verify .gitignore
- [ ] Open `.gitignore`
- [ ] Confirm `.env` is listed (should already be there)

---

## 🚀 Run the App

### Install & Start
- [ ] Open terminal
- [ ] Navigate to project: `cd ~/Desktop/Blendcafefigmacursortest`
- [ ] Install dependencies: `npm install` (if not done)
- [ ] Start dev server: `npm run dev`
- [ ] Note the URL (usually http://localhost:5173)

### Open in Browser
- [ ] Open the URL in browser
- [ ] Allow location permission when prompted

---

## 🧪 Test Everything

### Test Authentication
- [ ] Click "Sign Up" tab
- [ ] Enter username, email, password
- [ ] Click "Create Account"
- [ ] Should redirect to home page
- [ ] Sign out (Settings → Logout)
- [ ] Click "Login" tab
- [ ] Sign in with same credentials
- [ ] Try "Sign in with Google"

### Verify in Firebase Console
- [ ] Go to Firebase Console → Authentication
- [ ] See your user listed
- [ ] Go to Firestore Database
- [ ] See "users" collection
- [ ] See your user document

### Test Map
- [ ] Navigate to Map page (bottom nav)
- [ ] Map should load with Google branding
- [ ] See your location (blue dot)
- [ ] See cafe markers (orange/gray with ☕)
- [ ] Click a marker
- [ ] Card should appear at bottom
- [ ] Click "View Details"

### Test Explore Page
- [ ] Navigate to Explore page
- [ ] Cafes should load (wait a moment)
- [ ] Try search box
- [ ] Try category filters
- [ ] Try "Open Now" filter
- [ ] Try adding to favorites (heart icon)

### Test Favorites
- [ ] Add a cafe to favorites
- [ ] Go to Collections page
- [ ] See your favorited cafe
- [ ] Check Firestore:
  - [ ] Go to Firebase Console → Firestore
  - [ ] Open users → [your-id]
  - [ ] See "favorites" array

### Test Profile Settings
- [ ] Go to Settings page
- [ ] Change username
- [ ] Click "Save Changes"
- [ ] Should see success message
- [ ] Refresh page
- [ ] Username should persist
- [ ] Check Firestore to verify update

---

## ✅ Verification Checklist

### Firebase Working
- [ ] Can sign up with email/password
- [ ] Can sign in with email/password
- [ ] Can sign in with Google
- [ ] User appears in Firebase Console
- [ ] User data saved in Firestore
- [ ] Favorites saved to Firestore

### Google Maps Working
- [ ] Map loads (shows Google logo)
- [ ] Shows your location
- [ ] Shows cafe markers
- [ ] Can click markers
- [ ] Cafe details appear

### Google Places Working
- [ ] Real cafes load on map
- [ ] Cafes show in Explore page
- [ ] Cafe names are real (not mock data)
- [ ] Ratings and reviews are real
- [ ] Photos load

### Filtering Working
- [ ] Can filter by categories
- [ ] Can filter by distance
- [ ] Can filter by "Open Now"
- [ ] Can search by name
- [ ] Results update immediately

---

## 🐛 If Something's Not Working

### Check Browser Console
- [ ] Open Developer Tools (F12)
- [ ] Look for red errors
- [ ] Note any error messages

### Common Issues

**"Firebase API key not configured"**
- [ ] Check `.env` file has correct values
- [ ] Restart dev server (`Ctrl+C` then `npm run dev`)

**"Google Maps API key not configured"**
- [ ] Verify API key in `.env`
- [ ] Check APIs are enabled in Google Cloud
- [ ] Verify billing is enabled
- [ ] Restart dev server

**No cafes showing**
- [ ] Verify Places API is enabled
- [ ] Check billing is enabled
- [ ] Look at browser console for errors
- [ ] Try a different location

**Authentication fails**
- [ ] Verify Firebase config in `.env`
- [ ] Check auth methods are enabled in Firebase
- [ ] Clear browser cache
- [ ] Try incognito/private mode

---

## 📋 Post-Setup Tasks

### Optional but Recommended
- [ ] Update Firestore security rules (see SETUP_GUIDE.md)
- [ ] Set up API key restrictions properly
- [ ] Add your production domain to authorized domains
- [ ] Set up Firebase hosting (if deploying)
- [ ] Enable error reporting

### Before Going Live
- [ ] Change Firestore from "test mode" to production rules
- [ ] Restrict API keys to specific domains
- [ ] Set up proper monitoring
- [ ] Review Firebase usage limits
- [ ] Set up billing alerts

---

## 🎉 You're Done!

If all checks are ✅, you have:
- ✅ Working authentication
- ✅ Real-time cafe data
- ✅ Interactive maps
- ✅ Database integration
- ✅ Filtering system
- ✅ Profile management

**Ready to discover cafes!** ☕🗺️

---

## 📚 Next Steps

- Customize UI colors and branding
- Add more features (reviews, social, etc.)
- Deploy to production
- Share with friends!

## 🆘 Need Help?

1. See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed troubleshooting
2. See [QUICKSTART.md](./QUICKSTART.md) for quick reference
3. Check browser console for errors
4. Review Firebase/Google Cloud console for issues


