import React from 'react';
import { Star, MapPin, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Cafe } from '../lib/types';
import { useApp } from '../lib/AppContext';
import { translations } from '../lib/mockData';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface CafeCardProps {
  cafe: Cafe;
  index: number;
  onClick: () => void;
}

export function CafeCard({ cafe, index, onClick }: CafeCardProps) {
  const { language, favorites, addFavorite, removeFavorite } = useApp();
  const t = translations[language];
  const isFavorite = favorites.includes(cafe.id);

  const statusColors = {
    open: 'var(--status-open)',
    closed: 'var(--status-closed)',
    busy: 'var(--status-busy)',
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      removeFavorite(cafe.id);
    } else {
      addFavorite(cafe.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
      onClick={onClick}
      className="rounded-xl overflow-hidden border bg-card cursor-pointer transition-all"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="relative h-48 overflow-hidden group">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <ImageWithFallback
            src={cafe.image}
            alt={cafe.name}
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="absolute top-3 right-3">
          <Button
            size="sm"
            variant={isFavorite ? 'default' : 'secondary'}
            className="rounded-full w-9 h-9 p-0 shadow-md"
            onClick={handleFavoriteClick}
            style={isFavorite ? { backgroundColor: 'var(--brand-primary)' } : {}}
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`}
            />
          </Button>
        </div>
        <div
          className="absolute top-3 left-3 px-3 py-1 rounded-full text-white"
          style={{ backgroundColor: statusColors[cafe.status] }}
        >
          <span className="text-sm capitalize">{cafe.status}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="mb-1">{cafe.name}</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{cafe.rating}</span>
              <span className="text-xs">({cafe.reviewCount} {t.reviews})</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{cafe.distance} {t.miles}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {cafe.categories.slice(0, 3).map(category => (
            <Badge key={category} variant="secondary" className="text-xs">
              {category}
            </Badge>
          ))}
          {cafe.categories.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{cafe.categories.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {Array.from({ length: cafe.priceRange }).map((_, i) => (
            <span key={i} style={{ color: 'var(--brand-primary)' }}>
              $
            </span>
          ))}
          {Array.from({ length: 4 - cafe.priceRange }).map((_, i) => (
            <span key={i} className="text-gray-300">
              $
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
