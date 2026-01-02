import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, User, Cafe, Friend } from './types';
import { mockFriends } from './mockData';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthService } from '../services/authService';
import { CafeService } from '../services/cafeService';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  favorites: string[];
  addFavorite: (cafeId: string) => void;
  removeFavorite: (cafeId: string) => void;
  wantToTry: string[];
  addWantToTry: (cafeId: string) => void;
  removeWantToTry: (cafeId: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  selectedCafe: Cafe | null;
  setSelectedCafe: (cafe: Cafe | null) => void;
  friendRequestCount: number;
  navigationHistory: string[];
  addToHistory: (page: string) => void;
  goBack: () => string | null;
  friends: Friend[];
  acceptFriendRequest: (friendId: string) => void;
  declineFriendRequest: (friendId: string) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [wantToTry, setWantToTry] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['home']);
  const friendRequestCount = 2;
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await AuthService.getCurrentUser();
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
            setLanguage(userData.language);
            
            // Load user's favorites and want to try lists
            const userFavorites = await CafeService.getFavorites(firebaseUser.uid);
            const userWantToTry = await CafeService.getWantToTry(firebaseUser.uid);
            setFavorites(userFavorites);
            setWantToTry(userWantToTry);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setFavorites([]);
        setWantToTry([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addFavorite = async (cafeId: string) => {
    if (!user || favorites.includes(cafeId)) return;
    
    try {
      await CafeService.addToFavorites(user.id, cafeId);
      setFavorites([...favorites, cafeId]);
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  };

  const removeFavorite = async (cafeId: string) => {
    if (!user) return;
    
    try {
      await CafeService.removeFromFavorites(user.id, cafeId);
      setFavorites(favorites.filter(id => id !== cafeId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const addWantToTry = async (cafeId: string) => {
    if (!user || wantToTry.includes(cafeId)) return;
    
    try {
      await CafeService.addToWantToTry(user.id, cafeId);
      setWantToTry([...wantToTry, cafeId]);
    } catch (error) {
      console.error('Error adding to want to try:', error);
    }
  };

  const removeWantToTry = async (cafeId: string) => {
    if (!user) return;
    
    try {
      await CafeService.removeFromWantToTry(user.id, cafeId);
      setWantToTry(wantToTry.filter(id => id !== cafeId));
    } catch (error) {
      console.error('Error removing from want to try:', error);
    }
  };

  const addToHistory = (page: string) => {
    setNavigationHistory(prev => [...prev, page]);
  };

  const goBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Remove current page
      const previousPage = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      return previousPage;
    }
    return null;
  };

  const acceptFriendRequest = (friendId: string) => {
    setFriends(prevFriends => prevFriends.map(friend => 
      friend.id === friendId ? { ...friend, status: 'accepted' } : friend
    ));
  };

  const declineFriendRequest = (friendId: string) => {
    setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId));
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        user,
        setUser,
        favorites,
        addFavorite,
        removeFavorite,
        wantToTry,
        addWantToTry,
        removeWantToTry,
        isAuthenticated,
        setIsAuthenticated,
        selectedCafe,
        setSelectedCafe,
        friendRequestCount,
        navigationHistory,
        addToHistory,
        goBack,
        friends,
        acceptFriendRequest,
        declineFriendRequest,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}