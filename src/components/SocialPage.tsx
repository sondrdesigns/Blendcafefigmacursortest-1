import React, { useState } from 'react';
import { Users, UserPlus, Activity, Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { translations, mockFriends, mockActivities } from '../lib/mockData';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function SocialPage() {
  const { language, friendRequestCount } = useApp();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState('friends');

  const friends = mockFriends.filter(f => f.status === 'friends');
  const requests = mockFriends.filter(f => f.status === 'request');
  const pending = mockFriends.filter(f => f.status === 'pending');

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="mb-2">{t.social}</h1>
          <p className="text-muted-foreground">
            Connect with friends and see what cafés they're enjoying
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="friends" className="gap-2">
              <Users className="w-4 h-4" />
              {t.friends}
              <Badge variant="secondary">{friends.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <UserPlus className="w-4 h-4" />
              {t.friendRequests}
              {requests.length > 0 && (
                <Badge variant="destructive">{requests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              {t.activityFeed}
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
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>{friend.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="mb-1">{friend.username}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{friend.mutualFriends} mutual friends</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {friend.reviewCount}
                              </Badge>
                              <span>{t.reviews}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Profile
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
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={friend.avatar} />
                            <AvatarFallback>{friend.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="mb-1">{friend.username}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{friend.mutualFriends} mutual friends</span>
                              <span>•</span>
                              <span>{friend.reviewCount} {t.reviews}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" style={{ backgroundColor: 'var(--brand-primary)' }}>
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button variant="outline" size="sm">
                              <X className="w-4 h-4 mr-1" />
                              Decline
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
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={friend.avatar} />
                              <AvatarFallback>{friend.username[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="mb-1">{friend.username}</h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{friend.mutualFriends} mutual friends</span>
                              </div>
                            </div>
                            <Badge variant="secondary">Pending</Badge>
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
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={activity.userAvatar} />
                          <AvatarFallback>{activity.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="font-medium">{activity.username}</span>
                            {activity.type === 'review' && ' reviewed '}
                            {activity.type === 'visit' && ' visited '}
                            {activity.type === 'favorite' && ' favorited '}
                            <span className="font-medium">{activity.cafeName}</span>
                          </div>
                          {activity.rating && (
                            <div className="flex items-center gap-2 mb-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-sm ${
                                    i < activity.rating! ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          )}
                          {activity.text && (
                            <p className="text-sm text-muted-foreground mb-2">
                              "{activity.text}"
                            </p>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {activity.timestamp}
                          </span>
                        </div>
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
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
