import React, { useState } from 'react';
import { Users, UserPlus, Activity, Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { translations, mockActivities } from '../lib/mockData';
import { BackButton } from './BackButton';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SocialPageProps {
  onNavigate: (page: string, userId?: string) => void;
}

export function SocialPage({ onNavigate }: SocialPageProps) {
  const { language, friends: allFriends, acceptFriendRequest, declineFriendRequest } = useApp();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState('friends');

  const friends = allFriends.filter(f => f.status === 'friends' || f.status === 'accepted');
  const requests = allFriends.filter(f => f.status === 'request');
  const pending = allFriends.filter(f => f.status === 'pending');

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
              {friends.map((friend, index) => (
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
                        <Button variant="outline" size="sm" onClick={() => onNavigate('profile', friend.id)} className="w-full sm:w-auto text-sm">
                          View
                        </Button>
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
                            <Button size="sm" className="flex-1 sm:flex-initial" style={{ backgroundColor: 'var(--brand-primary)' }} onClick={() => acceptFriendRequest(friend.id)}>
                              <Check className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Accept</span>
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-initial" onClick={() => declineFriendRequest(friend.id)}>
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
                  <h3 className="mt-6 mb-3">Pending Requests</h3>
                  {pending.map((friend, index) => (
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
                              <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                                <span>{friend.mutualFriends} mutual</span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">Pending</Badge>
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
            <div className="grid gap-4">
              {mockActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex gap-3 sm:gap-4">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={activity.userAvatar} />
                          <AvatarFallback>{activity.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="mb-2 text-sm sm:text-base">
                            <span className="font-medium">{activity.username}</span>
                            {activity.type === 'review' && ' reviewed '}
                            {activity.type === 'visit' && ' visited '}
                            {activity.type === 'favorite' && ' favorited '}
                            <span className="font-medium break-words">{activity.cafeName}</span>
                          </div>
                          {activity.rating && (
                            <div className="flex items-center gap-1 mb-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-xs sm:text-sm ${
                                    i < activity.rating! ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          )}
                          {activity.text && (
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                              "{activity.text}"
                            </p>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {activity.timestamp}
                          </span>
                        </div>
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src={activity.cafeImage}
                            alt={activity.cafeName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}