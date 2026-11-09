/**
 * promptRemoval.ts - what "remove this prompt" means for a given role
 * (Constantin's ruling 2026-11-09: a viewer cannot hard delete, the prompts
 * DELETE policy is admin only). Pure, so a node test can prove the branching.
 *
 * - admin (not viewing as a customer): 'delete', the row and its collected
 *   answers are removed, with today's warning.
 * - everyone else: 'archive', an update setting is_active = false. The prompt
 *   stops being checked and stops counting toward the plan; its answers stay.
 */
export type PromptRemoval = 'delete' | 'archive'

export function removalMode(isAdmin: boolean): PromptRemoval {
  return isAdmin ? 'delete' : 'archive'
}

export function removalVerb(mode: PromptRemoval): 'Delete' | 'Archive' {
  return mode === 'delete' ? 'Delete' : 'Archive'
}

export function removalConfirm(mode: PromptRemoval): string {
  return mode === 'delete'
    ? 'Delete this prompt? Every AI answer already collected for it is deleted too, and that cannot be undone.'
    : 'Archive this prompt? It stops being checked and no longer counts toward your plan. The answers already collected for it are kept.'
}

export function removalFailure(mode: PromptRemoval): string {
  return mode === 'delete'
    ? 'Could not delete that prompt. Try again, and if it keeps failing, contact support.'
    : 'Could not archive that prompt. Try again, and if it keeps failing, contact support.'
}

/** The write a removal performs, as data, so the role branch is testable. */
export function removalWrite(mode: PromptRemoval): { op: 'delete' } | { op: 'update'; patch: { is_active: false } } {
  return mode === 'delete' ? { op: 'delete' } : { op: 'update', patch: { is_active: false } }
}
