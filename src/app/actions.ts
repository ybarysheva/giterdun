'use server';

import { aiEnhanceTasks, type AiTaskEnhancementInput, type AiTaskEnhancementOutput } from '@/ai/flows/ai-sorting-tasks';

export async function getAiTaskEnhancements(input: AiTaskEnhancementInput): Promise<AiTaskEnhancementOutput> {
  try {
    const result = await aiEnhanceTasks(input);
    return result;
  } catch (error) {
    console.error('Error in AI enhancement action:', error);
    // Return a default empty object on error to prevent crashes
    return { effortSuggestions: [], topReasons: [] };
  }
}
