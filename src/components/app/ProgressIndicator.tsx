'use client';

import { Progress } from '@/components/ui/progress';

interface ProgressIndicatorProps {
  value: number;
  count: number;
  total: number;
}

export function ProgressIndicator({ value, count, total }: ProgressIndicatorProps) {
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <Progress value={value} className="h-2" />
      <span className="text-sm text-muted-foreground whitespace-nowrap">{count} of {total} done</span>
    </div>
  );
}
