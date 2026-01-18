import React, { useState, Suspense, lazy } from 'react';
import { BarChart3, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './lib/AppContext';
import { Navigation } from './components/Navigation';
import { NotificationPrompt } from './components/NotificationPrompt';
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

// Beautiful cafe-themed loading screen - lightweight and smooth
function CafeLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div className={`${fullScreen ? 'min-h-screen' : 'min-h-[50vh]'} flex items-center justify-center bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/40`}>
      <div className="text-center">
        {/* Coffee cup with steam animation */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          {/* Cup */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Coffee className="w-10 h-10" style={{ color: 'var(--brand-primary)' }} />
          </motion.div>
          
          {/* Steam lines - CSS-only for better mobile performance */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-4 rounded-full bg-gradient-to-t from-amber-400/60 to-transparent steam-line"
                style={{ 
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Pulsing dots */}
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--brand-primary)' }}
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Page transition wrapper for smooth page changes
function PageWrapper({ children, ...props }: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ 
        duration: 0.25,
        ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth feel
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [profileUserId, setProfileUserId] = useState<string | undefined>(undefined);
  const [messagesUserId, setMessagesUserId] = useState<string | undefined>(undefined);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);
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
    return <CafeLoader fullScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<CafeLoader fullScreen />}>
        <AuthPage onNavigate={handleNavigate} onSignupComplete={() => setShowProfileSetup(true)} />
      </Suspense>
    );
  }

  if (showProfileSetup) {
    return (
      <Suspense fallback={<CafeLoader fullScreen />}>
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
      
      {/* Notification Permission Prompt */}
      {showNotificationPrompt && (
        <NotificationPrompt onClose={() => setShowNotificationPrompt(false)} />
      )}
      
      <main>
        <Suspense fallback={<CafeLoader />}>
          <AnimatePresence mode="wait">
            {currentPage === 'home' && (
              <PageWrapper key="home">
                <HomePage onNavigate={handleNavigate} />
              </PageWrapper>
            )}
            {currentPage === 'explore' && (
              <PageWrapper key="explore">
                <ExplorePage onNavigate={handleNavigate} />
              </PageWrapper>
            )}
            {currentPage === 'map' && (
              <PageWrapper key="map">
                <MapPageReal onNavigate={handleNavigate} />
              </PageWrapper>
            )}
            {currentPage === 'social' && (
              <PageWrapper key="social">
                <SocialPage onNavigate={handleNavigate} />
              </PageWrapper>
            )}
            {currentPage === 'collections' && (
              <PageWrapper key="collections">
                <CollectionsPage type="combined" onNavigate={handleNavigate} />
              </PageWrapper>
            )}
            {currentPage === 'settings' && (
              <PageWrapper key="settings">
                <SettingsPage onNavigate={handleNavigate} />
              </PageWrapper>
            )}
            {currentPage === 'business' && user?.accountType === 'business' && (
              <PageWrapper key="business">
                <BusinessDashboard />
              </PageWrapper>
            )}
            {currentPage === 'profile' && (
              <PageWrapper key="profile">
                <ProfilePage onNavigate={handleNavigate} onOpenMessages={handleOpenMessages} userId={profileUserId} />
              </PageWrapper>
            )}
            {currentPage === 'messages' && (
              <PageWrapper key="messages">
                <MessagesPage onNavigate={handleNavigate} initialConversationId={messagesUserId} />
              </PageWrapper>
            )}
          </AnimatePresence>
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
