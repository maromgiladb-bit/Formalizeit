/**
 * Deletion / archive eligibility for an NDA row. Pure decision logic shared by
 * the dashboard UI and the API route guards so they agree on what can be
 * removed or archived.
 *
 * Status/workflow strings are compared case-insensitively so both the DB enum
 * values ("SIGNED", "CANCELLED", "COMPLETE") and the lowercased dashboard
 * values ("signed", "cancelled") work with the same call.
 */
export type NdaLifecycleInput = {
  status: string
  workflowState?: string | null
  expired?: boolean
}

const norm = (s: string | null | undefined): string => (s ?? '').toUpperCase()

/** A finalized NDA is fully signed / complete and must never be deleted. */
export function isNdaFinalized(nda: NdaLifecycleInput): boolean {
  return (
    norm(nda.status) === 'SIGNED' ||
    norm(nda.workflowState) === 'COMPLETE' ||
    norm(nda.workflowState) === 'SIGNING_COMPLETE'
  )
}

/**
 * A row may be hard-deleted only when it is an unsent draft, a legacy cancelled
 * row, or an expired (lapsed-link) NDA. Finalized and active in-flight NDAs
 * cannot be deleted.
 */
export function canHardDeleteNda(nda: NdaLifecycleInput): boolean {
  if (isNdaFinalized(nda)) return false
  const status = norm(nda.status)
  if (status === 'DRAFT') return true
  if (status === 'CANCELLED') return true
  return !!nda.expired
}

/** Only finalized NDAs may be archived or unarchived. */
export function canArchiveNda(nda: NdaLifecycleInput): boolean {
  return isNdaFinalized(nda)
}
