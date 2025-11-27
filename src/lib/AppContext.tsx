import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language, User, Cafe, Friend } from './types';
import { currentUser, mockCafes, mockFriends } from './mockData';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  user: User;
  setUser: (user: User) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [user, setUser] = useState<User>(currentUser);
  const [favorites, setFavorites] = useState<string[]>(['1', '2']);
  const [wantToTry, setWantToTry] = useState<string[]>(['3', '5']);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['home']);
  const friendRequestCount = 2;
  const [friends, setFriends] = useState<Friend[]>(mockFriends);

  const addFavorite = (cafeId: string) => {
    if (!favorites.includes(cafeId)) {
      setFavorites([...favorites, cafeId]);
    }
  };

  const removeFavorite = (cafeId: string) => {
    setFavorites(favorites.filter(id => id !== cafeId));
  };

  const addWantToTry = (cafeId: string) => {
    if (!wantToTry.includes(cafeId)) {
      setWantToTry([...wantToTry, cafeId]);
    }
  };

  const removeWantToTry = (cafeId: string) => {
    setWantToTry(wantToTry.filter(id => id !== cafeId));
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