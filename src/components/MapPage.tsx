import React, { useState } from 'react';
import { Search, SlidersHorizontal, List, Maximize2, Navigation2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { translations, mockCafes } from '../lib/mockData';
import { Cafe } from '../lib/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Slider } from './ui/slider';

export function MapPage() {
  const { language, setSelectedCafe } = useApp();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState([1.2]);
  const [selectedMapCafe, setSelectedMapCafe] = useState<Cafe | null>(null);

  const handleMarkerClick = (cafe: Cafe) => {
    setSelectedMapCafe(cafe);
  };

  const handleViewDetails = () => {
    if (selectedMapCafe) {
      setSelectedCafe(selectedMapCafe);
    }
  };

  return (
    <div className="h-[calc(100vh-73px)] relative overflow-hidden">
      {/* Map Background - Code-based design */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        {/* Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-300"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        {/* Street-like lines */}
        <svg className="absolute inset-0 w-full h-full">
          <line x1="30%" y1="0%" x2="30%" y2="100%" stroke="#d1d5db" strokeWidth="2" />
          <line x1="60%" y1="0%" x2="60%" y2="100%" stroke="#d1d5db" strokeWidth="2" />
          <line x1="0%" y1="40%" x2="100%" y2="40%" stroke="#d1d5db" strokeWidth="3" />
          <line x1="0%" y1="65%" x2="100%" y2="65%" stroke="#d1d5db" strokeWidth="2" />
        </svg>
        
        {/* Neighborhood blocks */}
        <div className="absolute top-[10%] left-[10%] w-40 h-32 bg-green-100 opacity-30 rounded-sm" />
        <div className="absolute top-[20%] right-[15%] w-48 h-40 bg-green-50 opacity-40 rounded-sm" />
        <div className="absolute bottom-[15%] left-[20%] w-56 h-36 bg-blue-50 opacity-30 rounded-sm" />
        <div className="absolute bottom-[25%] right-[10%] w-44 h-44 bg-green-100 opacity-25 rounded-sm" />
        
        {/* Building-like rectangles */}
        {[...Array(15)].map((_, i) => {
          const positions = [
            { top: '15%', left: '25%', width: 16, height: 20 },
            { top: '18%', left: '35%', width: 20, height: 24 },
            { top: '25%', left: '15%', width: 14, height: 18 },
            { top: '32%', left: '45%', width: 18, height: 22 },
            { top: '45%', left: '20%', width: 16, height: 20 },
            { top: '50%', left: '40%', width: 22, height: 26 },
            { top: '55%', left: '55%', width: 18, height: 20 },
            { top: '60%', left: '28%', width: 16, height: 22 },
            { top: '22%', left: '65%', width: 20, height: 24 },
            { top: '35%', left: '70%', width: 16, height: 18 },
            { top: '48%', left: '75%', width: 18, height: 22 },
            { top: '68%', left: '65%', width: 20, height: 24 },
            { top: '15%', left: '80%', width: 16, height: 20 },
            { top: '70%', left: '15%', width: 18, height: 20 },
            { top: '72%', left: '48%', width: 16, height: 22 },
          ];
          const pos = positions[i];
          return (
            <div
              key={i}
              className="absolute bg-gray-200 opacity-40 rounded-sm"
              style={{
                top: pos.top,
                left: pos.left,
                width: `${pos.width}px`,
                height: `${pos.height}px`,
              }}
            />
          );
        })}
        
        {/* Water feature */}
        <motion.div
          animate={{
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-0 left-[5%] right-[5%] h-24 bg-blue-200 rounded-t-3xl"
        />
        
        {/* Your location indicator */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 blur-md w-12 h-12 -m-2" />
            <Navigation2 className="w-8 h-8 text-blue-600 relative z-10" fill="currentColor" />
          </div>
        </motion.div>

        {/* Cafe Markers */}
        {mockCafes.map((cafe, index) => {
          // Position markers randomly for demo
          const positions = [
            { top: '45%', left: '48%' },
            { top: '52%', left: '46%' },
            { top: '38%', left: '50%' },
            { top: '55%', left: '52%' },
            { top: '42%', left: '54%' },
            { top: '48%', left: '44%' },
          ];
          const pos = positions[index] || { top: '50%', left: '50%' };

          return (
            <motion.button
              key={cafe.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.2 }}
              onClick={() => handleMarkerClick(cafe)}
              className="absolute w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer z-20"
              style={{
                top: pos.top,
                left: pos.left,
                backgroundColor: selectedMapCafe?.id === cafe.id ? 'var(--brand-accent)' : 'var(--brand-primary)',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="text-white">☕</span>
            </motion.button>
          );
        })}
      </div>

      {/* Search and Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-lg shadow-lg p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search 'downtown' or 'S..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <Button size="sm" variant="outline" style={{ color: 'var(--brand-primary)' }}>
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Radius: {radiusMiles[0]}mi</span>
              <button
                onClick={() => setShowList(!showList)}
                className="flex items-center gap-1 text-sm hover:underline"
                style={{ color: 'var(--brand-primary)' }}
              >
                {showList ? <Maximize2 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                {showList ? 'Hide List' : 'Show List'}
              </button>
            </div>
            <Slider
              value={radiusMiles}
              onValueChange={setRadiusMiles}
              max={12.4}
              min={0.3}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-muted-foreground">Filters</span>
          </div>
        </motion.div>

        {/* Cafe List */}
        {showList && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto"
          >
            <div className="p-4 space-y-2">
              {mockCafes.map((cafe) => (
                <button
                  key={cafe.id}
                  onClick={() => handleMarkerClick(cafe)}
                  className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                    selectedMapCafe?.id === cafe.id
                      ? 'border-current shadow-sm'
                      : 'border-gray-200'
                  }`}
                  style={
                    selectedMapCafe?.id === cafe.id
                      ? { borderColor: 'var(--brand-primary)' }
                      : {}
                  }
                >
                  <h4 className="mb-1 text-sm">{cafe.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>⭐ {cafe.rating}</span>
                    <span>•</span>
                    <span>{cafe.distance} mi</span>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={
                        cafe.status === 'open'
                          ? { backgroundColor: 'var(--status-open)', color: 'white' }
                          : cafe.status === 'busy'
                          ? { backgroundColor: 'var(--status-busy)', color: 'white' }
                          : {}
                      }
                    >
                      {cafe.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Selected Cafe Card */}
      {selectedMapCafe && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-10"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div
                  className="w-20 h-20 rounded-lg bg-cover bg-center flex-shrink-0"
                  style={{ backgroundImage: `url(${selectedMapCafe.image})` }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="mb-1 truncate">{selectedMapCafe.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span>⭐ {selectedMapCafe.rating}</span>
                    <span>•</span>
                    <span>{selectedMapCafe.distance} mi</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedMapCafe.categories.slice(0, 2).map(category => (
                      <Badge key={category} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleViewDetails}
                className="w-full mt-3"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Map/Satellite Toggle */}
      <div className="absolute top-4 left-4 z-10">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white rounded-lg shadow-lg flex overflow-hidden"
        >
          <button className="px-4 py-2 text-sm bg-white">
            Map
          </button>
          <button className="px-4 py-2 text-sm" style={{ backgroundColor: 'var(--brand-primary)', color: 'white' }}>
            Satellite
          </button>
        </motion.div>
      </div>

      {/* Fullscreen Button */}
      <div className="absolute bottom-4 left-4 z-10">
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white rounded-lg shadow-lg p-3 hover:shadow-xl transition-all"
        >
          <Maximize2 className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}