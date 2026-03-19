'use client';

import type { Task } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CarryoverListProps {
  tasks: Task[];
  onAddCarryoverToToday: (id: string) => void;
}

export function CarryoverList({ tasks, onAddCarryoverToToday }: CarryoverListProps) {
  // Filter out subtasks — only show root carryover tasks
  const rootTasks = tasks.filter(t => !t.parentTaskId);

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-muted-foreground mb-3">From Yesterday</h2>
      <div className="space-y-2">
        {rootTasks.map((task) => (
          <Card key={task.id} className="bg-card/50">
            <CardContent className="p-3 flex items-center justify-between gap-3">
              <span className="text-muted-foreground flex-grow">{task.title}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddCarryoverToToday(task.id)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Today
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
