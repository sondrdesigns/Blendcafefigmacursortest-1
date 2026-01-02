import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './lib/AppContext';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { ExplorePage } from './components/ExplorePage';
import { MapPageReal } from './components/MapPageReal';
import { SocialPage } from './components/SocialPage';
import { CollectionsPage } from './components/CollectionsPage';
import { SettingsPage } from './components/SettingsPage';
import { AuthPage } from './components/AuthPage';
import { BusinessDashboard } from './components/BusinessDashboard';
import { ProfilePage } from './components/ProfilePage';
import { ProfileSetupPage } from './components/ProfileSetupPage';
import { MessagesPage } from './components/MessagesPage';
import { CafeDetailModal } from './components/CafeDetailModal';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [profileUserId, setProfileUserId] = useState<string | undefined>(undefined);
  const [messagesUserId, setMessagesUserId] = useState<string | undefined>(undefined);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const { isAuthenticated, selectedCafe, setSelectedCafe, user, addToHistory, goBack, loading } = useApp();

  const handleNavigate = (page: string, userId?: string) => {
    setCurrentPage(page);
    addToHistory(page);
    if (page === 'profile' && userId) {
      setProfileUserId(userId);
    } else if (page === 'profile') {
      setProfileUserId(undefined); // Own profile
    }
    if (page !== 'messages') {
      setMessagesUserId(undefined);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMessages = (friendId: string) => {
    setMessagesUserId(friendId);
    setCurrentPage('messages');
    addToHistory('messages');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    const previousPage = goBack();
    if (previousPage) {
      setCurrentPage(previousPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--brand-primary)' }}></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onNavigate={handleNavigate} onSignupComplete={() => setShowProfileSetup(true)} />;
  }

  if (showProfileSetup) {
    return (
      <ProfileSetupPage
        onNavigate={handleNavigate}
        onComplete={() => setShowProfileSetup(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      
      <main>
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'explore' && <ExplorePage onNavigate={handleNavigate} />}
        {currentPage === 'map' && <MapPageReal onNavigate={handleNavigate} />}
        {currentPage === 'social' && <SocialPage onNavigate={handleNavigate} />}
        {currentPage === 'collections' && <CollectionsPage type="combined" onNavigate={handleNavigate} />}
        {currentPage === 'settings' && <SettingsPage onNavigate={handleNavigate} />}
        {currentPage === 'business' && user?.accountType === 'business' && <BusinessDashboard />}
        {currentPage === 'profile' && <ProfilePage onNavigate={handleNavigate} onOpenMessages={handleOpenMessages} userId={profileUserId} />}
        {currentPage === 'messages' && <MessagesPage onNavigate={handleNavigate} initialConversationId={messagesUserId} />}
      </main>

      {/* Business Dashboard FAB */}
      {user?.accountType === 'business' && currentPage !== 'business' && (
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