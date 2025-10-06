'use server';

/**
 * @fileOverview AI-powered task enrichment flow for "Pick For Me".
 *
 * This file defines a Genkit flow that uses an LLM to:
 * 1. Suggest 'effort' ratings (XS, S, M, L) for tasks that don't have one.
 * 2. Generate brief, context-aware reasons why a specific task was ranked as the top priority by the local sorting algorithm.
 *
 * The flow does NOT determine the task order; it only enriches the data provided by the app.
 *
 * @file
 * @exports aiEnhanceTasks
 * @exports AiTaskEnhancementInput
 * @exports AiTaskEnhancementOutput
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  effort: z.enum(['XS', 'S', 'M', 'L']).nullable(),
  importance: z.enum(['!!']).nullable(),
  isStale: z.boolean().describe('True if the task has been carried over for 2 or more days.'),
});

const SessionSchema = z.object({
  energy: z.enum(['low', 'med', 'high']),
});

const AiTaskEnhancementInputSchema = z.object({
  tasks: z.array(TaskSchema).describe('The full list of "todo" tasks.'),
  topTaskId: z.string().describe('The ID of the task that has been locally determined as the top priority.'),
  session: SessionSchema.describe('The current user session, including energy level.'),
});
export type AiTaskEnhancementInput = z.infer<typeof AiTaskEnhancementInputSchema>;

const EffortSuggestionSchema = z.object({
  id: z.string().describe('The ID of the task.'),
  effort: z.enum(['XS', 'S', 'M', 'L']).describe('The suggested effort level.'),
});

const AiTaskEnhancementOutputSchema = z.object({
  effortSuggestions: z
    .array(EffortSuggestionSchema)
    .describe('An array of effort suggestions for tasks where effort was null.'),
  topReasons: z
    .array(z.string())
    .describe('An array of 2-3 short, human-readable reasons why the top-ranked task is important right now.'),
});
export type AiTaskEnhancementOutput = z.infer<typeof AiTaskEnhancementOutputSchema>;

export async function aiEnhanceTasks(input: AiTaskEnhancementInput): Promise<AiTaskEnhancementOutput> {
  return aiEnhanceTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiTaskEnhancementPrompt',
  input: {schema: AiTaskEnhancementInputSchema},
  output: {schema: AiTaskEnhancementOutputSchema},
  config: {
    temperature: 0.2, // Low temperature for stable, predictable output
  },
  prompt: `You are a helpful assistant for a user with ADHD. Your goal is to provide context and suggestions for their to-do list, not to re-order it.

The user's app has already sorted the tasks and selected the top priority task.

Your two jobs are:
1. For any task in the list with a missing effort level, suggest one ('XS', 'S', 'M', 'L') based on its title.
2. For the single top-priority task (ID: {{topTaskId}}), generate 2-3 brief, encouraging "Why this?" reasons it's a good choice to do now.

Here is the data:
- User's Energy: {{session.energy}}
- Top Task ID: {{topTaskId}}
- All To-Do Tasks:
  {{#each tasks}}
  - Task: { id: {{id}}, title: '{{title}}', effort: {{effort || 'null'}}, importance: {{importance || 'null'}}, isStale: {{isStale}} }
  {{/each}}

Rules for "Why this?" reasons:
- Base reasons on the task's properties: importance, effort, staleness, and how it fits the user's energy.
- Example reasons: "Quick win (XS)", "Important (!!)", "Carried over 2+ days", "Good for low energy".
- The top task is the one with ID: {{topTaskId}}. Find it in the list to understand its properties.
- Be concise and positive.

Return a valid JSON object matching the specified output format.
`,
});

const aiEnhanceTasksFlow = ai.defineFlow(
  {
    name: 'aiEnhanceTasksFlow',
    inputSchema: AiTaskEnhancementInputSchema,
    outputSchema: AiTaskEnhancementOutputSchema,
  },
  async input => {
    // If there are no tasks needing effort suggestions and no top task, return empty.
    const tasksToProcess = input.tasks.filter(t => t.effort === null);
    if (tasksToProcess.length === 0 && !input.topTaskId) {
      return { effortSuggestions: [], topReasons: [] };
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);
