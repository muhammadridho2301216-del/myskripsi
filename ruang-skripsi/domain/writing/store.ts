/**
 * Pure, framework-free engine for one writing document: autosave snapshots,
 * manual snapshots, status transitions, AI suggestion apply/undo, version
 * restore, and basic conflict detection.
 *
 * Every function takes the current state and returns a NEW state (document +
 * versions + ledger). Nothing here touches localStorage or Appwrite — that is
 * the job of the repository adapters in `domain/repository.ts`. This keeps
 * the rules testable and reusable once the Appwrite adapter lands (Batch 6).
 */

import {
  ConflictError,
  StaleSuggestionError,
  TransitionBlockedError,
  type ChangeKind,
  type ChangeLedgerEntry,
  type SectionStatus,
  type VersionSnapshot,
  type WritingDocument,
} from './model'
import { countWords, hashText, newId } from './text'
import type { Suggestion } from './suggestions'
import { applySuggestionToText } from './suggestions'
import { checkCompletion, type CompletionContext } from './citations'

export interface DocumentState {
  document: WritingDocument
  versions: VersionSnapshot[]
  ledger: ChangeLedgerEntry[]
}

/** Snapshots kept forever regardless of age. Plain autosaves get pruned. */
const DURABLE_REASONS = new Set<VersionSnapshot['reason']>([
  'manual', 'status-change', 'before-ai', 'before-restore', 'conflict-backup',
])
const MAX_AUTOSAVE_SNAPSHOTS = 50

export function createDocument(nodeId: string, now: Date = new Date()): WritingDocument {
  const iso = now.toISOString()
  return {
    id: nodeId,
    nodeId,
    content: '',
    notes: '',
    wordCount: 0,
    rev: 0,
    status: 'not-started',
    createdAt: iso,
    updatedAt: iso,
  }
}

function nextSeq(versions: VersionSnapshot[]): number {
  return versions.reduce((max, item) => Math.max(max, item.seq), 0) + 1
}

function takeSnapshot(
  document: WritingDocument,
  versions: VersionSnapshot[],
  reason: VersionSnapshot['reason'],
  actor: ChangeLedgerEntry['actor'],
  label?: string,
): VersionSnapshot {
  return {
    id: newId('ver'),
    documentId: document.id,
    seq: nextSeq(versions),
    content: document.content,
    hash: hashText(document.content),
    wordCount: document.wordCount,
    createdAt: new Date().toISOString(),
    reason,
    label,
    actor,
    pinned: false,
  }
}

function pruneAutosaves(versions: VersionSnapshot[]): VersionSnapshot[] {
  const durable = versions.filter(item => item.pinned || DURABLE_REASONS.has(item.reason))
  const autosaves = versions
    .filter(item => !item.pinned && !DURABLE_REASONS.has(item.reason))
    .sort((a, b) => b.seq - a.seq)
    .slice(0, MAX_AUTOSAVE_SNAPSHOTS)
  return [...durable, ...autosaves].sort((a, b) => a.seq - b.seq)
}

function ledgerEntry(input: {
  document: WritingDocument
  kind: ChangeKind
  summary: string
  actor: ChangeLedgerEntry['actor']
  wordsBefore: number
  wordsAfter: number
  versionId?: string
  restoredVersionId?: string
  refersToEntryId?: string
  statusFrom?: SectionStatus
  statusTo?: SectionStatus
  provenance?: ChangeLedgerEntry['provenance']
}): ChangeLedgerEntry {
  return {
    id: newId('chg'),
    documentId: input.document.id,
    nodeId: input.document.nodeId,
    at: new Date().toISOString(),
    actor: input.actor,
    kind: input.kind,
    summary: input.summary,
    wordsBefore: input.wordsBefore,
    wordsAfter: input.wordsAfter,
    addedWords: Math.max(0, input.wordsAfter - input.wordsBefore),
    removedWords: Math.max(0, input.wordsBefore - input.wordsAfter),
    versionId: input.versionId,
    restoredVersionId: input.restoredVersionId,
    refersToEntryId: input.refersToEntryId,
    statusFrom: input.statusFrom,
    statusTo: input.statusTo,
    provenance: input.provenance,
  }
}

