import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './lib/AppContext';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { ExplorePage } from './components/ExplorePage';
import { MapPage } from './components/MapPage';
import { SocialPage } from './components/SocialPage';
import { CollectionsPage } from './components/CollectionsPage';
import { SettingsPage } from './components/SettingsPage';
import { AuthPage } from './components/AuthPage';
import { BusinessDashboard } from './components/BusinessDashboard';
import { CafeDetailModal } from './components/CafeDetailModal';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated, selectedCafe, setSelectedCafe, user } = useApp();

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAuthenticated) {
    return <AuthPage onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      
      <main>
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'explore' && <ExplorePage onNavigate={handleNavigate} />}
        {currentPage === 'map' && <MapPage />}
        {currentPage === 'social' && <SocialPage />}
        {currentPage === 'favorites' && <CollectionsPage type="favorites" />}
        {currentPage === 'wantToTry' && <CollectionsPage type="wantToTry" />}
        {currentPage === 'settings' && <SettingsPage />}
        {currentPage === 'business' && user.accountType === 'business' && <BusinessDashboard />}
      </main>

      {/* Business Dashboard FAB */}
      {user.accountType === 'business' && currentPage !== 'business' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="fixed bottom-6 right-6 z-50"
              >
                <Button
                  onClick={() => handleNavigate('business')}
                  size="lg"
                  className="rounded-full w-14 h-14 shadow-xl hover:shadow-2xl transition-all"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  <BarChart3 className="w-6 h-6" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Business Dashboard</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <CafeDetailModal cafe={selectedCafe} onClose={() => setSelectedCafe(null)} />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}