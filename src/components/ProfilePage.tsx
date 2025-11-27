import React, { useState } from 'react';
import { Edit2, MapPin, Calendar, Trophy, Star, Coffee, Heart, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { translations } from '../lib/mockData';
import { BackButton } from './BackButton';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  userId?: string; // If provided, shows that user's profile; otherwise shows current user
}

export function ProfilePage({ onNavigate, userId }: ProfilePageProps) {
  const { language, user } = useApp();
  const t = translations[language];
  const isOwnProfile = !userId || userId === user.id;

  // Mock data for profile
  const profileData = {
    id: userId || user.id,
    username: isOwnProfile ? user.username : 'emma_coffee',
    email: isOwnProfile ? user.email : 'emma@example.com',
    avatar: isOwnProfile ? user.avatar : 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
    bio: isOwnProfile 
      ? 'Coffee enthusiast ☕ | Always seeking the perfect brew | NYC'
      : 'Specialty coffee lover | Latte art enthusiast | Brooklyn',
    location: 'New York, NY',
    memberSince: 'January 2024',
    reviewCount: isOwnProfile ? user.reviewCount : 28,
    friendCount: isOwnProfile ? user.friendCount : 64,
    favoritesCount: 12,
    visitedCount: 45,
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
    { label: 'Reviews', value: profileData.reviewCount, icon: MessageSquare },
    { label: 'Friends', value: profileData.friendCount, icon: Heart },
    { label: 'Favorites', value: profileData.favoritesCount, icon: Star },
    { label: 'Visited', value: profileData.visitedCount, icon: Coffee },
  ];

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
                    <div className="flex gap-2 mt-4 justify-center sm:justify-start">
                      <Button style={{ backgroundColor: 'var(--brand-primary)' }}>
                        <Heart className="w-4 h-4 mr-2" />
                        Add Friend
                      </Button>
                      <Button variant="outline">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="achievements" className="space-y-6">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span>Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Reviews</span>
            </TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3>Achievements</h3>
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