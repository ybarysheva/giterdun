'use server';

/**
 * @fileOverview AI-powered task enrichment flow for "Pick For Me".
 *
 * This file defines a Genkit flow that uses an LLM to:
 * 1. Suggest 'effort' ratings (XS, S, M, L) for tasks that don't have one, including confidence and reasons.
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
  flagged: z.boolean().describe('True if the task is marked as important.'),
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
  confidence: z.number().min(0).max(1).describe('The confidence level of the suggestion, from 0.0 to 1.0.'),
  reasons: z.array(z.string()).describe('An array of 1-3 brief phrases explaining the effort suggestion.'),
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
  prompt: `You are an assistant for a to-do app. Your goal is to enrich task data, not to re-order it.

The user's app has already sorted the tasks and selected the top priority one.

Your two jobs are:
1. For each task in the list with a missing effort level, suggest one ('XS', 'S', 'M', 'L'). You must also provide a confidence score (0.0-1.0) and 1-3 brief reasons for your choice.
   - XS: <5m (e.g., send a message, make a call).
   - S: 5-15m (e.g., tidy one area, schedule appointment).
   - M: 15-45m (e.g., write a short draft, renew a document).
   - L: 45m+ (e.g., build/implement something, major errand).
   - If a title is vague (e.g., "portfolio"), prefer 'L' with lower confidence.
   - If uncertain, choose the smaller bucket and lower confidence (e.g., 0.45).

2. For the single top-priority task (ID: {{topTaskId}}), generate 2-3 brief, encouraging "Why this?" reasons it's a good choice to do now.

Here is the data:
- User's Energy: {{session.energy}}
- Top Task ID: {{topTaskId}}
- All To-Do Tasks:
  {{#each tasks}}
  - Task: { id: {{id}}, title: '{{title}}', effort: {{effort || 'null'}}, flagged: {{flagged}}, isStale: {{isStale}} }
  {{/each}}

Rules for "Why this?" reasons:
- Base reasons on the task's properties: if it's flagged as important, its effort, its staleness, and how it fits the user's current energy.
- Example reasons: "Quick win (XS)", "Flagged as important", "Carried over 2+ days", "Good for low energy".
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
    // Only proceed if there are tasks needing effort or a top task is identified.
    const tasksToProcess = input.tasks.filter(t => t.effort === null);
    if (tasksToProcess.length === 0 && !input.topTaskId) {
      return { effortSuggestions: [], topReasons: [] };
    }
    
    const {output} = await prompt(input);
    if (!output) {
      return { effortSuggestions: [], topReasons: [] };
    }

    // Harden the output: only return suggestions for tasks that actually needed one.
    const validEffortSuggestions = output.effortSuggestions.filter(suggestion => 
      tasksToProcess.some(task => task.id === suggestion.id)
    );

    return {
      effortSuggestions: validEffortSuggestions,
      topReasons: output.topReasons,
    };
  }
);
