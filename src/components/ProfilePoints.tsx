import React from 'react';
import QuestService from '@/services/quest';
import { Gift } from 'lucide-react';

const ProfilePoints: React.FC = () => {
  const points = QuestService.getPoints();
  return (
    <div className="flex items-center gap-2 p-4 bg-card border border-border rounded-lg shadow-sm">
      <Gift className="w-5 h-5 text-yellow-500" />
      <span className="font-medium">Points:</span>
      <span className="font-bold text-primary text-lg">{points}</span>
      <span className="text-muted-foreground">(Airdrop Eligible)</span>
    </div>
  );
};

export default ProfilePoints;
