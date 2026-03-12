'use client';

import * as React from 'react';
import type { Task } from '@/lib/types';
import { TaskItem } from './TaskItem';
import { Button } from '@/components/ui/button';
import { Shuffle } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  firstTaskId?: string;
  sortMode: string;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onDeleteTask: (id: string) => void;
  onSkipTask: (id: string) => void;
}

export function TaskList({ tasks, firstTaskId, sortMode, onUpdateTask, onDeleteTask, onSkipTask }: TaskListProps) {
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
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onSkip={sortMode === 'ai' && task.id === firstTaskId ? () => onSkipTask(task.id) : undefined}
        />
      ))}
    </div>
  );
}
