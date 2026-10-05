/**
 * Pure JSON<->domain-object mappers for the Appwrite adapter. Kept separate
 * from appwrite.ts so they can be unit-tested without any Appwrite client —
 * this is the part of Batch 6 that CAN be fully verified without
 * credentials, and it is (see tests/appwriteMapping.test.ts).
 */
import type { Models } from 'appwrite'
import type { DocumentState } from '../writing/store'
import type { WritingDocument } from '../writing/model'
import type { Revision, RevisionStatusEvent } from '../revision/model'
import type { BimbinganEntry } from '../bimbingan/model'

/**
 * Row types extend Appwrite's `Models.Row` (which carries $id, $sequence,
 * $tableId, $databaseId, $createdAt, $updatedAt, $permissions) so they
 * satisfy the `Row extends Models.Row` generic constraint on every
 * TablesDB method — see domain/repository/appwrite.ts.
 */
export interface WritingDocumentFields {
  ownerId: string
  nodeId: string
  content: string
  notes: string
  wordCount: number
  rev: number
  status: WritingDocument['status']
  versionsJson: string
  ledgerJson: string
  createdAt: string
  updatedAt: string
}
export type WritingDocumentRow = Models.Row & WritingDocumentFields

export function documentStateToRow(ownerId: string, state: DocumentState): WritingDocumentFields {
  return {
    ownerId,
    nodeId: state.document.nodeId,
    content: state.document.content,
    notes: state.document.notes,
    wordCount: state.document.wordCount,
    rev: state.document.rev,
    status: state.document.status,
    versionsJson: JSON.stringify(state.versions),
    ledgerJson: JSON.stringify(state.ledger),
    createdAt: state.document.createdAt,
    updatedAt: state.document.updatedAt,
  }
}

export function rowToDocumentState(row: WritingDocumentRow): DocumentState {
  return {
    document: {
      id: row.nodeId,
      nodeId: row.nodeId,
      content: row.content,
      notes: row.notes,
      wordCount: row.wordCount,
      rev: row.rev,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    versions: safeParseArray(row.versionsJson),
    ledger: safeParseArray(row.ledgerJson),
  }
}

export interface RevisionFields {
  ownerId: string
  logicalId: string
  author: string
  sourceType: Revision['sourceType']
  meetingId?: string
  outlineNodeId?: string
  outlineNodeTitle?: string
  priority: Revision['priority']
  deadline?: string
  status: Revision['status']
  requestText: string
  textBefore?: string
  textAfter?: string
  evidenceVersionIdsJson: string
  confirmationNote?: string
  statusHistoryJson: string
  createdAt: string
  updatedAt: string
}
export type RevisionRow = Models.Row & RevisionFields

export function revisionToRow(ownerId: string, revision: Revision): RevisionFields {
  return {
    ownerId,
    logicalId: revision.id,
    author: revision.author,
    sourceType: revision.sourceType,
    meetingId: revision.meetingId,
    outlineNodeId: revision.outlineNodeId,
    outlineNodeTitle: revision.outlineNodeTitle,
    priority: revision.priority,
    deadline: revision.deadline,
    status: revision.status,
    requestText: revision.requestText,
    textBefore: revision.textBefore,
    textAfter: revision.textAfter,
    evidenceVersionIdsJson: JSON.stringify(revision.evidenceVersionIds),
    confirmationNote: revision.confirmationNote,
    statusHistoryJson: JSON.stringify(revision.statusHistory),
    createdAt: revision.createdAt,
    updatedAt: revision.updatedAt,
  }
}

export function rowToRevision(row: RevisionRow): Revision {
  return {
    id: row.logicalId,
    author: row.author,
    sourceType: row.sourceType,
    meetingId: row.meetingId,
    outlineNodeId: row.outlineNodeId,
    outlineNodeTitle: row.outlineNodeTitle,
    priority: row.priority,
    deadline: row.deadline,
    status: row.status,
    requestText: row.requestText,
    textBefore: row.textBefore,
    textAfter: row.textAfter,
    evidenceVersionIds: safeParseArray(row.evidenceVersionIdsJson),
    confirmationNote: row.confirmationNote,
    statusHistory: safeParseArray<RevisionStatusEvent>(row.statusHistoryJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export interface BimbinganFields {
  ownerId: string
  logicalId: string
  meetingDate: string
  supervisor: string
  agenda: string
  decisionsJson: string
  generatedRevisionIdsJson: string
  nextMeetingTargetsJson: string
  attachmentsJson: string
  createdAt: string
  updatedAt: string
}
export type BimbinganRow = Models.Row & BimbinganFields

export function bimbinganToRow(ownerId: string, entry: BimbinganEntry): BimbinganFields {
  return {
    ownerId,
    logicalId: entry.id,
    meetingDate: entry.meetingDate,
    supervisor: entry.supervisor,
    agenda: entry.agenda,
    decisionsJson: JSON.stringify(entry.decisions),
    generatedRevisionIdsJson: JSON.stringify(entry.generatedRevisionIds),
    nextMeetingTargetsJson: JSON.stringify(entry.nextMeetingTargets),
    attachmentsJson: JSON.stringify(entry.attachments),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }
}

export function rowToBimbingan(row: BimbinganRow): BimbinganEntry {
  return {
    id: row.logicalId,
    meetingDate: row.meetingDate,
    supervisor: row.supervisor,
    agenda: row.agenda,
    decisions: safeParseArray(row.decisionsJson),
    generatedRevisionIds: safeParseArray(row.generatedRevisionIdsJson),
    nextMeetingTargets: safeParseArray(row.nextMeetingTargetsJson),
    attachments: safeParseArray(row.attachmentsJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function safeParseArray<T>(json: string): T[] {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
