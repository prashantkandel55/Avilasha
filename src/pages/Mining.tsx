import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Pickaxe, 
  Cpu, 
  Zap, 
  Bolt, 
  TrendingUp, 
  BarChart, 
  Clock, 
  Trophy, 
  ChevronUp, 
  Coins, 
  Layers, 
  Cog, 
  HardDrive, 
  Gauge,
  Sparkles,
  Wrench,
  Flame,
  Fan,
  Chip,
  Thermometer,
  Droplets,
  Lightbulb,
  Rocket,
  Gem
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// Mining hardware types
interface MiningHardware {
  id: string;
  name: string;
  type: 'CPU' | 'GPU' | 'ASIC';
  hashrate: number;
  power: number;
  price: number;
  efficiency: number;
  level: number;
  maxLevel: number;
  icon: React.ReactNode;
}

// Mining stats
interface MiningStats {
  totalMined: number;
  hashrate: number;
  efficiency: number;
  power: number;
  uptime: number;
  lastPayout: number;
  startTime: number;
}

// Upgrade
interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: {
    type: 'hashrate' | 'efficiency' | 'power' | 'luck';
    value: number;
  };
  applied: boolean;
  icon: React.ReactNode;
}

// Achievement
interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  type: 'mined' | 'hashrate' | 'efficiency' | 'upgrades';
  unlocked: boolean;
  reward: number;
  icon: React.ReactNode;
}

