'use server';

/**
 * @fileOverview AI-powered task sorting flow for the "Pick For Me" feature.
 *
 * This file defines a Genkit flow that uses an LLM to analyze tasks and
 * prioritize them based on effort, importance, and freshness, tailoring
 * the sorting to the user's current energy level.
 *
 * @file
 * @exports aiSortingTasks
 * @exports AiSortingTasksInput
 * @exports AiSortingTasksOutput
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  effort: z.enum(['XS', 'S', 'M', 'L', null]).nullable(),
  importance: z.enum(['!!', null]).nullable(),
  status: z.enum(['todo', 'done']),
  listDate: z.string(), // YYYY-MM-DD
  isCarryover: z.boolean(),
});

const SessionSchema = z.object({
  energy: z.enum(['low', 'med', 'high']),
  sessionQuickWinsCompleted: z.number(),
});

const AiSortingTasksInputSchema = z.object({
  tasks: z.array(TaskSchema).describe('An array of tasks to be sorted.'),
  session: SessionSchema.describe('The current user session information, including energy level.'),
});
export type AiSortingTasksInput = z.infer<typeof AiSortingTasksInputSchema>;

const AiSortingTasksOutputSchema = z.array(z.string()).describe('An array of task IDs sorted by priority.');
export type AiSortingTasksOutput = z.infer<typeof AiSortingTasksOutputSchema>;

export async function aiSortingTasks(input: AiSortingTasksInput): Promise<AiSortingTasksOutput> {
  return aiSortingTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSortingTasksPrompt',
  input: {schema: AiSortingTasksInputSchema},
  output: {schema: AiSortingTasksOutputSchema},
  prompt: `You are a personal assistant designed to help users with ADHD prioritize their tasks.

  Given the following list of tasks, sort them by priority based on effort, importance, and freshness.
  Take into account the user's current energy level when prioritizing tasks; High energy suggests focusing on important tasks, but low energy suggests quick wins.

  Tasks:
  {{#each tasks}}
  - id: {{id}}, title: {{title}}, effort: {{effort}}, importance: {{importance}}, status: {{status}}, listDate: {{listDate}}, isCarryover: {{isCarryover}}
  {{/each}}

  Energy Level: {{session.energy}}
  Quick Wins Completed: {{session.sessionQuickWinsCompleted}}

  Prioritize tasks that are:
  - High importance
  - Low effort (especially if energy is low)
  - Fresh (not carryover tasks unless they are important or the user has high energy)

  Return an array of task IDs in the order of priority.
  The output should be a JSON array of strings.
  `,
});

const aiSortingTasksFlow = ai.defineFlow(
  {
    name: 'aiSortingTasksFlow',
    inputSchema: AiSortingTasksInputSchema,
    outputSchema: AiSortingTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
