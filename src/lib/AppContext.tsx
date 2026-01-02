import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, User, Cafe, Friend } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthService } from '../services/authService';
import { CafeService } from '../services/cafeService';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

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
  sendFriendRequest: (userId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<Friend[]>;
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
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  
  const friendRequestCount = friends.filter(f => f.status === 'request').length;

  // Load friends from Firestore
  const loadFriends = async (userId: string) => {
    try {
      const friendsRef = collection(db, 'friendships');
      const q = query(friendsRef, where('users', 'array-contains', userId));
      const snapshot = await getDocs(q);
      
      const loadedFriends: Friend[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const friendUserId = data.users.find((id: string) => id !== userId);
        if (friendUserId) {
          const friendDoc = await getDoc(doc(db, 'users', friendUserId));
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            loadedFriends.push({
              id: friendUserId,
              username: friendData.username || 'User',
              avatar: friendData.avatar || '/default-avatar.svg',
              status: data.status === 'accepted' ? 'friends' : 
                      data.requestedBy === userId ? 'pending' : 'request',
              mutualFriends: 0,
              reviewCount: friendData.reviewCount || 0,
            });
          }
        }
      }
      setFriends(loadedFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

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
            
            // Load friends from Firestore
            await loadFriends(firebaseUser.uid);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setFavorites([]);
        setWantToTry([]);
        setFriends([]);
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

  // Search for users by username
  const searchUsers = async (searchQuery: string): Promise<Friend[]> => {
    if (!searchQuery.trim() || !user) return [];
    
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const results: Friend[] = [];
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const userId = docSnap.id;
        
        // Don't include self or existing friends
        if (userId === user.id) return;
        if (friends.some(f => f.id === userId)) return;
        
        // Match by username (case-insensitive)
        if (data.username?.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({
            id: userId,
            username: data.username || 'User',
            avatar: data.avatar || '/default-avatar.svg',
            status: 'friends', // Will be shown as "Add Friend" in UI
            mutualFriends: 0,
            reviewCount: data.reviewCount || 0,
          });
        }
      });
      
      return results.slice(0, 10); // Limit to 10 results
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // Send friend request
  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;
    
    try {
      const friendshipId = [user.id, friendId].sort().join('_');
      await setDoc(doc(db, 'friendships', friendshipId), {
        users: [user.id, friendId],
        status: 'pending',
        requestedBy: user.id,
        createdAt: new Date(),
      });
      
      // Add to local state as pending
      const friendDoc = await getDoc(doc(db, 'users', friendId));
      if (friendDoc.exists()) {
        const friendData = friendDoc.data();
        setFriends(prev => [...prev, {
          id: friendId,
          username: friendData.username || 'User',
          avatar: friendData.avatar || '/default-avatar.svg',
          status: 'pending',
          mutualFriends: 0,
          reviewCount: friendData.reviewCount || 0,
        }]);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const acceptFriendRequest = async (friendId: string) => {
    if (!user) return;
    
    try {
      const friendshipId = [user.id, friendId].sort().join('_');
      await setDoc(doc(db, 'friendships', friendshipId), {
        users: [user.id, friendId],
        status: 'accepted',
        acceptedAt: new Date(),
      }, { merge: true });
      
      setFriends(prevFriends => prevFriends.map(friend => 
        friend.id === friendId ? { ...friend, status: 'friends' } : friend
      ));
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const declineFriendRequest = async (friendId: string) => {
    if (!user) return;
    
    try {
      const friendshipId = [user.id, friendId].sort().join('_');
      await deleteDoc(doc(db, 'friendships', friendshipId));
      
      setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId));
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
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
        sendFriendRequest,
        searchUsers,
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