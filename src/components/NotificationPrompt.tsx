import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Coffee } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from '../lib/AppContext';

interface NotificationPromptProps {
  onClose: () => void;
}

export function NotificationPrompt({ onClose }: NotificationPromptProps) {
  const { enableNotifications, user } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user has already been prompted
    const hasBeenPrompted = localStorage.getItem('notification_prompt_shown');
    const permission = Notification.permission;
    
    // Show prompt if:
    // - User is logged in
    // - Haven't been prompted before
    // - Permission is still 'default' (not yet decided)
    if (user && !hasBeenPrompted && permission === 'default') {
      // Delay showing the prompt for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000); // Show after 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleAllow = async () => {
    setIsLoading(true);
    localStorage.setItem('notification_prompt_shown', 'true');
    
    const success = await enableNotifications();
    
    setIsLoading(false);
    setIsVisible(false);
    onClose();
    
    if (!success) {
      console.log('Notification permission denied or failed');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification_prompt_shown', 'true');
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header decoration */}
          <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          <div className="p-6 pt-8 text-center">
            {/* Icon */}
            <div className="relative mx-auto w-20 h-20 mb-5">
              <div className="absolute inset-0 bg-amber-100 rounded-2xl rotate-6" />
              <div className="absolute inset-0 bg-amber-200 rounded-2xl -rotate-3" />
              <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl w-full h-full flex items-center justify-center shadow-lg">
                <Bell className="w-10 h-10 text-white" />
              </div>
              {/* Notification badge */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                <Coffee className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Stay in the loop! ☕
            </h2>

            {/* Description */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              Get notified when friends message you, send friend requests, or when there's activity on your favorite cafés.
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleAllow}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enabling...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <Bell className="w-4 h-4" />
                    Allow Notifications
                  </span>
                )}
              </Button>
              
              <button
                onClick={handleDismiss}
                className="w-full py-2.5 text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Maybe later
              </button>
            </div>

            {/* Footer note */}
            <p className="mt-4 text-xs text-gray-400">
              You can change this anytime in Settings
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

