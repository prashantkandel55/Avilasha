import React, { useState, useEffect } from 'react';
import QuestService, { Quest } from '@/services/quest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Gift, Loader2 } from 'lucide-react';
import { walletService } from '@/services/wallet.service';
import { WalletConnectModal } from '@/components/WalletConnectModal';

const Quests: React.FC = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    async function fetchWallets() {
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      setLoading(false);
    }
    fetchWallets();
  }, []);

  useEffect(() => {
    if (wallets.length) {
      setQuests(QuestService.getQuests());
      setPoints(QuestService.getPoints());
    }
  }, [wallets]);

  const handleComplete = (id: string) => {
    setLoading(true);
    setTimeout(() => {
      QuestService.completeQuest(id);
      setQuests(QuestService.getQuests());
      setPoints(QuestService.getPoints());
      setLoading(false);
    }, 800); // Simulate async
  };

  const handleClaim = (id: string) => {
    setLoading(true);
    setTimeout(() => {
      QuestService.claimQuest(id);
      setQuests(QuestService.getQuests());
      setLoading(false);
    }, 800);
  };

  if (loading) {
    return <div className="text-center p-10">Loading quests...</div>;
  }

  if (!wallets.length) {
    return (
      <div className="glassmorphism glassmorphism-hover p-8 rounded-2xl shadow-lg animate-fade-in text-center">
        <h2 className="text-2xl font-bold mb-2">No Wallet Connected</h2>
        <p className="mb-4">Connect a wallet to view quests.</p>
        <button
          className="inline-block bg-primary text-white px-6 py-2 rounded-lg shadow hover:bg-primary/90 transition"
          onClick={() => setShowWalletModal(true)}
        >
          Connect Wallet
        </button>
        {showWalletModal && (
          <WalletConnectModal onConnect={() => {
            setShowWalletModal(false);
            (async () => {
              const allWallets = await walletService.getAllWallets?.() || [];
              setWallets(allWallets);
            })();
          }} />
        )}
      </div>
    );
  }

  return (
    <div className="glassmorphism glassmorphism-hover p-8 rounded-2xl shadow-lg animate-fade-in">
      <div className="flex justify-between items-center mb-6 slide-up-animation">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
            <Gift className="w-7 h-7 text-yellow-500" /> Quests & Airdrop
          </h1>
          <p className="text-muted-foreground">Complete quests to earn rewards and points</p>
        </div>
        <div className="mb-6 flex items-center gap-3">
          <span className="text-lg">Your Points:</span>
          <span className="font-semibold text-primary text-2xl">{points}</span>
        </div>
      </div>
      <div className="space-y-6">
        {quests.map(quest => (
          <Card key={quest.id} className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {quest.status === 'claimed' ? (
                  <CheckCircle className="text-green-500 w-5 h-5" />
                ) : null}
                {quest.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-muted-foreground">{quest.description}</div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-primary">+{quest.points} pts</span>
                {quest.status === 'available' && (
                  <Button disabled={loading} onClick={() => handleComplete(quest.id)} size="sm">
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Complete'}
                  </Button>
                )}
                {quest.status === 'completed' && (
                  <Button variant="outline" disabled={loading} onClick={() => handleClaim(quest.id)} size="sm">
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Claim'}
                  </Button>
                )}
                {quest.status === 'claimed' && (
                  <span className="text-green-600 font-semibold">Claimed</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Quests;
