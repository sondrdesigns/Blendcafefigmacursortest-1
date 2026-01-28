import React, { useState } from 'react';
import { Trophy, Star, Coffee, Users, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

export function AchievementsCard() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { user, friends, favorites } = useApp();
  
  // Get actual user stats
  const friendCount = friends.filter(f => f.status === 'friends').length;
  const reviewCount = user?.reviewCount || 0;
  const visitedCount = user?.visitedCount || 0;
  const favoritesCount = favorites.length;
  
  const achievements = [
    {
      icon: Coffee,
      title: 'Coffee Explorer',
      description: 'Visit 10 different cafés',
      progress: visitedCount,
      total: 10,
      unlocked: visitedCount >= 10,
    },
    {
      icon: Star,
      title: 'Review Master',
      description: 'Write 25 reviews',
      progress: reviewCount,
      total: 25,
      unlocked: reviewCount >= 25,
    },
    {
      icon: Users,
      title: 'Social Butterfly',
      description: 'Add 50 friends',
      progress: friendCount,
      total: 50,
      unlocked: friendCount >= 50,
    },
    {
      icon: MapPin,
      title: 'Local Expert',
      description: 'Save 20 favorite cafés',
      progress: favoritesCount,
      total: 20,
      unlocked: favoritesCount >= 20,
    },
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div 
          className="flex items-center gap-2 mb-4 cursor-pointer" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Trophy className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
          <h3>Achievements</h3>
          <Badge variant="secondary" className="ml-auto">
            {achievements.filter(a => a.unlocked).length}/{achievements.length}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        
        {isExpanded && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Start reviewing cafés to unlock achievements!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        achievement.unlocked ? 'bg-yellow-400' : 'bg-gray-300'
                      }`}
                    >
                      <achievement.icon
                        className={`w-5 h-5 ${
                          achievement.unlocked ? 'text-white' : 'text-gray-500'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm mb-1">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">
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
          </>
        )}
      </CardContent>
    </Card>
  );
}