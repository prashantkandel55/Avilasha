import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Plus, Trash2, Edit2, BarChart2, AlertTriangle, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Volume2, Clock, DollarSign, Percent, Zap, Settings, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  type: 'price' | 'volume' | 'news' | 'security' | 'whale';
  asset: string;
  condition: string;
  value: string;
  status: 'active' | 'triggered' | 'snoozed';
  createdAt: string;
  lastTriggered?: string;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'price',
    asset: 'Bitcoin (BTC)',
    condition: 'above',
    value: '$45,000',
    status: 'active',
    createdAt: '2023-07-12'
  },
  {
    id: '2',
    type: 'price',
    asset: 'Ethereum (ETH)',
    condition: 'below',
    value: '$3,000',
    status: 'active',
    createdAt: '2023-07-10'
  },
  {
    id: '3',
    type: 'volume',
    asset: 'Solana (SOL)',
    condition: 'increase',
    value: '50%',
    status: 'triggered',
    createdAt: '2023-07-08',
    lastTriggered: '2023-07-15'
  },
  {
    id: '4',
    type: 'news',
    asset: 'Cardano (ADA)',
    condition: 'keyword',
    value: 'upgrade, hardfork',
    status: 'active',
    createdAt: '2023-07-05'
  },
  {
    id: '5',
    type: 'security',
    asset: 'Wallet 0x1a2b...3c4d',
    condition: 'transfer',
    value: 'any amount',
    status: 'active',
    createdAt: '2023-07-01'
  },
  {
    id: '6',
    type: 'whale',
    asset: 'Bitcoin (BTC)',
    condition: 'movement',
    value: '> 100 BTC',
    status: 'snoozed',
    createdAt: '2023-06-28'
  }
];

