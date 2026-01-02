import React, { useState, Suspense, lazy } from 'react';
import { BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { AppProvider, useApp } from './lib/AppContext';
import { Navigation } from './components/Navigation';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./components/HomePage').then(m => ({ default: m.HomePage })));
const ExplorePage = lazy(() => import('./components/ExplorePage').then(m => ({ default: m.ExplorePage })));
const MapPageReal = lazy(() => import('./components/MapPageReal').then(m => ({ default: m.MapPageReal })));
const SocialPage = lazy(() => import('./components/SocialPage').then(m => ({ default: m.SocialPage })));
const CollectionsPage = lazy(() => import('./components/CollectionsPage').then(m => ({ default: m.CollectionsPage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AuthPage = lazy(() => import('./components/AuthPage').then(m => ({ default: m.AuthPage })));
const BusinessDashboard = lazy(() => import('./components/BusinessDashboard').then(m => ({ default: m.BusinessDashboard })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ProfileSetupPage = lazy(() => import('./components/ProfileSetupPage').then(m => ({ default: m.ProfileSetupPage })));
const MessagesPage = lazy(() => import('./components/MessagesPage').then(m => ({ default: m.MessagesPage })));
const CafeDetailModal = lazy(() => import('./components/CafeDetailModal').then(m => ({ default: m.CafeDetailModal })));

// Loading spinner component
function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--brand-primary)' }}></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

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
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthPage onNavigate={handleNavigate} onSignupComplete={() => setShowProfileSetup(true)} />
      </Suspense>
    );
  }

  if (showProfileSetup) {
    return (
      <Suspense fallback={<PageLoader />}>
        <ProfileSetupPage
          onNavigate={handleNavigate}
          onComplete={() => setShowProfileSetup(false)}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      
      <main>
        <Suspense fallback={<PageLoader />}>
          {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
          {currentPage === 'explore' && <ExplorePage onNavigate={handleNavigate} />}
          {currentPage === 'map' && <MapPageReal onNavigate={handleNavigate} />}
          {currentPage === 'social' && <SocialPage onNavigate={handleNavigate} />}
          {currentPage === 'collections' && <CollectionsPage type="combined" onNavigate={handleNavigate} />}
          {currentPage === 'settings' && <SettingsPage onNavigate={handleNavigate} />}
          {currentPage === 'business' && user?.accountType === 'business' && <BusinessDashboard />}
          {currentPage === 'profile' && <ProfilePage onNavigate={handleNavigate} onOpenMessages={handleOpenMessages} userId={profileUserId} />}
          {currentPage === 'messages' && <MessagesPage onNavigate={handleNavigate} initialConversationId={messagesUserId} />}
        </Suspense>
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

      <Suspense fallback={null}>
        <CafeDetailModal cafe={selectedCafe} onClose={() => setSelectedCafe(null)} />
      </Suspense>
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
