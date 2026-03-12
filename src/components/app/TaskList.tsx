'use client';

import * as React from 'react';
import type { Task } from '@/lib/types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  firstTaskId?: string;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onDeleteTask: (id: string) => void;
}

export function TaskList({ tasks, firstTaskId, onUpdateTask, onDeleteTask }: TaskListProps) {
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
        />
      ))}
    </div>
  );
}
