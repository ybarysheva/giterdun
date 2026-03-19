'use client';

import { useFirestoreTasks } from '@/hooks/use-firestore-tasks';
import type { Task } from '@/lib/types';

export function useTaskManager() {
  const firestoreTasks = useFirestoreTasks();
  const firstTask = firestoreTasks.tasks.find(t => t.status === 'todo' && !t.parentTaskId);

  const getSubtasksForTask = (taskId: string): Task[] => {
    return firestoreTasks.tasks
      .filter(t => t.parentTaskId === taskId)
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  };

  return {
    tasks: firestoreTasks.tasks,
    carryoverTasks: firestoreTasks.carryoverTasks,
    addTask: firestoreTasks.addTask,
    updateTask: firestoreTasks.updateTask,
    deleteTask: firestoreTasks.deleteTask,
    addCarryoverToToday: firestoreTasks.addCarryoverToToday,
    addSubtask: firestoreTasks.addSubtask,
    getSubtasksForTask,
    loading: firestoreTasks.loading,
    firstTask,
  };
}
