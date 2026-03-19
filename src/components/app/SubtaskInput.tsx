'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface SubtaskInputProps {
  onAddSubtask: (title: string) => void;
}

export function SubtaskInput({ onAddSubtask }: SubtaskInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onAddSubtask(trimmed);
      setInputValue('');
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setInputValue('');
      setShowInput(false);
    }
  };

  if (!showInput) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setShowInput(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="h-8 text-sm gap-2 text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Add subtask
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!inputValue.trim()) setShowInput(false);
        }}
        placeholder="Subtask title..."
        className="text-sm h-8"
        autoFocus
      />
      <Button size="sm" onClick={handleSubmit} className="h-8 px-3">
        Add
      </Button>
    </div>
  );
}