const Alerts = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'price',
    asset: '',
    condition: 'above',
    value: '',
  });

  // Add real-time polling for alerts
  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchAlerts() {
      // Fetch alerts from backend or local storage
      setAlerts(mockAlerts); // Replace with real fetch if available
    }
    fetchAlerts();
    interval = setInterval(fetchAlerts, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
    toast({
      title: "Alert Deleted",
      description: "The alert has been removed",
    });
  };

  const handleToggleSnooze = (id: string) => {
    setAlerts(alerts.map(alert => {
      if (alert.id === id) {
        const newStatus = alert.status === 'snoozed' ? 'active' : 'snoozed';
        return { ...alert, status: newStatus };
      }
      return alert;
    }));

    const alert = alerts.find(a => a.id === id);
    const action = alert?.status === 'snoozed' ? 'activated' : 'snoozed';

    toast({
      title: `Alert ${action}`,
      description: `The alert for ${alert?.asset} has been ${action}`,
    });
  };

  const handleCreateAlert = () => {
    const id = (alerts.length + 1).toString();
    const createdAt = new Date().toISOString().split('T')[0];

    const newAlertObj: Alert = {
      id,
      type: newAlert.type as any,
      asset: newAlert.asset,
      condition: newAlert.condition,
      value: newAlert.value,
      status: 'active',
      createdAt
    };

    setAlerts([newAlertObj, ...alerts]);
    setIsCreating(false);

    toast({
      title: "Alert Created",
      description: `New ${newAlert.type} alert for ${newAlert.asset} created successfully`,
    });

    // Reset form
    setNewAlert({
      type: 'price',
      asset: '',
      condition: 'above',
      value: '',
    });
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'price': return <BarChart2 className="h-4 w-4" />;
      case 'volume': return <Volume2 className="h-4 w-4" />;
      case 'news': return <Zap className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'whale': return <DollarSign className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Alerts</h1>
        <p className="text-muted-foreground">Set up and manage custom alerts for your portfolio</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Alerts</TabsTrigger>
                <TabsTrigger value="price">Price</TabsTrigger>
                <TabsTrigger value="volume">Volume</TabsTrigger>
                <TabsTrigger value="news">News</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
            </Tabs>

            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Alert
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Alert</DialogTitle>
                  <DialogDescription>
                    Set up a custom alert for your assets
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Alert Type</Label>
                    <Select
                      value={newAlert.type}
                      onValueChange={(value) => setNewAlert({ ...newAlert, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price">Price Alert</SelectItem>
                        <SelectItem value="volume">Volume Alert</SelectItem>
                        <SelectItem value="news">News Alert</SelectItem>
                        <SelectItem value="security">Security Alert</SelectItem>
                        <SelectItem value="whale">Whale Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Asset</Label>
                    <Select
                      value={newAlert.asset}
                      onValueChange={(value) => setNewAlert({ ...newAlert, asset: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bitcoin (BTC)">Bitcoin (BTC)</SelectItem>
                        <SelectItem value="Ethereum (ETH)">Ethereum (ETH)</SelectItem>
                        <SelectItem value="Solana (SOL)">Solana (SOL)</SelectItem>
                        <SelectItem value="Cardano (ADA)">Cardano (ADA)</SelectItem>
                        <SelectItem value="Ripple (XRP)">Ripple (XRP)</SelectItem>
                        <SelectItem value="Wallet 0x1a2b...3c4d">Wallet 0x1a2b...3c4d</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select
                      value={newAlert.condition}
                      onValueChange={(value) => setNewAlert({ ...newAlert, condition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {newAlert.type === 'price' && (
                          <>
                            <SelectItem value="above">Price Above</SelectItem>
                            <SelectItem value="below">Price Below</SelectItem>
                            <SelectItem value="change">Price Change %</SelectItem>
                          </>
                        )}
                        {newAlert.type === 'volume' && (
                          <>
                            <SelectItem value="increase">Volume Increase</SelectItem>
                            <SelectItem value="above">Volume Above</SelectItem>
                          </>
                        )}
                        {newAlert.type === 'news' && (
                          <>
                            <SelectItem value="keyword">Contains Keywords</SelectItem>
                          </>
                        )}
                        {newAlert.type === 'security' && (
                          <>
                            <SelectItem value="transfer">Transfer Detection</SelectItem>
                            <SelectItem value="approval">New Approval</SelectItem>
                          </>
                        )}
                        {newAlert.type === 'whale' && (
                          <>
                            <SelectItem value="movement">Large Movement</SelectItem>
                            <SelectItem value="accumulation">Accumulation</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      placeholder={
                        newAlert.type === 'price' ? 'e.g. $45,000' :
                          newAlert.type === 'volume' ? 'e.g. 50%' :
                            newAlert.type === 'news' ? 'e.g. upgrade, hardfork' :
                              newAlert.type === 'security' ? 'e.g. any amount' :
                                'e.g. > 100 BTC'
                      }
                      value={newAlert.value}
                      onChange={(e) => setNewAlert({ ...newAlert, value: e.target.value })}
                    />
                  </div>

                  {newAlert.type === 'price' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Price Target</Label>
                        <span className="text-sm text-muted-foreground">$40,000</span>
                      </div>
                      <Slider defaultValue={[40000]} max={100000} step={100} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>$0</span>
                        <span>$100,000</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch id="notification" defaultChecked />
                      <Label htmlFor="notification">Push Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="email" defaultChecked />
                      <Label htmlFor="email">Email Alerts</Label>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button onClick={handleCreateAlert}>Create Alert</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Active Alerts</CardTitle>
              <CardDescription>
                {alerts.filter(a => a.status === 'active').length} active alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        alert.type === 'price' ? 'bg-blue-500/10' :
                          alert.type === 'volume' ? 'bg-green-500/10' :
                            alert.type === 'news' ? 'bg-amber-500/10' :
                              alert.type === 'security' ? 'bg-red-500/10' :
                                'bg-purple-500/10'
                      }`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <div className="font-medium">{alert.asset}</div>
                        <div className="text-xs text-muted-foreground capitalize">{alert.type} alert • Created {alert.createdAt}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <div className="font-medium flex items-center">
                          {alert.condition === 'above' ? <ArrowUp className="mr-1 h-3 w-3" /> :
                            alert.condition === 'below' ? <ArrowDown className="mr-1 h-3 w-3" /> :
                              alert.condition === 'increase' ? <TrendingUp className="mr-1 h-3 w-3" /> :
                                null}
                          {alert.condition === 'above' ? 'Above ' :
                            alert.condition === 'below' ? 'Below ' :
                              alert.condition === 'increase' ? 'Increase ' :
                                alert.condition === 'keyword' ? 'Keywords: ' :
                                  alert.condition === 'transfer' ? 'Detect ' :
                                    alert.condition === 'movement' ? 'Detect ' :
                                      ''}
                          {alert.value}
                        </div>
                        {alert.lastTriggered && (
                          <div className="text-xs text-muted-foreground">
                            Last triggered: {alert.lastTriggered}
                          </div>
                        )}
                      </div>

                      <Badge variant="outline" className={`
                        ${alert.status === 'active' ? 'bg-green-500/10 text-green-500' :
                          alert.status === 'triggered' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-gray-500/10 text-gray-500'}
                      `}>
                        {alert.status}
                      </Badge>

                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleSnooze(alert.id)}
                        >
                          {alert.status === 'snoozed' ? (
                            <Bell className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {alerts.length === 0 && (
                  <div className="text-center py-6">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                      <Bell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">No alerts yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first alert to stay updated on market movements
                    </p>
                    <Button onClick={() => setIsCreating(true)}>Create Alert</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Settings</CardTitle>
              <CardDescription>Configure how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <div className="text-sm text-muted-foreground">Receive alerts on your device</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">Receive alerts via email</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <Label className="text-base">SMS Notifications</Label>
                  <div className="text-sm text-muted-foreground">Receive alerts via SMS</div>
                </div>
                <Switch />
              </div>

              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <Label className="text-base">Quiet Hours</Label>
                  <div className="text-sm text-muted-foreground">Don't send alerts during certain hours</div>
                </div>
                <Switch />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Advanced Settings
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Templates</CardTitle>
              <CardDescription>Quickly create common alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => {
                  setNewAlert({
                    type: 'price',
                    asset: 'Bitcoin (BTC)',
                    condition: 'above',
                    value: '$50,000',
                  });
                  setIsCreating(true);
                }}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  BTC above $50,000
                </Button>

                <Button variant="outline" className="w-full justify-start" onClick={() => {
                  setNewAlert({
                    type: 'price',
                    asset: 'Ethereum (ETH)',
                    condition: 'below',
                    value: '$2,000',
                  });
                  setIsCreating(true);
                }}>
                  <TrendingDown className="mr-2 h-4 w-4" />
                  ETH below $2,000
                </Button>

                <Button variant="outline" className="w-full justify-start" onClick={() => {
                  setNewAlert({
                    type: 'volume',
                    asset: 'Bitcoin (BTC)',
                    condition: 'increase',
                    value: '50%',
                  });
                  setIsCreating(true);
                }}>
                  <Volume2 className="mr-2 h-4 w-4" />
                  BTC volume spike (50%+)
                </Button>

                <Button variant="outline" className="w-full justify-start" onClick={() => {
                  setNewAlert({
                    type: 'security',
                    asset: 'Wallet 0x1a2b...3c4d',
                    condition: 'transfer',
                    value: 'any amount',
                  });
                  setIsCreating(true);
                }}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Wallet security alert
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Last 3 alerts that were triggered</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { asset: 'Solana (SOL)', event: 'Price increased by 12%', time: '2 hours ago' },
                  { asset: 'Bitcoin (BTC)', event: 'Volume spike detected', time: '5 hours ago' },
                  { asset: 'Ethereum (ETH)', event: 'Price dropped below $3,000', time: '1 day ago' },
                ].map((notification, i) => (
                  <div key={i} className="flex gap-3 items-start pb-3 border-b last:border-0 last:pb-0">
                    <div className="bg-amber-500/10 p-2 rounded-full">
                      <Bell className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <div className="font-medium">{notification.asset}</div>
                      <div className="text-sm">{notification.event}</div>
                      <div className="text-xs text-muted-foreground">{notification.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="w-full">View All Activity</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
