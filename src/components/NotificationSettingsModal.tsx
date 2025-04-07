
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

interface NotificationSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const NotificationSettingsModal = ({ open, onClose }: NotificationSettingsModalProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'price-alerts',
      title: 'Price Alerts',
      description: 'Get notified when prices change significantly',
      enabled: true,
    },
    {
      id: 'transaction-updates',
      title: 'Transaction Updates',
      description: 'Receive updates about your transactions',
      enabled: true,
    },
    {
      id: 'security-alerts',
      title: 'Security Alerts',
      description: 'Get notified about security events',
      enabled: true,
    },
    {
      id: 'newsletter',
      title: 'Newsletter',
      description: 'Receive weekly crypto market insights',
      enabled: false,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(settings.map(setting => 
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    ));
    
    // Show toast notification
    const setting = settings.find(s => s.id === id);
    if (setting) {
      const newState = !setting.enabled;
      toast({
        title: `${setting.title} ${newState ? 'Enabled' : 'Disabled'}`,
        description: newState 
          ? `You will now receive ${setting.title.toLowerCase()}`
          : `You will no longer receive ${setting.title.toLowerCase()}`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Notification Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {settings.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between py-2">
              <div>
                <h4 className="font-medium text-base">{setting.title}</h4>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <Switch 
                checked={setting.enabled} 
                onCheckedChange={() => toggleSetting(setting.id)} 
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettingsModal;
