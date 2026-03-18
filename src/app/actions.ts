'use server';

import type { Effort } from '@/lib/types';

export async function classifyTaskEffort(
  title: string
): Promise<{ effort: Effort; reason: string } | null> {
  // Paused for MVP 0.1 — effort classification disabled
  return null;
}
