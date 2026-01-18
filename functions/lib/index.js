"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onFriendRequestAccepted = exports.onNewFriendRequest = exports.onNewMessage = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
// Send notification to a user
async function sendNotificationToUser(userId, title, body, data) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.fcmTokens) || userData.fcmTokens.length === 0) {
            console.log(`No FCM tokens found for user ${userId}`);
            return;
        }
        if (!userData.notificationsEnabled) {
            console.log(`Notifications disabled for user ${userId}`);
            return;
        }
        const message = {
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
            const invalidTokens = [];
            response.responses.forEach((resp, idx) => {
                var _a;
                if (!resp.success && userData.fcmTokens) {
                    const errorCode = (_a = resp.error) === null || _a === void 0 ? void 0 : _a.code;
                    if (errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered') {
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
    }
    catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
    }
}
// Trigger notification when a new message is created
exports.onNewMessage = functions.firestore
    .document('messages/{messageId}')
    .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    const { senderId, receiverId, text } = messageData;
    console.log(`New message from ${senderId} to ${receiverId}`);
    // Don't notify if sender and receiver are the same
    if (senderId === receiverId) {
        return null;
    }
    // Get sender's info for the notification
    const senderDoc = await db.collection('users').doc(senderId).get();
    const senderData = senderDoc.data();
    const senderName = (senderData === null || senderData === void 0 ? void 0 : senderData.username) || (senderData === null || senderData === void 0 ? void 0 : senderData.displayName) || 'Someone';
    // Send notification to receiver
    await sendNotificationToUser(receiverId, `New message from ${senderName}`, text.length > 100 ? text.substring(0, 100) + '...' : text, {
        type: 'message',
        senderId,
        messageId: context.params.messageId,
        conversationId: [senderId, receiverId].sort().join('_'),
    });
    return null;
});
// Trigger notification when a new friend request is created
exports.onNewFriendRequest = functions.firestore
    .document('friendships/{friendshipId}')
    .onCreate(async (snapshot) => {
    const friendshipData = snapshot.data();
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
    const senderData = senderDoc.data();
    const senderName = (senderData === null || senderData === void 0 ? void 0 : senderData.username) || (senderData === null || senderData === void 0 ? void 0 : senderData.displayName) || 'Someone';
    // Send notification to recipient
    await sendNotificationToUser(recipientId, 'New Friend Request', `${senderName} wants to be your friend`, {
        type: 'friend_request',
        senderId: requestedBy,
    });
    return null;
});
// Trigger notification when a friend request is accepted
exports.onFriendRequestAccepted = functions.firestore
    .document('friendships/{friendshipId}')
    .onUpdate(async (change) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
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
    const accepterData = accepterDoc.data();
    const accepterName = (accepterData === null || accepterData === void 0 ? void 0 : accepterData.username) || (accepterData === null || accepterData === void 0 ? void 0 : accepterData.displayName) || 'Someone';
    // Send notification to the original requester
    await sendNotificationToUser(requestedBy, 'Friend Request Accepted! 🎉', `${accepterName} accepted your friend request`, {
        type: 'friend_accepted',
        friendId: accepterId,
    });
    return null;
});
//# sourceMappingURL=index.js.map