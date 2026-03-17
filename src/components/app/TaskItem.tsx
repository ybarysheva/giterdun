'use client';

import { useState } from 'react';
import type { Task, Effort } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Trash2, Edit, Flag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TaskItemProps {
  task: Task;
  isFirst: boolean;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask?: (id: string) => void;
  isSelected?: boolean;
}

const effortColors: Record<Effort, string> = {
  XS: 'bg-green-100 text-green-800',
  S: 'bg-blue-100 text-blue-800',
  M: 'bg-yellow-100 text-yellow-800',
  L: 'bg-orange-100 text-orange-800',
};

export function TaskItem({ task, isFirst, onUpdateTask, onDeleteTask, onSelectTask, isSelected }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const handleStatusChange = (checked: boolean) => {
    onUpdateTask(task.id, { status: checked ? 'done' : 'todo' });
  };

  const handleFlagToggle = () => {
    onUpdateTask(task.id, { flagged: !task.flagged });
  };

  const handleSaveEdit = () => {
    if (editedTitle.trim() !== '' && editedTitle.trim() !== task.title) {
        onUpdateTask(task.id, { title: editedTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedTitle(task.title);
    }
  };

  return (
    <Card
      className={cn(
        'shadow-sm transition-all duration-300',
        task.status === 'done' ? 'bg-secondary' : 'bg-card',
        isFirst && task.status === 'todo' && 'border-primary border-2',
        isSelected && 'ring-2 ring-primary ring-offset-1',
        onSelectTask && 'cursor-pointer'
      )}
      onClick={() => onSelectTask?.(task.id)}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            id={`task-${task.id}`}
            checked={task.status === 'done'}
            onCheckedChange={handleStatusChange}
            aria-label={`Mark task "${task.title}" as ${task.status === 'done' ? 'not done' : 'done'}`}
          />
        </div>
        <div className="flex-grow min-w-0">
          {isEditing ? (
            <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="h-8"
            />
          ) : (
            <span
              className={cn(
                'transition-colors block truncate',
                task.status === 'done'
                  ? 'text-muted-foreground line-through'
                  : 'text-card-foreground',
                isFirst && task.status === 'todo' ? 'text-lg font-bold' : 'font-normal'
              )}
            >
              {task.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
            {task.effort && task.status === 'todo' && (
                <Badge variant="outline" className={cn(effortColors[task.effort], 'border-transparent')}>
                    {task.effort}
                </Badge>
            )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => { e.stopPropagation(); handleFlagToggle(); }}
          aria-pressed={task.flagged}
        >
          <Flag className={cn("h-4 w-4", task.flagged ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground/70')} />
          <span className="sr-only">{task.flagged ? 'Unflag task' : 'Flag task'}</span>
        </Button>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDeleteTask(task.id)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
