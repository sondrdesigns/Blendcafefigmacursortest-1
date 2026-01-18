import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, MoreVertical, Image as ImageIcon, Coffee, Trash2, Ban, Check, CheckSquare, Send, Smile, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { Message, Conversation, Friend } from '../lib/types';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      const loadedMessages: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Message[];
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
      m.senderId === participantId && 
      m.receiverId === MY_USER_ID && 
      !m.read
    );
    
    // Mark each unread message as read
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

  // Calculate unread counts per conversation
  const getUnreadCount = (participantId: string) => {
    return messages.filter(m => 
      m.senderId === participantId && 
      m.receiverId === MY_USER_ID && 
      !m.read
    ).length;
  };

  // Get last message for a conversation
  const getLastMessage = (participantId: string) => {
    const convMessages = messages.filter(m =>
      (m.senderId === MY_USER_ID && m.receiverId === participantId) ||
      (m.senderId === participantId && m.receiverId === MY_USER_ID)
    );
    return convMessages[convMessages.length - 1];
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      await addDoc(collection(db, 'messages'), {
        senderId: MY_USER_ID,
        receiverId: selectedConversation.participant.id,
        text: messageText,
        timestamp: Timestamp.now(),
        read: false,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
    }
  };

  const handleDeleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return;
    const { deleteDoc, doc } = await import('firebase/firestore');
    for (const messageId of selectedMessages) {
      await deleteDoc(doc(db, 'messages', messageId));
    }
    setSelectedMessages(new Set());
    setIsSelectMode(false);
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation || !MY_USER_ID) return;
    const { deleteDoc, doc } = await import('firebase/firestore');
    const participantId = selectedConversation.participant.id;
    const toDelete = messages.filter(m => 
      (m.senderId === MY_USER_ID && m.receiverId === participantId) ||
      (m.senderId === participantId && m.receiverId === MY_USER_ID)
    );
    for (const message of toDelete) {
      await deleteDoc(doc(db, 'messages', message.id));
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

  // Conversation List Component
  const ConversationList = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('social')}
              className="p-2 -ml-2 rounded-2xl hover:bg-white/60 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-amber-900" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-amber-900">Messages</h1>
              <p className="text-sm text-amber-700/60">{filteredConversations.length} conversations</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Coffee className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-sm border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-amber-900 placeholder:text-amber-400 shadow-sm"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-4">
        <AnimatePresence>
          {filteredConversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-64 text-center px-4"
            >
              <div className="w-20 h-20 rounded-3xl bg-white/60 flex items-center justify-center mb-4 shadow-lg">
                <Users className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="font-semibold text-amber-900 mb-1">No conversations yet</h3>
              <p className="text-sm text-amber-600/70">Add friends to start chatting!</p>
            </motion.div>
          ) : (
            filteredConversations.map((conv, index) => {
              const lastMsg = getLastMessage(conv.participant.id);
              const unread = getUnreadCount(conv.participant.id);
              
              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 mb-2 rounded-3xl cursor-pointer transition-all duration-300 ${
                    selectedConversation?.id === conv.id 
                      ? 'bg-white shadow-lg shadow-amber-200/50 scale-[1.02]' 
                      : 'bg-white/50 hover:bg-white hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="w-14 h-14 ring-4 ring-white shadow-md">
                        <AvatarImage src={conv.participant.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-amber-200 to-orange-300 text-amber-800 font-bold text-lg">
                          {conv.participant.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-400 border-3 border-white rounded-full shadow-sm" />
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold text-amber-900 ${unread > 0 ? 'font-bold' : ''}`}>
                          {conv.participant.username}
                        </span>
                        {lastMsg && (
                          <span className="text-xs text-amber-500 ml-2">
                            {formatTime(lastMsg.timestamp)}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <p className={`text-sm truncate ${unread > 0 ? 'font-medium text-amber-800' : 'text-amber-600/70'}`}>
                          {lastMsg.senderId === MY_USER_ID && <span className="text-amber-400">You: </span>}
                          {lastMsg.text}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // Chat Panel Component
  const ChatPanel = () => {
    if (!selectedConversation) return null;
    
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-amber-50/50 to-white">
        {/* Chat Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-amber-100/50 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 -ml-2 rounded-2xl hover:bg-amber-100/50 transition-all"
              onClick={() => setSelectedConversation(null)}
            >
              <ArrowLeft className="w-5 h-5 text-amber-700" />
            </button>
            <Avatar className="w-12 h-12 ring-4 ring-amber-100 shadow-lg">
              <AvatarImage src={selectedConversation.participant.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-amber-200 to-orange-300 text-amber-800 font-bold">
                {selectedConversation.participant.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-lg text-amber-900">{selectedConversation.participant.username}</h3>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm text-emerald-600 font-medium">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSelectMode && selectedMessages.size > 0 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={handleDeleteSelectedMessages}
                className="p-3 rounded-2xl bg-rose-100 text-rose-600 hover:bg-rose-200 transition-all shadow-sm"
              >
                <Trash2 className="w-5 h-5" />
              </motion.button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-3 rounded-2xl hover:bg-amber-100/50 transition-all">
                  <MoreVertical className="w-5 h-5 text-amber-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2">
                <DropdownMenuItem onClick={() => { setIsSelectMode(!isSelectMode); setSelectedMessages(new Set()); }} className="rounded-xl">
                  <CheckSquare className="w-4 h-4 mr-3" />
                  {isSelectMode ? 'Cancel Selection' : 'Select Messages'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDeleteConversation} className="text-rose-600 rounded-xl">
                  <Trash2 className="w-4 h-4 mr-3" />
                  Delete Conversation
                </DropdownMenuItem>
                <DropdownMenuItem className="text-rose-600 rounded-xl">
                  <Ban className="w-4 h-4 mr-3" />
                  Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-1 min-h-full flex flex-col justify-end">
            {conversationMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-6 shadow-xl">
                  <Coffee className="w-12 h-12 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">Start the conversation!</h3>
                <p className="text-amber-600/70">Say hello to {selectedConversation.participant.username} ☕</p>
              </div>
            ) : (
              conversationMessages.map((message, index) => {
                const isOwn = message.senderId === MY_USER_ID;
                const showAvatar = !isOwn && (
                  index === conversationMessages.length - 1 ||
                  conversationMessages[index + 1]?.senderId !== message.senderId
                );
                const isLastInGroup = index === conversationMessages.length - 1 ||
                  conversationMessages[index + 1]?.senderId !== message.senderId;
                const showDateSep = shouldShowDateSeparator(index);
                const isSelected = selectedMessages.has(message.id);

                return (
                  <React.Fragment key={message.id}>
                    {showDateSep && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center py-6"
                      >
                        <span className="px-5 py-2 bg-amber-100/80 backdrop-blur-sm rounded-full text-xs font-semibold text-amber-700 shadow-sm">
                          {formatDateSeparator(message.timestamp)}
                        </span>
                      </motion.div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-4' : 'mb-1'} ${isSelectMode ? 'cursor-pointer' : ''}`}
                      onClick={() => isSelectMode && (selectedMessages.has(message.id) 
                        ? setSelectedMessages(prev => { const n = new Set(prev); n.delete(message.id); return n; })
                        : setSelectedMessages(prev => new Set(prev).add(message.id))
                      )}
                    >
                      <div className={`flex items-end gap-3 max-w-[80%] sm:max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {isSelectMode && (
                          <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            isSelected ? 'bg-amber-500 border-amber-500 scale-110' : 'border-amber-300'
                          }`}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        )}
                        {!isOwn && !isSelectMode && (
                          <div className="w-8 h-8 flex-shrink-0">
                            {showAvatar && (
                              <Avatar className="w-8 h-8 shadow-md ring-2 ring-white">
                                <AvatarImage src={selectedConversation.participant.avatar} />
                                <AvatarFallback className="bg-gradient-to-br from-amber-200 to-orange-300 text-amber-800 text-xs font-bold">
                                  {selectedConversation.participant.username[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}
                        <div
                          className={`px-5 py-3 shadow-sm transition-all ${
                            isSelected ? 'ring-2 ring-amber-500 shadow-amber-200 ' : ''
                          }${
                            isOwn
                              ? `bg-gradient-to-br from-amber-500 to-orange-500 text-white ${isLastInGroup ? 'rounded-3xl rounded-br-lg' : 'rounded-3xl'}`
                              : `bg-white text-amber-900 ${isLastInGroup ? 'rounded-3xl rounded-bl-lg' : 'rounded-3xl'}`
                          }`}
                        >
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                          <p className={`text-[11px] mt-1.5 ${isOwn ? 'text-white/70' : 'text-amber-400'}`}>
                            {formatMessageTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 p-4 sm:p-6 bg-white/80 backdrop-blur-xl border-t border-amber-100/50"
        >
          <div className="flex items-center gap-3">
            <button className="p-3 rounded-2xl hover:bg-amber-100/50 transition-all flex-shrink-0">
              <ImageIcon className="w-5 h-5 text-amber-500" />
            </button>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                className="w-full py-4 px-6 bg-amber-50/50 border-2 border-amber-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 text-amber-900 placeholder:text-amber-400 transition-all"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg transition-all ${
                newMessage.trim() 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30 hover:shadow-amber-500/50' 
                  : 'bg-amber-200 shadow-none'
              }`}
            >
              <Send className={`w-5 h-5 ${newMessage.trim() ? 'text-white' : 'text-amber-400'}`} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Empty State for Desktop
  const EmptyState = () => (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-amber-50/50 to-orange-50/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md px-8"
      >
        <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-200/50">
          <Coffee className="w-16 h-16 text-amber-500" />
        </div>
        <h3 className="font-bold text-2xl text-amber-900 mb-3">Your Messages</h3>
        <p className="text-amber-600/70 text-lg">Select a conversation to start chatting with your friends</p>
      </motion.div>
    </div>
  );

  return (
    <div className="fixed inset-0 top-[57px] bg-gradient-to-br from-amber-100/40 via-orange-50/30 to-yellow-50/40 overflow-hidden">
      {/* Mobile Layout */}
      <div className="md:hidden h-full">
        <AnimatePresence mode="wait">
          {selectedConversation ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full"
            >
              <ChatPanel />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full"
            >
              <ConversationList />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex h-full">
        {/* Sidebar */}
        <div className="w-[360px] lg:w-[400px] border-r border-amber-200/30 flex-shrink-0 bg-white/30 backdrop-blur-sm">
          <ConversationList />
        </div>
        
        {/* Chat Area */}
        <div className="flex-1">
          {selectedConversation ? <ChatPanel /> : <EmptyState />}
        </div>
      </div>
    </div>
  );
}
