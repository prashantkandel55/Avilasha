// QuestService: Handles quest logic, progress, and points
export interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  status: 'available' | 'in_progress' | 'completed' | 'claimed';
}

export class QuestService {
  private static QUESTS_KEY = 'user_quests';
  private static POINTS_KEY = 'user_points';

  // Default quests (could be loaded from backend in future)
  private static defaultQuests: Quest[] = [
    {
      id: 'connect-wallet',
      title: 'Connect your Wallet',
      description: 'Connect a crypto wallet to get started.',
      points: 50,
      status: 'available',
    },
    {
      id: 'first-transaction',
      title: 'Make your First Transaction',
      description: 'Complete your first crypto transaction.',
      points: 100,
      status: 'available',
    },
    {
      id: 'invite-friend',
      title: 'Invite a Friend',
      description: 'Invite a friend and help them sign up.',
      points: 75,
      status: 'available',
    },
  ];

  static getQuests(): Quest[] {
    const quests = localStorage.getItem(this.QUESTS_KEY);
    if (quests) return JSON.parse(quests);
    // Initialize with default quests
    localStorage.setItem(this.QUESTS_KEY, JSON.stringify(this.defaultQuests));
    return this.defaultQuests;
  }

  static updateQuestStatus(id: string, status: Quest['status']) {
    const quests = this.getQuests().map(q => q.id === id ? { ...q, status } : q);
    localStorage.setItem(this.QUESTS_KEY, JSON.stringify(quests));
  }

  static getPoints(): number {
    return Number(localStorage.getItem(this.POINTS_KEY) || '0');
  }

  static addPoints(points: number) {
    const current = this.getPoints();
    localStorage.setItem(this.POINTS_KEY, String(current + points));
  }

  static completeQuest(id: string) {
    const quests = this.getQuests();
    const quest = quests.find(q => q.id === id);
    if (quest && quest.status !== 'claimed') {
      this.updateQuestStatus(id, 'completed');
      this.addPoints(quest.points);
    }
  }

  static claimQuest(id: string) {
    this.updateQuestStatus(id, 'claimed');
  }

  static resetAll() {
    localStorage.removeItem(this.QUESTS_KEY);
    localStorage.removeItem(this.POINTS_KEY);
  }
}

export default QuestService;
