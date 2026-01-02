
# ☕ Blend - Cafe Discovery App

Discover your perfect café vibe with real-time data, interactive maps, and smart filtering.

![Built with React](https://img.shields.io/badge/React-18.3-blue)
![Firebase](https://img.shields.io/badge/Firebase-Enabled-orange)
![Google Maps](https://img.shields.io/badge/Google%20Maps-Integrated-green)

## 🌟 Features

- 🔐 **Authentication** - Email/Password + Google OAuth
- 🗺️ **Interactive Maps** - Real Google Maps with cafe markers
- ☕ **Real Cafe Data** - Live data from Google Places API
- 🔍 **Smart Filtering** - Search by categories, rating, distance
- ❤️ **Favorites** - Save cafes to your personal collection
- 👤 **User Profiles** - Manage settings with backend sync
- 📱 **Responsive** - Works beautifully on mobile and desktop

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Google Cloud account (for Maps/Places API)

### Installation

1. **Clone and install dependencies:**

```bash
cd ~/Desktop/Blendcafefigmacursortest
npm install
```

2. **Set up Firebase and Google Maps:**

See [QUICKSTART.md](./QUICKSTART.md) for a 5-minute setup guide or [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

3. **Configure environment variables:**

Copy your Firebase and Google Maps credentials to `.env`:

```env
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... (see .env.example for all fields)

VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

4. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📖 Documentation

- **[Quick Start Guide](./QUICKSTART.md)** - Get running in 5 minutes
- **[Complete Setup Guide](./SETUP_GUIDE.md)** - Detailed setup instructions with troubleshooting

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI, Framer Motion
- **Backend**: Firebase (Auth + Firestore)
- **Maps**: Google Maps JavaScript API
- **Data**: Google Places API

## 📁 Project Structure

```
src/
├── components/        # React components
│   ├── AuthPage.tsx      # Authentication
│   ├── MapPageReal.tsx   # Interactive map
│   ├── ExplorePage.tsx   # Browse cafes
│   └── ...
├── services/         # API services
│   ├── authService.ts         # Firebase auth
│   ├── cafeService.ts         # Cafe data management
│   └── googleMapsService.ts   # Maps & Places API
├── lib/             # Core logic
│   ├── firebase.ts       # Firebase config
│   ├── AppContext.tsx    # Global state
│   └── types.ts          # TypeScript definitions
└── App.tsx          # Main application
```

## 🔑 Key Features Implementation

### Authentication
- Firebase Auth with email/password and Google OAuth
- Protected routes and user sessions
- Profile management with Firestore sync

### Maps Integration
- Real-time cafe markers on Google Maps
- User location detection
- Distance calculation and radius filtering

### Cafe Data
- Live data from Google Places API
- Caching in Firestore for performance
- Advanced filtering (categories, rating, distance, open now)

### User Experience
- Smooth animations with Framer Motion
- Responsive design for all screen sizes
- Toast notifications for user feedback

## 💰 Cost Information

This app uses Firebase and Google Cloud services with generous free tiers:

- **Firebase**: 50k MAU free, 1GB storage, 50k reads/day
- **Google Maps/Places**: $200 free credit/month
- Most development and small-scale apps stay within free tier

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🐛 Troubleshooting

**Issue**: Map not loading
- Verify Google Maps API key is correct
- Enable Maps JavaScript API and Places API
- Ensure billing is enabled (required for Places API)

**Issue**: Authentication errors
- Check Firebase config in `.env`
- Enable Email/Password and Google sign-in in Firebase Console

**Issue**: No cafes showing
- Verify Places API is enabled
- Check billing is enabled in Google Cloud
- Check browser console for detailed errors

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for more troubleshooting tips.

## 📝 License

This project is for educational and development purposes.

## 🤝 Contributing

This is currently a demo/template project. Feel free to fork and customize for your needs!

## 📧 Support

For issues and questions, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Maps API Docs](https://developers.google.com/maps)
- Browser console for error messages

---

**Original Design**: Based on Figma design at https://www.figma.com/design/LrNR2uTN1fZz81dMjs5Bw3/

Made with ☕ and React
  