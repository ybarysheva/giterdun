'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/types';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface TaskInputProps {
  onAddTask: (task: Omit<Task, 'id' | 'listDate' | 'isCarryover' | 'createdAt' | 'status' | 'originDate'>) => void;
}

export function TaskInput({ onAddTask }: TaskInputProps) {
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (text.trim() === '') return;

    const title = text.trim();
    onAddTask({ title });
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };


  return (
    <Card className="bg-card/50">
      <CardContent className="p-3 flex items-center gap-3">
        <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add new"
            className="text-base border-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-grow bg-transparent"
        />
        <Button onClick={handleAdd} size="icon" className="rounded-full w-8 h-8 flex-shrink-0">
          <Plus className="h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
}
