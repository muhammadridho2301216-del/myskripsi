import { newId } from '../writing/text'
import {
  canTransition,
  guardRevisionCompletion,
  type Revision,
  type RevisionPriority,
  type RevisionSourceType,
  type RevisionStatus,
} from './model'

export class RevisionTransitionError extends Error {
  constructor(public readonly from: RevisionStatus, public readonly to: RevisionStatus) {
    super(`Revisi tidak dapat berpindah dari "${from}" ke "${to}" secara langsung.`)
    this.name = 'RevisionTransitionError'
  }
}

export class RevisionBlockedError extends Error {
  constructor(public readonly blockers: { code: string, message: string }[]) {
    super(blockers.map(item => item.message).join(' '))
    this.name = 'RevisionBlockedError'
  }
}

export interface CreateRevisionInput {
  author: string
  sourceType: RevisionSourceType
  requestText: string
  meetingId?: string
  outlineNodeId?: string
  outlineNodeTitle?: string
  priority?: RevisionPriority
  deadline?: string
  textBefore?: string
}

export function createRevision(input: CreateRevisionInput, now: Date = new Date()): Revision {
  const iso = now.toISOString()
  return {
    id: newId('rev'),
    author: input.author.trim(),
    sourceType: input.sourceType,
    meetingId: input.meetingId,
    outlineNodeId: input.outlineNodeId,
    outlineNodeTitle: input.outlineNodeTitle,
    priority: input.priority ?? 'medium',
    deadline: input.deadline,
    status: 'baru',
    requestText: input.requestText.trim(),
    textBefore: input.textBefore,
    textAfter: undefined,
    evidenceVersionIds: [],
    confirmationNote: undefined,
    statusHistory: [{ id: newId('rse'), from: null, to: 'baru', at: iso }],
    createdAt: iso,
    updatedAt: iso,
  }
}

export interface TransitionOptions {
  note?: string
  textAfter?: string
  evidenceVersionIds?: string[]
  confirmationNote?: string
  /** Allow a non-linear transition (e.g. reopening from 'selesai'). Still runs completion guards. */
  allowSkip?: boolean
}

export function transitionRevision(
  revision: Revision,
  to: RevisionStatus,
  options: TransitionOptions = {},
  now: Date = new Date(),
): Revision {
  if (revision.status === to) return revision
  if (!options.allowSkip && !canTransition(revision.status, to)) {
    throw new RevisionTransitionError(revision.status, to)
  }
  const textAfter = options.textAfter ?? revision.textAfter
  const evidenceVersionIds = options.evidenceVersionIds ?? revision.evidenceVersionIds
  const blockers = guardRevisionCompletion(to, { textAfter, evidenceVersionIds })
  if (blockers.length) throw new RevisionBlockedError(blockers)

  const iso = now.toISOString()
  return {
    ...revision,
    status: to,
    textAfter,
    evidenceVersionIds,
    confirmationNote: options.confirmationNote ?? revision.confirmationNote,
    updatedAt: iso,
    statusHistory: [
      ...revision.statusHistory,
      { id: newId('rse'), from: revision.status, to, at: iso, note: options.note },
    ],
  }
}

export function attachEvidence(revision: Revision, versionId: string): Revision {
  if (revision.evidenceVersionIds.includes(versionId)) return revision
  return { ...revision, evidenceVersionIds: [...revision.evidenceVersionIds, versionId], updatedAt: new Date().toISOString() }
}

const priorityWeight: Record<RevisionPriority, number> = { blocking: 3, high: 2, medium: 1, low: 0 }

/** Sort order for the revision board: open + overdue + high priority first. */
export function sortRevisions(revisions: Revision[], now: Date = new Date()): Revision[] {
  const isOpen = (item: Revision) => item.status !== 'selesai'
  const isOverdue = (item: Revision) => Boolean(item.deadline) && isOpen(item) && new Date(item.deadline!).getTime() < now.getTime()
  return [...revisions].sort((a, b) => {
    if (isOpen(a) !== isOpen(b)) return isOpen(a) ? -1 : 1
    if (isOverdue(a) !== isOverdue(b)) return isOverdue(a) ? -1 : 1
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) return priorityWeight[b.priority] - priorityWeight[a.priority]
    const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity
    const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity
    return aDeadline - bDeadline
  })
}

export interface RevisionBoardCounts {
  total: number
  byStatus: Record<RevisionStatus, number>
  overdue: number
  blocking: number
}

export function summarizeRevisions(revisions: Revision[], now: Date = new Date()): RevisionBoardCounts {
  const byStatus = { baru: 0, dipahami: 0, dikerjakan: 0, 'perlu-konfirmasi': 0, selesai: 0 } as Record<RevisionStatus, number>
  let overdue = 0
  let blocking = 0
  for (const item of revisions) {
    byStatus[item.status] += 1
    if (item.status !== 'selesai' && item.deadline && new Date(item.deadline).getTime() < now.getTime()) overdue += 1
    if (item.status !== 'selesai' && item.priority === 'blocking') blocking += 1
  }
  return { total: revisions.length, byStatus, overdue, blocking }
}

export function openRevisionCountForNode(revisions: Revision[], outlineNodeId: string): number {
  return revisions.filter(item => item.outlineNodeId === outlineNodeId && item.status !== 'selesai').length
}
