export interface DailyActivity {
  id: string;
  petId: string;
  name: string;
  duration: number;
  notes?: string;
  date: string;
  timestamp?: number;
}

export interface Milestone {
  id: string;
  petId: string;
  title: string;
  description: string;
  emoji?: string;
  date: string;
  createdAt: string;
}

export interface Memory {
  id: string;
  petId: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  date: string;
  tags?: string[];
  createdAt: string;
}

export interface TrainingSession {
  id: string;
  petId: string;
  activity: string;
  duration: number;
  success: number;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface BondLevel {
  level: number;
  experience: number;
  title: string;
  icon: string;
}

export const BOND_LEVELS: BondLevel[] = [
  { level: 1, experience: 0, title: '初次见面', icon: '👋' },
  { level: 2, experience: 100, title: '逐渐熟悉', icon: '🤝' },
  { level: 3, experience: 300, title: '信任建立', icon: '💚' },
  { level: 4, experience: 600, title: '亲密伙伴', icon: '💛' },
  { level: 5, experience: 1000, title: '形影不离', icon: '💜' },
  { level: 6, experience: 1500, title: '灵魂伴侣', icon: '🧡' },
  { level: 7, experience: 2100, title: '一生陪伴', icon: '❤️' },
];

export function calculateBondLevel(experience: number): BondLevel {
  for (let i = BOND_LEVELS.length - 1; i >= 0; i--) {
    if (experience >= BOND_LEVELS[i].experience) {
      return BOND_LEVELS[i];
    }
  }
  return BOND_LEVELS[0];
}
