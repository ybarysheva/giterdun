'use client';

import type { Task } from '@/lib/types';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SubtaskListProps {
  subtasks: Task[];
  onToggleSubtask: (id: string, status: 'todo' | 'done') => void;
  onDeleteSubtask: (id: string) => void;
}

export function SubtaskList({ subtasks, onToggleSubtask, onDeleteSubtask }: SubtaskListProps) {
  if (subtasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {subtasks.map((subtask) => (
        <div
          key={subtask.id}
          className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
        >
          <button
            onClick={() => onToggleSubtask(subtask.id, subtask.status === 'done' ? 'todo' : 'done')}
            className={cn(
              'flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors',
              subtask.status === 'done'
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-muted-foreground hover:border-primary'
            )}
            aria-label={subtask.status === 'done' ? 'Mark as todo' : 'Mark as done'}
          >
            {subtask.status === 'done' && <Check className="h-2.5 w-2.5" />}
          </button>
          <span
            className={cn(
              'flex-1 text-sm',
              subtask.status === 'done' && 'line-through text-muted-foreground'
            )}
          >
            {subtask.title}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteSubtask(subtask.id)}
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Delete subtask"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
