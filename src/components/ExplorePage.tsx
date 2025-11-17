import React, { useState, useEffect } from 'react';
import { Search, MapPin, SlidersHorizontal, Trophy, Navigation as NavigationIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { translations, categories, mockCafes } from '../lib/mockData';
import { Cafe } from '../lib/types';
import { CafeCard } from './CafeCard';
import { SkeletonCard } from './SkeletonCard';
import { AchievementsCard } from './AchievementsCard';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface ExplorePageProps {
  onNavigate: (page: string) => void;
}

export function ExplorePage({ onNavigate }: ExplorePageProps) {
  const { language, setSelectedCafe } = useApp();
  const t = translations[language];
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [cafes, setCafes] = useState<Cafe[]>([]);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setCafes(mockCafes);
      setLoading(false);
    }, 1000);
  }, []);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const filteredCafes = cafes.filter(cafe => {
    // Search filter
    if (searchQuery && !cafe.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter
    if (selectedCategories.length > 0) {
      const hasCategory = selectedCategories.some(cat =>
        cafe.categories.includes(cat)
      );
      if (!hasCategory) return false;
    }

    // Quick filters
    if (quickFilter === 'openNow' && cafe.status !== 'open') {
      return false;
    }

    return true;
  });

  // Apply sorting
  let sortedCafes = [...filteredCafes];
  if (quickFilter === 'highestRated') {
    sortedCafes.sort((a, b) => b.rating - a.rating);
  } else if (quickFilter === 'nearest') {
    sortedCafes.sort((a, b) => a.distance - b.distance);
  }

  const handleCafeClick = (cafe: Cafe) => {
    setSelectedCafe(cafe);
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="mb-2">Discover Cafés by Vibe</h1>
            <p className="text-muted-foreground">
              Find cafés that match what you're looking for
            </p>
          </motion.div>

          {/* Search and Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-3 mb-6"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Enter city or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <MapPin className="w-4 h-4" />
              Use Current Location
            </Button>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h3 className="mb-3">What's your vibe today?</h3>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2 transition-all hover:scale-105"
                  style={
                    selectedCategories.includes(category)
                      ? { backgroundColor: 'var(--brand-primary)' }
                      : {}
                  }
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </motion.div>

          {/* Quick Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 flex-wrap"
          >
            <span className="text-sm text-muted-foreground">{t.quickFilters}</span>
            <Button
              size="sm"
              variant={quickFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setQuickFilter('all')}
              style={quickFilter === 'all' ? { backgroundColor: 'var(--brand-primary)' } : {}}
            >
              {t.all}
            </Button>
            <Button
              size="sm"
              variant={quickFilter === 'openNow' ? 'default' : 'outline'}
              onClick={() => setQuickFilter('openNow')}
              style={quickFilter === 'openNow' ? { backgroundColor: 'var(--brand-primary)' } : {}}
            >
              {t.openNow}
            </Button>
            <Button
              size="sm"
              variant={quickFilter === 'highestRated' ? 'default' : 'outline'}
              onClick={() => setQuickFilter('highestRated')}
              style={quickFilter === 'highestRated' ? { backgroundColor: 'var(--brand-primary)' } : {}}
            >
              <Trophy className="w-4 h-4 mr-1" />
              {t.highestRated}
            </Button>
            <Button
              size="sm"
              variant={quickFilter === 'nearest' ? 'default' : 'outline'}
              onClick={() => setQuickFilter('nearest')}
              style={quickFilter === 'nearest' ? { backgroundColor: 'var(--brand-primary)' } : {}}
            >
              <NavigationIcon className="w-4 h-4 mr-1" />
              {t.nearest}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Cafe Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AchievementsCard />
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {sortedCafes.map((cafe, index) => (
              <CafeCard
                key={cafe.id}
                cafe={cafe}
                index={index}
                onClick={() => handleCafeClick(cafe)}
              />
            ))}
          </motion.div>
        )}

        {!loading && sortedCafes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-muted-foreground text-lg">
              No cafés found matching your criteria. Try adjusting your filters.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}