const Mining: React.FC = () => {
  // Mining hardware options
  const [hardware, setHardware] = useState<MiningHardware[]>([
    {
      id: 'cpu-basic',
      name: 'Basic CPU Miner',
      type: 'CPU',
      hashrate: 0.5,
      power: 65,
      price: 0,
      efficiency: 0.0077,
      level: 1,
      maxLevel: 5,
      icon: <Cpu />
    },
    {
      id: 'gpu-basic',
      name: 'Basic GPU Rig',
      type: 'GPU',
      hashrate: 30,
      power: 150,
      price: 500,
      efficiency: 0.2,
      level: 0,
      maxLevel: 10,
      icon: <HardDrive />
    },
    {
      id: 'asic-basic',
      name: 'Entry ASIC Miner',
      type: 'ASIC',
      hashrate: 100,
      power: 1500,
      price: 2000,
      efficiency: 0.067,
      level: 0,
      maxLevel: 15,
      icon: <Chip />
    }
  ]);

  // Mining stats
  const [stats, setStats] = useState<MiningStats>({
    totalMined: 0,
    hashrate: 0.5, // Start with basic CPU
    efficiency: 0.0077,
    power: 65,
    uptime: 0,
    lastPayout: 0,
    startTime: Date.now()
  });

  // Mining state
  const [isMining, setIsMining] = useState(false);
  const [balance, setBalance] = useState(100); // Start with 100 AVI tokens
  const [miningProgress, setMiningProgress] = useState(0);
  const [miningInterval, setMiningInterval] = useState<NodeJS.Timeout | null>(null);
  const [activeHardware, setActiveHardware] = useState<string>('cpu-basic');
  const [showConfetti, setShowConfetti] = useState(false);

  // Upgrades
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    {
      id: 'cooling',
      name: 'Advanced Cooling',
      description: 'Reduce power consumption by 10%',
      cost: 200,
      effect: { type: 'power', value: -0.1 },
      applied: false,
      icon: <Droplets />
    },
    {
      id: 'overclock',
      name: 'Overclocking',
      description: 'Increase hashrate by 15%',
      cost: 350,
      effect: { type: 'hashrate', value: 0.15 },
      applied: false,
      icon: <Gauge />
    },
    {
      id: 'efficiency',
      name: 'Power Optimization',
      description: 'Improve efficiency by 20%',
      cost: 500,
      effect: { type: 'efficiency', value: 0.2 },
      applied: false,
      icon: <Lightbulb />
    },
    {
      id: 'luck',
      name: 'Lucky Algorithm',
      description: 'Increase mining rewards by 25%',
      cost: 750,
      effect: { type: 'luck', value: 0.25 },
      applied: false,
      icon: <Sparkles />
    },
    {
      id: 'thermal',
      name: 'Thermal Compound',
      description: 'Reduce power consumption by 5%',
      cost: 150,
      effect: { type: 'power', value: -0.05 },
      applied: false,
      icon: <Thermometer />
    },
    {
      id: 'fans',
      name: 'High-RPM Fans',
      description: 'Increase hashrate by 8%',
      cost: 250,
      effect: { type: 'hashrate', value: 0.08 },
      applied: false,
      icon: <Fan />
    }
  ]);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first-coin',
      name: 'First Coin',
      description: 'Mine your first AVI token',
      requirement: 1,
      type: 'mined',
      unlocked: false,
      reward: 10,
      icon: <Coins />
    },
    {
      id: 'hundred-coins',
      name: 'Hundred Club',
      description: 'Mine 100 AVI tokens',
      requirement: 100,
      type: 'mined',
      unlocked: false,
      reward: 50,
      icon: <Layers />
    },
    {
      id: 'hashrate-50',
      name: 'Power Miner',
      description: 'Reach 50 H/s hashrate',
      requirement: 50,
      type: 'hashrate',
      unlocked: false,
      reward: 100,
      icon: <Bolt />
    },
    {
      id: 'first-upgrade',
      name: 'Upgrader',
      description: 'Purchase your first upgrade',
      requirement: 1,
      type: 'upgrades',
      unlocked: false,
      reward: 25,
      icon: <Cog />
    },
    {
      id: 'efficiency-master',
      name: 'Efficiency Master',
      description: 'Reach 0.5 efficiency',
      requirement: 0.5,
      type: 'efficiency',
      unlocked: false,
      reward: 150,
      icon: <Zap />
    }
  ]);

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('avilasha_mining_data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setHardware(data.hardware || hardware);
        setStats({
          ...data.stats,
          startTime: data.stats?.startTime || Date.now()
        });
        setBalance(data.balance || balance);
        setUpgrades(data.upgrades || upgrades);
        setAchievements(data.achievements || achievements);
        setActiveHardware(data.activeHardware || activeHardware);
      } catch (error) {
        console.error('Failed to load mining data:', error);
      }
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    const saveData = () => {
      localStorage.setItem('avilasha_mining_data', JSON.stringify({
        hardware,
        stats,
        balance,
        upgrades,
        achievements,
        activeHardware
      }));
    };

    // Save every 30 seconds and on unmount
    const saveInterval = setInterval(saveData, 30000);
    return () => {
      clearInterval(saveInterval);
      saveData();
    };
  }, [hardware, stats, balance, upgrades, achievements, activeHardware]);

  // Calculate mining rewards
  const calculateReward = () => {
    const activeDevice = hardware.find(h => h.id === activeHardware);
    if (!activeDevice) return 0;
    
    // Base reward calculation
    let reward = activeDevice.hashrate * 0.01;
    
    // Apply luck upgrade if available
    const luckUpgrade = upgrades.find(u => u.effect.type === 'luck' && u.applied);
    if (luckUpgrade) {
      reward *= (1 + luckUpgrade.effect.value);
    }
    
    return reward;
  };

  // Start mining
  const startMining = () => {
    if (isMining) return;
    
    setIsMining(true);
    const interval = setInterval(() => {
      setMiningProgress(prev => {
        if (prev >= 100) {
          // Mining cycle complete
          const reward = calculateReward();
          setStats(prev => ({
            ...prev,
            totalMined: prev.totalMined + reward,
            lastPayout: reward
          }));
          setBalance(prev => prev + reward);
          
          // Check achievements
          checkAchievements(reward);
          
          return 0;
        }
        return prev + 2; // Progress speed
      });
    }, 100);
    
    setMiningInterval(interval);
  };

  // Stop mining
  const stopMining = () => {
    if (!isMining) return;
    
    setIsMining(false);
    if (miningInterval) {
      clearInterval(miningInterval);
      setMiningInterval(null);
    }
  };

  // Check and update achievements
  const checkAchievements = (reward: number) => {
    let updated = false;
    const newAchievements = achievements.map(achievement => {
      if (achievement.unlocked) return achievement;
      
      let requirementMet = false;
      
      switch (achievement.type) {
        case 'mined':
          requirementMet = stats.totalMined + reward >= achievement.requirement;
          break;
        case 'hashrate':
          requirementMet = stats.hashrate >= achievement.requirement;
          break;
        case 'efficiency':
          requirementMet = stats.efficiency >= achievement.requirement;
          break;
        case 'upgrades':
          requirementMet = upgrades.filter(u => u.applied).length >= achievement.requirement;
          break;
      }
      
      if (requirementMet && !achievement.unlocked) {
        updated = true;
        
        // Show achievement notification
        toast({
          title: '🏆 Achievement Unlocked!',
          description: `${achievement.name}: ${achievement.description}`,
        });
        
        // Add reward
        setBalance(prev => prev + achievement.reward);
        
        // Show confetti
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        
        // Trigger confetti animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        return { ...achievement, unlocked: true };
      }
      
      return achievement;
    });
    
    if (updated) {
      setAchievements(newAchievements);
    }
  };

  // Purchase hardware
  const purchaseHardware = (id: string) => {
    const hardwareItem = hardware.find(h => h.id === id);
    if (!hardwareItem || hardwareItem.level > 0 || balance < hardwareItem.price) return;
    
    setBalance(prev => prev - hardwareItem.price);
    
    const updatedHardware = hardware.map(h => 
      h.id === id ? { ...h, level: 1 } : h
    );
    
    setHardware(updatedHardware);
    
    toast({
      title: 'Hardware Purchased',
      description: `You've purchased ${hardwareItem.name}!`,
    });
  };

  // Upgrade hardware
  const upgradeHardware = (id: string) => {
    const hardwareItem = hardware.find(h => h.id === id);
    if (!hardwareItem || hardwareItem.level >= hardwareItem.maxLevel) return;
    
    const upgradeCost = Math.round(hardwareItem.price * 0.5 * (hardwareItem.level + 1));
    
    if (balance < upgradeCost) {
      toast({
        title: 'Insufficient Funds',
        description: `You need ${upgradeCost} AVI to upgrade this hardware.`,
        variant: 'destructive'
      });
      return;
    }
    
    setBalance(prev => prev - upgradeCost);
    
    const updatedHardware = hardware.map(h => {
      if (h.id === id) {
        const newLevel = h.level + 1;
        const levelMultiplier = 1 + (newLevel * 0.2);
        
        return {
          ...h,
          level: newLevel,
          hashrate: h.type === 'CPU' ? 0.5 * levelMultiplier : 
                    h.type === 'GPU' ? 30 * levelMultiplier : 
                    100 * levelMultiplier,
          efficiency: h.efficiency * (1 + (newLevel * 0.05))
        };
      }
      return h;
    });
    
    setHardware(updatedHardware);
    
    // Update stats if this is the active hardware
    if (id === activeHardware) {
      const updatedItem = updatedHardware.find(h => h.id === id);
      if (updatedItem) {
        setStats(prev => ({
          ...prev,
          hashrate: updatedItem.hashrate,
          efficiency: updatedItem.efficiency,
          power: updatedItem.power
        }));
      }
    }
    
    toast({
      title: 'Hardware Upgraded',
      description: `You've upgraded your ${hardwareItem.name} to level ${hardwareItem.level + 1}!`,
    });
  };

  // Purchase upgrade
  const purchaseUpgrade = (id: string) => {
    const upgrade = upgrades.find(u => u.id === id);
    if (!upgrade || upgrade.applied || balance < upgrade.cost) return;
    
    setBalance(prev => prev - upgrade.cost);
    
    const updatedUpgrades = upgrades.map(u => 
      u.id === id ? { ...u, applied: true } : u
    );
    
    setUpgrades(updatedUpgrades);
    
    // Apply upgrade effect
    const activeDevice = hardware.find(h => h.id === activeHardware);
    if (activeDevice) {
      switch (upgrade.effect.type) {
        case 'hashrate':
          setStats(prev => ({
            ...prev,
            hashrate: prev.hashrate * (1 + upgrade.effect.value)
          }));
          break;
        case 'power':
          setStats(prev => ({
            ...prev,
            power: prev.power * (1 + upgrade.effect.value)
          }));
          break;
        case 'efficiency':
          setStats(prev => ({
            ...prev,
            efficiency: prev.efficiency * (1 + upgrade.effect.value)
          }));
          break;
        // Luck is applied directly in reward calculation
      }
    }
    
    toast({
      title: 'Upgrade Purchased',
      description: `You've purchased ${upgrade.name}!`,
    });
    
    // Check for upgrade achievement
    checkAchievements(0);
  };

  // Switch active hardware
  const switchHardware = (id: string) => {
    const hardwareItem = hardware.find(h => h.id === id);
    if (!hardwareItem || hardwareItem.level === 0) return;
    
    setActiveHardware(id);
    
    // Update stats based on new hardware
    setStats(prev => ({
      ...prev,
      hashrate: hardwareItem.hashrate,
      efficiency: hardwareItem.efficiency,
      power: hardwareItem.power
    }));
    
    // Restart mining if it was active
    if (isMining) {
      stopMining();
      setTimeout(startMining, 100);
    }
    
    toast({
      title: 'Hardware Switched',
      description: `Now mining with ${hardwareItem.name}`,
    });
  };

  // Format number with suffix
  const formatNumber = (num: number, decimals: number = 2) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(decimals) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(decimals) + 'K';
    }
    return num.toFixed(decimals);
  };

  // Calculate uptime
  const getUptime = () => {
    const seconds = Math.floor((Date.now() - stats.startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  // Calculate upgrade cost for hardware
  const getUpgradeCost = (item: MiningHardware) => {
    return Math.round(item.price * 0.5 * (item.level + 1));
  };

  // Calculate mining efficiency (AVI per watt)
  const getMiningEfficiency = () => {
    if (stats.power === 0) return 0;
    return (stats.hashrate * 0.01) / stats.power;
  };

  // Render hardware card
  const renderHardwareCard = (item: MiningHardware) => {
    const isActive = activeHardware === item.id;
    const isOwned = item.level > 0;
    const canUpgrade = isOwned && item.level < item.maxLevel;
    const upgradeCost = getUpgradeCost(item);
    
    return (
      <Card key={item.id} className={`transition-all duration-300 ${isActive ? 'border-primary shadow-lg' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className={`p-1.5 rounded-full ${isActive ? 'bg-primary text-white' : 'bg-muted'}`}>
                  {item.icon}
                </span>
                {item.name}
              </CardTitle>
              <CardDescription>
                Level {item.level}/{item.maxLevel} {item.type} Miner
              </CardDescription>
            </div>
            <Badge variant={isActive ? "default" : "outline"}>
              {isActive ? "Active" : item.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <div className="text-xs text-muted-foreground">Hashrate</div>
              <div className="font-medium">{formatNumber(item.hashrate)} H/s</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Power</div>
              <div className="font-medium">{item.power}W</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Efficiency</div>
              <div className="font-medium">{item.efficiency.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Est. Reward</div>
              <div className="font-medium">{(item.hashrate * 0.01).toFixed(4)} AVI/h</div>
            </div>
          </div>
          
          {isOwned && canUpgrade && (
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-1">Level Progress</div>
              <div className="flex items-center gap-2">
                <Progress value={(item.level / item.maxLevel) * 100} className="h-2" />
                <span className="text-xs">{item.level}/{item.maxLevel}</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          {!isOwned ? (
            <Button 
              onClick={() => purchaseHardware(item.id)} 
              disabled={balance < item.price}
              className="w-full"
            >
              Buy for {item.price} AVI
            </Button>
          ) : (
            <>
              {!isActive && (
                <Button 
                  onClick={() => switchHardware(item.id)} 
                  variant="outline"
                  className="flex-1"
                >
                  Select
                </Button>
              )}
              
              {canUpgrade && (
                <Button 
                  onClick={() => upgradeHardware(item.id)} 
                  disabled={balance < upgradeCost}
                  className={`flex-1 ${isActive ? 'w-full' : ''}`}
                >
                  Upgrade ({upgradeCost} AVI)
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1 cyberpunk-text">Mining Center</h1>
        <p className="text-muted-foreground">Mine AVI tokens with your hardware</p>
      </div>
      
      {/* Mining Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Balance Card */}
        <Card className="md:col-span-2 gradient-bg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              AVI Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-4xl font-bold neon-text">{formatNumber(balance, 4)}</div>
              <div className="text-lg text-muted-foreground mb-1">AVI</div>
            </div>
            
            {stats.lastPayout > 0 && (
              <div className="text-sm text-green-500 mt-1">
                +{stats.lastPayout.toFixed(4)} AVI last payout
              </div>
            )}
          </CardContent>
          <CardFooter>
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Mining Progress</span>
                <span className="text-sm">{miningProgress.toFixed(0)}%</span>
              </div>
              <Progress value={miningProgress} className="h-2 mb-4" />
              
              <div className="flex gap-2">
                {isMining ? (
                  <Button 
                    onClick={stopMining} 
                    variant="destructive"
                    className="flex-1"
                  >
                    Stop Mining
                  </Button>
                ) : (
                  <Button 
                    onClick={startMining} 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Start Mining
                  </Button>
                )}
              </div>
            </div>
          </CardFooter>
        </Card>
        
        {/* Stats Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              Mining Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Hashrate</div>
                <div className="font-medium">{formatNumber(stats.hashrate)} H/s</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Power</div>
                <div className="font-medium">{stats.power}W</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Efficiency</div>
                <div className="font-medium">{getMiningEfficiency().toFixed(6)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Uptime</div>
                <div className="font-medium">{getUptime()}</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full">
              <div className="text-xs text-muted-foreground mb-1">Total Mined</div>
              <div className="text-xl font-bold">{formatNumber(stats.totalMined, 4)} AVI</div>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <Tabs defaultValue="hardware" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="hardware" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Hardware
          </TabsTrigger>
          <TabsTrigger value="upgrades" className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Upgrades
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Achievements
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="hardware">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hardware.map(renderHardwareCard)}
          </div>
        </TabsContent>
        
        <TabsContent value="upgrades">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upgrades.map(upgrade => (
              <Card key={upgrade.id} className={upgrade.applied ? 'border-green-500' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className={`p-1.5 rounded-full ${upgrade.applied ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                      {upgrade.icon}
                    </span>
                    {upgrade.name}
                  </CardTitle>
                  <CardDescription>{upgrade.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Effect:</span>
                    <Badge variant="outline">
                      {upgrade.effect.type === 'power' ? 'Power Consumption' : 
                       upgrade.effect.type === 'hashrate' ? 'Hashrate' :
                       upgrade.effect.type === 'efficiency' ? 'Efficiency' : 'Mining Luck'}
                       {' '}
                      {upgrade.effect.value > 0 ? '+' : ''}{(upgrade.effect.value * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  {upgrade.applied ? (
                    <Badge className="w-full justify-center py-2 bg-green-500">
                      Applied
                    </Badge>
                  ) : (
                    <Button 
                      onClick={() => purchaseUpgrade(upgrade.id)} 
                      disabled={balance < upgrade.cost}
                      className="w-full"
                    >
                      Purchase for {upgrade.cost} AVI
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="achievements">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {achievements.map(achievement => (
              <Card key={achievement.id} className={achievement.unlocked ? 'border-yellow-500' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className={`p-1.5 rounded-full ${achievement.unlocked ? 'bg-yellow-500 text-white' : 'bg-muted'}`}>
                      {achievement.icon}
                    </span>
                    {achievement.name}
                  </CardTitle>
                  <CardDescription>{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Progress:</span>
                      <span>
                        {achievement.type === 'mined' ? formatNumber(stats.totalMined, 1) : 
                         achievement.type === 'hashrate' ? formatNumber(stats.hashrate, 1) :
                         achievement.type === 'efficiency' ? stats.efficiency.toFixed(2) :
                         upgrades.filter(u => u.applied).length}
                        /{formatNumber(achievement.requirement, 1)}
                      </span>
                    </div>
                    
                    <Progress 
                      value={achievement.unlocked ? 100 : 
                             achievement.type === 'mined' ? Math.min(100, (stats.totalMined / achievement.requirement) * 100) : 
                             achievement.type === 'hashrate' ? Math.min(100, (stats.hashrate / achievement.requirement) * 100) :
                             achievement.type === 'efficiency' ? Math.min(100, (stats.efficiency / achievement.requirement) * 100) :
                             Math.min(100, (upgrades.filter(u => u.applied).length / achievement.requirement) * 100)} 
                      className="h-2" 
                    />
                    
                    <div className="flex items-center gap-1 text-sm">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span>Reward: {achievement.reward} AVI</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  {achievement.unlocked ? (
                    <Badge className="w-full justify-center py-2 bg-yellow-500">
                      Unlocked
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="w-full justify-center py-2">
                      Locked
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Mining Activity Feed */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Mining Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-full">
                    <Coins className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium">Mining Reward</div>
                    <div className="text-sm text-muted-foreground">+{stats.lastPayout.toFixed(4)} AVI</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Just now</div>
              </div>
              
              {achievements.filter(a => a.unlocked).map((achievement, index) => (
                <div key={achievement.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-500/20 p-2 rounded-full">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                      <div className="font-medium">Achievement Unlocked: {achievement.name}</div>
                      <div className="text-sm text-muted-foreground">+{achievement.reward} AVI reward</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{index === 0 ? '2m ago' : index === 1 ? '15m ago' : '1h ago'}</div>
                </div>
              ))}
              
              {upgrades.filter(u => u.applied).map((upgrade, index) => (
                <div key={upgrade.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-full">
                      <Cog className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium">Upgrade Applied: {upgrade.name}</div>
                      <div className="text-sm text-muted-foreground">{upgrade.description}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{index === 0 ? '30m ago' : index === 1 ? '2h ago' : '5h ago'}</div>
                </div>
              ))}
              
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <Pickaxe className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Mining Started</div>
                    <div className="text-sm text-muted-foreground">Using {hardware.find(h => h.id === activeHardware)?.name}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{getUptime()} ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Confetti effect for achievements */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          />
        )}
      </AnimatePresence>
      
      {/* Mining Tips */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Mining Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-md">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Rocket className="h-4 w-4 text-primary" />
                  Getting Started
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start with the basic CPU miner and save up for more powerful hardware. Upgrade your equipment to increase mining efficiency.
                </p>
              </div>
              
              <div className="p-4 border rounded-md">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Gauge className="h-4 w-4 text-primary" />
                  Optimize Performance
                </h3>
                <p className="text-sm text-muted-foreground">
                  Purchase upgrades to improve your mining efficiency. Focus on hashrate and efficiency upgrades for the best results.
                </p>
              </div>
              
              <div className="p-4 border rounded-md">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Achievements
                </h3>
                <p className="text-sm text-muted-foreground">
                  Complete achievements to earn bonus AVI tokens. These can help you purchase better equipment faster.
                </p>
              </div>
              
              <div className="p-4 border rounded-md">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Gem className="h-4 w-4 text-blue-500" />
                  Advanced Mining
                </h3>
                <p className="text-sm text-muted-foreground">
                  ASIC miners offer the highest hashrates but consume more power. Balance your hardware choices based on your mining goals.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Mining;