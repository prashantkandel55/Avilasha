
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Bell, CreditCard, Globe, Moon, Sun, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [darkMode, setDarkMode] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  
  const [profile, setProfile] = useState({
    fullName: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    phone: '+1 (555) 123-4567',
  });
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfile({ ...profile, [id]: value });
  };
  
  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved",
    });
  };
  
  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    
    if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(systemPrefersDark);
    } else {
      setDarkMode(newTheme === 'dark');
    }
    
    toast({
      title: "Theme Changed",
      description: `Theme set to ${newTheme}`,
    });
  };
  
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="p-4">
              <TabsList className="grid grid-cols-1 gap-2">
                <TabsTrigger value="profile" className="flex justify-start gap-2 px-4 py-3">
                  <User size={18} />
                  <span>Profile</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex justify-start gap-2 px-4 py-3">
                  <Shield size={18} />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex justify-start gap-2 px-4 py-3">
                  <Bell size={18} />
                  <span>Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex justify-start gap-2 px-4 py-3">
                  <CreditCard size={18} />
                  <span>Payment Methods</span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex justify-start gap-2 px-4 py-3">
                  <Globe size={18} />
                  <span>Preferences</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'profile' && (
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={profile.fullName} 
                    onChange={handleProfileChange} 
                    className="mt-1" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profile.email} 
                    onChange={handleProfileChange} 
                    className="mt-1" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={profile.phone} 
                    onChange={handleProfileChange} 
                    className="mt-1" 
                  />
                </div>
                
                <Button 
                  onClick={handleSaveProfile}
                  className="bg-primary hover:bg-primary/90 mt-2"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
          
          {activeTab === 'preferences' && (
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Appearance</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Dark Mode</h3>
                    <p className="text-sm text-muted-foreground">Use dark theme for the application</p>
                  </div>
                  <Switch 
                    checked={darkMode} 
                    onCheckedChange={setDarkMode} 
                  />
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Theme</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`p-4 rounded-lg border flex flex-col items-center gap-2 ${theme === 'dark' ? 'border-primary' : 'border-border'}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <Moon size={20} className={theme === 'dark' ? 'text-primary' : ''} />
                      </div>
                      <span className="text-sm">Dark</span>
                    </button>
                    
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`p-4 rounded-lg border flex flex-col items-center gap-2 ${theme === 'light' ? 'border-primary' : 'border-border'}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <Sun size={20} className={theme === 'light' ? 'text-primary' : ''} />
                      </div>
                      <span className="text-sm">Light</span>
                    </button>
                    
                    <button
                      onClick={() => handleThemeChange('system')}
                      className={`p-4 rounded-lg border flex flex-col items-center gap-2 ${theme === 'system' ? 'border-primary' : 'border-border'}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <Monitor size={20} className={theme === 'system' ? 'text-primary' : ''} />
                      </div>
                      <span className="text-sm">System</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Price Alerts</h3>
                      <p className="text-sm text-muted-foreground">Get notified when prices change significantly</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Transaction Updates</h3>
                      <p className="text-sm text-muted-foreground">Receive updates about your transactions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Security Alerts</h3>
                      <p className="text-sm text-muted-foreground">Get notified about security events</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Newsletter</h3>
                      <p className="text-sm text-muted-foreground">Receive weekly crypto market insights</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Placeholder for other tabs */}
          {activeTab === 'security' && (
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
              <p className="text-muted-foreground">Manage your security preferences and account protection</p>
            </div>
          )}
          
          {activeTab === 'payment' && (
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
              <p className="text-muted-foreground">Manage your payment options and billing information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
