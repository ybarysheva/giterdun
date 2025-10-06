'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Task } from '@/lib/types';
import { Zap, Star } from 'lucide-react';

interface StartBannerProps {
  task: Task;
}

const getReason = (task: Task): { text: string; icon: React.ReactNode } => {
  if (task.importance === '!!') {
    return { text: 'Important Task', icon: <Star className="w-4 h-4 text-yellow-500" /> };
  }
  if (task.effort === 'XS' || task.effort === 'S') {
    return { text: 'Quick Win', icon: <Zap className="w-4 h-4 text-green-500" /> };
  }
  return { text: "Let's get started", icon: null };
};

export function StartBanner({ task }: StartBannerProps) {
  const reason = getReason(task);

  return (
    <Card className="bg-accent/50 border-primary/20 shadow-sm">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
            {reason.icon}
            {reason.text}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold">
          {task.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Pick one thing to get started.</p>
      </CardContent>
    </Card>
  );
}
