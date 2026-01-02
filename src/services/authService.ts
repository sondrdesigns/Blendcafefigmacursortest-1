import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../lib/types';

const googleProvider = new GoogleAuthProvider();
const DEFAULT_AVATAR = '/default-avatar.svg';

export class AuthService {
  /**
   * Sign up a new user with email and password
   */
  static async signUp(email: string, password: string, username: string): Promise<User> {
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, {
        displayName: username,
        photoURL: DEFAULT_AVATAR
      });

      // Create user document in Firestore
      const newUser: User = {
        id: firebaseUser.uid,
        username: username,
        email: email,
        avatar: DEFAULT_AVATAR,
        accountType: 'consumer',
        visibility: 'public',
        language: 'en',
        reviewCount: 0,
        friendCount: 0
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

      return newUser;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      return userDoc.data() as User;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  /**
   * Sign in with Google
   */
  static async signInWithGoogle(): Promise<{ user: User; isNewUser: boolean }> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Check if user already exists
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (userDoc.exists()) {
        return {
          user: userDoc.data() as User,
          isNewUser: false
        };
      }

      // Create new user document
      const newUser: User = {
        id: firebaseUser.uid,
        username: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || DEFAULT_AVATAR,
        accountType: 'consumer',
        visibility: 'public',
        language: 'en',
        reviewCount: 0,
        friendCount: 0
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

      return {
        user: newUser,
        isNewUser: true
      };
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  /**
   * Get current user data
   */
  static async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      return null;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }
}

