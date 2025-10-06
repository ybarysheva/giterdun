'use server';

import { aiSortingTasks, type AiSortingTasksInput } from '@/ai/flows/ai-sorting-tasks';

export async function getAiSortedTaskIds(input: AiSortingTasksInput): Promise<string[]> {
  try {
    const sortedIds = await aiSortingTasks(input);
    return sortedIds;
  } catch (error) {
    console.error('Error in AI sorting action:', error);
    // Return an empty array or handle the error as appropriate
    return [];
  }
}
