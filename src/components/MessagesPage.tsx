import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, MoreVertical, Image as ImageIcon, Coffee, Trash2, Ban, Check, CheckSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { Message, Conversation } from '../lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { collection, query, where, onSnapshot, addDoc, Timestamp, or, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface MessagesPageProps {
  onNavigate: (page: string) => void;
  initialConversationId?: string;
}

export function MessagesPage({ onNavigate, initialConversationId }: MessagesPageProps) {
  const { user, friends } = useApp();
  const MY_USER_ID = user?.id || '';
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [recentlySentIds, setRecentlySentIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const mobileMessagesContainerRef = useRef<HTMLDivElement>(null);

  // Build conversations from friends list
  useEffect(() => {
    if (!MY_USER_ID) return;
    const acceptedFriends = friends.filter(f => f.status === 'friends' || f.status === 'accepted');
    const friendConversations: Conversation[] = acceptedFriends.map(friend => ({
      id: `conv-${[MY_USER_ID, friend.id].sort().join('-')}`,
      participantIds: [MY_USER_ID, friend.id],
      participant: friend,
      unreadCount: 0,
    }));
    setConversations(friendConversations);
  }, [friends, MY_USER_ID]);

  // Listen to messages from Firestore
  useEffect(() => {
    if (!MY_USER_ID) return;
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, or(
      where('senderId', '==', MY_USER_ID),
      where('receiverId', '==', MY_USER_ID)
    ));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        senderId: docSnap.data().senderId,
        receiverId: docSnap.data().receiverId,
        text: docSnap.data().text,
        timestamp: docSnap.data().timestamp?.toDate() || new Date(),
        read: docSnap.data().read || false,
      }));
      loadedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(loadedMessages);
    });

    return () => unsubscribe();
  }, [MY_USER_ID]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (!selectedConversation || !MY_USER_ID) return;
    const participantId = selectedConversation.participant.id;
    const unreadMessages = messages.filter(m => 
      m.senderId === participantId && m.receiverId === MY_USER_ID && !m.read
    );
    unreadMessages.forEach(async (msg) => {
      try {
        await updateDoc(doc(db, 'messages', msg.id), { read: true });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });
  }, [selectedConversation, messages, MY_USER_ID]);

  const conversationMessages = selectedConversation
    ? messages.filter(m => {
        const participantId = selectedConversation.participant.id;
        return (m.senderId === MY_USER_ID && m.receiverId === participantId) ||
               (m.senderId === participantId && m.receiverId === MY_USER_ID);
      })
    : [];

  const filteredConversations = conversations.filter(c =>
    c.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUnreadCount = (participantId: string) => {
    return messages.filter(m => m.senderId === participantId && m.receiverId === MY_USER_ID && !m.read).length;
  };

  const getLastMessage = (participantId: string) => {
    const convMessages = messages.filter(m =>
      (m.senderId === MY_USER_ID && m.receiverId === participantId) ||
      (m.senderId === participantId && m.receiverId === MY_USER_ID)
    );
    return convMessages[convMessages.length - 1];
  };

  // Auto-scroll to bottom when messages change or conversation changes
  const scrollToBottom = (immediate = false) => {
    const scroll = () => {
      // Try desktop container first
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
      // Try mobile container
      if (mobileMessagesContainerRef.current) {
        mobileMessagesContainerRef.current.scrollTop = mobileMessagesContainerRef.current.scrollHeight;
      }
      // Fallback to scrollIntoView
      messagesEndRef.current?.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth', block: 'end' });
    };
    
    if (immediate) {
      scroll();
      // Also scroll after a brief delay to catch any late renders
      setTimeout(scroll, 50);
      setTimeout(scroll, 150);
    } else {
      setTimeout(scroll, 50);
      setTimeout(scroll, 200);
    }
  };

  // Scroll when conversation changes (immediate)
  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom(true);
    }
  }, [selectedConversation?.id]);

  // Scroll when messages change (smooth)
  useEffect(() => {
    if (conversationMessages.length > 0) {
      scrollToBottom(false);
    }
  }, [conversationMessages.length]);

  useEffect(() => {
    if (initialConversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.participant.id === initialConversationId);
      if (conv) setSelectedConversation(conv);
    }
  }, [initialConversationId, conversations.length]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !MY_USER_ID) return;
    const messageText = newMessage.trim();
    setNewMessage('');
    
    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        senderId: MY_USER_ID,
        receiverId: selectedConversation.participant.id,
        text: messageText,
        timestamp: Timestamp.now(),
        read: false,
      });
      
      // Track recently sent for animation
      setRecentlySentIds(prev => new Set(prev).add(docRef.id));
      setTimeout(() => {
        setRecentlySentIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(docRef.id);
          return newSet;
        });
      }, 600);
      
      // Scroll to bottom after message is sent
      scrollToBottom(true);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore on error
    }
  };

  const handleDeleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return;
    const { deleteDoc, doc: docRef } = await import('firebase/firestore');
    for (const messageId of selectedMessages) {
      await deleteDoc(docRef(db, 'messages', messageId));
    }
    setSelectedMessages(new Set());
    setIsSelectMode(false);
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation || !MY_USER_ID) return;
    const { deleteDoc, doc: docRef } = await import('firebase/firestore');
    const participantId = selectedConversation.participant.id;
    const toDelete = messages.filter(m => 
      (m.senderId === MY_USER_ID && m.receiverId === participantId) ||
      (m.senderId === participantId && m.receiverId === MY_USER_ID)
    );
    for (const message of toDelete) {
      await deleteDoc(docRef(db, 'messages', message.id));
    }
    setSelectedConversation(null);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const current = new Date(conversationMessages[index].timestamp);
    const previous = new Date(conversationMessages[index - 1].timestamp);
    return current.toDateString() !== previous.toDateString();
  };

  const formatDateSeparator = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    if (messageDate.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return messageDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Shared Message Bubble Component
  const MessageBubble = ({ msg, idx, isMobile = false }: { msg: Message; idx: number; isMobile?: boolean }) => {
    const isOwn = msg.senderId === MY_USER_ID;
    const showDate = shouldShowDateSeparator(idx);
    const isNew = recentlySentIds.has(msg.id);
    const isSelected = selectedMessages.has(msg.id);

    return (
      <React.Fragment>
        {showDate && (
          <div className="flex justify-center py-3">
            <span className="px-3 py-1 bg-amber-200 rounded-full text-xs font-medium text-amber-800">
              {formatDateSeparator(msg.timestamp)}
            </span>
          </div>
        )}
        <motion.div 
          initial={isNew ? { opacity: 0, scale: 0.8, y: 20 } : false}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isSelectMode && !isMobile ? 'cursor-pointer' : ''}`}
          onClick={() => !isMobile && isSelectMode && (
            isSelected 
              ? setSelectedMessages(prev => { const n = new Set(prev); n.delete(msg.id); return n; })
              : setSelectedMessages(prev => new Set(prev).add(msg.id))
          )}
        >
          <div className={`flex items-end gap-2 ${isMobile ? 'max-w-[75%]' : 'max-w-[65%]'} ${isOwn ? 'flex-row-reverse' : ''}`}>
            {!isMobile && isSelectMode && (
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
              }`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
            )}
            {!isOwn && !isSelectMode && !isMobile && selectedConversation && (
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={selectedConversation.participant.avatar} />
                <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                  {selectedConversation.participant.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className={`px-4 py-2.5 rounded-2xl shadow-md ${
              !isMobile && isSelected ? 'ring-2 ring-amber-400 ' : ''
            }${
              isOwn 
                ? 'rounded-br-md'
                : 'rounded-bl-md'
            }`} style={{ backgroundColor: '#a67c52' }}>
              <p className={`${isMobile ? 'text-sm' : 'text-[15px]'} leading-relaxed text-white`}>{msg.text}</p>
              <p className="text-[10px] mt-1 text-white/70">
                {formatMessageTime(msg.timestamp)}
              </p>
            </div>
          </div>
        </motion.div>
      </React.Fragment>
    );
  };

  return (
    <div className="fixed inset-0 top-[57px] bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50/30 overflow-hidden">
      {/* Mobile Layout */}
      <div className="md:hidden absolute inset-0 flex flex-col">
        <AnimatePresence mode="wait">
          {selectedConversation ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 flex flex-col bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50/30"
            >
              {/* Mobile Chat Header */}
              <div className="flex-none px-4 py-3 bg-white border-b border-amber-100 flex items-center gap-3">
                <button onClick={() => setSelectedConversation(null)} className="p-2 -ml-2 rounded-lg hover:bg-amber-50">
                  <ArrowLeft className="w-5 h-5 text-amber-700" />
                </button>
                <Avatar className="w-9 h-9 border-2 border-amber-100 flex-shrink-0">
                  <AvatarImage src={selectedConversation.participant.avatar} />
                  <AvatarFallback className="bg-amber-100 text-amber-700 font-semibold">
                    {selectedConversation.participant.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="flex-1 font-semibold text-gray-900 truncate text-lg">{selectedConversation.participant.username}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-xl hover:bg-amber-50">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => { setIsSelectMode(!isSelectMode); setSelectedMessages(new Set()); }}>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      {isSelectMode ? 'Cancel' : 'Select Messages'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDeleteConversation} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />Delete Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Ban className="w-4 h-4 mr-2" />Block User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Messages */}
              <div ref={mobileMessagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
                {conversationMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                      <Coffee className="w-8 h-8 text-amber-600" />
                    </div>
                    <p className="font-medium text-gray-900">Start chatting!</p>
                    <p className="text-sm text-gray-500">Say hello to {selectedConversation.participant.username}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversationMessages.map((msg, idx) => (
                      <React.Fragment key={msg.id}>
                        <MessageBubble msg={msg} idx={idx} isMobile />
                      </React.Fragment>
                    ))}
                    <div ref={messagesEndRef} className="h-1" />
                  </div>
                )}
              </div>

              {/* Mobile Input */}
              <div className="flex-none p-3 bg-white border-t border-amber-100">
                <div className="flex items-center gap-2">
                  <button className="p-2.5 rounded-xl hover:bg-amber-50 text-amber-600">
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 py-2.5 px-4 bg-amber-50 border border-amber-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <motion.button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    className={`p-2.5 rounded-xl transition-colors ${
                      newMessage.trim() ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-400'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Mobile List Header */}
              <div className="flex-none p-4 bg-white border-b border-amber-100">
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => onNavigate('social')} className="p-2 -ml-2 rounded-xl hover:bg-amber-50">
                    <ArrowLeft className="w-5 h-5 text-amber-700" />
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                    <p className="text-xs text-gray-500">{filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                </div>
              </div>

              {/* Mobile Conversations List */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {filteredConversations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                      <Coffee className="w-8 h-8 text-amber-600" />
                    </div>
                    <p className="font-medium text-gray-900">No conversations</p>
                    <p className="text-sm text-gray-500">Add friends to start chatting!</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredConversations.map((conv) => {
                      const lastMsg = getLastMessage(conv.participant.id);
                      const unread = getUnreadCount(conv.participant.id);
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className="w-full p-4 mb-2 rounded-2xl bg-white border-2 border-amber-200 shadow-md hover:shadow-lg hover:border-amber-300 transition-all flex items-center gap-3 text-left"
                        >
                          <div className="relative flex-shrink-0">
                            <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                              <AvatarImage src={conv.participant.avatar} />
                              <AvatarFallback className="bg-amber-100 text-amber-700 font-semibold">
                                {conv.participant.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                            {unread > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {unread}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base flex-1" style={{ color: '#5c3d2e' }}>
                                {(conv.participant.username && conv.participant.username.trim()) || 
                                 (conv.participant as any).displayName || 
                                 (conv.participant as any).name || 
                                 (conv.participant.id ? conv.participant.id.slice(0, 8) : 'User')}
                              </span>
                              {lastMsg && (
                                <span className="text-xs flex-shrink-0" style={{ color: '#8b7355' }}>
                                  {formatTime(lastMsg.timestamp)}
                                </span>
                              )}
                            </div>
                            {lastMsg && (
                              <p className="text-sm mt-0.5" style={{ color: unread > 0 ? '#5c3d2e' : '#8b7355', fontWeight: unread > 0 ? 500 : 400 }}>
                                {unread > 0 && lastMsg.senderId !== MY_USER_ID 
                                  ? 'New Message' 
                                  : lastMsg.senderId === MY_USER_ID 
                                    ? `You: ${lastMsg.text}` 
                                    : lastMsg.text}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex absolute inset-0">
        {/* Sidebar */}
        <div className="w-80 lg:w-96 bg-white border-r border-amber-100 flex flex-col">
          {/* Desktop List Header */}
          <div className="flex-none p-4 pt-6 border-b border-amber-50">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => onNavigate('social')} className="p-2 -ml-2 rounded-xl hover:bg-amber-50 transition-colors">
                <ArrowLeft className="w-5 h-5 text-amber-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                <p className="text-xs text-gray-500">{filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
              />
            </div>
          </div>

          {/* Desktop Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 min-h-0">
            {filteredConversations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                  <Coffee className="w-8 h-8 text-amber-400" />
                </div>
                <p className="font-medium text-gray-700">No conversations</p>
                <p className="text-sm text-gray-400">Add friends to start chatting!</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const lastMsg = getLastMessage(conv.participant.id);
                const unread = getUnreadCount(conv.participant.id);
                const isSelected = selectedConversation?.id === conv.id;
                return (
                  <motion.button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`w-full p-4 mb-2 rounded-2xl flex items-center gap-3 text-left shadow-md transition-shadow hover:shadow-lg ${
                      isSelected ? 'bg-amber-700 border-2 border-amber-500' : 'bg-amber-800 border border-amber-700'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-12 h-12 border-2 border-amber-600 shadow-sm">
                        <AvatarImage src={conv.participant.avatar} />
                        <AvatarFallback className="bg-amber-200 text-amber-900 font-semibold">
                          {conv.participant.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-amber-800 rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-base flex-1 truncate ${unread > 0 ? 'text-white' : 'text-amber-100'}`}>
                          {conv.participant.username || (conv.participant as any).displayName || (conv.participant as any).name || conv.participant.id?.slice(0, 8) || 'User'}
                        </span>
                        {unread > 0 && (
                          <span className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-pulse flex-shrink-0" />
                        )}
                        {lastMsg && (
                          <span className="text-xs text-amber-300 flex-shrink-0">
                            {formatTime(lastMsg.timestamp)}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <p className={`text-sm truncate mt-0.5 ${unread > 0 ? 'text-amber-100 font-medium' : 'text-amber-300'}`}>
                          {unread > 0 && lastMsg.senderId !== MY_USER_ID 
                            ? 'New Message' 
                            : lastMsg.senderId === MY_USER_ID 
                              ? `You: ${lastMsg.text}` 
                              : lastMsg.text}
                        </p>
                      )}
                    </div>
                    {unread > 0 && (
                      <span className="w-6 h-6 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        {unread}
                      </span>
                    )}
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-amber-50/50 to-white">
          {selectedConversation ? (
            <>
              {/* Desktop Chat Header */}
              <div className="flex-none px-6 py-6 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm min-h-[80px]">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-amber-300 flex-shrink-0 shadow-md">
                    <AvatarImage src={selectedConversation.participant.avatar} />
                    <AvatarFallback className="bg-amber-100 text-amber-800 font-bold text-lg">
                      {selectedConversation.participant.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-gray-900 text-xl">{selectedConversation.participant.username}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {isSelectMode && selectedMessages.size > 0 && (
                    <button
                      onClick={handleDeleteSelectedMessages}
                      className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete ({selectedMessages.size})
                    </button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-lg hover:bg-gray-100">
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => { setIsSelectMode(!isSelectMode); setSelectedMessages(new Set()); }}>
                        <CheckSquare className="w-4 h-4 mr-2" />
                        {isSelectMode ? 'Cancel Selection' : 'Select Messages'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDeleteConversation} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />Delete Conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Ban className="w-4 h-4 mr-2" />Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Desktop Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                {conversationMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                      <Coffee className="w-10 h-10 text-amber-600" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-1">Start the conversation!</p>
                    <p className="text-gray-500">Say hello to {selectedConversation.participant.username} ☕</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-w-3xl mx-auto">
                    {conversationMessages.map((msg, idx) => (
                      <React.Fragment key={msg.id}>
                        <MessageBubble msg={msg} idx={idx} />
                      </React.Fragment>
                    ))}
                    <div ref={messagesEndRef} className="h-1" />
                  </div>
                )}
              </div>

              {/* Desktop Input */}
              <div className="flex-none px-6 py-4 bg-white border-t border-gray-100">
                <div className="flex items-center gap-3 max-w-3xl mx-auto">
                  <button className="p-2.5 rounded-xl hover:bg-amber-50 text-amber-600 flex-shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 py-3 px-5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
                  />
                  <motion.button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.05 }}
                    className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                      newMessage.trim()
                        ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 rounded-3xl bg-amber-100 flex items-center justify-center mb-6">
                <Coffee className="w-12 h-12 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Messages</h3>
              <p className="text-gray-500">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
