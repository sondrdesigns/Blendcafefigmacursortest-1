import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language, User, Cafe } from './types';
import { currentUser, mockCafes } from './mockData';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [user, setUser] = useState<User>(currentUser);
  const [favorites, setFavorites] = useState<string[]>(['1', '2']);
  const [wantToTry, setWantToTry] = useState<string[]>(['3', '5']);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const friendRequestCount = 2;

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
