import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, MoreVertical, Image as ImageIcon, Coffee, Trash2, Ban, Check, CheckSquare } from 'lucide-react';
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
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp, or, and, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface MessagesPageProps {
  onNavigate: (page: string) => void;
  initialConversationId?: string;
}

export function MessagesPage({ onNavigate, initialConversationId }: MessagesPageProps) {
  const { user, friends } = useApp();
  
  // Use the current authenticated user's ID
  const MY_USER_ID = user?.id || '';
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build conversations from friends list
  useEffect(() => {
    if (!MY_USER_ID) return;
    
    // Get friends who are actually accepted friends (not pending/requests)
    const acceptedFriends = friends.filter(f => f.status === 'friends' || f.status === 'accepted');
    
    // Create a conversation for each friend
    const friendConversations: Conversation[] = acceptedFriends.map(friend => ({
      id: `conv-${[MY_USER_ID, friend.id].sort().join('-')}`,
      participantIds: [MY_USER_ID, friend.id],
      participant: friend,
      unreadCount: 0,
    }));
    
    setConversations(friendConversations);
  }, [friends, MY_USER_ID]);

  // Listen to messages from Firestore in real-time
  useEffect(() => {
    if (!MY_USER_ID) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      or(
        where('senderId', '==', MY_USER_ID),
        where('receiverId', '==', MY_USER_ID)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        loadedMessages.push({
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          text: data.text,
          timestamp: data.timestamp?.toDate() || new Date(),
          read: data.read || false,
        });
      });
      // Sort by timestamp
      loadedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(loadedMessages);
    }, (error) => {
      console.error('Error listening to messages:', error);
    });

    return () => unsubscribe();
  }, [MY_USER_ID]);

  // Filter messages for selected conversation
  const conversationMessages = selectedConversation
    ? messages.filter(m => {
        const participantId = selectedConversation.participant.id;
        return (
          (m.senderId === MY_USER_ID && m.receiverId === participantId) ||
          (m.senderId === participantId && m.receiverId === MY_USER_ID)
        );
      }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  // Filter conversations based on search
  const filteredConversations = conversations.filter(c =>
    c.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages.length, isTyping]);

  // Set initial conversation from prop (when clicking "Message" from a friend's profile)
  useEffect(() => {
    if (initialConversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.participant.id === initialConversationId);
      if (conv) {
        setSelectedConversation(conv);
      } else {
        // Check if this person is a friend
        const friend = friends.find(f => f.id === initialConversationId && (f.status === 'friends' || f.status === 'accepted'));
        if (friend) {
          const newConv: Conversation = {
            id: `conv-${[MY_USER_ID, friend.id].sort().join('-')}`,
            participantIds: [MY_USER_ID, friend.id],
            participant: friend,
            unreadCount: 0,
          };
          setConversations(prev => {
            // Avoid duplicates
            if (prev.some(c => c.id === newConv.id)) return prev;
            return [newConv, ...prev];
          });
          setSelectedConversation(newConv);
        }
      }
    }
  }, [initialConversationId, conversations.length, friends, MY_USER_ID]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setIsSelectMode(false);
    setSelectedMessages(new Set());
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setIsSelectMode(false);
    setSelectedMessages(new Set());
  };

  // Toggle select mode for deleting messages
  const handleToggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedMessages(new Set());
  };

  // Toggle message selection
  const handleToggleMessageSelection = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  // Delete selected messages
  const handleDeleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return;
    
    try {
      // Import deleteDoc
      const { deleteDoc, doc } = await import('firebase/firestore');
      
      // Delete each selected message from Firestore
      for (const messageId of selectedMessages) {
        await deleteDoc(doc(db, 'messages', messageId));
      }
      
      // The real-time listener will update the UI
      setSelectedMessages(new Set());
      setIsSelectMode(false);
    } catch (error) {
      console.error('Error deleting messages:', error);
    }
  };

  // Delete entire conversation (deletes all messages with this participant)
  const handleDeleteConversation = async () => {
    if (!selectedConversation || !MY_USER_ID) return;
    
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const participantId = selectedConversation.participant.id;
      
      // Find all messages in this conversation and delete them
      const messagesToDelete = messages.filter(m => 
        (m.senderId === MY_USER_ID && m.receiverId === participantId) ||
        (m.senderId === participantId && m.receiverId === MY_USER_ID)
      );
      
      for (const message of messagesToDelete) {
        await deleteDoc(doc(db, 'messages', message.id));
      }
      
      // Remove conversation from list
      setConversations(prev => prev.filter(c => c.id !== selectedConversation.id));
      setSelectedConversation(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Block user (removes conversation and prevents future messages)
  const handleBlockUser = () => {
    if (!selectedConversation) return;
    // For now, just delete the conversation (in a real app, you'd save blocked users)
    handleDeleteConversation();
    // Could add to a blocked users list in localStorage
    const blocked = JSON.parse(localStorage.getItem('blend_blocked_users') || '[]');
    blocked.push(selectedConversation.participant.id);
    localStorage.setItem('blend_blocked_users', JSON.stringify(blocked));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !MY_USER_ID) return;

    const messageText = newMessage.trim();
    
    // Clear input immediately
    setNewMessage('');
    
    try {
      // Save message to Firestore
      await addDoc(collection(db, 'messages'), {
        senderId: MY_USER_ID,
        receiverId: selectedConversation.participant.id,
        text: messageText,
        timestamp: Timestamp.now(),
        read: false,
      });
      
      // The real-time listener will automatically update the messages state
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message if failed
      setNewMessage(messageText);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

  return (
    <div className="fixed inset-0 top-[57px] bg-white overflow-hidden">
      {/* Mobile Layout */}
      <div className="md:hidden h-full">
        <AnimatePresence mode="wait">
          {selectedConversation ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col bg-gradient-to-b from-orange-50/30 to-white"
            >
              {/* Chat Header */}
              <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    className="p-2 -ml-2 rounded-xl hover:bg-orange-100/50 transition-colors"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <Avatar className="w-10 h-10 ring-2 ring-orange-100 shadow-md">
                    <AvatarImage src={selectedConversation.participant.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-200 to-amber-200 text-orange-700">
                      {selectedConversation.participant.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedConversation.participant.username}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-400 rounded-full" />
                      <span className="text-xs text-gray-500">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSelectMode && selectedMessages.size > 0 && (
                    <button
                      onClick={handleDeleteSelectedMessages}
                      className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2.5 rounded-xl hover:bg-orange-100/50 transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleToggleSelectMode}>
                        <CheckSquare className="w-4 h-4 mr-2" />
                        {isSelectMode ? 'Cancel Selection' : 'Select Messages'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDeleteConversation} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBlockUser} className="text-red-600">
                        <Ban className="w-4 h-4 mr-2" />
                        Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-1 min-h-full flex flex-col justify-end">
                  {conversationMessages.map((message, index) => {
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
                          <div className="flex justify-center py-4">
                            <span className="px-4 py-1.5 bg-gray-100/80 rounded-full text-xs font-medium text-gray-500">
                              {formatDateSeparator(message.timestamp)}
                            </span>
                          </div>
                        )}
                        <div 
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'} ${isSelectMode ? 'cursor-pointer' : ''}`}
                          onClick={() => isSelectMode && handleToggleMessageSelection(message.id)}
                        >
                          <div className={`flex items-end gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                            {isSelectMode && (
                              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mb-1 flex items-center justify-center ${
                                isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                            )}
                            {!isOwn && !isSelectMode && (
                              <div className="w-7 h-7 flex-shrink-0 mb-1">
                                {showAvatar && (
                                  <Avatar className="w-7 h-7 shadow-sm">
                                    <AvatarImage src={selectedConversation.participant.avatar} />
                                    <AvatarFallback className="bg-gradient-to-br from-orange-200 to-amber-200 text-orange-700 text-xs">
                                      {selectedConversation.participant.username[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            )}
                            <div
                              className={`px-4 py-2.5 shadow-sm ${
                                isSelected ? 'ring-2 ring-orange-500 ' : ''
                              }${
                                isOwn
                                  ? `bg-orange-100 border border-orange-200 text-gray-800 ${isLastInGroup ? 'rounded-2xl rounded-br-md' : 'rounded-2xl'}`
                                  : `bg-white border border-gray-100 text-gray-800 ${isLastInGroup ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl'}`
                              }`}
                            >
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                              <p className="text-[10px] mt-1 text-gray-400">
                                {formatMessageTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  {isTyping && (
                    <div className="flex justify-start mb-3">
                      <div className="flex items-end gap-2">
                        <Avatar className="w-7 h-7 shadow-sm">
                          <AvatarImage src={selectedConversation.participant.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-200 to-amber-200 text-orange-700 text-xs">
                            {selectedConversation.participant.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-bl-md shadow-sm">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="flex-shrink-0 p-3 bg-white border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-xl hover:bg-orange-100/50 transition-colors flex-shrink-0">
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 min-w-0 py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-base"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="w-11 h-11 rounded-full bg-white flex-shrink-0 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-600">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col bg-white"
            >
              {/* List Header */}
              <div className="flex-shrink-0 p-4 border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => onNavigate('social')}
                      className="p-2 -ml-2 rounded-xl hover:bg-orange-100/50 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200/50">
                    <Coffee className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto p-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className="p-3 rounded-2xl cursor-pointer transition-all hover:bg-orange-50/50 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-12 h-12 ring-2 ring-white shadow-md">
                          <AvatarImage src={conv.participant.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-200 to-amber-200 text-orange-700 font-medium">
                            {conv.participant.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-lg">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-gray-900 truncate">{conv.participant.username}</span>
                          {conv.lastMessage && (
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              {formatTime(conv.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                            {conv.lastMessage.senderId === MY_USER_ID && <span className="text-gray-400">You: </span>}
                            {conv.lastMessage.text}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredConversations.length === 0 && (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-400">No conversations found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex h-full">
        {/* Sidebar */}
        <div className="w-80 lg:w-96 border-r border-gray-100 flex-shrink-0 flex flex-col bg-white">
          <div className="flex-shrink-0 p-4 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onNavigate('social')}
                  className="p-2 -ml-2 rounded-xl hover:bg-orange-100/50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200/50">
                <Coffee className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`p-3 rounded-2xl cursor-pointer transition-all ${
                  selectedConversation?.id === conv.id 
                    ? 'bg-gradient-to-r from-orange-100 to-amber-50' 
                    : 'hover:bg-orange-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12 ring-2 ring-white shadow-md">
                      <AvatarImage src={conv.participant.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-200 to-amber-200 text-orange-700 font-medium">
                        {conv.participant.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-gray-900 truncate">{conv.participant.username}</span>
                      {conv.lastMessage && (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {formatTime(conv.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                        {conv.lastMessage.senderId === MY_USER_ID && <span className="text-gray-400">You: </span>}
                        {conv.lastMessage.text}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <div className="h-full flex flex-col bg-gradient-to-b from-orange-50/30 to-white">
              {/* Header */}
              <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 ring-2 ring-orange-100 shadow-md">
                    <AvatarImage src={selectedConversation.participant.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-200 to-amber-200 text-orange-700">
                      {selectedConversation.participant.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedConversation.participant.username}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-400 rounded-full" />
                      <span className="text-xs text-gray-500">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSelectMode && selectedMessages.size > 0 && (
                    <button
                      onClick={handleDeleteSelectedMessages}
                      className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2.5 rounded-xl hover:bg-orange-100/50 transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleToggleSelectMode}>
                        <CheckSquare className="w-4 h-4 mr-2" />
                        {isSelectMode ? 'Cancel Selection' : 'Select Messages'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDeleteConversation} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBlockUser} className="text-red-600">
                        <Ban className="w-4 h-4 mr-2" />
                        Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-1 min-h-full flex flex-col justify-end">
                  {conversationMessages.map((message, index) => {
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
                          <div className="flex justify-center py-4">
                            <span className="px-4 py-1.5 bg-gray-100/80 rounded-full text-xs font-medium text-gray-500">
                              {formatDateSeparator(message.timestamp)}
                            </span>
                          </div>
                        )}
                        <div 
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'} ${isSelectMode ? 'cursor-pointer' : ''}`}
                          onClick={() => isSelectMode && handleToggleMessageSelection(message.id)}
                        >
                          <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                            {isSelectMode && (
                              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mb-1 flex items-center justify-center ${
                                isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                            )}
                            {!isOwn && !isSelectMode && (
                              <div className="w-7 h-7 flex-shrink-0 mb-1">
                                {showAvatar && (
                                  <Avatar className="w-7 h-7 shadow-sm">
                                    <AvatarImage src={selectedConversation.participant.avatar} />
                                    <AvatarFallback className="bg-gradient-to-br from-orange-200 to-amber-200 text-orange-700 text-xs">
                                      {selectedConversation.participant.username[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            )}
                            <div
                              className={`px-4 py-2.5 shadow-sm ${
                                isSelected ? 'ring-2 ring-orange-500 ' : ''
                              }${
                                isOwn
                                  ? `bg-orange-100 border border-orange-200 text-gray-800 ${isLastInGroup ? 'rounded-2xl rounded-br-md' : 'rounded-2xl'}`
                                  : `bg-white border border-gray-100 text-gray-800 ${isLastInGroup ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl'}`
                              }`}
                            >
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                              <p className="text-[10px] mt-1 text-gray-400">
                                {formatMessageTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  {isTyping && (
                    <div className="flex justify-start mb-3">
                      <div className="flex items-end gap-2">
                        <Avatar className="w-7 h-7 shadow-sm">
                          <AvatarImage src={selectedConversation.participant.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-200 to-amber-200 text-orange-700 text-xs">
                            {selectedConversation.participant.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-bl-md shadow-sm">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="flex-shrink-0 p-3 bg-white border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-xl hover:bg-orange-100/50 transition-colors flex-shrink-0">
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 min-w-0 py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-base"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="w-11 h-11 rounded-full bg-white flex-shrink-0 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-600">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-50/30 to-white">
              <div className="text-center max-w-sm px-4">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-100/50">
                  <Coffee className="w-12 h-12 text-orange-500" />
                </div>
                <h3 className="font-semibold text-xl text-gray-900 mb-2">Your Messages</h3>
                <p className="text-gray-500">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
