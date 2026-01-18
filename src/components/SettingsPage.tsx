import React, { useState, useRef } from 'react';
import { User, Bell, Lock, Globe, Camera, MapPin, FileText, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { translations } from '../lib/mockData';
import { Language, AccountType } from '../lib/types';
import { AuthService } from '../services/authService';
import { BackButton } from './BackButton';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { toast } from 'sonner';

// Popular locations for the dropdown
const LOCATIONS = [
  { value: 'new-york', label: 'New York City, NY' },
  { value: 'los-angeles', label: 'Los Angeles, CA' },
  { value: 'san-francisco', label: 'San Francisco, CA' },
  { value: 'chicago', label: 'Chicago, IL' },
  { value: 'seattle', label: 'Seattle, WA' },
  { value: 'austin', label: 'Austin, TX' },
  { value: 'portland', label: 'Portland, OR' },
  { value: 'boston', label: 'Boston, MA' },
  { value: 'denver', label: 'Denver, CO' },
  { value: 'miami', label: 'Miami, FL' },
  { value: 'atlanta', label: 'Atlanta, GA' },
  { value: 'nashville', label: 'Nashville, TN' },
  { value: 'philadelphia', label: 'Philadelphia, PA' },
  { value: 'san-diego', label: 'San Diego, CA' },
  { value: 'washington-dc', label: 'Washington, D.C.' },
  { value: 'tokyo', label: 'Tokyo, Japan' },
  { value: 'london', label: 'London, UK' },
  { value: 'paris', label: 'Paris, France' },
  { value: 'sydney', label: 'Sydney, Australia' },
  { value: 'toronto', label: 'Toronto, Canada' },
  { value: 'vancouver', label: 'Vancouver, Canada' },
  { value: 'seoul', label: 'Seoul, South Korea' },
  { value: 'singapore', label: 'Singapore' },
  { value: 'melbourne', label: 'Melbourne, Australia' },
  { value: 'berlin', label: 'Berlin, Germany' },
];

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

const DEFAULT_AVATAR = '/default-avatar.svg';

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { language, setLanguage, user, setUser, setIsAuthenticated, notificationsEnabled, enableNotifications } = useApp();
  const t = translations[language];
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || DEFAULT_AVATAR);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [accountType, setAccountType] = useState<AccountType>(user?.accountType || 'consumer');
  const [visibility, setVisibility] = useState(user?.visibility || 'public');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

  const handleSaveChanges = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // In production, upload avatarFile to storage and get URL
      const finalAvatarUrl = avatarUrl || DEFAULT_AVATAR;

      await AuthService.updateUserProfile(user.id, {
        username,
        email,
        bio,
        location,
        avatar: finalAvatarUrl,
        accountType,
        visibility,
      });

      setUser({
        ...user,
        username,
        email,
        bio,
        location,
        avatar: finalAvatarUrl,
        accountType,
        visibility,
      });

      toast.success('Settings saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Signed out successfully');
      // Will automatically redirect to auth page since isAuthenticated is false
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
    }
  };

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' },
  ];

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackButton onNavigate={onNavigate} />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="mb-2">{t.settings}</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </motion.div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="w-full grid grid-cols-4 gap-1">
            <TabsTrigger value="account" className="gap-1 px-2">
              <User className="w-4 h-4" />
              <span className="hidden md:inline">{t.accountTab}</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-1 px-2">
              <Globe className="w-4 h-4" />
              <span className="hidden md:inline">{t.preferencesTab}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 px-2">
              <Bell className="w-4 h-4" />
              <span className="hidden md:inline">{t.notificationsTab}</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1 px-2">
              <Lock className="w-4 h-4" />
              <span className="hidden md:inline">{t.privacyTab}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{t.accountSettings}</CardTitle>
                  <CardDescription>
                    {t.accountSettingsDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback>{user.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                      {avatarUrl !== DEFAULT_AVATAR && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAvatarUrl(DEFAULT_AVATAR);
                            setAvatarFile(null);
                          }}
                          className="text-xs text-gray-500"
                        >
                          Remove Photo
                        </Button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">{t.username}</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">
                      <FileText className="w-4 h-4 inline mr-2" />
                      {t.bioLabel}
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder={t.bioPlaceholder}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {bio.length}/200 {t.characters}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      {t.locationLabel}
                    </Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger id="location" className="w-full">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <SelectValue placeholder={t.locationPlaceholder || "Select your city"} />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {LOCATIONS.map((loc) => (
                          <SelectItem key={loc.value} value={loc.label}>
                            {loc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountType">{t.accountType}</Label>
                    <Select value={accountType} onValueChange={(val) => setAccountType(val as AccountType)}>
                      <SelectTrigger id="accountType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consumer">{t.consumer}</SelectItem>
                        <SelectItem value="business">{t.business}</SelectItem>
                      </SelectContent>
                    </Select>
                    {accountType === 'business' && (
                      <p className="text-sm text-muted-foreground">
                        You have access to the Business Dashboard
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveChanges} 
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                      disabled={saving}
                      className="flex-1"
                    >
                      {saving ? 'Saving...' : t.saveChanges}
                    </Button>
                    <Button 
                      onClick={handleSignOut} 
                      variant="outline"
                      className="flex-1"
                    >
                      {t.logout}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="preferences">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{t.preferencesTab}</CardTitle>
                  <CardDescription>
                    {t.preferencesDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">{t.language}</Label>
                    <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show distance in kilometers</Label>
                      <p className="text-sm text-muted-foreground">
                        Use metric system for distances
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Dark mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Use dark theme throughout the app
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Push Notifications Card */}
              <Card className={notificationsEnabled ? 'border-green-200 bg-green-50/30' : 'border-amber-200 bg-amber-50/30'}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${notificationsEnabled ? 'bg-green-100' : 'bg-amber-100'}`}>
                      <Smartphone className={`w-5 h-5 ${notificationsEnabled ? 'text-green-600' : 'text-amber-600'}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">Push Notifications</CardTitle>
                      <CardDescription>
                        {notificationsEnabled 
                          ? 'You will receive notifications even when the app is closed' 
                          : 'Enable to receive notifications on your device'}
                      </CardDescription>
                    </div>
                    {notificationsEnabled ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Enabled
                      </span>
                    ) : (
                      <Button 
                        onClick={async () => {
                          const success = await enableNotifications();
                          if (success) {
                            toast.success('Push notifications enabled!');
                          } else {
                            toast.error('Could not enable notifications. Please check your browser settings.');
                          }
                        }}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Enable
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.notificationsTab}</CardTitle>
                  <CardDescription>
                    {t.notificationsDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Friend requests</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when someone sends you a friend request
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you receive a new message
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Friend activity</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when friends review or visit cafés
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New cafés nearby</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about new cafés in your area
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email summaries of your activity
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="privacy">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{t.privacyTab}</CardTitle>
                  <CardDescription>
                    {t.privacyDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="visibility">{t.visibility}</Label>
                    <Select value={visibility} onValueChange={(val) => setVisibility(val as 'public' | 'private')}>
                      <SelectTrigger id="visibility">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">{t.public}</SelectItem>
                        <SelectItem value="private">{t.private}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {visibility === 'public'
                        ? 'Your profile and activity are visible to everyone'
                        : 'Only friends can see your profile and activity'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show review history</Label>
                      <p className="text-sm text-muted-foreground">
                        Let others see cafés you've reviewed
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show favorites</Label>
                      <p className="text-sm text-muted-foreground">
                        Let friends see your favorite cafés
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Location sharing</Label>
                      <p className="text-sm text-muted-foreground">
                        Share your location for better recommendations
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}