'use client';

import { useFirestoreTasks } from '@/hooks/use-firestore-tasks';

export function useTaskManager() {
  const firestoreTasks = useFirestoreTasks();
  const firstTask = firestoreTasks.tasks.find(t => t.status === 'todo');

  return {
    tasks: firestoreTasks.tasks,
    carryoverTasks: firestoreTasks.carryoverTasks,
    addTask: firestoreTasks.addTask,
    updateTask: firestoreTasks.updateTask,
    deleteTask: firestoreTasks.deleteTask,
    addCarryoverToToday: firestoreTasks.addCarryoverToToday,
    loading: firestoreTasks.loading,
    firstTask,
  };
}
