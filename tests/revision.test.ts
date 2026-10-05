import assert from 'node:assert/strict'
import test from 'node:test'
import { canTransition, guardRevisionCompletion } from '../domain/revision/model'
import {
  RevisionBlockedError,
  RevisionTransitionError,
  attachEvidence,
  createRevision,
  openRevisionCountForNode,
  summarizeRevisions,
  sortRevisions,
  transitionRevision,
} from '../domain/revision/store'
import {
  addDecision,
  buildTimeline,
  createBimbinganEntry,
  linkRevisionToMeeting,
  toggleTarget,
} from '../domain/bimbingan/model'

test('revision workflow only allows the documented transitions', () => {
  assert.equal(canTransition('baru', 'dipahami'), true)
  assert.equal(canTransition('baru', 'selesai'), false)
  assert.equal(canTransition('dikerjakan', 'perlu-konfirmasi'), true)
  assert.equal(canTransition('selesai', 'dikerjakan'), true)
})

test('guardRevisionCompletion requires evidence before closing a revision', () => {
  assert.deepEqual(guardRevisionCompletion('selesai', { evidenceVersionIds: [] }), [{
    code: 'no-evidence',
    message: 'Tambahkan teks sesudah revisi atau tautkan versi naskah sebagai bukti sebelum menutup revisi ini.',
  }])
  assert.deepEqual(guardRevisionCompletion('selesai', { textAfter: 'Sudah diperbaiki.', evidenceVersionIds: [] }), [])
  assert.deepEqual(guardRevisionCompletion('dipahami', { evidenceVersionIds: [] }), [])
})

test('createRevision seeds a single-event status history at "baru"', () => {
  const revision = createRevision({
    author: 'Bu Diana',
    sourceType: 'pembimbing-1',
    requestText: 'Perjelas rumusan masalah.',
  })
  assert.equal(revision.status, 'baru')
  assert.equal(revision.statusHistory.length, 1)
  assert.equal(revision.statusHistory[0].to, 'baru')
})

test('transitionRevision rejects skipped states and blocks closing without evidence', () => {
  const revision = createRevision({ author: 'Bu Diana', sourceType: 'pembimbing-1', requestText: 'Perjelas X.' })
  assert.throws(() => transitionRevision(revision, 'selesai'), RevisionTransitionError)

  const understood = transitionRevision(revision, 'dipahami')
  const working = transitionRevision(understood, 'dikerjakan')
  assert.throws(() => transitionRevision(working, 'selesai'), RevisionBlockedError)

  const done = transitionRevision(working, 'selesai', { textAfter: 'Rumusan masalah sudah dipersempit.' })
  assert.equal(done.status, 'selesai')
  assert.equal(done.statusHistory.length, 4)
  assert.equal(done.statusHistory.at(-1)?.from, 'dikerjakan')
})

test('attachEvidence is idempotent and allows closing via linked versions instead of text', () => {
  const revision = transitionRevision(
    transitionRevision(createRevision({ author: 'Pak Reza', sourceType: 'pembimbing-2', requestText: 'Tambahkan batas waktu.' }), 'dipahami'),
    'dikerjakan',
  )
  const withEvidence = attachEvidence(revision, 'ver_1')
  const again = attachEvidence(withEvidence, 'ver_1')
  assert.equal(again.evidenceVersionIds.length, 1)
  const closed = transitionRevision(again, 'selesai')
  assert.equal(closed.status, 'selesai')
})

test('sortRevisions prioritizes open, overdue, and blocking items', () => {
  const now = new Date('2026-10-10T00:00:00Z')
  const base = createRevision({ author: 'A', sourceType: 'mandiri', requestText: 'x' }, now)
  const done = transitionRevision(transitionRevision(base, 'dipahami', {}, now), 'dikerjakan', {}, now)
  const closed = transitionRevision(done, 'selesai', { textAfter: 'done' }, now)
  const overdue = { ...base, id: 'rev_overdue', deadline: '2026-01-01T00:00:00Z', priority: 'medium' as const }
  const blocking = { ...base, id: 'rev_blocking', priority: 'blocking' as const }
  const normal = { ...base, id: 'rev_normal', priority: 'low' as const }

  const sorted = sortRevisions([closed, normal, overdue, blocking], now)
  assert.equal(sorted[0].id, overdue.id)
  assert.equal(sorted.at(-1)?.id, closed.id)
})

test('summarizeRevisions counts by status, overdue, and blocking', () => {
  const now = new Date('2026-10-10T00:00:00Z')
  const base = createRevision({ author: 'A', sourceType: 'mandiri', requestText: 'x' }, now)
  const overdue = { ...base, id: 'rev_overdue', deadline: '2026-01-01T00:00:00Z' }
  const summary = summarizeRevisions([base, overdue], now)
  assert.equal(summary.total, 2)
  assert.equal(summary.byStatus.baru, 2)
  assert.equal(summary.overdue, 1)
})

test('openRevisionCountForNode only counts unresolved revisions for that node', () => {
  const base = createRevision({ author: 'A', sourceType: 'mandiri', requestText: 'x', outlineNodeId: '1.1' })
  const closed = transitionRevision(
    transitionRevision(base, 'dipahami'),
    'dikerjakan',
  )
  const done = transitionRevision(closed, 'selesai', { textAfter: 'done' })
  assert.equal(openRevisionCountForNode([base], '1.1'), 1)
  assert.equal(openRevisionCountForNode([done], '1.1'), 0)
  assert.equal(openRevisionCountForNode([base], '1.2'), 0)
})

test('bimbingan entry links generated revisions and tracks next-meeting targets', () => {
  let entry = createBimbinganEntry({
    meetingDate: '2026-09-20',
    supervisor: 'Bu Diana',
    agenda: 'Review Bab 1',
    decisions: ['Perjelas rumusan masalah'],
    nextMeetingTargets: ['Selesaikan Bab 1', ''],
  })
  assert.equal(entry.nextMeetingTargets.length, 1)
  entry = linkRevisionToMeeting(entry, 'rev_1')
  entry = linkRevisionToMeeting(entry, 'rev_1')
  assert.equal(entry.generatedRevisionIds.length, 1)
  entry = addDecision(entry, 'Tambahkan dua jurnal pembanding')
  assert.equal(entry.decisions.length, 2)
  entry = toggleTarget(entry, entry.nextMeetingTargets[0].id)
  assert.equal(entry.nextMeetingTargets[0].done, true)
})

test('buildTimeline orders meetings most-recent-first with pending target counts', () => {
  const older = createBimbinganEntry({ meetingDate: '2026-08-01', supervisor: 'Bu Diana', agenda: 'A', nextMeetingTargets: ['t1', 't2'] })
  const newer = createBimbinganEntry({ meetingDate: '2026-09-01', supervisor: 'Bu Diana', agenda: 'B' })
  const timeline = buildTimeline([older, newer])
  assert.equal(timeline[0].entry.id, newer.id)
  assert.equal(timeline[1].pendingTargets, 2)
})
