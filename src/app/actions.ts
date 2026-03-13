'use server';

import Anthropic from '@anthropic-ai/sdk';
import type { Effort } from '@/lib/types';

const client = new Anthropic();

export async function classifyTaskEffort(
  title: string
): Promise<{ effort: Effort; reason: string } | null> {
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 128,
      messages: [
        {
          role: 'user',
          content: `Classify the effort level for this task. Return only valid JSON, no markdown.

Task: "${title}"

Return JSON with exactly these fields: {"effort": "XS"|"S"|"M"|"L", "reason": "<one short sentence>"}

Effort levels:
- XS: ≤5 min (e.g. quick reply, set a timer)
- S: 10–15 min (e.g. short email, fill out a form)
- M: 25 min (e.g. write a report section, fix a bug)
- L: 1+ hour (e.g. major project work, deep research)`,
        },
      ],
    });

    const block = response.content[0];
    if (block.type !== 'text') return null;

    const raw = block.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(raw);
    const validEfforts: Effort[] = ['XS', 'S', 'M', 'L'];
    if (!validEfforts.includes(parsed.effort)) return null;

    return { effort: parsed.effort as Effort, reason: String(parsed.reason ?? '') };
  } catch {
    return null;
  }
}
