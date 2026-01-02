import React, { useState } from 'react';
import { Heart, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { translations, mockCafes } from '../lib/mockData';
import { BackButton } from './BackButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CafeCard } from './CafeCard';

interface CollectionsPageProps {
  type: 'favorites' | 'wantToTry' | 'combined';
  onNavigate: (page: string) => void;
}

export function CollectionsPage({ type, onNavigate }: CollectionsPageProps) {
  const { language, favorites, wantToTry, setSelectedCafe } = useApp();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'favorites' | 'wantToTry'>(
    type === 'combined' ? 'favorites' : type
  );

  const favoriteCafes = mockCafes.filter(cafe => favorites.includes(cafe.id));
  const wantToTryCafes = mockCafes.filter(cafe => wantToTry.includes(cafe.id));

  const handleCafeClick = (cafe: any) => {
    setSelectedCafe(cafe);
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <BackButton onNavigate={onNavigate} />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="mb-2">{t.myCollections}</h1>
          <p className="text-muted-foreground">
            {t.myCollectionsDescription}
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'favorites' | 'wantToTry')}>
          <TabsList className="mb-6">
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="w-4 h-4" />
              {t.favorites}
              <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {favoriteCafes.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="wantToTry" className="gap-2">
              <Star className="w-4 h-4" />
              {t.wantToTry}
              <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {wantToTryCafes.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            {favoriteCafes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteCafes.map((cafe, index) => (
                  <CafeCard
                    key={cafe.id}
                    cafe={cafe}
                    index={index}
                    onClick={() => handleCafeClick(cafe)}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="mb-2">No favorites yet</h3>
                <p className="text-muted-foreground">
                  Start exploring and save your favorite cafés
                </p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="wantToTry">
            {wantToTryCafes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wantToTryCafes.map((cafe, index) => (
                  <CafeCard
                    key={cafe.id}
                    cafe={cafe}
                    index={index}
                    onClick={() => handleCafeClick(cafe)}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="mb-2">No places saved to try</h3>
                <p className="text-muted-foreground">
                  Discover new cafés and add them to your list
                </p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}