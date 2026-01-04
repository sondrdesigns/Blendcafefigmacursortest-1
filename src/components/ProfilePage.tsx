import React, { useState, useEffect } from 'react';
import { Edit2, MapPin, Calendar, Trophy, Star, Coffee, Heart, MessageSquare, Settings as SettingsIcon, UserPlus, UserCheck, Users, Lock, ThumbsUp, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { translations, mockCafes } from '../lib/mockData';
import { BackButton } from './BackButton';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  onOpenMessages?: (friendId: string) => void;
  userId?: string; // If provided, shows that user's profile; otherwise shows current user
}

interface ViewedUser {
  id: string;
  username: string;
  email?: string;
  avatar: string;
  bio?: string;
  location?: string;
  reviewCount: number;
  friendCount: number;
  visibility?: 'public' | 'private';
}

export function ProfilePage({ onNavigate, onOpenMessages, userId }: ProfilePageProps) {
  const { language, user, friends, favorites, sendFriendRequest } = useApp();
  const t = translations[language];
  const isOwnProfile = !userId || userId === user?.id;
  const [viewedUser, setViewedUser] = useState<ViewedUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);

  // Load viewed user's profile from Firestore
  useEffect(() => {
    if (!isOwnProfile && userId) {
      const loadUserProfile = async () => {
        setLoadingUser(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setViewedUser({
              id: userId,
              username: data.username || 'User',
              email: data.email,
              avatar: data.avatar || '/default-avatar.svg',
              bio: data.bio || '',
              location: data.location || '',
              reviewCount: data.reviewCount || 0,
              friendCount: data.friendCount || 0,
              visibility: data.visibility || 'public',
            });
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
        setLoadingUser(false);
      };
      loadUserProfile();
    }
  }, [userId, isOwnProfile]);

  // Find the friend data if viewing someone else's profile (from local friends list)
  const friendData = userId ? friends.find(f => f.id === userId) : null;
  
  // Check friendship status
  const isFriend = friendData ? (friendData.status === 'friends' || friendData.status === 'accepted') : false;
  const isPending = friendData?.status === 'pending';
  const isRequest = friendData?.status === 'request';
  
  // Determine if we can view their collections (public OR private but friends)
  const canViewCollections = isOwnProfile || 
    (viewedUser?.visibility === 'public') || 
    (viewedUser?.visibility === 'private' && isFriend);

  // Profile data - use real data from Firestore
  const profileData = {
    id: userId || user?.id || '',
    username: isOwnProfile ? (user?.username || 'User') : (viewedUser?.username || 'User'),
    email: isOwnProfile ? (user?.email || '') : (viewedUser?.email || ''),
    avatar: isOwnProfile ? (user?.avatar || '/default-avatar.svg') : (viewedUser?.avatar || '/default-avatar.svg'),
    bio: isOwnProfile 
      ? (user?.bio || 'No bio yet')
      : (viewedUser?.bio || 'No bio yet'),
    location: isOwnProfile ? (user?.location || 'Not set') : (viewedUser?.location || 'Not set'),
    memberSince: 'January 2024',
    reviewCount: isOwnProfile ? (user?.reviewCount || 0) : (viewedUser?.reviewCount || 0),
    friendCount: isOwnProfile ? (friends.filter(f => f.status === 'friends' || f.status === 'accepted').length) : (viewedUser?.friendCount || 0),
    favoritesCount: isOwnProfile ? favorites.length : 0,
    visitedCount: 0, // Will be loaded from Firestore if needed
    likedCount: 0,   // Will be loaded from Firestore if needed
    visibility: viewedUser?.visibility || 'public',
    mutualFriends: friendData?.mutualFriends || 0,
  };

  // Get cafe data for favorites, visited, liked
  const getFavorites = () => {
    const ids = friendData?.favorites || ['1', '3', '5'];
    return mockCafes.filter(c => ids.includes(c.id));
  };
  
  const getVisited = () => {
    const ids = friendData?.visited || ['1', '2', '3', '4', '5'];
    return mockCafes.filter(c => ids.includes(c.id));
  };
  
  const getLiked = () => {
    const ids = friendData?.liked || ['1', '2', '5'];
    return mockCafes.filter(c => ids.includes(c.id));
  };

  // Get mutual friends
  const getMutualFriends = () => {
    // Return first few friends as "mutual" for demo
    return friends.filter(f => f.status === 'friends').slice(0, profileData.mutualFriends > 3 ? 3 : profileData.mutualFriends);
  };

  const achievements = [
    {
      icon: Coffee,
      title: 'Coffee Explorer',
      description: 'Visit 10 different cafés',
      progress: 6,
      total: 10,
      unlocked: false,
    },
    {
      icon: Star,
      title: 'Review Master',
      description: 'Write 25 reviews',
      progress: 42,
      total: 25,
      unlocked: true,
    },
    {
      icon: Heart,
      title: 'Social Butterfly',
      description: 'Add 50 friends',
      progress: 128,
      total: 50,
      unlocked: true,
    },
    {
      icon: MapPin,
      title: 'Local Expert',
      description: 'Discover all cafés in your area',
      progress: 15,
      total: 20,
      unlocked: false,
    },
    {
      icon: Trophy,
      title: 'Top Reviewer',
      description: 'Get 100 helpful votes',
      progress: 67,
      total: 100,
      unlocked: false,
    },
    {
      icon: Coffee,
      title: 'Early Bird',
      description: 'Visit 5 cafés before 8am',
      progress: 3,
      total: 5,
      unlocked: false,
    },
  ];

  const recentReviews = [
    {
      id: '1',
      cafeName: 'Artisan Brew House',
      rating: 5,
      comment: 'Amazing coffee and great atmosphere! The baristas really know their craft.',
      date: '2 days ago',
      helpfulCount: 12,
    },
    {
      id: '2',
      cafeName: 'Cozy Corner Café',
      rating: 4,
      comment: 'Perfect spot for getting work done. Fast WiFi and comfortable seating.',
      date: '1 week ago',
      helpfulCount: 8,
    },
    {
      id: '3',
      cafeName: 'Morning Ritual',
      rating: 5,
      comment: 'Best cappuccino in the city! Love their latte art.',
      date: '2 weeks ago',
      helpfulCount: 15,
    },
  ];

  const stats = [
    { label: t.reviews, value: profileData.reviewCount, icon: MessageSquare },
    { label: t.friends, value: profileData.friendCount, icon: Users },
    { label: t.favorites, value: profileData.favoritesCount, icon: Star },
    { label: t.visited || 'Visited', value: profileData.visitedCount, icon: Coffee },
  ];

  const handleAddFriend = async () => {
    if (!userId || addingFriend) return;
    setAddingFriend(true);
    try {
      await sendFriendRequest(userId);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
    setAddingFriend(false);
  };

  const handleMessage = () => {
    if (onOpenMessages && userId) {
      onOpenMessages(userId);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <BackButton onNavigate={onNavigate} />
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <Avatar className="w-24 h-24 sm:w-32 sm:h-32 mx-auto sm:mx-0">
                  <AvatarImage src={profileData.avatar} />
                  <AvatarFallback>{profileData.username[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                    <h1 className="text-2xl sm:text-3xl">{profileData.username}</h1>
                    {isOwnProfile && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onNavigate('settings')}
                        className="mx-auto sm:mx-0"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-3">{profileData.bio}</p>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profileData.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {profileData.memberSince}</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="text-center p-3 rounded-lg bg-gray-50"
                      >
                        <stat.icon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                        <div className="font-semibold" style={{ color: 'var(--brand-primary)' }}>
                          {stat.value}
                        </div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {!isOwnProfile && (
                    <>
                      {/* Mutual Friends Section */}
                      {profileData.mutualFriends > 0 && (
                        <div className="flex items-center gap-2 mt-4 justify-center sm:justify-start">
                          <div className="flex -space-x-2">
                            {getMutualFriends().map((friend) => (
                              <Avatar key={friend.id} className="w-6 h-6 border-2 border-white">
                                <AvatarImage src={friend.avatar} />
                                <AvatarFallback className="text-xs">{friend.username[0]}</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {profileData.mutualFriends} mutual friend{profileData.mutualFriends !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 justify-center sm:justify-start">
                        {isFriend ? (
                          // Already friends - show "Friends" badge
                          <Button variant="outline" disabled className="cursor-default">
                            <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                            Friends
                          </Button>
                        ) : isPending ? (
                          // Pending request - show "Request Sent"
                          <Button variant="outline" disabled className="cursor-default">
                            <CheckCircle className="w-4 h-4 mr-2 text-amber-500" />
                            Request Sent
                          </Button>
                        ) : isRequest ? (
                          // They sent us a request - show "Accept Request"
                          <Button style={{ backgroundColor: 'var(--brand-primary)' }} onClick={handleAddFriend}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Accept Request
                          </Button>
                        ) : (
                          // Not friends - show "Add Friend"
                          <Button 
                            style={{ backgroundColor: 'var(--brand-primary)' }} 
                            onClick={handleAddFriend}
                            disabled={addingFriend}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            {addingFriend ? 'Adding...' : 'Add Friend'}
                          </Button>
                        )}
                        <Button variant="outline" onClick={handleMessage}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue={isOwnProfile ? "achievements" : "favorites"} className="space-y-6">
          <TabsList className="w-full grid grid-cols-5 h-auto">
            {isOwnProfile && (
              <TabsTrigger value="achievements" className="gap-1 px-2 py-2.5">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">{t.achievements}</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="favorites" className="gap-1 px-2 py-2.5">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">{t.favorites}</span>
            </TabsTrigger>
            <TabsTrigger value="visited" className="gap-1 px-2 py-2.5">
              <Coffee className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">{t.visited || 'Visited'}</span>
            </TabsTrigger>
            <TabsTrigger value="liked" className="gap-1 px-2 py-2.5">
              <ThumbsUp className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Liked</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1 px-2 py-2.5">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">{t.reviews}</span>
            </TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          {isOwnProfile && (
            <TabsContent value="achievements">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3>{t.achievements}</h3>
                      <Badge variant="secondary">
                        {achievements.filter(a => a.unlocked).length}/{achievements.length} Unlocked
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {achievements.map((achievement, index) => (
                        <motion.div
                          key={achievement.title}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-lg border ${
                            achievement.unlocked
                              ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                achievement.unlocked ? 'bg-yellow-400' : 'bg-gray-300'
                              }`}
                            >
                              <achievement.icon
                                className={`w-6 h-6 ${
                                  achievement.unlocked ? 'text-white' : 'text-gray-500'
                                }`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm">{achievement.title}</h4>
                                {achievement.unlocked && (
                                  <Badge variant="secondary" className="text-xs">Unlocked</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">
                                {achievement.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={(achievement.progress / achievement.total) * 100}
                                  className="flex-1 h-2"
                                />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {Math.min(achievement.progress, achievement.total)}/{achievement.total}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {canViewCollections ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {getFavorites().map((cafe, index) => (
                        <motion.div
                          key={cafe.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50/50 transition-colors cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                            <Star className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{cafe.name}</h4>
                            <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {cafe.location.address}
                            </p>
                          </div>
                          <Badge variant="secondary" className="flex-shrink-0">
                            <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                            {cafe.rating}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Lock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <h4 className="font-medium mb-2">Private Profile</h4>
                    <p className="text-muted-foreground text-sm">
                      This user's favorites are private. Add them as a friend to see their collections.
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>

          {/* Visited Tab */}
          <TabsContent value="visited">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {canViewCollections ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {getVisited().map((cafe, index) => (
                        <motion.div
                          key={cafe.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50/50 transition-colors cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                            <Coffee className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{cafe.name}</h4>
                            <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {cafe.location.address}
                            </p>
                          </div>
                          <Badge variant="secondary" className="flex-shrink-0">
                            <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                            {cafe.rating}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Lock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <h4 className="font-medium mb-2">Private Profile</h4>
                    <p className="text-muted-foreground text-sm">
                      This user's visited places are private. Add them as a friend to see their collections.
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>

          {/* Liked Tab */}
          <TabsContent value="liked">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {canViewCollections ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {getLiked().map((cafe, index) => (
                        <motion.div
                          key={cafe.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50/50 transition-colors cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center flex-shrink-0">
                            <ThumbsUp className="w-5 h-5 text-pink-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{cafe.name}</h4>
                            <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {cafe.location.address}
                            </p>
                          </div>
                          <Badge variant="secondary" className="flex-shrink-0">
                            <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                            {cafe.rating}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Lock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <h4 className="font-medium mb-2">Private Profile</h4>
                    <p className="text-muted-foreground text-sm">
                      This user's liked places are private. Add them as a friend to see their collections.
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {recentReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="mb-1">{review.cafeName}</h4>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {review.date}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-3">{review.comment}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Heart className="w-4 h-4" />
                        <span>{review.helpfulCount} found this helpful</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}