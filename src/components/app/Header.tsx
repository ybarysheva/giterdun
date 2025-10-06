'use client';

import type { Session, SortMode, EnergyLevel } from '@/lib/types';
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
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 className="text-3xl font-bold text-foreground font-headline tracking-tight">
        Pick For Me
      </h1>
      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
        <div className="flex-1 sm:flex-initial">
          <Label className="text-sm text-muted-foreground mb-2 block">
            How's your energy?
          </Label>
          <RadioGroup
            defaultValue="med"
            value={session.energy}
            onValueChange={(value: EnergyLevel) => onEnergyChange(value)}
            className="flex items-center space-x-4"
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
        <div className="flex-1 sm:flex-initial">
          <Label className="text-sm text-muted-foreground mb-2 block">
            Sort by
          </Label>
          <Select value={sortMode} onValueChange={(v: SortMode) => onSortModeChange(v)}>
            <SelectTrigger className="w-full sm:w-[150px]">
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
