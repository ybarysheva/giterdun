import { Timestamp } from 'firebase/firestore';

export type Effort = 'XS' | 'S' | 'M' | 'L';

export type Task = {
  id: string;
  title: string;
  effort?: Effort | null;
  effortSource?: 'ai' | 'user' | null; // Track whether effort was user-set or AI-classified
  status: 'todo' | 'done';
  listDate: string; // YYYY-MM-DD
  isCarryover: boolean;
  createdAt: number; // timestamp
  completedAt?: number; // timestamp
  originDate?: string; // YYYY-MM-DD
  description?: string;
  // Subtask fields
  parentTaskId?: string | null;
  depth?: number;
  // Canvas fields (planned feature)
  canvasPositionX?: number;
  canvasPositionY?: number;
};

export type Session = {};
