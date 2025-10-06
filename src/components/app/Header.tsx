'use client';
import { useState, useEffect } from 'react';
import type { Session, SortMode, EnergyLevel } from '@/lib/types';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface HeaderProps {
  session: Session;
  onEnergyChange: (energy: EnergyLevel) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
}

export function Header({
  session,
  onEnergyChange,
  sortMode,
  onSortModeChange,
}: HeaderProps) {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const now = new Date();
    setCurrentDate(format(now, 'E, LLL d'));
  }, []);

  return (
    <header className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-5xl font-bold uppercase tracking-wider">
          <span className="text-foreground">{currentDate.split(',')[0]}</span>
          <span className="text-muted-foreground">{currentDate.substring(currentDate.indexOf(','))}</span>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full">
        <div className="flex-1">
          <Label className="text-sm text-muted-foreground mb-2 block text-center sm:text-left">
            How's your energy?
          </Label>
          <RadioGroup
            defaultValue="med"
            value={session.energy}
            onValueChange={(value: EnergyLevel) => onEnergyChange(value)}
            className="flex items-center justify-center sm:justify-start space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="low" id="low" />
              <Label htmlFor="low" className="font-normal">Low</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="med" id="med" />
              <Label htmlFor="med" className="font-normal">Med</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="high" id="high" />
              <Label htmlFor="high" className="font-normal">High</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="w-full sm:w-auto sm:flex-1">
          <Label className="text-sm text-muted-foreground mb-2 block text-center sm:text-right">
            Sort by
          </Label>
          <Select value={sortMode} onValueChange={(v: SortMode) => onSortModeChange(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai">Pick for Me</SelectItem>
              <SelectItem value="easy">Easy First</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
