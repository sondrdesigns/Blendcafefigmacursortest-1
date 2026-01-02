import React, { useState } from 'react';
import { X, Star, MapPin, Heart, Clock, Wifi, Users, Coffee, Sparkles, ChevronLeft, ChevronRight, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Cafe, Review } from '../lib/types';
import { useApp } from '../lib/AppContext';
import { translations, mockReviews, mockFriends } from '../lib/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

interface CafeDetailModalProps {
  cafe: Cafe | null;
  onClose: () => void;
}

export function CafeDetailModal({ cafe, onClose }: CafeDetailModalProps) {
  const { language, favorites, addFavorite, removeFavorite, friends } = useApp();
  const t = translations[language];
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  if (!cafe) return null;

  const isFavorite = favorites.includes(cafe.id);
  const reviews = mockReviews.filter(r => r.cafeId === cafe.id);
  
  // Get friends list (use context friends or fallback to mockFriends)
  const friendsList = friends?.filter(f => f.status === 'friends' || f.status === 'accepted') || 
    mockFriends.filter(f => f.status === 'friends');
  
  const handleFavoriteClick = () => {
    if (isFavorite) {
      removeFavorite(cafe.id);
    } else {
      addFavorite(cafe.id);
    }
  };

  const getCurrentDayData = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const dayData = cafe.popularTimes.find(pt => pt.day === today);
    
    if (!dayData) return [];
    
    return dayData.hours.map((value, index) => ({
      hour: `${index + 6}:00`,
      busyness: value,
    }));
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % cafe.photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + cafe.photos.length) % cafe.photos.length);
  };

  const handleShareToFriend = (friendId: string) => {
    setSendingTo(friendId);
    
    // Simulate sending message
    setTimeout(() => {
      setSelectedFriends(prev => [...prev, friendId]);
      setSendingTo(null);
      toast.success(`Shared ${cafe.name} with friend!`);
    }, 500);
  };

  const handleCloseShareDialog = () => {
    setShowShareDialog(false);
    setSelectedFriends([]);
  };

  return (
    <>
      <Dialog open={!!cafe} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-y-auto [&>button]:hidden">
          {/* Accessibility elements */}
          <DialogTitle className="sr-only">{cafe.name}</DialogTitle>
          <DialogDescription className="sr-only">
            {cafe.description}
          </DialogDescription>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Photo Gallery - Now scrolls with content */}
            <div className="relative h-64 md:h-80 overflow-hidden bg-black">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPhotoIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    <ImageWithFallback
                      src={cafe.photos[currentPhotoIndex]}
                      alt={cafe.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
                
                {cafe.photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {cafe.photos.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentPhotoIndex ? 'bg-white w-6' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                <Button
                  onClick={onClose}
                  variant="secondary"
                  size="sm"
                  className="absolute top-4 right-4 rounded-full w-10 h-10 p-0 z-10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6 pb-8">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="mb-2">{cafe.name}</h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{cafe.rating}</span>
                        <span>({cafe.reviewCount} {t.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{cafe.distance} {t.miles}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {cafe.location.address}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {cafe.categories.map(category => (
                        <Badge key={category} variant="secondary">
                          {t[category.toLowerCase() as keyof typeof t] || category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleFavoriteClick}
                      variant={isFavorite ? 'default' : 'outline'}
                      className="gap-2"
                      style={isFavorite ? { backgroundColor: 'var(--brand-primary)' } : {}}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                      {isFavorite ? 'Saved' : 'Save'}
                    </Button>
                    <Button
                      onClick={() => setShowShareDialog(true)}
                      variant="outline"
                      className="gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Share
                    </Button>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full grid grid-cols-4 h-auto">
                    <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4 py-2">{t.overview}</TabsTrigger>
                    <TabsTrigger value="hours" className="text-xs sm:text-sm px-2 sm:px-4 py-2">{t.hours}</TabsTrigger>
                    <TabsTrigger value="popular" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                      <span className="hidden sm:inline">{t.popularTimes}</span>
                      <span className="sm:hidden">{t.popularTimes?.split(' ')[0] || 'Popular'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="text-xs sm:text-sm px-2 sm:px-4 py-2">{t.reviews}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    {/* AI-Generated Summary */}
                    {cafe.aiSummary && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200"
                      >
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-900">{t.aiSummary}</span>
                      </div>
                        <p className="text-sm text-purple-800 leading-relaxed">
                          {cafe.aiSummary}
                        </p>
                      </motion.div>
                    )}

                    {/* Fallback to regular description if no AI summary */}
                    {!cafe.aiSummary && (
                      <div>
                        <p className="text-sm leading-relaxed">{cafe.description}</p>
                      </div>
                    )}

                    {/* Categorized Reviews Section */}
                    {cafe.categorizedReviews && cafe.categorizedReviews.length > 0 && (
                      <div>
                        <h4 className="mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                          {t.whatPeopleSay}
                        </h4>
                        <div className="space-y-3">
                          {cafe.categorizedReviews.map((review, index) => (
                            <motion.div
                              key={review.category}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`p-3 rounded-lg border ${
                                review.sentiment === 'positive'
                                  ? 'bg-green-50 border-green-200'
                                  : review.sentiment === 'negative'
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge 
                                  variant="secondary" 
                                  className="font-medium"
                                  style={{ backgroundColor: 'var(--brand-primary)', color: 'white' }}
                                >
                                  {review.category}
                                </Badge>
                                <span className={`text-xs font-medium ${
                                  review.sentiment === 'positive'
                                    ? 'text-green-700'
                                    : review.sentiment === 'negative'
                                    ? 'text-red-700'
                                    : 'text-gray-700'
                                }`}>
                                  {review.sentiment === 'positive' ? `👍 ${t.positive}` : 
                                   review.sentiment === 'negative' ? `👎 ${t.negative}` : 
                                   `😐 ${t.neutral}`}
                                </span>
                              </div>
                              <p className="text-sm mb-2 leading-relaxed text-gray-700">
                                {review.summary}
                              </p>
                              {review.highlights && review.highlights.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {review.highlights.map((highlight, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-1 rounded-full bg-white/50 text-gray-600"
                                    >
                                      "{highlight}"
                                    </span>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legacy AI Analysis (keep for compatibility) */}
                    {cafe.aiAnalysis && !cafe.aiSummary && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                          <span className="font-medium text-purple-900">AI Analysis</span>
                        </div>
                        <p className="text-sm text-purple-800 leading-relaxed">
                          {cafe.aiAnalysis}
                        </p>
                      </motion.div>
                    )}

                    {/* Amenities */}
                    <div>
                      <h4 className="mb-2">Amenities</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {cafe.amenities.map(amenity => (
                          <div key={amenity} className="flex items-center gap-2 text-sm">
                            <Coffee className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="hours" className="mt-4">
                    <div className="space-y-2">
                      {cafe.hours.map(({ day, open, close }) => (
                        <div key={day} className="flex justify-between py-2 border-b">
                          <span className="font-medium">{day}</span>
                          <span className="text-muted-foreground">
                            {open} - {close}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="popular" className="mt-4">
                    <div>
                      <h4 className="mb-4">Busyness Throughout the Day</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={getCurrentDayData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="busyness" fill="var(--brand-primary)" />
                        </BarChart>
                      </ResponsiveContainer>
                      <p className="text-sm text-muted-foreground mt-4">
                        * Based on typical activity for today
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-4">
                    <div className="space-y-4">
                      {reviews.length > 0 ? (
                        reviews.map(review => (
                          <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <Avatar>
                                <AvatarImage src={review.userAvatar} />
                                <AvatarFallback>{review.username[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">{review.username}</span>
                                  <span className="text-xs text-muted-foreground">{review.date}</span>
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'fill-gray-200 text-gray-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <p className="text-sm leading-relaxed">{review.text}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No reviews yet. Be the first to review!
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Share to Friend Dialog */}
      <Dialog open={showShareDialog} onOpenChange={handleCloseShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Café</DialogTitle>
            <DialogDescription>
              Send {cafe.name} to a friend
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {/* Cafe Preview */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={cafe.photos[0]}
                    alt={cafe.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{cafe.name}</h4>
                  <p className="text-sm text-gray-500 truncate">{cafe.location.address}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-600">{cafe.rating}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Friends List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {friendsList.length > 0 ? (
                friendsList.map((friend) => {
                  const isSent = selectedFriends.includes(friend.id);
                  const isSending = sendingTo === friend.id;
                  
                  return (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-200 to-amber-200 text-orange-700">
                            {friend.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-900">{friend.username}</span>
                      </div>
                      <button
                        onClick={() => !isSent && !isSending && handleShareToFriend(friend.id)}
                        disabled={isSent || isSending}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          isSent
                            ? 'bg-green-100 text-green-700'
                            : isSending
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-lg'
                        }`}
                      >
                        {isSent ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            Sent
                          </span>
                        ) : isSending ? (
                          'Sending...'
                        ) : (
                          <span className="flex items-center gap-1">
                            <Send className="w-4 h-4" />
                            Send
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No friends to share with yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleCloseShareDialog}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