/** Lightweight in-memory edit. No snapshot, no ledger entry — call commitAutosave to persist history. */
export function applyEdit(document: WritingDocument, content: string, now: Date = new Date()): WritingDocument {
  if (content === document.content) return document
  return { ...document, content, wordCount: countWords(content), updatedAt: now.toISOString() }
}

/**
 * Called by the debounced autosave timer. No-ops if content already matches
 * the latest snapshot (avoids duplicate history entries while idle).
 */
export function commitAutosave(state: DocumentState, now: Date = new Date()): DocumentState {
  const latest = [...state.versions].sort((a, b) => b.seq - a.seq)[0]
  if (latest && latest.hash === hashText(state.document.content)) return state
  const snapshot = takeSnapshot(state.document, state.versions, 'autosave', 'user')
  const document = { ...state.document, rev: state.document.rev + 1, updatedAt: now.toISOString() }
  const entry = ledgerEntry({
    document,
    kind: 'edit',
    summary: 'Autosave',
    actor: 'user',
    wordsBefore: latest?.wordCount ?? 0,
    wordsAfter: document.wordCount,
    versionId: snapshot.id,
  })
  return {
    document,
    versions: pruneAutosaves([...state.versions, snapshot]),
    ledger: [...state.ledger, entry],
  }
}

export function manualSnapshot(state: DocumentState, label: string, now: Date = new Date()): DocumentState {
  const snapshot = { ...takeSnapshot(state.document, state.versions, 'manual', 'user', label), pinned: true }
  const document = { ...state.document, rev: state.document.rev + 1, updatedAt: now.toISOString() }
  const entry = ledgerEntry({
    document,
    kind: 'manual-snapshot',
    summary: label || 'Snapshot manual',
    actor: 'user',
    wordsBefore: document.wordCount,
    wordsAfter: document.wordCount,
    versionId: snapshot.id,
  })
  return { document, versions: [...state.versions, snapshot], ledger: [...state.ledger, entry] }
}

export interface StatusChangeOptions {
  /** Required when moving INTO 'complete'; ignored otherwise. */
  completion?: CompletionContext
  /** Caller already warned the user and they confirmed — downgrade blockers to a forced note. */
  force?: boolean
}

export function changeStatus(
  state: DocumentState,
  to: SectionStatus,
  options: StatusChangeOptions = {},
  now: Date = new Date(),
): DocumentState {
  const from = state.document.status
  if (from === to) return state
  if (to === 'complete' && !options.force) {
    if (!options.completion) {
      throw new TransitionBlockedError([{ code: 'completion-context-missing', message: 'Kelengkapan bagian belum dapat diperiksa.' }])
    }
    const result = checkCompletion(options.completion)
    if (!result.allowed) throw new TransitionBlockedError(result.blockers)
  }
  const snapshot = takeSnapshot(state.document, state.versions, 'status-change', 'user')
  const document: WritingDocument = { ...state.document, status: to, rev: state.document.rev + 1, updatedAt: now.toISOString() }
  const entry = ledgerEntry({
    document,
    kind: 'status',
    summary: `Status diubah dari ${from} ke ${to}`,
    actor: 'user',
    wordsBefore: document.wordCount,
    wordsAfter: document.wordCount,
    versionId: snapshot.id,
    statusFrom: from,
    statusTo: to,
  })
  return { document, versions: pruneAutosaves([...state.versions, snapshot]), ledger: [...state.ledger, entry] }
}

/**
 * Applies an AI suggestion. The suggestion carries a hash of the document it
 * was computed against; if the live document drifted since (another edit,
 * another applied suggestion), we refuse rather than apply to the wrong text.
 */
export function applyAISuggestion(state: DocumentState, suggestion: Suggestion, now: Date = new Date()): DocumentState {
  if (suggestion.baseHash !== hashText(state.document.content)) throw new StaleSuggestionError()
  const before = takeSnapshot(state.document, state.versions, 'before-ai', 'ai')
  const content = applySuggestionToText(state.document.content, suggestion)
  const document: WritingDocument = {
    ...state.document,
    content,
    wordCount: countWords(content),
    rev: state.document.rev + 1,
    updatedAt: now.toISOString(),
  }
  const entry = ledgerEntry({
    document,
    kind: 'ai-apply',
    summary: `Saran AI diterapkan: ${suggestion.actionType}`,
    actor: 'ai',
    wordsBefore: state.document.wordCount,
    wordsAfter: document.wordCount,
    versionId: before.id,
    provenance: suggestion.provenance,
  })
  return { document, versions: pruneAutosaves([...state.versions, before]), ledger: [...state.ledger, entry] }
}

