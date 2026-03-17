import { Timestamp } from 'firebase/firestore';

export type Effort = 'XS' | 'S' | 'M' | 'L';

export type Task = {
  id: string;
  title: string;
  effort: Effort | null;
  flagged: boolean;
  status: 'todo' | 'done';
  listDate: string; // YYYY-MM-DD
  isCarryover: boolean;
  createdAt: number; // timestamp
  completedAt?: number; // timestamp
  originDate?: string; // YYYY-MM-DD
  effortConfidence?: number | null;
  effortSource?: 'ai' | 'user' | null;
  effortReasons?: string[] | null;
  // Hierarchical task fields (PRD pivot)
  parentTaskId?: string | null;
  depth?: number;
  order?: number;
  description?: string;
  canvasPositionX?: number;
  canvasPositionY?: number;
  deletedAt?: number | null;
};

export type EnergyLevel = 'low' | 'med' | 'high';

export type Session = {
  energy: EnergyLevel;
  sessionQuickWinsCompleted: number;
};

export type SortMode = 'custom' | 'easy' | 'ai';
