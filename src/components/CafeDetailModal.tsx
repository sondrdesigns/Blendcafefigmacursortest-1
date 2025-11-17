import React, { useState } from 'react';
import { X, Star, MapPin, Heart, Clock, Wifi, Users, Coffee, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Cafe, Review } from '../lib/types';
import { useApp } from '../lib/AppContext';
import { translations, mockReviews } from '../lib/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface CafeDetailModalProps {
  cafe: Cafe | null;
  onClose: () => void;
}

export function CafeDetailModal({ cafe, onClose }: CafeDetailModalProps) {
  const { language, favorites, addFavorite, removeFavorite } = useApp();
  const t = translations[language];
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  if (!cafe) return null;

  const isFavorite = favorites.includes(cafe.id);
  const reviews = mockReviews.filter(r => r.cafeId === cafe.id);
  
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

  return (
    <Dialog open={!!cafe} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col h-full"
        >
          {/* Photo Gallery */}
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
              className="absolute top-4 right-4 rounded-full w-10 h-10 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
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
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleFavoriteClick}
                  variant={isFavorite ? 'default' : 'outline'}
                  className="gap-2"
                  style={isFavorite ? { backgroundColor: 'var(--brand-primary)' } : {}}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Saved' : 'Save'}
                </Button>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="hours">Hours</TabsTrigger>
                  <TabsTrigger value="popular">Popular Times</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div>
                    <p className="text-sm leading-relaxed">{cafe.description}</p>
                  </div>

                  {cafe.aiAnalysis && (
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
          </ScrollArea>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
