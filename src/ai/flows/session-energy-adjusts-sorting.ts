'use server';
/**
 * @fileOverview Adjusts task sorting based on user's energy level using AI.
 *
 * This file exports:
 * - `adjustTaskSortingForEnergy` - An async function that adjusts task sorting based on the user's energy level.
 * - `EnergyLevel` - The input type for the adjustTaskSortingForEnergy function.
 * - `TaskSortingOutput` - The output type for the adjustTaskSortingForEnergy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnergyLevelSchema = z.enum(['low', 'med', 'high']);
export type EnergyLevel = z.infer<typeof EnergyLevelSchema>;

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  effort: z.enum(['XS', 'S', 'M', 'L', null]),
  importance: z.enum(['!!', null]),
  status: z.enum(['todo', 'done']),
  listDate: z.string(),
  isCarryover: z.boolean(),
});
export type Task = z.infer<typeof TaskSchema>;

const TaskSortingOutputSchema = z.array(TaskSchema);
export type TaskSortingOutput = z.infer<typeof TaskSortingOutputSchema>;

const SessionEnergyAdjustsSortingInputSchema = z.object({
  energyLevel: EnergyLevelSchema.describe('The user\'s current energy level (low, med, high).'),
  tasks: z.array(TaskSchema).describe('The list of tasks to be sorted.'),
});
export type SessionEnergyAdjustsSortingInput = z.infer<typeof SessionEnergyAdjustsSortingInputSchema>;

export async function adjustTaskSortingForEnergy(
  input: SessionEnergyAdjustsSortingInput
): Promise<TaskSortingOutput> {
  return adjustTaskSortingForEnergyFlow(input);
}

const adjustTaskSortingForEnergyPrompt = ai.definePrompt({
  name: 'adjustTaskSortingForEnergyPrompt',
  input: {schema: SessionEnergyAdjustsSortingInputSchema},
  output: {schema: TaskSortingOutputSchema},
  prompt: `You are a personal assistant helping a user with ADHD decide what task to work on next.

Sort the following list of tasks based on the user's energy level. When the energy level is low, prioritize shorter, easier tasks. When the energy level is high, prioritize more important or longer tasks. Return the sorted list of tasks as a JSON array.

Energy Level: {{{energyLevel}}}
Tasks: {{{JSON.stringify(tasks)}}}

Ensure the output is a valid JSON array of tasks.
`,
});

const adjustTaskSortingForEnergyFlow = ai.defineFlow(
  {
    name: 'adjustTaskSortingForEnergyFlow',
    inputSchema: SessionEnergyAdjustsSortingInputSchema,
    outputSchema: TaskSortingOutputSchema,
  },
  async input => {
    const {output} = await adjustTaskSortingForEnergyPrompt(input);
    return output!;
  }
);
