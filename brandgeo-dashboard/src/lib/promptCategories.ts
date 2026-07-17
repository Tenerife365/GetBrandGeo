/**
 * promptCategories.ts
 * General, client-agnostic prompt categories + a lightweight auto-categoriser.
 *
 * The original taxonomy grew around the first client (catering: wedding / galas /
 * corporate / very_large …) and every page carried its own copy of the label map.
 * Clients are now diverse, so categories are (a) a small general set that applies
 * to any business and (b) AUTO-ASSIGNED from the prompt text when it's entered —
 * the user no longer picks one. `promptCategoryLabel` is the single display
 * source of truth; it prettifies unknown/legacy slugs so historical prompts
 * (still carrying the old catering categories) render sensibly.
 */

export interface PromptCategoryDef { id: string; label: string; hint: string }

export const PROMPT_CATEGORIES: PromptCategoryDef[] = [
  { id: 'discovery',  label: 'Discovery',       hint: 'Finding options — "best / top X", "recommend a …"' },
  { id: 'comparison', label: 'Comparison',      hint: '"X vs Y", "alternatives to …"' },
  { id: 'local',      label: 'Local',           hint: 'Location-based — "near me", "in <place>"' },
  { id: 'problem',    label: 'Problem-solving', hint: '"how to …", "help with …", need-based' },
  { id: 'brand',      label: 'Brand',           hint: "Mentions the client's own brand name" },
  { id: 'general',    label: 'General',         hint: 'Anything else' },
]

const LABELS: Record<string, string> = Object.fromEntries(
  PROMPT_CATEGORIES.map(c => [c.id, c.label]),
)

/** Display label for a stored category. Falls back to a prettified slug so old
 *  (catering-era) categories — `very_large`, `galas`, … — still read cleanly on
 *  historical prompts without needing a migration. */
export function promptCategoryLabel(cat: string | null | undefined): string {
  if (!cat) return 'General'
  if (LABELS[cat]) return LABELS[cat]
  return cat
    .split(/[_-]/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Auto-assign a general category from the prompt text. First-match-wins and
 *  deliberately simple — a sensible default, not an oracle. If a brand name is
 *  supplied and appears in the prompt, that wins (a direct brand query). */
export function categorizePrompt(text: string, brandName?: string): string {
  const t = ` ${text.toLowerCase()} `
  const brand = brandName?.trim().toLowerCase()
  if (brand && brand.length > 1 && t.includes(brand)) return 'brand'
  if (/\b(vs\.?|versus|compare|comparison|alternatives?|better than|instead of)\b/.test(t)) return 'comparison'
  if (/\b(near me|nearby|closest|local|in my area|around here)\b/.test(t)) return 'local'
  if (/\b(how (to|do|can|much|long)|help( me)?|fix|repair|solve|solution|troubleshoot|why (is|does|won))\b/.test(t)) return 'problem'
  if (/\b(best|top|recommend|recommended|leading|popular|which|suggest|good)\b/.test(t)) return 'discovery'
  return 'general'
}
