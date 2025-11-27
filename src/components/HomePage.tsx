import React, { useState } from 'react';
import { Search, Coffee } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { translations, categories } from '../lib/mockData';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { language } = useApp();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleExplore = () => {
    onNavigate('explore');
  };

  return (
    <div className="min-h-[calc(100vh-73px)]">
      {/* Hero Section */}
      <div className="relative h-[500px] md:h-[600px] overflow-hidden">
        {/* Warm Cozy Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50/30">
          {/* Paper texture overlay */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(184, 131, 74, 0.03) 2px,
              rgba(184, 131, 74, 0.03) 4px
            )`
          }} />
          
          {/* Soft Animated Blobs */}
          <motion.div
            animate={{
              x: [0, 80, 0],
              y: [0, -80, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
            style={{ background: 'radial-gradient(circle, #d4915e, transparent)' }}
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 80, 0],
              scale: [1, 1.25, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
            style={{ background: 'radial-gradient(circle, #b8834a, transparent)' }}
          />
          
          {/* Floating Coffee Steam */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.05, 0.15, 0.05],
                y: [0, -50, -100],
                x: [0, Math.sin(i) * 20, 0],
                scale: [0.8, 1.2, 0.6],
              }}
              transition={{
                duration: 6 + i * 0.8,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeInOut"
              }}
              className="absolute"
              style={{
                left: `${8 + i * 8}%`,
                top: `${30 + (i % 4) * 15}%`,
              }}
            >
              <div 
                className="w-16 h-16 md:w-24 md:h-24 rounded-full blur-xl" 
                style={{ backgroundColor: '#b8834a' }}
              />
            </motion.div>
          ))}
          
          {/* Soft Decorative Elements */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 right-24 opacity-10"
          >
            <div className="w-40 h-40 rounded-full border-4" style={{ borderColor: '#b8834a' }} />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-32 left-20 opacity-10"
          >
            <div className="w-32 h-32 rounded-full border-4" style={{ borderColor: '#d4915e' }} />
          </motion.div>
          
          {/* Coffee Cup Doodles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`cup-${i}`}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.08, 0.15, 0.08],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeInOut"
              }}
              className="absolute text-6xl md:text-7xl"
              style={{
                left: `${15 + i * 14}%`,
                top: `${25 + (i % 2) * 30}%`,
                color: '#b8834a',
              }}
            >
              ☕
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <h1 
              className="text-6xl md:text-7xl lg:text-8xl mb-6" 
              style={{ 
                color: '#4a3728',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                fontFamily: 'var(--font-display)'
              }}
            >
              {t.heroTitle}{' '}
              <span 
                className="block md:inline" 
                style={{ 
                  background: 'linear-gradient(135deg, #b8834a 0%, #d4915e 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontStyle: 'italic',
                  fontFamily: 'var(--font-display)'
                }}
              >
                {t.heroTitleAccent}
              </span>
            </h1>
            <p 
              className="text-lg md:text-xl lg:text-2xl mb-8 max-w-2xl mx-auto" 
              style={{ 
                color: '#6d4c41',
                fontWeight: 400,
                lineHeight: 1.6
              }}
            >
              {t.heroSubtitle}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="w-full max-w-2xl"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-2 shadow-xl border-2 flex items-center gap-2" style={{ borderColor: '#f5ebe0' }}>
              <Search className="w-5 h-5 ml-3" style={{ color: '#8d6e63' }} />
              <Input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              />
              <Button
                onClick={handleExplore}
                className="rounded-3xl px-6 shadow-md hover:shadow-lg transition-all"
                style={{ backgroundColor: '#b8834a' }}
              >
                {t.exploreButton}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Category Selection */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="max-w-6xl mx-auto px-4 py-12 md:py-16"
      >
        <div className="text-center mb-8">
          <h2 className="mb-2" style={{ color: '#4a3728' }}>{t.whatLookingFor}</h2>
          <p className="text-muted-foreground">
            {t.selectCategories}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleCategory(category)}
              className={`p-6 rounded-2xl border-2 transition-all ${
                selectedCategories.includes(category)
                  ? 'border-current text-white shadow-lg'
                  : 'bg-white/80 backdrop-blur-sm hover:shadow-md'
              }`}
              style={
                selectedCategories.includes(category)
                  ? { 
                      backgroundColor: '#b8834a', 
                      borderColor: '#b8834a',
                      boxShadow: '0 8px 16px -4px rgba(184, 131, 74, 0.3)'
                    }
                  : { 
                      borderColor: '#f5ebe0',
                      color: '#6d4c41'
                    }
              }
            >
              <span className="block">{t[category.toLowerCase() as keyof typeof t] || category}</span>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            onClick={handleExplore}
            className="px-8 rounded-2xl shadow-md hover:shadow-xl transition-all"
            style={{ 
              backgroundColor: '#b8834a',
              boxShadow: '0 4px 12px rgba(184, 131, 74, 0.3)'
            }}
          >
            {t.exploreButton}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}