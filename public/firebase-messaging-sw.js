// Firebase Messaging Service Worker
// This handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config - these are public identifiers (not secrets)
// Security is handled by Firestore rules and authentication
const firebaseConfig = {
  apiKey: "AIzaSyChp8CBcxlkzb9NO2UBeIoAQkYh-fSMp1Q",
  authDomain: "blend-a1644.firebaseapp.com",
  projectId: "blend-a1644",
  storageBucket: "blend-a1644.firebasestorage.app",
  messagingSenderId: "549377893928",
  appId: "1:549377893928:web:08aa41ea3bc3605675371d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Blend Cafe';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Determine which page to open based on notification type
  const data = event.notification.data || {};
  let targetUrl = '/';

  if (data.type === 'message') {
    targetUrl = '/?page=messages';
    if (data.conversationId) {
      targetUrl += `&conversation=${data.conversationId}`;
    }
  } else if (data.type === 'friend_request') {
    targetUrl = '/?page=social&tab=requests';
  } else if (data.type === 'friend_accepted') {
    targetUrl = '/?page=social&tab=friends';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', data });
          return client.focus();
        }
      }
      // Open a new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

