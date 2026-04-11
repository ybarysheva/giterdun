import { GROCERY_KEYWORDS } from './grocery-keywords';

/**
 * Classifies a shopping item title as 'grocery' or 'other'.
 * Uses word-boundary matching for single-word keywords and substring
 * matching for multi-word keywords (e.g. "feta cheese", "frozen peas").
 */
export function classifyItem(title: string): 'grocery' | 'other' {
  const lower = title.toLowerCase().trim();

  for (const keyword of GROCERY_KEYWORDS) {
    if (keyword.includes(' ')) {
      // Multi-word keyword: substring match is fine
      if (lower.includes(keyword)) return 'grocery';
    } else {
      // Single-word keyword: require word boundary to avoid partial matches
      if (new RegExp(`\\b${keyword}\\b`).test(lower)) return 'grocery';
    }
  }

  return 'other';
}
