import React, { useState } from 'react';
import QuestService, { Quest } from '@/services/quest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Gift, Loader2 } from 'lucide-react';

const Quests: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>(QuestService.getQuests());
  const [points, setPoints] = useState<number>(QuestService.getPoints());
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Gift className="w-7 h-7 text-yellow-500" /> Quests & Airdrop
      </h1>
      <div className="mb-6 flex items-center gap-3">
        <span className="text-lg">Your Points:</span>
        <span className="font-semibold text-primary text-2xl">{points}</span>
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
