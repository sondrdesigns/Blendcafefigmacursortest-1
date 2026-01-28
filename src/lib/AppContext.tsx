import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, User, Cafe, Friend } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthService } from '../services/authService';
import { CafeService } from '../services/cafeService';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';

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
  unreadMessageCount: number;
  navigationHistory: string[];
  addToHistory: (page: string) => void;
  goBack: () => string | null;
  friends: Friend[];
  acceptFriendRequest: (friendId: string) => void;
  declineFriendRequest: (friendId: string) => void;
  sendFriendRequest: (userId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<Friend[]>;
  loading: boolean;
  exploreSearchQuery: string;
  setExploreSearchQuery: (query: string) => void;
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
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [exploreSearchQuery, setExploreSearchQuery] = useState('');
  
  const friendRequestCount = friends.filter(f => f.status === 'request').length;

  // Set up real-time listener for friendships
  useEffect(() => {
    if (!user?.id) {
      setFriends([]);
      return;
    }

    console.log('👥 Setting up friendship listener for user:', user.id);

    const friendsRef = collection(db, 'friendships');
    const q = query(friendsRef, where('users', 'array-contains', user.id));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log(`📬 Received ${snapshot.docs.length} friendship documents`);
      
      const loadedFriends: Friend[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const friendUserId = data.users.find((id: string) => id !== user.id);
        
        if (friendUserId) {
          try {
            const friendDoc = await getDoc(doc(db, 'users', friendUserId));
            if (friendDoc.exists()) {
              const friendData = friendDoc.data();
              
              // Determine the status from the current user's perspective
              let status: 'friends' | 'pending' | 'request';
              if (data.status === 'accepted') {
                status = 'friends';
              } else if (data.requestedBy === user.id) {
                // Current user sent the request - it's pending from our view
                status = 'pending';
              } else {
                // Someone else sent the request - it's an incoming request
                status = 'request';
              }
              
              console.log(`👤 Friend: ${friendData.username}, Status: ${status} (requestedBy: ${data.requestedBy}, dbStatus: ${data.status})`);
              
              loadedFriends.push({
                id: friendUserId,
                username: friendData.username || friendData.displayName || friendData.name || friendData.email?.split('@')[0] || 'User',
                avatar: friendData.avatar || friendData.photoURL || '/default-avatar.svg',
                status: status,
                mutualFriends: 0,
                reviewCount: friendData.reviewCount || 0,
              });
            }
          } catch (error) {
            console.error('Error loading friend data:', error);
          }
        }
      }
      
      console.log(`✅ Loaded ${loadedFriends.length} friends/requests:`, 
        loadedFriends.map(f => `${f.username}(${f.status})`).join(', ')
      );
      
      setFriends(loadedFriends);
    }, (error) => {
      console.error('❌ Error listening to friendships:', error);
    });

    return () => {
      console.log('🔌 Cleaning up friendship listener');
      unsubscribe();
    };
  }, [user?.id]);

  // Set up real-time listener for unread messages
  useEffect(() => {
    if (!user?.id) {
      setUnreadMessageCount(0);
      return;
    }

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef, 
      where('receiverId', '==', user.id),
      where('read', '==', false)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadMessageCount(snapshot.docs.length);
    }, (error) => {
      console.error('Error listening to unread messages:', error);
    });

    return () => unsubscribe();
  }, [user?.id]);

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
            // Friends are loaded via real-time listener in separate useEffect
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
      
      // Get IDs of users we already have relationships with
      const existingRelationshipIds = new Set(friends.map(f => f.id));
      
      const results: Friend[] = [];
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const userId = docSnap.id;
        
        // Don't include self
        if (userId === user.id) return;
        
        // Don't include users we already have a relationship with (friends, pending, request)
        if (existingRelationshipIds.has(userId)) return;
        
        // Match by username (case-insensitive)
        if (data.username?.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({
            id: userId,
            username: data.username || 'User',
            avatar: data.avatar || '/default-avatar.svg',
            status: 'none' as any, // No relationship yet - will show "Add Friend"
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
    if (!user) {
      console.error('Cannot send friend request: No user logged in');
      throw new Error('You must be logged in to send friend requests');
    }
    
    try {
      console.log(`📤 Sending friend request from ${user.id} to ${friendId}`);
      
      // Check if friendship already exists
      const friendshipId = [user.id, friendId].sort().join('_');
      
      try {
        const existingFriendship = await getDoc(doc(db, 'friendships', friendshipId));
        if (existingFriendship.exists()) {
          console.log('⚠️ Friendship already exists:', existingFriendship.data());
          throw new Error('Friend request already exists');
        }
      } catch (readError: any) {
        // If it's a permission error on read, that's okay - we'll try to create anyway
        if (!readError.message?.includes('already exists')) {
          console.log('Could not check existing friendship, attempting to create...');
        } else {
          throw readError;
        }
      }
      
      // Create friendship document
      console.log('Creating friendship document:', friendshipId);
      await setDoc(doc(db, 'friendships', friendshipId), {
        users: [user.id, friendId],
        status: 'pending',
        requestedBy: user.id,
        createdAt: new Date(),
      });
      
      console.log('✅ Friend request sent successfully');
      
      // Optimistically add to local state as pending
      // The real-time listener will also update this, but this makes the UI more responsive
      const friendDoc = await getDoc(doc(db, 'users', friendId));
      if (friendDoc.exists()) {
        const friendData = friendDoc.data();
        const newFriend: Friend = {
          id: friendId,
          username: friendData.username || 'User',
          avatar: friendData.avatar || '/default-avatar.svg',
          status: 'pending',
          mutualFriends: 0,
          reviewCount: friendData.reviewCount || 0,
        };
        
        // Only add if not already in friends list
        setFriends(prev => {
          if (prev.some(f => f.id === friendId)) {
            return prev;
          }
          return [...prev, newFriend];
        });
      }
    } catch (error: any) {
      console.error('❌ Error sending friend request:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide more helpful error messages
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check Firestore security rules.');
      } else if (error.code === 'unavailable') {
        throw new Error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  };

  const acceptFriendRequest = async (friendId: string) => {
    if (!user) {
      console.error('Cannot accept friend request: No user logged in');
      return;
    }
    
    try {
      console.log(`✅ Accepting friend request from ${friendId}`);
      
      const friendshipId = [user.id, friendId].sort().join('_');
      await setDoc(doc(db, 'friendships', friendshipId), {
        users: [user.id, friendId],
        status: 'accepted',
        acceptedAt: new Date(),
      }, { merge: true });
      
      console.log('📝 Updated friendship document to accepted');
      
      // Update friend counts for both users
      const userRef = doc(db, 'users', user.id);
      const friendRef = doc(db, 'users', friendId);
      
      const [userDoc, friendDoc] = await Promise.all([
        getDoc(userRef),
        getDoc(friendRef)
      ]);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, { 
          friendCount: (userDoc.data().friendCount || 0) + 1 
        });
      }
      if (friendDoc.exists()) {
        await updateDoc(friendRef, { 
          friendCount: (friendDoc.data().friendCount || 0) + 1 
        });
      }
      
      console.log('✅ Friend request accepted, friend counts updated');
      // The real-time listener will update the friends list automatically
    } catch (error) {
      console.error('❌ Error accepting friend request:', error);
      throw error;
    }
  };

  const declineFriendRequest = async (friendId: string) => {
    if (!user) {
      console.error('Cannot decline friend request: No user logged in');
      return;
    }
    
    try {
      console.log(`❌ Declining friend request from ${friendId}`);
      
      const friendshipId = [user.id, friendId].sort().join('_');
      await deleteDoc(doc(db, 'friendships', friendshipId));
      
      console.log('🗑️ Deleted friendship document');
      
      // Optimistically remove from local state
      setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId));
    } catch (error) {
      console.error('❌ Error declining friend request:', error);
      throw error;
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
        unreadMessageCount,
        navigationHistory,
        addToHistory,
        goBack,
        friends,
        acceptFriendRequest,
        declineFriendRequest,
        sendFriendRequest,
        searchUsers,
        loading,
        exploreSearchQuery,
        setExploreSearchQuery,
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