/** Reverts an AI apply using the before-ai snapshot taken at apply time. */
export function undoAIChange(state: DocumentState, applyEntryId: string, now: Date = new Date()): DocumentState {
  const entry = state.ledger.find(item => item.id === applyEntryId && item.kind === 'ai-apply')
  if (!entry?.versionId) throw new Error('Entri perubahan AI tidak ditemukan.')
  const snapshot = state.versions.find(item => item.id === entry.versionId)
  if (!snapshot) throw new Error('Versi sebelum perubahan AI tidak ditemukan.')
  const document: WritingDocument = {
    ...state.document,
    content: snapshot.content,
    wordCount: snapshot.wordCount,
    rev: state.document.rev + 1,
    updatedAt: now.toISOString(),
  }
  const undoEntry = ledgerEntry({
    document,
    kind: 'ai-undo',
    summary: 'Saran AI dibatalkan',
    actor: 'user',
    wordsBefore: state.document.wordCount,
    wordsAfter: document.wordCount,
    refersToEntryId: entry.id,
  })
  return { document, versions: state.versions, ledger: [...state.ledger, undoEntry] }
}

export function restoreVersion(state: DocumentState, versionId: string, now: Date = new Date()): DocumentState {
  const target = state.versions.find(item => item.id === versionId)
  if (!target) throw new Error('Versi tidak ditemukan.')
  const before = takeSnapshot(state.document, state.versions, 'before-restore', 'user')
  const document: WritingDocument = {
    ...state.document,
    content: target.content,
    wordCount: target.wordCount,
    rev: state.document.rev + 1,
    updatedAt: now.toISOString(),
  }
  const entry = ledgerEntry({
    document,
    kind: 'restore',
    summary: `Dipulihkan ke versi #${target.seq}`,
    actor: 'user',
    wordsBefore: state.document.wordCount,
    wordsAfter: document.wordCount,
    versionId: before.id,
    restoredVersionId: target.id,
  })
  return { document, versions: pruneAutosaves([...state.versions, before]), ledger: [...state.ledger, entry] }
}

/**
 * Offline/multi-tab conflict strategy (SUBTASK-08.01.08): the caller tracks
 * the `rev` it last loaded. If the persisted rev has moved on, this throws;
 * the UI then offers "keep mine" (forceOverwrite) or "keep server copy" (load
 * fresh state instead of calling this at all).
 */
export function assertNoConflict(expectedRev: number, persisted: WritingDocument): void {
  if (expectedRev !== persisted.rev) throw new ConflictError(expectedRev, persisted.rev)
}

/** "Keep mine": snapshot the server copy so it is not silently lost, then overwrite with local content. */
export function forceOverwrite(state: DocumentState, persisted: WritingDocument, now: Date = new Date()): DocumentState {
  const backup: VersionSnapshot = {
    id: newId('ver'),
    documentId: persisted.id,
    seq: nextSeq(state.versions),
    content: persisted.content,
    hash: hashText(persisted.content),
    wordCount: persisted.wordCount,
    createdAt: now.toISOString(),
    reason: 'conflict-backup',
    label: 'Versi dari sesi/tab lain sebelum ditimpa',
    actor: 'system',
    pinned: true,
  }
  const document: WritingDocument = { ...state.document, rev: persisted.rev + 1, updatedAt: now.toISOString() }
  const entry = ledgerEntry({
    document,
    kind: 'conflict-overwrite',
    summary: 'Konflik versi diselesaikan: menyimpan perubahan lokal, versi lain dicadangkan.',
    actor: 'user',
    wordsBefore: persisted.wordCount,
    wordsAfter: document.wordCount,
    versionId: backup.id,
  })
  return { document, versions: pruneAutosaves([...state.versions, backup]), ledger: [...state.ledger, entry] }
}
