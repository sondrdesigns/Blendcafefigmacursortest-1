import React, { useState } from 'react';
import { Coffee, Home, Compass, MapPin, Users, Heart, Star, Settings, LogOut, Menu, X, Globe, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { translations } from '../lib/mockData';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Language } from '../lib/types';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { language, setLanguage, friendRequestCount, unreadMessageCount, setIsAuthenticated, setUser } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language];

  const handleLogout = async () => {
    try {
      const { AuthService } = await import('../services/authService');
      await AuthService.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setMobileMenuOpen(false);
      // Will automatically redirect to auth page
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'explore', label: t.explore, icon: Compass },
    { id: 'map', label: t.map, icon: MapPin },
    { id: 'social', label: t.social, icon: Users, badge: friendRequestCount },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessageCount },
    { id: 'collections', label: t.collections, icon: Heart },
    { id: 'profile', label: t.profile, icon: User },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  const handleNavClick = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation - Full labels (1100px and up) */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="hidden min-[1100px]:flex items-center justify-between px-6 py-3 bg-white/95 backdrop-blur-sm border-b sticky top-0 z-50"
        style={{ 
          boxShadow: '0 2px 8px rgba(101, 67, 33, 0.08)',
          borderColor: 'rgba(141, 110, 99, 0.15)'
        }}
      >
        <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => onNavigate('home')}>
          <Coffee className="w-6 h-6" style={{ color: 'var(--brand-primary)' }} />
          <span 
            className="text-xl whitespace-nowrap" 
            style={{ 
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: '#4a3728',
              letterSpacing: '-0.02em'
            }}
          >
            {t.appName}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-nowrap">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-2xl transition-all relative whitespace-nowrap ${
                currentPage === item.id
                  ? 'text-white'
                  : 'hover:bg-secondary'
              }`}
              style={currentPage === item.id ? { 
                backgroundColor: 'var(--brand-primary)',
                boxShadow: '0 2px 8px rgba(184, 131, 74, 0.3)'
              } : { color: '#6d4c41' }}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-sm">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0 rounded-2xl ml-1">
                <Globe className="w-4 h-4" />
                <span>{languages.find(l => l.code === language)?.flag}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map(lang => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className="gap-2"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-2xl transition-all flex-shrink-0 hover:bg-secondary ml-1"
            style={{ color: '#6d4c41' }}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">{t.logout}</span>
          </button>
        </div>
      </motion.nav>

      {/* Tablet/Medium Desktop Navigation - Icon only with tooltips (768px to 1099px) */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="hidden md:flex min-[1100px]:hidden items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-sm border-b sticky top-0 z-50"
        style={{ 
          boxShadow: '0 2px 8px rgba(101, 67, 33, 0.08)',
          borderColor: 'rgba(141, 110, 99, 0.15)'
        }}
      >
        <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => onNavigate('home')}>
          <Coffee className="w-6 h-6" style={{ color: 'var(--brand-primary)' }} />
          <span className="text-lg whitespace-nowrap" style={{ fontWeight: 'var(--font-weight-medium)', color: '#4a3728' }}>
            {t.appName}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center justify-center p-2.5 rounded-2xl transition-all relative ${
                currentPage === item.id
                  ? 'text-white'
                  : 'hover:bg-secondary'
              }`}
              style={currentPage === item.id ? { 
                backgroundColor: 'var(--brand-primary)',
                boxShadow: '0 2px 8px rgba(184, 131, 74, 0.3)'
              } : { color: '#6d4c41' }}
              title={item.label}
            >
              <item.icon className="w-4 h-4" />
              {item.badge && item.badge > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-1 flex-shrink-0 rounded-2xl">
                <Globe className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map(lang => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className="gap-2"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2.5 rounded-2xl transition-all ml-1 hover:bg-secondary"
            style={{ color: '#6d4c41' }}
            title={t.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="md:hidden flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-sm border-b sticky top-0 z-50"
        style={{ 
          boxShadow: '0 2px 8px rgba(101, 67, 33, 0.08)',
          borderColor: 'rgba(141, 110, 99, 0.15)'
        }}
      >
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
          <Coffee className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
          <span className="whitespace-nowrap" style={{ fontWeight: 'var(--font-weight-medium)', color: '#4a3728' }}>{t.appName}</span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-secondary rounded-2xl transition-all flex-shrink-0"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b shadow-lg fixed top-[57px] left-0 right-0 z-40 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
                    currentPage === item.id
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={currentPage === item.id ? { backgroundColor: 'var(--brand-primary)' } : {}}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-auto h-6 w-6 flex items-center justify-center p-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </button>
              ))}

              <div className="pt-2 border-t mt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full gap-2 justify-start">
                      <Globe className="w-4 h-4" />
                      <span>{languages.find(l => l.code === language)?.flag}</span>
                      <span>{languages.find(l => l.code === language)?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {languages.map(lang => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className="gap-2"
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>{t.logout}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}