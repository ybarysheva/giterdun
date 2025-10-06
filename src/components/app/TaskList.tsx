'use client';

import type { Task } from '@/lib/types';
import { TaskItem } from './TaskItem';
import { Info } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  firstTaskId?: string;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  aiReasons?: string[];
}

export function TaskList({ tasks, firstTaskId, onUpdateTask, onDeleteTask, aiReasons = [] }: TaskListProps) {
  if (tasks.length === 0) {
    return null;
  }

  const firstTaskIndex = tasks.findIndex(t => t.id === firstTaskId);

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <>
          {index === firstTaskIndex && aiReasons.length > 0 && (
            <div className="mb-2 ml-1 flex items-start gap-2 text-sm text-primary">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="italic">
                Why this? {aiReasons.join(' / ')}
              </p>
            </div>
          )}
          <TaskItem
            key={task.id}
            task={task}
            isFirst={task.id === firstTaskId}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
          />
        </>
      ))}
    </div>
  );
}
