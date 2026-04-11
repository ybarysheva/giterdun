import { Timestamp } from 'firebase/firestore';

export type Effort = 'XS' | 'S' | 'M' | 'L';

export type Task = {
  id: string;
  title: string;
  effort?: Effort | null;
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

export type ShoppingItem = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
};

export type Session = {};
