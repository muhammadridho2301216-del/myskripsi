export type SectionStatus = 'not-started' | 'drafting' | 'review' | 'complete'

export const sectionStatusLabels: Record<SectionStatus, string> = {
  'not-started': 'Belum mulai',
  drafting: 'Draft',
  review: 'Review',
  complete: 'Selesai',
}
export const sectionStatusOrder: SectionStatus[] = ['not-started', 'drafting', 'review', 'complete']

export type ChangeActor = 'user' | 'ai' | 'system'

export type AIActionType =
  | 'improve-clarity'
  | 'critique-argument'
  | 'find-unsupported-claims'
  | 'check-terminology'

export interface AIProvenance {
  provider: string
  model: string
  actionType: AIActionType
  /** Optional user instruction. Always passed through redactSecrets before storage. */
  instruction?: string
  suggestionId: string
}

/** One writing document per outline node. `id === nodeId` keeps lookups trivial. */
export interface WritingDocument {
  id: string
  nodeId: string
  content: string
  notes: string
  wordCount: number
  /** Incremented on every write. Used for optimistic concurrency across tabs. */
  rev: number
  status: SectionStatus
  createdAt: string
  updatedAt: string
}

export type SnapshotReason =
  | 'autosave'
  | 'manual'
  | 'status-change'
  | 'before-ai'
  | 'before-restore'
  | 'conflict-backup'

export interface VersionSnapshot {
  id: string
  documentId: string
  /** Monotonic per document. Lets the UI show "Versi 12" even after pruning. */
  seq: number
  content: string
  hash: string
  wordCount: number
  createdAt: string
  reason: SnapshotReason
  label?: string
  actor: ChangeActor
  /** Pinned snapshots are never removed by pruning. */
  pinned: boolean
}

export type ChangeKind =
  | 'edit'
  | 'manual-snapshot'
  | 'status'
  | 'restore'
  | 'ai-apply'
  | 'ai-undo'
  | 'ai-review'
  | 'conflict-overwrite'

/**
 * Append-only record of an important change. It intentionally stores no document
 * text (snapshots hold that) and no API keys or model reasoning.
 */
export interface ChangeLedgerEntry {
  id: string
  documentId: string
  nodeId: string
  at: string
  actor: ChangeActor
  kind: ChangeKind
  summary: string
  wordsBefore: number
  wordsAfter: number
  addedWords: number
  removedWords: number
  /** Snapshot taken immediately before this change (enables undo/restore). */
  versionId?: string
  /** For restore/undo: the snapshot that was restored. */
  restoredVersionId?: string
  /** For ai-undo / ai-review: which ai-apply entry this refers to. */
  refersToEntryId?: string
  statusFrom?: SectionStatus
  statusTo?: SectionStatus
  provenance?: AIProvenance
}

export class ConflictError extends Error {
  constructor(public readonly expectedRev: number, public readonly actualRev: number) {
    super('Dokumen diubah dari tab atau sesi lain.')
    this.name = 'ConflictError'
  }
}

export class StaleSuggestionError extends Error {
  constructor() {
    super('Teks berubah sejak saran dibuat. Jalankan ulang aksi AI.')
    this.name = 'StaleSuggestionError'
  }
}

export interface Issue { code: string, message: string }

export class TransitionBlockedError extends Error {
  constructor(public readonly blockers: Issue[]) {
    super(blockers.map(item => item.message).join(' '))
    this.name = 'TransitionBlockedError'
  }
}
