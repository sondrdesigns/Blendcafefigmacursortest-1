import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

interface UserData {
  username?: string;
  displayName?: string;
  name?: string;
  fcmTokens?: string[];
  notificationsEnabled?: boolean;
}

interface MessageData {
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: admin.firestore.Timestamp;
  read: boolean;
}

interface FriendshipData {
  users: string[];
  status: string;
  requestedBy: string;
  createdAt: admin.firestore.Timestamp;
}

// Send notification to a user
async function sendNotificationToUser(
  userId: string, 
  title: string, 
  body: string, 
  data: Record<string, string>
): Promise<void> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data() as UserData | undefined;

    if (!userData?.fcmTokens || userData.fcmTokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return;
    }

    if (!userData.notificationsEnabled) {
      console.log(`Notifications disabled for user ${userId}`);
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
      },
      data,
      tokens: userData.fcmTokens,
      webpush: {
        notification: {
          icon: '/favicon.png',
          badge: '/favicon.png',
          vibrate: [100, 50, 100],
        },
        fcmOptions: {
          link: '/',
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log(`Successfully sent ${response.successCount} notifications to user ${userId}`);

    // Remove invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && userData.fcmTokens) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(userData.fcmTokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await db.collection('users').doc(userId).update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
        });
        console.log(`Removed ${invalidTokens.length} invalid tokens for user ${userId}`);
      }
    }
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
  }
}

// Trigger notification when a new message is created
export const onNewMessage = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data() as MessageData;
    const { senderId, receiverId, text } = messageData;

    console.log(`New message from ${senderId} to ${receiverId}`);

    // Don't notify if sender and receiver are the same
    if (senderId === receiverId) {
      return null;
    }

    // Get sender's info for the notification
    const senderDoc = await db.collection('users').doc(senderId).get();
    const senderData = senderDoc.data() as UserData | undefined;
    const senderName = senderData?.username || senderData?.displayName || 'Someone';

    // Send notification to receiver
    await sendNotificationToUser(
      receiverId,
      `New message from ${senderName}`,
      text.length > 100 ? text.substring(0, 100) + '...' : text,
      {
        type: 'message',
        senderId,
        messageId: context.params.messageId,
        conversationId: [senderId, receiverId].sort().join('_'),
      }
    );

    return null;
  });

// Trigger notification when a new friend request is created
export const onNewFriendRequest = functions.firestore
  .document('friendships/{friendshipId}')
  .onCreate(async (snapshot) => {
    const friendshipData = snapshot.data() as FriendshipData;
    const { users, requestedBy, status } = friendshipData;

    // Only notify for pending requests
    if (status === 'accepted') {
      return null;
    }

    // Find the recipient (the user who didn't send the request)
    const recipientId = users.find((id) => id !== requestedBy);
    if (!recipientId) {
      return null;
    }

    console.log(`New friend request from ${requestedBy} to ${recipientId}`);

    // Get sender's info
    const senderDoc = await db.collection('users').doc(requestedBy).get();
    const senderData = senderDoc.data() as UserData | undefined;
    const senderName = senderData?.username || senderData?.displayName || 'Someone';

    // Send notification to recipient
    await sendNotificationToUser(
      recipientId,
      'New Friend Request',
      `${senderName} wants to be your friend`,
      {
        type: 'friend_request',
        senderId: requestedBy,
      }
    );

    return null;
  });

// Trigger notification when a friend request is accepted
export const onFriendRequestAccepted = functions.firestore
  .document('friendships/{friendshipId}')
  .onUpdate(async (change) => {
    const beforeData = change.before.data() as FriendshipData;
    const afterData = change.after.data() as FriendshipData;

    // Only trigger if status changed to 'accepted'
    if (beforeData.status === 'accepted' || afterData.status !== 'accepted') {
      return null;
    }

    const { users, requestedBy } = afterData;

    // Notify the person who sent the original request
    console.log(`Friend request accepted: ${requestedBy} <-> ${users.find((id) => id !== requestedBy)}`);

    // Get accepter's info (the person who didn't send the request)
    const accepterId = users.find((id) => id !== requestedBy);
    if (!accepterId) {
      return null;
    }

    const accepterDoc = await db.collection('users').doc(accepterId).get();
    const accepterData = accepterDoc.data() as UserData | undefined;
    const accepterName = accepterData?.username || accepterData?.displayName || 'Someone';

    // Send notification to the original requester
    await sendNotificationToUser(
      requestedBy,
      'Friend Request Accepted! 🎉',
      `${accepterName} accepted your friend request`,
      {
        type: 'friend_accepted',
        friendId: accepterId,
      }
    );

    return null;
  });


