'use client';

import { useState } from 'react';
import type { Task, Effort } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Trash2, Edit, Star } from 'lucide-react';
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
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

const effortColors: Record<Effort, string> = {
  XS: 'bg-green-100 text-green-800',
  S: 'bg-blue-100 text-blue-800',
  M: 'bg-yellow-100 text-yellow-800',
  L: 'bg-orange-100 text-orange-800',
};

export function TaskItem({ task, onUpdateTask, onDeleteTask }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  
  const handleStatusChange = (checked: boolean) => {
    onUpdateTask(task.id, { status: checked ? 'done' : 'todo' });
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
        task.status === 'done' ? 'bg-secondary' : 'bg-card'
      )}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.status === 'done'}
          onCheckedChange={handleStatusChange}
          aria-label={`Mark task "${task.title}" as ${task.status === 'done' ? 'not done' : 'done'}`}
        />
        <div className="flex-grow">
          {isEditing ? (
            <Input 
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                autoFocus
                className="h-8"
            />
          ) : (
            <label
              htmlFor={`task-${task.id}`}
              className={cn(
                'font-medium transition-colors',
                task.status === 'done'
                  ? 'text-muted-foreground line-through'
                  : 'text-card-foreground'
              )}
            >
              {task.title}
            </label>
          )}
        </div>
        <div className="flex items-center gap-2">
            {task.importance === '!!' && task.status === 'todo' && <Star className="w-4 h-4 text-yellow-500" />}
            {task.effort && task.status === 'todo' && (
                <Badge variant="outline" className={cn(effortColors[task.effort], 'border-transparent')}>
                    {task.effort}
                </Badge>
            )}
        </div>
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
      </CardContent>
    </Card>
  );
}
