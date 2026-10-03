import { newId } from '../writing/text'

/**
 * One supervision meeting log. Revisions created during the meeting link
 * back here via Revision.meetingId so the "Timeline" view (SUBTASK-08.04.07)
 * can show the meeting followed by everything it produced.
 */
export interface BimbinganAttachment {
  id: string
  name: string
  /** Object storage reference once Appwrite is wired (Batch 6). Local prototype stores nothing heavy here. */
  url?: string
  note?: string
}

export interface BimbinganTarget {
  id: string
  text: string
  done: boolean
}

export interface BimbinganEntry {
  id: string
  /** ISO date of the meeting, not createdAt — meetings are often logged after the fact. */
  meetingDate: string
  supervisor: string
  agenda: string
  decisions: string[]
  /** Revision ids created from this meeting (SUBTASK-08.04.04). */
  generatedRevisionIds: string[]
  nextMeetingTargets: BimbinganTarget[]
  attachments: BimbinganAttachment[]
  createdAt: string
  updatedAt: string
}

export interface CreateBimbinganInput {
  meetingDate: string
  supervisor: string
  agenda: string
  decisions?: string[]
  nextMeetingTargets?: string[]
}

export function createBimbinganEntry(input: CreateBimbinganInput, now: Date = new Date()): BimbinganEntry {
  const iso = now.toISOString()
  return {
    id: newId('bim'),
    meetingDate: input.meetingDate,
    supervisor: input.supervisor.trim(),
    agenda: input.agenda.trim(),
    decisions: (input.decisions ?? []).map(item => item.trim()).filter(Boolean),
    generatedRevisionIds: [],
    nextMeetingTargets: (input.nextMeetingTargets ?? []).map(text => ({ id: newId('tgt'), text: text.trim(), done: false })).filter(item => item.text),
    attachments: [],
    createdAt: iso,
    updatedAt: iso,
  }
}

export function linkRevisionToMeeting(entry: BimbinganEntry, revisionId: string): BimbinganEntry {
  if (entry.generatedRevisionIds.includes(revisionId)) return entry
  return { ...entry, generatedRevisionIds: [...entry.generatedRevisionIds, revisionId], updatedAt: new Date().toISOString() }
}

export function addAttachment(entry: BimbinganEntry, attachment: Omit<BimbinganAttachment, 'id'>): BimbinganEntry {
  return {
    ...entry,
    attachments: [...entry.attachments, { ...attachment, id: newId('att') }],
    updatedAt: new Date().toISOString(),
  }
}

export function toggleTarget(entry: BimbinganEntry, targetId: string): BimbinganEntry {
  return {
    ...entry,
    nextMeetingTargets: entry.nextMeetingTargets.map(item => item.id === targetId ? { ...item, done: !item.done } : item),
    updatedAt: new Date().toISOString(),
  }
}

export function addDecision(entry: BimbinganEntry, decision: string): BimbinganEntry {
  const text = decision.trim()
  if (!text) return entry
  return { ...entry, decisions: [...entry.decisions, text], updatedAt: new Date().toISOString() }
}

/** Chronological meeting order, most recent meeting first (for the timeline view). */
export function sortByMeetingDate(entries: BimbinganEntry[]): BimbinganEntry[] {
  return [...entries].sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime())
}

export interface BimbinganTimelineItem {
  entry: BimbinganEntry
  pendingTargets: number
  totalTargets: number
}

export function buildTimeline(entries: BimbinganEntry[]): BimbinganTimelineItem[] {
  return sortByMeetingDate(entries).map(entry => ({
    entry,
    pendingTargets: entry.nextMeetingTargets.filter(item => !item.done).length,
    totalTargets: entry.nextMeetingTargets.length,
  }))
}
