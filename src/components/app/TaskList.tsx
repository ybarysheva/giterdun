'use client';

import type { Task } from '@/lib/types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  firstTaskId?: string;
  selectedTaskId?: string | null;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask?: (id: string) => void;
}

export function TaskList({ tasks, firstTaskId, selectedTaskId, onUpdateTask, onDeleteTask, onSelectTask }: TaskListProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isFirst={task.id === firstTaskId}
          isSelected={task.id === selectedTaskId}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onSelectTask={onSelectTask}
        />
      ))}
    </div>
  );
}
