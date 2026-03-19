'use client';

import { useState, useEffect, useRef } from 'react';
import type { Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Check } from 'lucide-react';
import { SubtaskInput } from './SubtaskInput';
import { SubtaskList } from './SubtaskList';

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onDeleteTask?: (id: string) => void;
  subtasks: Task[];
  onAddSubtask: (title: string) => void;
}

function PanelContent({
  task,
  onClose,
  onUpdateTask,
  onDeleteTask,
  subtasks,
  onAddSubtask,
}: {
  task: Task;
  onClose: () => void;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onDeleteTask?: (id: string) => void;
  subtasks: Task[];
  onAddSubtask: (title: string) => void;
}) {
  const [titleValue, setTitleValue] = useState(task.title);
  const [descValue, setDescValue] = useState(task.description ?? '');
  const titleRef = useRef<HTMLInputElement>(null);

  // Sync when task changes
  useEffect(() => {
    setTitleValue(task.title);
    setDescValue(task.description ?? '');
  }, [task.id, task.title, task.description]);

  const handleTitleBlur = () => {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== task.title) {
      onUpdateTask(task.id, { title: trimmed });
    } else if (!trimmed) {
      setTitleValue(task.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') titleRef.current?.blur();
    if (e.key === 'Escape') {
      setTitleValue(task.title);
      titleRef.current?.blur();
    }
  };

  const handleDescBlur = () => {
    if (descValue !== (task.description ?? '')) {
      onUpdateTask(task.id, { description: descValue });
    }
  };

  const handleStatusToggle = () => {
    onUpdateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-2 p-4 border-b">
        <button
          onClick={handleStatusToggle}
          className={cn(
            'mt-1 flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors',
            task.status === 'done'
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-muted-foreground hover:border-primary'
          )}
          aria-label={task.status === 'done' ? 'Mark as todo' : 'Mark as done'}
        >
          {task.status === 'done' && <Check className="h-3 w-3" />}
        </button>
        <Input
          ref={titleRef}
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          className={cn(
            'flex-1 border-none shadow-none text-base font-semibold px-0 focus-visible:ring-0 h-auto py-0',
            task.status === 'done' && 'line-through text-muted-foreground'
          )}
        />
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Description */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Notes</p>
          <textarea
            value={descValue}
            onChange={(e) => setDescValue(e.target.value)}
            onBlur={handleDescBlur}
            placeholder="Add notes..."
            rows={4}
            className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Subtasks */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Subtasks</p>
          <div className="space-y-3">
            <SubtaskList
              subtasks={subtasks}
              onToggleSubtask={(id, status) => onUpdateTask(id, { status })}
              onDeleteSubtask={(id) => onDeleteTask?.(id)}
            />
            <SubtaskInput onAddSubtask={onAddSubtask} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TaskDetailPanel({ task, onClose, onUpdateTask, onDeleteTask, subtasks, onAddSubtask }: TaskDetailPanelProps) {
  const isOpen = task !== null;

  return (
    <>
      {/* ── Mobile: bottom sheet ── */}
      {/* Backdrop */}
      <div
        className={cn(
          'md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={cn(
          'md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-xl transition-transform duration-300 ease-out max-h-[80vh] flex flex-col',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        {task && (
          <PanelContent task={task} onClose={onClose} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} subtasks={subtasks} onAddSubtask={onAddSubtask} />
        )}
      </div>

      {/* ── Desktop: right side panel ── */}
      {/* Desktop version is rendered inline by the parent layout */}
    </>
  );
}

/**
 * Desktop-only inline panel content (rendered in the right column).
 * Separate from the mobile bottom sheet to avoid double-rendering in both layouts.
 */
export function TaskDetailPanelDesktop({ task, onClose, onUpdateTask, onDeleteTask, subtasks, onAddSubtask }: TaskDetailPanelProps) {
  if (!task) return null;
  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden h-full">
      <PanelContent task={task} onClose={onClose} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} subtasks={subtasks} onAddSubtask={onAddSubtask} />
    </div>
  );
}
