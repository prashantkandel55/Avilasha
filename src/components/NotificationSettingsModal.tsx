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
      <DialogContent className="sm:max-w-md bg-card border-border rounded-lg shadow-inner p-2 mb-2">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Notification Settings</DialogTitle>
        </DialogHeader>
        <div className="divide-y divide-gray-200 bg-gray-50 rounded-lg shadow-inner p-2 mb-2">
          {settings.map((setting, idx) => (
            <div key={setting.id} className={`flex items-center justify-between py-4 px-2 transition ${idx % 2 === 0 ? 'bg-white/80' : 'bg-gray-100/80'} rounded-lg hover:shadow-sm`}>
              <div>
                <h4 className="font-medium text-base text-primary mb-0.5">{setting.title}</h4>
                <p className="text-xs text-muted-foreground leading-tight">{setting.description}</p>
              </div>
              <Switch 
                checked={setting.enabled} 
                onCheckedChange={() => toggleSetting(setting.id)}
                className="scale-110 focus:ring-2 focus:ring-primary/40"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-2">
          <button onClick={onClose} className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition">Close</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettingsModal;
