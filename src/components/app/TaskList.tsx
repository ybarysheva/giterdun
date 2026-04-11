'use client';

import type { Task } from '@/lib/types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  firstTaskId?: string;
  selectedTaskId?: string | null;
  subtaskPreviewMap?: Map<string, Task | null>;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask?: (id: string) => void;
}

export function TaskList({ tasks, firstTaskId, selectedTaskId, subtaskPreviewMap, onUpdateTask, onDeleteTask, onSelectTask }: TaskListProps) {
  // Filter out subtasks — only show root tasks (no parentTaskId)
  const rootTasks = tasks.filter(t => !t.parentTaskId);

  if (rootTasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {rootTasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isFirst={task.id === firstTaskId}
          isSelected={task.id === selectedTaskId}
          nextSubtask={subtaskPreviewMap?.get(task.id) ?? null}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onSelectTask={onSelectTask}
        />
      ))}
    </div>
  );
}
