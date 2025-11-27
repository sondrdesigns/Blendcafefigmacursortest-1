import React, { useState } from 'react';
import { User, Bell, Lock, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { translations } from '../lib/mockData';
import { Language, AccountType } from '../lib/types';
import { BackButton } from './BackButton';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { toast } from 'sonner@2.0.3';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { language, setLanguage, user, setUser } = useApp();
  const t = translations[language];
  
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [accountType, setAccountType] = useState<AccountType>(user.accountType);
  const [visibility, setVisibility] = useState(user.visibility);

  const handleSaveChanges = () => {
    setUser({
      ...user,
      username,
      email,
      accountType,
      visibility,
    });
    toast.success('Settings saved successfully!');
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
              <span className="hidden md:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-1 px-2">
              <Globe className="w-4 h-4" />
              <span className="hidden md:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 px-2">
              <Bell className="w-4 h-4" />
              <span className="hidden md:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1 px-2">
              <Lock className="w-4 h-4" />
              <span className="hidden md:inline">Privacy</span>
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
                    Update your account information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.username[0]}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline">Change Photo</Button>
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

                  <Button onClick={handleSaveChanges} style={{ backgroundColor: 'var(--brand-primary)' }}>
                    {t.saveChanges}
                  </Button>
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
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>
                    Customize your experience
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
            >
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Manage how you receive notifications
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
                  <CardTitle>Privacy</CardTitle>
                  <CardDescription>
                    Control who can see your information
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