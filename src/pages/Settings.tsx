import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Bell, CreditCard, Globe, Moon, Sun, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/authService';
import { walletService } from '@/services/wallet.service';
import { WalletConnectModal } from '@/components/WalletConnectModal';

const Settings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [darkMode, setDarkMode] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [profile, setProfile] = useState({ fullName: '', email: '', phone: '' });
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfile({ ...profile, [id]: value });
  };

  const handleSaveProfile = async () => {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      toast({ title: "Not logged in", description: "Please log in to update your profile", variant: "destructive" });
      return;
    }
    const { error } = await AuthService.updateProfile(user.id, {
      full_name: profile.fullName,
      phone: profile.phone
    });
    if (error) {
      toast({ title: "Profile Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile Updated", description: "Your profile information has been saved" });
    }
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

  useEffect(() => {
    (async () => {
      const user = await AuthService.getCurrentUser();
      if (user) {
        const { profile: dbProfile } = await AuthService.getProfile(user.id);
        setProfile({
          fullName: dbProfile?.full_name || '',
          email: dbProfile?.email || user.email || '',
          phone: dbProfile?.phone || ''
        });
      }
    })();
  }, []);

  useEffect(() => {
    async function fetchWallets() {
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      setLoading(false);
    }
    fetchWallets();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-black/30 rounded-2xl shadow-lg animate-fade-in">
      {!wallets.length && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg mb-6 flex items-center gap-2">
          <Shield size={18} className="text-yellow-600" />
          <span>No wallet connected. Some features may be limited until you connect a wallet.</span>
          <Button className="ml-auto" onClick={() => setShowWalletModal(true)} variant="outline">Connect Wallet</Button>
        </div>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex gap-2 mb-6">
          <TabsTrigger value="profile" className="flex gap-2 items-center"><User size={18}/>Profile</TabsTrigger>
          <TabsTrigger value="security" className="flex gap-2 items-center"><Shield size={18}/>Security</TabsTrigger>
          <TabsTrigger value="notifications" className="flex gap-2 items-center"><Bell size={18}/>Notifications</TabsTrigger>
          <TabsTrigger value="payment" className="flex gap-2 items-center"><CreditCard size={18}/>Payment</TabsTrigger>
          <TabsTrigger value="preferences" className="flex gap-2 items-center"><Globe size={18}/>Preferences</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
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
                    onChange={(e) => handleProfileChange(e)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    className="mt-1"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => handleProfileChange(e)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleSaveProfile}
                  className="bg-primary hover:bg-primary/90 mt-2"
                  variant="luxury"
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
      {showWalletModal && (
        <WalletConnectModal onConnect={() => setShowWalletModal(false)} onClose={() => setShowWalletModal(false)} />
      )}
    </div>
  );
};

export default Settings;