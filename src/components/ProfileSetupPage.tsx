import React, { useState, useRef } from 'react';
import { Camera, MapPin, User, FileText, ArrowRight, X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { useApp } from '../lib/AppContext';
import { AuthService } from '../services/authService';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LocationAutocomplete } from './LocationAutocomplete';
import { toast } from 'sonner';

interface ProfileSetupPageProps {
  onNavigate: (page: string) => void;
  onComplete: () => void;
}

const DEFAULT_AVATAR = '/default-avatar.svg';

export function ProfileSetupPage({ onNavigate, onComplete }: ProfileSetupPageProps) {
  const { user, setUser } = useApp();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || DEFAULT_AVATAR);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSkip = () => {
    toast.info('You can set up your profile later in Settings');
    onComplete();
    onNavigate('home');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image must be smaller than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('Photo uploaded!');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('Photo uploaded!');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let finalAvatarUrl = DEFAULT_AVATAR;

      // Upload avatar to Firebase Storage if a file was selected
      if (avatarFile) {
        const storageRef = ref(storage, `avatars/${user.id}/${Date.now()}_${avatarFile.name}`);
        const snapshot = await uploadBytes(storageRef, avatarFile);
        finalAvatarUrl = await getDownloadURL(snapshot.ref);
      } else if (avatarUrl && avatarUrl !== DEFAULT_AVATAR && !avatarUrl.startsWith('data:')) {
        // Keep existing URL if it's not a data URL
        finalAvatarUrl = avatarUrl;
      }

      // Update user profile with new information
      await AuthService.updateUserProfile(user.id, {
        bio,
        location,
        avatar: finalAvatarUrl,
      });

      // Update local user state
      setUser({
        ...user,
        bio,
        location,
        avatar: finalAvatarUrl,
      });

      toast.success('Profile set up successfully!');
      onComplete();
      onNavigate('home');
    } catch (error: any) {
      console.error('Error setting up profile:', error);
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Skip for now
              </Button>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 mx-auto"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-3xl mb-2">Set Up Your Profile</CardTitle>
            <CardDescription className="text-base">
              Tell us a bit about yourself to personalize your experience
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-32 h-32 border-4 border-gray-100">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-3xl bg-gray-100">
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="w-full space-y-3">
                {/* Drag & Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-current bg-orange-50'
                      : 'border-gray-300 hover:border-current hover:bg-gray-50'
                  }`}
                  style={isDragging ? { borderColor: 'var(--brand-primary)' } : {}}
                >
                  <div className="flex flex-col items-center gap-2">
                    {isDragging ? (
                      <>
                        <Upload className="w-8 h-8" style={{ color: 'var(--brand-primary)' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>
                          Drop image here
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Camera className="w-6 h-6 text-gray-400" />
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          Drag & drop or click to upload
                        </p>
                        <p className="text-xs text-gray-500">
                          Take a photo or choose from device
                        </p>
                        <p className="text-xs text-gray-400">
                          Max 5MB • JPG, PNG, GIF
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Choose Photo
                </Button>

                {avatarUrl !== DEFAULT_AVATAR && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAvatarUrl(DEFAULT_AVATAR);
                      setAvatarFile(null);
                    }}
                    className="w-full text-gray-500 hover:text-gray-700"
                  >
                    Remove Photo
                  </Button>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">
                <FileText className="w-4 h-4 inline mr-2" />
                Bio
              </Label>
              <Textarea
                id="bio"
                placeholder="Coffee enthusiast ☕ | Love trying new cafes | Remote worker"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/200 characters
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                <MapPin className="w-4 h-4 inline mr-2" />
                Location
              </Label>
              <LocationAutocomplete
                value={location}
                onChange={setLocation}
                placeholder="Search your city, state, or country..."
              />
              <p className="text-xs text-muted-foreground">
                Type any location for better café recommendations
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
                disabled={loading}
              >
                Skip for now
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                style={{ backgroundColor: 'var(--brand-primary)' }}
                disabled={loading}
              >
                {loading ? (
                  'Saving...'
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              You can always update your profile later in Settings
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

