import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SplashCursor } from '@/components/ui/splash-cursor';
import { 
  Pickaxe, 
  Cpu, 
  Zap, 
  Bolt, 
  BarChart, 
  Clock, 
  Coins, 
  Trophy, 
  Users, 
  ArrowUp, 
  ArrowDown, 
  Flame,
  Sparkles,
  Gem,
  Gift,
  Rocket,
  Layers,
  Wallet,
  Landmark,
  Lightbulb
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNotification } from '@/context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// Mining difficulty levels
const DIFFICULTY_LEVELS = {
  easy: { hashRate: 10, powerUsage: 5, reward: 0.5 },
  medium: { hashRate: 25, powerUsage: 15, reward: 1.5 },
  hard: { hashRate: 50, powerUsage: 35, reward: 3.5 },
  extreme: { hashRate: 100, powerUsage: 75, reward: 8 }
};

// Mining pools
const MINING_POOLS = [
  { id: 'solo', name: 'Solo Mining', fee: 0, minPayout: 0.001, reliability: 'Variable' },
  { id: 'avilashaPool', name: 'Avilasha Pool', fee: 1, minPayout: 0.01, reliability: 'High' },
  { id: 'megaPool', name: 'MegaPool', fee: 2, minPayout: 0.005, reliability: 'Very High' },
  { id: 'cryptoUnion', name: 'Crypto Union', fee: 1.5, minPayout: 0.02, reliability: 'Medium' }
];

// Hardware options
const HARDWARE_OPTIONS = [
  { id: 'cpu', name: 'CPU Mining', hashRate: 5, powerUsage: 10, initialCost: 0 },
  { id: 'gpu', name: 'GPU Mining', hashRate: 25, powerUsage: 30, initialCost: 500 },
  { id: 'asic', name: 'ASIC Miner', hashRate: 100, powerUsage: 80, initialCost: 2000 }
];

