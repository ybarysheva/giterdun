'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Task, Effort } from '@/lib/types';
import { Plus } from 'lucide-react';

interface TaskInputProps {
  onAddTasks: (tasks: Omit<Task, 'id' | 'listDate' | 'isCarryover' | 'createdAt' | 'status'>[]) => void;
}

const effortMap: { [key: string]: Effort } = {
  '5m': 'XS',
  '10m': 'S',
  '25m': 'M',
  '1h': 'L',
};
const effortRegex = /\b(5m|10m|25m|1h)\b/gi;
const importanceRegex = /!!/g;

export function TaskInput({ onAddTasks }: TaskInputProps) {
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (text.trim() === '') return;

    const lines = text.split('\n').filter((line) => line.trim() !== '');
    const newTasks = lines.map((line) => {
      let title = line.trim();
      let effort: Effort | null = null;
      let importance: '!!' | null = null;

      const effortMatch = title.match(effortRegex);
      if (effortMatch) {
        effort = effortMap[effortMatch[0].toLowerCase()];
        title = title.replace(effortRegex, '').trim();
      }

      if (importanceRegex.test(title)) {
        importance = '!!';
        title = title.replace(importanceRegex, '').trim();
      }

      return { title, effort, importance };
    });

    onAddTasks(newTasks);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleAdd();
    }
  };


  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type tasks, one per line...&#10;Try adding '25m' for effort or '!!' for importance!"
        className="min-h-[80px] text-base resize-none"
      />
      <div className="flex justify-end">
        <Button onClick={handleAdd}><Plus className="mr-2 h-4 w-4" /> Add Tasks</Button>
      </div>
    </div>
  );
}
