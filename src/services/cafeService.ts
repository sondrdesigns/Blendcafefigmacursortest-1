import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Cafe, Review } from '../lib/types';

export class CafeService {
  /**
   * Add a cafe to user's favorites
   */
  static async addToFavorites(userId: string, cafeId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        favorites: arrayUnion(cafeId)
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  /**
   * Remove a cafe from user's favorites
   */
  static async removeFromFavorites(userId: string, cafeId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        favorites: arrayRemove(cafeId)
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  /**
   * Add a cafe to user's "want to try" list
   */
  static async addToWantToTry(userId: string, cafeId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        wantToTry: arrayUnion(cafeId)
      });
    } catch (error) {
      console.error('Error adding to want to try:', error);
      throw error;
    }
  }

  /**
   * Remove a cafe from user's "want to try" list
   */
  static async removeFromWantToTry(userId: string, cafeId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        wantToTry: arrayRemove(cafeId)
      });
    } catch (error) {
      console.error('Error removing from want to try:', error);
      throw error;
    }
  }

  /**
   * Get user's favorites
   */
  static async getFavorites(userId: string): Promise<string[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().favorites || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  /**
   * Get user's want to try list
   */
  static async getWantToTry(userId: string): Promise<string[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().wantToTry || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting want to try:', error);
      return [];
    }
  }

  /**
   * Save a cafe to Firestore (for caching Google Places results)
   */
  static async saveCafe(cafe: Cafe): Promise<void> {
    try {
      await setDoc(doc(db, 'cafes', cafe.id), {
        ...cafe,
        lastUpdated: Timestamp.now()
      });
    } catch (error) {
      console.error('Error saving cafe:', error);
      throw error;
    }
  }

  /**
   * Get a cafe by ID
   */
  static async getCafeById(cafeId: string): Promise<Cafe | null> {
    try {
      const cafeDoc = await getDoc(doc(db, 'cafes', cafeId));
      if (cafeDoc.exists()) {
        return cafeDoc.data() as Cafe;
      }
      return null;
    } catch (error) {
      console.error('Error getting cafe:', error);
      return null;
    }
  }

  /**
   * Add a review for a cafe
   */
  static async addReview(review: Review): Promise<void> {
    try {
      const reviewRef = doc(collection(db, 'reviews'));
      await setDoc(reviewRef, {
        ...review,
        id: reviewRef.id,
        createdAt: Timestamp.now()
      });

      // Update user's review count
      const userRef = doc(db, 'users', review.userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentCount = userDoc.data().reviewCount || 0;
        await updateDoc(userRef, {
          reviewCount: currentCount + 1
        });
      }
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  }

  /**
   * Get reviews for a cafe
   */
  static async getReviewsForCafe(cafeId: string, limitCount: number = 10): Promise<Review[]> {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('cafeId', '==', cafeId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(reviewsQuery);
      return snapshot.docs.map(doc => doc.data() as Review);
    } catch (error) {
      console.error('Error getting reviews:', error);
      return [];
    }
  }

  /**
   * Search cafes with filters
   */
  static filterCafes(
    cafes: Cafe[],
    filters: {
      categories?: string[];
      priceRange?: number[];
      minRating?: number;
      maxDistance?: number;
      openNow?: boolean;
    }
  ): Cafe[] {
    let filtered = [...cafes];

    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(cafe =>
        filters.categories!.some(category =>
          cafe.categories.includes(category)
        )
      );
    }

    // Filter by price range
    if (filters.priceRange && filters.priceRange.length > 0) {
      filtered = filtered.filter(cafe =>
        filters.priceRange!.includes(cafe.priceRange)
      );
    }

    // Filter by minimum rating
    if (filters.minRating !== undefined) {
      filtered = filtered.filter(cafe => cafe.rating >= filters.minRating!);
    }

    // Filter by maximum distance
    if (filters.maxDistance !== undefined) {
      filtered = filtered.filter(cafe => cafe.distance <= filters.maxDistance!);
    }

    // Filter by open now
    if (filters.openNow) {
      filtered = filtered.filter(cafe => cafe.status === 'open');
    }

    return filtered;
  }

  /**
   * Sort cafes
   */
  static sortCafes(
    cafes: Cafe[],
    sortBy: 'distance' | 'rating' | 'reviewCount' | 'name'
  ): Cafe[] {
    const sorted = [...cafes];

    switch (sortBy) {
      case 'distance':
        sorted.sort((a, b) => a.distance - b.distance);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviewCount':
        sorted.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return sorted;
  }
}


