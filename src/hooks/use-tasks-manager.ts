'use client';

import { useState, useMemo } from 'react';
import { Session, SortMode } from '@/lib/types';
import { sortTasks, ScoreDebugEntry } from '@/lib/task-scoring';
import { useFirestoreTasks } from '@/hooks/use-firestore-tasks';

type DebugInfo = {
  scores: ScoreDebugEntry[];
};

export function useTaskManager() {
  const firestoreTasks = useFirestoreTasks();
  const [session, setSession] = useState<Session>({ energy: 'med', sessionQuickWinsCompleted: 0 });
  const [sortMode, setSortMode] = useState<SortMode>('ai');

  const { sorted, scores } = useMemo(
    () => sortTasks(firestoreTasks.tasks, sortMode, session.energy),
    [firestoreTasks.tasks, sortMode, session.energy],
  );

  const debugInfo: DebugInfo | null = scores.length > 0 ? { scores } : null;
  const firstTask = sorted.find(t => t.status === 'todo');

  return {
    tasks: sorted,
    carryoverTasks: firestoreTasks.carryoverTasks,
    session,
    setSession,
    sortMode,
    setSortMode,
    addTask: firestoreTasks.addTask,
    updateTask: firestoreTasks.updateTask,
    deleteTask: firestoreTasks.deleteTask,
    addCarryoverToToday: firestoreTasks.addCarryoverToToday,
    loading: firestoreTasks.loading,
    firstTask,
    debugInfo,
  };
}
