'use client';

import type { Task } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SubtaskPreviewProps {
  subtask: Task | null;
  className?: string;
}

export function SubtaskPreview({ subtask, className }: SubtaskPreviewProps) {
  if (!subtask) return null;

  return (
    <div className={cn('flex items-center gap-2 mt-1.5', className)}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
        Do next
      </span>
      <span
        className={cn(
          'text-xs text-muted-foreground truncate',
          subtask.status === 'done' && 'line-through opacity-60'
        )}
      >
        {subtask.title}
      </span>
    </div>
  );
}