const Mining = () => {
  // State for mining
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [miningSpeed, setMiningSpeed] = useState(1);
  const [miningPower, setMiningPower] = useState(50);
  const [difficulty, setDifficulty] = useState('medium');
  const [miningPool, setMiningPool] = useState('avilashaPool');
  const [hardware, setHardware] = useState('cpu');
  const [autoReinvest, setAutoReinvest] = useState(false);
  const [showEffects, setShowEffects] = useState(true);
  
  // Mining stats
  const [totalMined, setTotalMined] = useState(0);
  const [miningRate, setMiningRate] = useState(0);
  const [powerUsage, setPowerUsage] = useState(0);
  const [sessionRewards, setSessionRewards] = useState(0);
  const [miningHistory, setMiningHistory] = useState<{timestamp: number, amount: number}[]>([]);
  const [lastReward, setLastReward] = useState(0);
  const [miningLevel, setMiningLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [nextLevelExp, setNextLevelExp] = useState(100);
  
  // Hardware stats
  const [ownedHardware, setOwnedHardware] = useState<{[key: string]: number}>({
    cpu: 1,
    gpu: 0,
    asic: 0
  });
  
  // Economy
  const [balance, setBalance] = useState(100); // Starting with 100 credits
  const [electricityCost, setElectricityCost] = useState(0.12); // $ per kWh
  
  // Upgrades
  const [upgrades, setUpgrades] = useState<{[key: string]: number}>({
    cooling: 0,
    efficiency: 0,
    overclocking: 0,
    luck: 0
  });
  
  // Achievements
  const [achievements, setAchievements] = useState<{[key: string]: boolean}>({
    firstMine: false,
    reach10: false,
    reach100: false,
    reach1000: false,
    level5: false,
    level10: false,
    allHardware: false
  });
  
  // References
  const miningInterval = useRef<NodeJS.Timeout | null>(null);
  const { addNotification } = useNotification();
  
  // Calculate effective mining rate based on all factors
  const calculateMiningRate = useCallback(() => {
    const selectedHardware = HARDWARE_OPTIONS.find(h => h.id === hardware);
    const difficultySettings = DIFFICULTY_LEVELS[difficulty as keyof typeof DIFFICULTY_LEVELS];
    
    if (!selectedHardware || !difficultySettings) return 0;
    
    // Base rate from hardware
    let rate = selectedHardware.hashRate * (ownedHardware[hardware] || 1);
    
    // Apply difficulty modifier
    rate = rate * (difficultySettings.hashRate / 50);
    
    // Apply mining power (slider)
    rate = rate * (miningPower / 100);
    
    // Apply mining speed
    rate = rate * miningSpeed;
    
    // Apply upgrades
    rate = rate * (1 + (upgrades.efficiency * 0.1));
    rate = rate * (1 + (upgrades.overclocking * 0.15));
    
    // Apply mining level bonus (2% per level)
    rate = rate * (1 + ((miningLevel - 1) * 0.02));
    
    return parseFloat(rate.toFixed(2));
  }, [difficulty, hardware, miningPower, miningSpeed, ownedHardware, upgrades, miningLevel]);
  
  // Calculate power usage
  const calculatePowerUsage = useCallback(() => {
    const selectedHardware = HARDWARE_OPTIONS.find(h => h.id === hardware);
    if (!selectedHardware) return 0;
    
    // Base power from hardware
    let power = selectedHardware.powerUsage * (ownedHardware[hardware] || 1);
    
    // Apply mining power (slider)
    power = power * (miningPower / 100);
    
    // Apply overclocking (increases power usage)
    power = power * (1 + (upgrades.overclocking * 0.2));
    
    // Apply cooling (reduces power usage)
    power = power * (1 - (upgrades.cooling * 0.08));
    
    return parseFloat(power.toFixed(2));
  }, [hardware, miningPower, upgrades, ownedHardware]);
  
  // Calculate hourly profit
  const calculateHourlyProfit = useCallback(() => {
    const rate = calculateMiningRate();
    const power = calculatePowerUsage();
    const difficultySettings = DIFFICULTY_LEVELS[difficulty as keyof typeof DIFFICULTY_LEVELS];
    const pool = MINING_POOLS.find(p => p.id === miningPool);
    
    if (!difficultySettings || !pool) return 0;
    
    // Calculate hourly mining reward
    const hourlyReward = rate * difficultySettings.reward;
    
    // Apply pool fee
    const afterFee = hourlyReward * (1 - (pool.fee / 100));
    
    // Calculate electricity cost
    const hourlyCost = (power / 1000) * electricityCost;
    
    // Apply luck bonus
    const withLuck = afterFee * (1 + (upgrades.luck * 0.05));
    
    return parseFloat((withLuck - hourlyCost).toFixed(2));
  }, [calculateMiningRate, calculatePowerUsage, difficulty, electricityCost, miningPool, upgrades]);
  
  // Initialize and update mining rate
  useEffect(() => {
    const newRate = calculateMiningRate();
    setMiningRate(newRate);
    
    const newPower = calculatePowerUsage();
    setPowerUsage(newPower);
  }, [calculateMiningRate, calculatePowerUsage]);
  
  // Start/stop mining
  const toggleMining = () => {
    if (isMining) {
      // Stop mining
      if (miningInterval.current) {
        clearInterval(miningInterval.current);
        miningInterval.current = null;
      }
      setIsMining(false);
      toast({
        title: "Mining Stopped",
        description: `You mined ${sessionRewards.toFixed(4)} AVI tokens this session`,
      });
    } else {
      // Start mining
      setIsMining(true);
      setSessionRewards(0);
      
      // Create mining interval
      miningInterval.current = setInterval(() => {
        // Update progress
        setMiningProgress(prev => {
          const increment = (miningRate / 100) * 2; // Adjust for visual speed
          const newProgress = prev + increment;
          
          // If completed a block
          if (newProgress >= 100) {
            const reward = calculateReward();
            setTotalMined(prev => prev + reward);
            setBalance(prev => prev + reward);
            setSessionRewards(prev => prev + reward);
            setLastReward(reward);
            
            // Add to history
            setMiningHistory(prev => [
              { timestamp: Date.now(), amount: reward },
              ...prev.slice(0, 19) // Keep last 20 entries
            ]);
            
            // Add experience
            const expGain = Math.ceil(reward * 10);
            addExperience(expGain);
            
            // Show notification
            addNotification({
              id: `mining-${Date.now()}`,
              type: 'transaction',
              title: 'Mining Reward',
              description: `You mined ${reward.toFixed(4)} AVI tokens`,
              timestamp: Date.now(),
              read: false
            });
            
            // Show toast occasionally (not every time to avoid spam)
            if (Math.random() < 0.3) {
              toast({
                title: "Block Mined!",
                description: `You earned ${reward.toFixed(4)} AVI tokens`,
              });
            }
            
            // Show confetti effect for larger rewards
            if (reward > 1 && showEffects) {
              triggerConfetti();
            }
            
            // Check for achievements
            checkAchievements(reward);
            
            return 0; // Reset progress
          }
          
          return newProgress;
        });
      }, 100); // Update every 100ms
    }
  };
  
  // Calculate mining reward
  const calculateReward = () => {
    const difficultySettings = DIFFICULTY_LEVELS[difficulty as keyof typeof DIFFICULTY_LEVELS];
    const pool = MINING_POOLS.find(p => p.id === miningPool);
    
    if (!difficultySettings || !pool) return 0;
    
    // Base reward from difficulty
    let reward = difficultySettings.reward;
    
    // Apply randomness (±20%)
    const randomFactor = 0.8 + (Math.random() * 0.4);
    reward = reward * randomFactor;
    
    // Apply pool fee
    reward = reward * (1 - (pool.fee / 100));
    
    // Apply luck bonus
    reward = reward * (1 + (upgrades.luck * 0.05));
    
    // Apply mining level bonus (2% per level)
    reward = reward * (1 + ((miningLevel - 1) * 0.02));
    
    // Small chance for bonus reward (jackpot)
    if (Math.random() < 0.05 * (1 + (upgrades.luck * 0.1))) {
      reward = reward * (2 + Math.random() * 3); // 2-5x bonus
      
      toast({
        title: "Jackpot!",
        description: `You found a rare block worth ${reward.toFixed(4)} AVI tokens!`,
      });
      
      if (showEffects) {
        triggerConfetti();
      }
    }
    
    return parseFloat(reward.toFixed(4));
  };
  
  // Add experience and handle level ups
  const addExperience = (amount: number) => {
    setExperience(prev => {
      const newExp = prev + amount;
      
      // Check for level up
      if (newExp >= nextLevelExp) {
        const newLevel = miningLevel + 1;
        setMiningLevel(newLevel);
        
        // Calculate next level requirement (increases each level)
        const nextExp = Math.floor(100 * Math.pow(1.5, newLevel - 1));
        setNextLevelExp(nextExp);
        
        // Show level up notification
        toast({
          title: "Level Up!",
          description: `You reached mining level ${newLevel}!`,
        });
        
        if (showEffects) {
          triggerConfetti();
        }
        
        return newExp - nextLevelExp; // Carry over excess XP
      }
      
      return newExp;
    });
  };
  
  // Check for achievements
  const checkAchievements = (reward: number) => {
    const newAchievements = { ...achievements };
    let achievementUnlocked = false;
    
    // First mining achievement
    if (!achievements.firstMine) {
      newAchievements.firstMine = true;
      achievementUnlocked = true;
    }
    
    // Total mined achievements
    const newTotal = totalMined + reward;
    if (newTotal >= 10 && !achievements.reach10) {
      newAchievements.reach10 = true;
      achievementUnlocked = true;
    }
    if (newTotal >= 100 && !achievements.reach100) {
      newAchievements.reach100 = true;
      achievementUnlocked = true;
    }
    if (newTotal >= 1000 && !achievements.reach1000) {
      newAchievements.reach1000 = true;
      achievementUnlocked = true;
    }
    
    // Level achievements
    if (miningLevel >= 5 && !achievements.level5) {
      newAchievements.level5 = true;
      achievementUnlocked = true;
    }
    if (miningLevel >= 10 && !achievements.level10) {
      newAchievements.level10 = true;
      achievementUnlocked = true;
    }
    
    // Hardware achievement
    if (ownedHardware.cpu > 0 && ownedHardware.gpu > 0 && ownedHardware.asic > 0 && !achievements.allHardware) {
      newAchievements.allHardware = true;
      achievementUnlocked = true;
    }
    
    if (achievementUnlocked) {
      setAchievements(newAchievements);
      
      toast({
        title: "Achievement Unlocked!",
        description: "You've unlocked a new mining achievement!",
      });
      
      if (showEffects) {
        triggerConfetti();
      }
    }
  };
  
  // Buy hardware
  const buyHardware = (type: string) => {
    const hardware = HARDWARE_OPTIONS.find(h => h.id === type);
    if (!hardware) return;
    
    if (balance >= hardware.initialCost) {
      setBalance(prev => prev - hardware.initialCost);
      setOwnedHardware(prev => ({
        ...prev,
        [type]: (prev[type] || 0) + 1
      }));
      
      toast({
        title: "Hardware Purchased",
        description: `You purchased a new ${hardware.name}`,
      });
      
      // Check for achievement
      if (ownedHardware.cpu > 0 && ownedHardware.gpu > 0 && ownedHardware.asic > 0) {
        if (!achievements.allHardware) {
          setAchievements(prev => ({ ...prev, allHardware: true }));
          
          toast({
            title: "Achievement Unlocked!",
            description: "You've collected all types of mining hardware!",
          });
          
          if (showEffects) {
            triggerConfetti();
          }
        }
      }
    } else {
      toast({
        title: "Insufficient Funds",
        description: `You need ${hardware.initialCost} AVI to purchase this hardware`,
        variant: "destructive"
      });
    }
  };
  
  // Buy upgrade
  const buyUpgrade = (type: string) => {
    const currentLevel = upgrades[type] || 0;
    const cost = calculateUpgradeCost(type, currentLevel);
    
    if (balance >= cost) {
      setBalance(prev => prev - cost);
      setUpgrades(prev => ({
        ...prev,
        [type]: currentLevel + 1
      }));
      
      toast({
        title: "Upgrade Purchased",
        description: `You upgraded your ${type} to level ${currentLevel + 1}`,
      });
    } else {
      toast({
        title: "Insufficient Funds",
        description: `You need ${cost} AVI to purchase this upgrade`,
        variant: "destructive"
      });
    }
  };
  
  // Calculate upgrade cost
  const calculateUpgradeCost = (type: string, level: number) => {
    const baseCost = {
      cooling: 50,
      efficiency: 75,
      overclocking: 100,
      luck: 150
    };
    
    // Cost increases with each level
    return Math.floor(baseCost[type as keyof typeof baseCost] * Math.pow(1.5, level));
  };
  
  // Trigger confetti effect
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (miningInterval.current) {
        clearInterval(miningInterval.current);
      }
    };
  }, []);
  
  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('avilasha_mining_data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setTotalMined(data.totalMined || 0);
        setBalance(data.balance || 100);
        setMiningLevel(data.miningLevel || 1);
        setExperience(data.experience || 0);
        setNextLevelExp(data.nextLevelExp || 100);
        setOwnedHardware(data.ownedHardware || { cpu: 1, gpu: 0, asic: 0 });
        setUpgrades(data.upgrades || { cooling: 0, efficiency: 0, overclocking: 0, luck: 0 });
        setAchievements(data.achievements || {
          firstMine: false,
          reach10: false,
          reach100: false,
          reach1000: false,
          level5: false,
          level10: false,
          allHardware: false
        });
      } catch (error) {
        console.error('Error loading mining data:', error);
      }
    }
  }, []);
  
  // Save data to localStorage
  useEffect(() => {
    const dataToSave = {
      totalMined,
      balance,
      miningLevel,
      experience,
      nextLevelExp,
      ownedHardware,
      upgrades,
      achievements
    };
    
    localStorage.setItem('avilasha_mining_data', JSON.stringify(dataToSave));
  }, [totalMined, balance, miningLevel, experience, nextLevelExp, ownedHardware, upgrades, achievements]);
  
  return (
    <div className="animate-fade-in relative">
      {showEffects && isMining && <SplashCursor />}
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
          <Pickaxe className="h-8 w-8 text-primary" />
          <span className="cyberpunk-text">Crypto Mining</span>
        </h1>
        <p className="text-muted-foreground">Mine AVI tokens with your hardware</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main mining panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20 shadow-lg gradient-bg overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    Mining Control Center
                  </CardTitle>
                  <CardDescription>
                    Level {miningLevel} Miner • {experience}/{nextLevelExp} XP
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isMining ? "default" : "outline"} className={isMining ? "bg-green-500 text-white" : ""}>
                    {isMining ? "Mining Active" : "Mining Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pb-2">
              {/* Mining progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Mining Progress</span>
                  <span className="text-sm">{miningProgress.toFixed(1)}%</span>
                </div>
                <Progress value={miningProgress} className="h-3" />
              </div>
              
              {/* Mining stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-card/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Hash Rate</div>
                  <div className="text-xl font-bold flex items-center gap-1">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    {miningRate} H/s
                  </div>
                </div>
                
                <div className="bg-card/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Power Usage</div>
                  <div className="text-xl font-bold flex items-center gap-1">
                    <Bolt className="h-4 w-4 text-red-500" />
                    {powerUsage} W
                  </div>
                </div>
                
                <div className="bg-card/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Hourly Profit</div>
                  <div className="text-xl font-bold flex items-center gap-1">
                    <Coins className="h-4 w-4 text-green-500" />
                    {calculateHourlyProfit()} AVI
                  </div>
                </div>
                
                <div className="bg-card/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Last Reward</div>
                  <div className="text-xl font-bold flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    {lastReward.toFixed(4)} AVI
                  </div>
                </div>
              </div>
              
              {/* Mining controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label className="mb-2 block">Mining Power ({miningPower}%)</Label>
                  <Slider
                    value={[miningPower]}
                    onValueChange={(value) => setMiningPower(value[0])}
                    min={10}
                    max={100}
                    step={1}
                    disabled={isMining}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Eco</span>
                    <span>Balanced</span>
                    <span>Performance</span>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Mining Speed ({miningSpeed}x)</Label>
                  <Slider
                    value={[miningSpeed]}
                    onValueChange={(value) => setMiningSpeed(value[0])}
                    min={0.5}
                    max={2}
                    step={0.1}
                    disabled={isMining}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Slow</span>
                    <span>Normal</span>
                    <span>Fast</span>
                  </div>
                </div>
              </div>
              
              {/* Mining settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label className="mb-2 block">Difficulty</Label>
                  <select
                    className="w-full p-2 rounded-md border border-input bg-background"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    disabled={isMining}
                  >
                    <option value="easy">Easy (Lower rewards, higher success)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="hard">Hard (Higher rewards, lower success)</option>
                    <option value="extreme">Extreme (Highest rewards, lowest success)</option>
                  </select>
                </div>
                
                <div>
                  <Label className="mb-2 block">Mining Pool</Label>
                  <select
                    className="w-full p-2 rounded-md border border-input bg-background"
                    value={miningPool}
                    onChange={(e) => setMiningPool(e.target.value)}
                    disabled={isMining}
                  >
                    {MINING_POOLS.map(pool => (
                      <option key={pool.id} value={pool.id}>
                        {pool.name} (Fee: {pool.fee}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Additional options */}
              <div className="flex flex-wrap gap-6 mb-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-reinvest"
                    checked={autoReinvest}
                    onCheckedChange={setAutoReinvest}
                  />
                  <Label htmlFor="auto-reinvest">Auto-reinvest rewards</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-effects"
                    checked={showEffects}
                    onCheckedChange={setShowEffects}
                  />
                  <Label htmlFor="show-effects">Show visual effects</Label>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                onClick={toggleMining} 
                className={`w-full ${isMining ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'} text-white font-bold py-3 text-lg`}
              >
                {isMining ? (
                  <span className="flex items-center gap-2">
                    <Flame className="h-5 w-5 animate-pulse" />
                    Stop Mining
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Pickaxe className="h-5 w-5" />
                    Start Mining
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Tabs defaultValue="hardware" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="hardware" className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                <span>Hardware</span>
              </TabsTrigger>
              <TabsTrigger value="upgrades" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Upgrades</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span>Stats</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="hardware" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mining Hardware</CardTitle>
                  <CardDescription>Purchase and manage your mining equipment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {HARDWARE_OPTIONS.map(item => (
                      <Card key={item.id} className={`border ${hardware === item.id ? 'border-primary' : 'border-border'}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex justify-between">
                            <span>{item.name}</span>
                            <Badge>{ownedHardware[item.id] || 0}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Hash Rate:</span>
                              <span>{item.hashRate} H/s</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Power Usage:</span>
                              <span>{item.powerUsage} W</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cost:</span>
                              <span>{item.initialCost} AVI</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setHardware(item.id)}
                            disabled={ownedHardware[item.id] <= 0}
                          >
                            Select
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => buyHardware(item.id)}
                            disabled={balance < item.initialCost}
                          >
                            Buy
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="upgrades" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mining Upgrades</CardTitle>
                  <CardDescription>Improve your mining operation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex justify-between">
                          <span>Cooling System</span>
                          <Badge>Level {upgrades.cooling || 0}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground mb-2">
                          Reduces power consumption by 8% per level
                        </p>
                        <div className="flex justify-between text-sm">
                          <span>Current Bonus:</span>
                          <span>-{((upgrades.cooling || 0) * 8)}% power usage</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Upgrade Cost:</span>
                          <span>{calculateUpgradeCost('cooling', upgrades.cooling || 0)} AVI</span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full"
                          onClick={() => buyUpgrade('cooling')}
                          disabled={balance < calculateUpgradeCost('cooling', upgrades.cooling || 0)}
                        >
                          Upgrade Cooling
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex justify-between">
                          <span>Efficiency</span>
                          <Badge>Level {upgrades.efficiency || 0}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground mb-2">
                          Increases hash rate by 10% per level
                        </p>
                        <div className="flex justify-between text-sm">
                          <span>Current Bonus:</span>
                          <span>+{((upgrades.efficiency || 0) * 10)}% hash rate</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Upgrade Cost:</span>
                          <span>{calculateUpgradeCost('efficiency', upgrades.efficiency || 0)} AVI</span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full"
                          onClick={() => buyUpgrade('efficiency')}
                          disabled={balance < calculateUpgradeCost('efficiency', upgrades.efficiency || 0)}
                        >
                          Upgrade Efficiency
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex justify-between">
                          <span>Overclocking</span>
                          <Badge>Level {upgrades.overclocking || 0}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground mb-2">
                          Increases hash rate by 15% but power usage by 20% per level
                        </p>
                        <div className="flex justify-between text-sm">
                          <span>Current Bonus:</span>
                          <span>+{((upgrades.overclocking || 0) * 15)}% hash rate</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Current Penalty:</span>
                          <span>+{((upgrades.overclocking || 0) * 20)}% power usage</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Upgrade Cost:</span>
                          <span>{calculateUpgradeCost('overclocking', upgrades.overclocking || 0)} AVI</span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full"
                          onClick={() => buyUpgrade('overclocking')}
                          disabled={balance < calculateUpgradeCost('overclocking', upgrades.overclocking || 0)}
                        >
                          Upgrade Overclocking
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex justify-between">
                          <span>Luck</span>
                          <Badge>Level {upgrades.luck || 0}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground mb-2">
                          Increases mining rewards by 5% and jackpot chance by 10% per level
                        </p>
                        <div className="flex justify-between text-sm">
                          <span>Current Bonus:</span>
                          <span>+{((upgrades.luck || 0) * 5)}% rewards</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Jackpot Chance:</span>
                          <span>{5 + ((upgrades.luck || 0) * 0.5)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Upgrade Cost:</span>
                          <span>{calculateUpgradeCost('luck', upgrades.luck || 0)} AVI</span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full"
                          onClick={() => buyUpgrade('luck')}
                          disabled={balance < calculateUpgradeCost('luck', upgrades.luck || 0)}
                        >
                          Upgrade Luck
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="stats" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mining Statistics</CardTitle>
                  <CardDescription>Your mining performance and history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Performance Metrics</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Total Mined</span>
                            <span className="text-sm font-medium">{totalMined.toFixed(4)} AVI</span>
                          </div>
                          <Progress value={Math.min(totalMined / 10, 100)} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Current Balance</span>
                            <span className="text-sm font-medium">{balance.toFixed(2)} AVI</span>
                          </div>
                          <Progress value={Math.min(balance / 100, 100)} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Mining Level</span>
                            <span className="text-sm font-medium">{miningLevel}</span>
                          </div>
                          <Progress value={(experience / nextLevelExp) * 100} className="h-2" />
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-muted-foreground">{experience} XP</span>
                            <span className="text-xs text-muted-foreground">{nextLevelExp} XP</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Session Rewards</span>
                            <span className="text-sm font-medium">{sessionRewards.toFixed(4)} AVI</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Electricity Cost</span>
                            <div className="flex items-center">
                              <Input
                                type="number"
                                value={electricityCost}
                                onChange={(e) => setElectricityCost(parseFloat(e.target.value))}
                                className="w-20 h-6 text-xs"
                                step="0.01"
                                min="0"
                              />
                              <span className="ml-1 text-xs">$/kWh</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Recent Mining Activity</h3>
                      <div className="max-h-60 overflow-y-auto pr-2">
                        {miningHistory.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            No mining activity yet
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {miningHistory.map((entry, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-card/50 rounded-md">
                                <div className="flex items-center gap-2">
                                  <Coins className="h-4 w-4 text-primary" />
                                  <span>{entry.amount.toFixed(4)} AVI</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(entry.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Mining Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-4">
                <div className="text-4xl font-bold mb-2 neon-text">{balance.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">AVI Tokens</div>
                
                <div className="w-full mt-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Total Mined</span>
                    <span>{totalMined.toFixed(4)} AVI</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Mining Rate</span>
                    <span>{miningRate} H/s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Hourly Profit</span>
                    <span className={calculateHourlyProfit() >= 0 ? "text-green-500" : "text-red-500"}>
                      {calculateHourlyProfit() >= 0 ? "+" : ""}{calculateHourlyProfit()} AVI
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className={`p-2 rounded-md flex items-center gap-2 ${achievements.firstMine ? 'bg-primary/20' : 'bg-muted/50 opacity-70'}`}>
                  <Pickaxe className={`h-5 w-5 ${achievements.firstMine ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className="font-medium">First Mine</div>
                    <div className="text-xs text-muted-foreground">Mine your first AVI token</div>
                  </div>
                  {achievements.firstMine && <Sparkles className="h-4 w-4 text-yellow-500 ml-auto" />}
                </div>
                
                <div className={`p-2 rounded-md flex items-center gap-2 ${achievements.reach10 ? 'bg-primary/20' : 'bg-muted/50 opacity-70'}`}>
                  <Gem className={`h-5 w-5 ${achievements.reach10 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className="font-medium">Novice Miner</div>
                    <div className="text-xs text-muted-foreground">Mine 10 AVI tokens</div>
                  </div>
                  {achievements.reach10 && <Sparkles className="h-4 w-4 text-yellow-500 ml-auto" />}
                </div>
                
                <div className={`p-2 rounded-md flex items-center gap-2 ${achievements.reach100 ? 'bg-primary/20' : 'bg-muted/50 opacity-70'}`}>
                  <Gift className={`h-5 w-5 ${achievements.reach100 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className="font-medium">Professional Miner</div>
                    <div className="text-xs text-muted-foreground">Mine 100 AVI tokens</div>
                  </div>
                  {achievements.reach100 && <Sparkles className="h-4 w-4 text-yellow-500 ml-auto" />}
                </div>
                
                <div className={`p-2 rounded-md flex items-center gap-2 ${achievements.reach1000 ? 'bg-primary/20' : 'bg-muted/50 opacity-70'}`}>
                  <Rocket className={`h-5 w-5 ${achievements.reach1000 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className="font-medium">Mining Magnate</div>
                    <div className="text-xs text-muted-foreground">Mine 1000 AVI tokens</div>
                  </div>
                  {achievements.reach1000 && <Sparkles className="h-4 w-4 text-yellow-500 ml-auto" />}
                </div>
                
                <div className={`p-2 rounded-md flex items-center gap-2 ${achievements.level5 ? 'bg-primary/20' : 'bg-muted/50 opacity-70'}`}>
                  <Layers className={`h-5 w-5 ${achievements.level5 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className="font-medium">Experienced</div>
                    <div className="text-xs text-muted-foreground">Reach mining level 5</div>
                  </div>
                  {achievements.level5 && <Sparkles className="h-4 w-4 text-yellow-500 ml-auto" />}
                </div>
                
                <div className={`p-2 rounded-md flex items-center gap-2 ${achievements.level10 ? 'bg-primary/20' : 'bg-muted/50 opacity-70'}`}>
                  <Landmark className={`h-5 w-5 ${achievements.level10 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className="font-medium">Mining Master</div>
                    <div className="text-xs text-muted-foreground">Reach mining level 10</div>
                  </div>
                  {achievements.level10 && <Sparkles className="h-4 w-4 text-yellow-500 ml-auto" />}
                </div>
                
                <div className={`p-2 rounded-md flex items-center gap-2 ${achievements.allHardware ? 'bg-primary/20' : 'bg-muted/50 opacity-70'}`}>
                  <Lightbulb className={`h-5 w-5 ${achievements.allHardware ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className="font-medium">Hardware Collector</div>
                    <div className="text-xs text-muted-foreground">Own all types of mining hardware</div>
                  </div>
                  {achievements.allHardware && <Sparkles className="h-4 w-4 text-yellow-500 ml-auto" />}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Mining Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Network Difficulty</span>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Network Hash Rate</span>
                  <span className="text-sm">1.45 TH/s</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Active Miners</span>
                  <span className="text-sm">12,458</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Block Reward</span>
                  <span className="text-sm">{DIFFICULTY_LEVELS[difficulty as keyof typeof DIFFICULTY_LEVELS].reward} AVI</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Your Pool Share</span>
                  <span className="text-sm">{(miningRate / 14500000000 * 100).toFixed(8)}%</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-sm font-medium mb-2">Network Difficulty Trend</div>
                  <div className="flex items-center gap-1">
                    <ArrowUp className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-muted-foreground">Increasing (Next adjustment: 6h 42m)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Mining rewards popup */}
      <AnimatePresence>
        {lastReward > 0 && isMining && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="fixed bottom-10 right-10 bg-card p-4 rounded-lg shadow-lg border border-primary z-50 max-w-xs"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-3 rounded-full">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Block Mined!</h3>
                <p className="text-sm">You earned {lastReward.toFixed(4)} AVI tokens</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Mining;