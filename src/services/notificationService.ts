import { initializeMessaging, getMessagingInstance, getToken, onMessage } from '../lib/firebase';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
  onClick?: () => void;
}

class NotificationService {
  private messaging: ReturnType<typeof getMessagingInstance> = null;
  private currentToken: string | null = null;
  private onMessageCallback: ((payload: NotificationPayload) => void) | null = null;

  async initialize(): Promise<boolean> {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
      }

      // Initialize messaging
      this.messaging = await initializeMessaging();
      if (!this.messaging) {
        console.log('Firebase Messaging is not supported in this browser');
        return false;
      }

      // Register service worker
      await this.registerServiceWorker();

      // Set up foreground message handler
      this.setupForegroundHandler();

      return true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      return false;
    }
  }

  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  async requestPermission(): Promise<'granted' | 'denied' | 'default'> {
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async getAndSaveToken(userId: string): Promise<string | null> {
    if (!this.messaging || !VAPID_KEY) {
      console.log('Messaging not initialized or VAPID key missing');
      return null;
    }

    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission not granted');
        return null;
      }

      // Get the registration
      const registration = await navigator.serviceWorker.ready;

      // Get FCM token
      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('FCM Token obtained:', token.substring(0, 20) + '...');
        this.currentToken = token;

        // Save token to user's document in Firestore
        await this.saveTokenToFirestore(userId, token);

        return token;
      } else {
        console.log('No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  private async saveTokenToFirestore(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Add token to array (avoiding duplicates)
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token),
          notificationsEnabled: true,
          lastTokenUpdate: new Date()
        });
      } else {
        // Create user document with token
        await setDoc(userRef, {
          fcmTokens: [token],
          notificationsEnabled: true,
          lastTokenUpdate: new Date()
        }, { merge: true });
      }
      console.log('FCM token saved to Firestore');
    } catch (error) {
      console.error('Error saving token to Firestore:', error);
    }
  }

  async removeToken(userId: string): Promise<void> {
    if (!this.currentToken) return;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayRemove(this.currentToken),
        notificationsEnabled: false
      });
      this.currentToken = null;
      console.log('FCM token removed');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  private setupForegroundHandler(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);

      const notificationPayload: NotificationPayload = {
        title: payload.notification?.title || 'Blend Cafe',
        body: payload.notification?.body || 'You have a new notification',
        icon: payload.notification?.icon || '/favicon.png',
        data: payload.data as Record<string, string>
      };

      // Call the callback if set
      if (this.onMessageCallback) {
        this.onMessageCallback(notificationPayload);
      }

      // Also show a browser notification for foreground messages
      this.showLocalNotification(notificationPayload);
    });
  }

  onForegroundMessage(callback: (payload: NotificationPayload) => void): void {
    this.onMessageCallback = callback;
  }

  private showLocalNotification(payload: NotificationPayload): void {
    if (Notification.permission !== 'granted') return;

    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/favicon.png',
      tag: payload.data?.type || 'general',
      data: payload.data
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Handle navigation based on notification type
      if (payload.onClick) {
        payload.onClick();
      } else if (payload.data?.type === 'message') {
        // Navigate to messages page
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'messages', conversationId: payload.data.conversationId } }));
      } else if (payload.data?.type === 'friend_request') {
        // Navigate to social page requests tab
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'social', tab: 'requests' } }));
      }
    };
  }

  // Check if notifications are enabled
  isEnabled(): boolean {
    return Notification.permission === 'granted' && !!this.currentToken;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

