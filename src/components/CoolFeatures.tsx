import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Rocket, Trophy, Gift, Star, TrendingUp, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface CoolFeaturesProps {
  userName?: string;
}

const CoolFeatures: React.FC<CoolFeaturesProps> = ({ userName = 'Crypto Enthusiast' }) => {
  const { toast } = useToast();
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastClaimed, setLastClaimed] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Load saved data from localStorage
    const savedPoints = localStorage.getItem('avilasha_points');
    const savedStreak = localStorage.getItem('avilasha_streak');
    const savedLastClaimed = localStorage.getItem('avilasha_last_claimed');
    const savedAchievements = localStorage.getItem('avilasha_achievements');

    if (savedPoints) setPoints(parseInt(savedPoints));
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedLastClaimed) setLastClaimed(savedLastClaimed);
    if (savedAchievements) setAchievements(JSON.parse(savedAchievements));
  }, []);

  const saveData = () => {
    localStorage.setItem('avilasha_points', points.toString());
    localStorage.setItem('avilasha_streak', streak.toString());
    if (lastClaimed) localStorage.setItem('avilasha_last_claimed', lastClaimed);
    localStorage.setItem('avilasha_achievements', JSON.stringify(achievements));
  };

  useEffect(() => {
    saveData();
  }, [points, streak, lastClaimed, achievements]);

  const handleDailyReward = () => {
    const today = new Date().toISOString().split('T')[0];
    
    if (lastClaimed === today) {
      toast({
        title: "Already Claimed",
        description: "You've already claimed your daily reward today!",
      });
      return;
    }
    
    // Check if streak should continue or reset
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    let newStreak = 1;
    if (lastClaimed === yesterdayString) {
      newStreak = streak + 1;
    }
    
    // Calculate points (more points for longer streaks)
    const basePoints = 50;
    const streakBonus = Math.min(newStreak * 10, 100); // Cap bonus at 100
    const totalPoints = basePoints + streakBonus;
    
    setPoints(prev => prev + totalPoints);
    setStreak(newStreak);
    setLastClaimed(today);
    setShowReward(true);
    
    // Check for achievements
    if (newStreak === 3 && !achievements.includes('3-day-streak')) {
      addAchievement('3-day-streak', '3-Day Streak Master');
    }
    if (newStreak === 7 && !achievements.includes('7-day-streak')) {
      addAchievement('7-day-streak', 'Weekly Dedication');
    }
    if (points + totalPoints >= 1000 && !achievements.includes('1000-points')) {
      addAchievement('1000-points', 'Point Millionaire');
    }
    
    // Show confetti
    triggerConfetti();
  };

  const addAchievement = (id: string, title: string) => {
    setAchievements(prev => [...prev, id]);
    toast({
      title: "🏆 New Achievement Unlocked!",
      description: title,
    });
    triggerConfetti();
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    
    if (typeof window !== 'undefined' && confetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    
    setTimeout(() => setShowConfetti(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Cool Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Your Points
                </h3>
                <p className="text-sm text-muted-foreground">Earn rewards and unlock features</p>
              </div>
              <div className="text-2xl font-bold text-primary">{points}</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Daily Streak
                </h3>
                <p className="text-sm text-muted-foreground">Current streak: {streak} days</p>
              </div>
              <Button 
                onClick={handleDailyReward}
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
              >
                <Gift className="mr-2 h-4 w-4" />
                Claim Daily
              </Button>
            </div>
            
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Achievements
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant={achievements.includes('3-day-streak') ? 'default' : 'outline'} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  3-Day Streak
                </Badge>
                <Badge variant={achievements.includes('7-day-streak') ? 'default' : 'outline'} className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  7-Day Streak
                </Badge>
                <Badge variant={achievements.includes('1000-points') ? 'default' : 'outline'} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  1000 Points
                </Badge>
                <Badge variant={achievements.includes('first-transaction') ? 'default' : 'outline'} className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                  First Transaction
                </Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Rocket className="h-4 w-4 text-blue-500" />
                Upcoming Features
              </h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span>AI-powered trading signals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  <span>Instant cross-chain swaps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="h-3 w-3 text-purple-500" />
                  <span>Exclusive NFT airdrops</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50"
            onClick={() => setShowReward(false)}
          >
            <div className="absolute inset-0 bg-black/50" />
            <motion.div 
              className="relative bg-card p-8 rounded-xl shadow-xl border-2 border-primary/20 max-w-md w-full text-center"
              initial={{ rotate: -5 }}
              animate={{ rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <h2 className="text-2xl font-bold mb-2 text-gradient bg-gradient-to-r from-primary to-purple-600">Daily Reward Claimed!</h2>
              <p className="mb-4">You earned <span className="font-bold text-primary">{50 + Math.min(streak * 10, 100)}</span> points</p>
              <div className="text-5xl mb-4">🎁</div>
              <p className="text-sm text-muted-foreground mb-4">Current streak: {streak} days</p>
              <Button onClick={() => setShowReward(false)}>Awesome!</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoolFeatures;