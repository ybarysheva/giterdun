'use client';

import { useState, useMemo, useCallback } from 'react';
import { Session, SortMode, Task } from '@/lib/types';
import { sortTasks, ScoreDebugEntry } from '@/lib/task-scoring';
import { useFirestoreTasks } from '@/hooks/use-firestore-tasks';
import { useToast } from '@/hooks/use-toast';

type DebugInfo = {
  scores: ScoreDebugEntry[];
};

const COMPLETION_MESSAGES = [
  'Done! Keep it going.',
  'One down.',
  'That\'s one off the list.',
  'Nice work.',
  'Done.',
];

export function useTaskManager() {
  const firestoreTasks = useFirestoreTasks();
  const { toast } = useToast();
  const [session, setSession] = useState<Session>({ energy: 'med', sessionQuickWinsCompleted: 0 });
  const [sortMode, setSortMode] = useState<SortMode>('ai');
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

  const { sorted, scores } = useMemo(
    () => sortTasks(firestoreTasks.tasks, sortMode, session.energy),
    [firestoreTasks.tasks, sortMode, session.energy],
  );

  const todoTasks = sorted.filter(t => t.status === 'todo');
  const firstTask = todoTasks.find(t => !skippedIds.has(t.id));

  const skipTask = useCallback((id: string) => {
    setSkippedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      // If all todo tasks are skipped, reset so nothing is stuck
      const allTodoIds = todoTasks.map(t => t.id);
      if (allTodoIds.every(tid => next.has(tid))) return new Set();
      return next;
    });
  }, [todoTasks]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    firestoreTasks.updateTask(id, updates);
    if (updates.status === 'done') {
      const msg = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
      toast({ description: msg, duration: 2000 });
      // Remove from skipped if it was skipped
      setSkippedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  }, [firestoreTasks, toast]);

  // Reset skipped list when sort mode changes
  const handleSetSortMode = useCallback((mode: SortMode) => {
    setSortMode(mode);
    setSkippedIds(new Set());
  }, []);

  const debugInfo: DebugInfo | null = scores.length > 0 ? { scores } : null;

  return {
    tasks: sorted,
    carryoverTasks: firestoreTasks.carryoverTasks,
    session,
    setSession,
    sortMode,
    setSortMode: handleSetSortMode,
    addTask: firestoreTasks.addTask,
    updateTask,
    deleteTask: firestoreTasks.deleteTask,
    addCarryoverToToday: firestoreTasks.addCarryoverToToday,
    loading: firestoreTasks.loading,
    firstTask,
    skipTask,
    debugInfo,
  };
}
