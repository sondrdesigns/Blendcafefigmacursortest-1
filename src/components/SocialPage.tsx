import React, { useState } from 'react';
import { Users, UserPlus, Activity, Check, X, Search, MessageCircle, Loader2, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { translations } from '../lib/mockData';
import { BackButton } from './BackButton';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Friend } from '../lib/types';
import { toast } from 'sonner';

interface SocialPageProps {
  onNavigate: (page: string, userId?: string) => void;
}

export function SocialPage({ onNavigate }: SocialPageProps) {
  const { language, friends: allFriends, acceptFriendRequest, declineFriendRequest, searchUsers, sendFriendRequest } = useApp();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());

  const friends = allFriends.filter(f => f.status === 'friends' || f.status === 'accepted');
  const requests = allFriends.filter(f => f.status === 'request');
  const pending = allFriends.filter(f => f.status === 'pending');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      console.log('🔍 Search results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search users');
    }
    setIsSearching(false);
  };

  const handleSendRequest = async (userId: string) => {
    setSendingRequests(prev => new Set(prev).add(userId));
    try {
      await sendFriendRequest(userId);
      toast.success('Friend request sent!');
      // Remove from search results since they're now in pending
      setSearchResults(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleAcceptRequest = async (friendId: string) => {
    try {
      await acceptFriendRequest(friendId);
      toast.success('Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (friendId: string) => {
    try {
      await declineFriendRequest(friendId);
      toast.success('Friend request declined');
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast.error('Failed to decline friend request');
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50 overflow-x-hidden">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <BackButton onNavigate={onNavigate} />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <h1 className="mb-2">{t.social}</h1>
          <p className="text-muted-foreground">
            {t.connectWithFriends}
          </p>
        </motion.div>

        {/* Search Bar */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={t.searchUsersPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : t.searchButton}
              </Button>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">{t.searchResults}:</p>
                {searchResults.map((result) => (
                  <div key={result.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={result.avatar} />
                      <AvatarFallback>{result.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{result.username}</p>
                      <p className="text-xs text-muted-foreground">{result.reviewCount} reviews</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleSendRequest(result.id)}
                      disabled={sendingRequests.has(result.id)}
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                    >
                      {sendingRequests.has(result.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          {t.addFriend}
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {searchQuery && searchResults.length === 0 && !isSearching && (
              <p className="mt-3 text-sm text-muted-foreground text-center">{t.noUsersFound}</p>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="friends" className="flex-row items-center gap-1 px-1.5 sm:px-3 py-2.5">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm">{t.friendsTab}</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 min-w-[20px]">{friends.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-row items-center gap-1 px-1.5 sm:px-3 py-2.5">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm">{t.requestsTab}</span>
              {requests.length > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0 h-5 min-w-[20px]">{requests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-row items-center gap-1 px-1.5 sm:px-3 py-2.5">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm">{t.activityTab}</span>
            </TabsTrigger>
          </TabsList>

          {/* Friends Tab */}
          <TabsContent value="friends">
            <div className="grid gap-4">
              {friends.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">{t.noFriendsYet}</p>
                    <p className="text-sm text-muted-foreground">{t.useSearchBarToAddFriends}</p>
                  </CardContent>
                </Card>
              ) : friends.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>{friend.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="mb-1 truncate">{friend.username}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground">
                            <span className="text-xs sm:text-sm">{friend.mutualFriends} mutual</span>
                            <span className="hidden sm:inline">•</span>
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {friend.reviewCount}
                              </Badge>
                              <span className="text-xs sm:text-sm">{t.reviews}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button variant="outline" size="sm" onClick={() => onNavigate('messages', friend.id)} className="flex-1 sm:flex-initial">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => onNavigate('profile', friend.id)} className="flex-1 sm:flex-initial text-sm">
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Friend Requests Tab */}
          <TabsContent value="requests">
            <div className="grid gap-4">
              {requests.length > 0 ? (
                requests.map((friend, index) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={friend.avatar} />
                            <AvatarFallback>{friend.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="mb-1">{friend.username}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span>{friend.mutualFriends} mutual friends</span>
                              <span>•</span>
                              <span>{friend.reviewCount} {t.reviews}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button size="sm" className="flex-1 sm:flex-initial" style={{ backgroundColor: 'var(--brand-primary)' }} onClick={() => handleAcceptRequest(friend.id)}>
                              <Check className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Accept</span>
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-initial" onClick={() => handleDeclineRequest(friend.id)}>
                              <X className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Decline</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <UserPlus className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No friend requests at this time</p>
                  </CardContent>
                </Card>
              )}

              {pending.length > 0 && (
                <>
                  <h3 className="mt-6 mb-3 text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Sent Requests ({pending.length})
                  </h3>
                  {pending.map((friend, index) => (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-dashed border-amber-200 bg-amber-50/50">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={friend.avatar} />
                              <AvatarFallback>{friend.username[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="mb-1 truncate">{friend.username}</h4>
                              <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                                <span>{friend.reviewCount} reviews</span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </TabsContent>

          {/* Activity Feed Tab */}
          <TabsContent value="activity">
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {friends.length === 0 
                    ? t.addFriendsToSeeActivity 
                    : t.noRecentActivity}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}