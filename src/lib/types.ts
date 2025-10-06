import { Timestamp } from 'firebase/firestore';

export type Effort = 'XS' | 'S' | 'M' | 'L';

export type Importance = '!!' | null;

export type Task = {
  id: string;
  title: string;
  effort: Effort | null;
  importance: Importance;
  status: 'todo' | 'done';
  listDate: string; // YYYY-MM-DD
  isCarryover: boolean;
  createdAt: number; // timestamp
  completedAt?: number; // timestamp
  originDate?: string; // YYYY-MM-DD
};

export type EnergyLevel = 'low' | 'med' | 'high';

export type Session = {
  energy: EnergyLevel;
  sessionQuickWinsCompleted: number;
};

export type SortMode = 'custom' | 'easy' | 'ai';
