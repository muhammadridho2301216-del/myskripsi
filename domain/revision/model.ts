export type RevisionStatus = 'baru' | 'dipahami' | 'dikerjakan' | 'perlu-konfirmasi' | 'selesai'

export const revisionStatusOrder: RevisionStatus[] = [
  'baru', 'dipahami', 'dikerjakan', 'perlu-konfirmasi', 'selesai',
]

export const revisionStatusLabels: Record<RevisionStatus, string> = {
  baru: 'Baru',
  dipahami: 'Dipahami',
  dikerjakan: 'Dikerjakan',
  'perlu-konfirmasi': 'Perlu konfirmasi',
  selesai: 'Selesai',
}

export type RevisionPriority = 'low' | 'medium' | 'high' | 'blocking'

export const revisionPriorityLabels: Record<RevisionPriority, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  blocking: 'Menghambat sidang',
}

export type RevisionSourceType = 'pembimbing-1' | 'pembimbing-2' | 'penguji' | 'mandiri'

export const revisionSourceLabels: Record<RevisionSourceType, string> = {
  'pembimbing-1': 'Pembimbing 1',
  'pembimbing-2': 'Pembimbing 2',
  penguji: 'Penguji',
  mandiri: 'Catatan mandiri',
}

export interface RevisionStatusEvent {
  id: string
  from: RevisionStatus | null
  to: RevisionStatus
  at: string
  note?: string
}

/**
 * One revision note from a supervisor/examiner, tracked as a workflow item
 * rather than a flat comment list (PRD §Writing Workspace / TASK-08.03).
 */
export interface Revision {
  id: string
  /** Free-text name of the supervisor/examiner, e.g. "Bu Diana". */
  author: string
  sourceType: RevisionSourceType
  /** Links to a BimbinganEntry.id when the revision was captured during a logged meeting. */
  meetingId?: string
  /** Outline node (chapter/section) this revision targets. */
  outlineNodeId?: string
  outlineNodeTitle?: string
  priority: RevisionPriority
  deadline?: string
  status: RevisionStatus
  /** The reviewer's note as given. */
  requestText: string
  /** Text in the manuscript before the author addressed the note (optional, filled when work starts). */
  textBefore?: string
  /** Text in the manuscript after addressing the note. */
  textAfter?: string
  /** Links to WritingDocument version ids proving the change was made. */
  evidenceVersionIds: string[]
  /** Free-text confirmation note, e.g. what was explained back to the supervisor. */
  confirmationNote?: string
  statusHistory: RevisionStatusEvent[]
  createdAt: string
  updatedAt: string
}

export const revisionTransitions: Record<RevisionStatus, RevisionStatus[]> = {
  baru: ['dipahami'],
  dipahami: ['dikerjakan', 'baru'],
  dikerjakan: ['perlu-konfirmasi', 'selesai', 'dipahami'],
  'perlu-konfirmasi': ['selesai', 'dikerjakan'],
  selesai: ['dikerjakan'],
}

export function canTransition(from: RevisionStatus, to: RevisionStatus): boolean {
  return revisionTransitions[from]?.includes(to) ?? false
}

export interface RevisionGuardContext {
  textAfter?: string
  evidenceVersionIds: string[]
}

export interface RevisionBlocker { code: string, message: string }

/**
 * "Dikerjakan" -> "Selesai"/"Perlu konfirmasi" requires some evidence of
 * change — either an after-text or a linked manuscript version — so revisions
 * cannot be silently closed without a trace.
 */
export function guardRevisionCompletion(to: RevisionStatus, context: RevisionGuardContext): RevisionBlocker[] {
  if (to !== 'selesai' && to !== 'perlu-konfirmasi') return []
  const hasEvidence = Boolean(context.textAfter?.trim()) || context.evidenceVersionIds.length > 0
  return hasEvidence ? [] : [{
    code: 'no-evidence',
    message: 'Tambahkan teks sesudah revisi atau tautkan versi naskah sebagai bukti sebelum menutup revisi ini.',
  }]
}
