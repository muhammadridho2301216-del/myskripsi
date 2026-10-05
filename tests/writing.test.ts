import assert from 'node:assert/strict'
import test from 'node:test'
import { diffText, hasChanges, opsToText } from '../domain/writing/diff'
import { countWords, hashText, redactSecrets } from '../domain/writing/text'
import {
  buildCitationPlaceholder,
  checkCompletion,
  evidenceCoverage,
  extractCitations,
  newCitationKeys,
  summarizeCitations,
} from '../domain/writing/citations'
import { buildAIActionRequest } from '../domain/writing/prompts'
import { buildSuggestion, detectSuggestionWarnings } from '../domain/writing/suggestions'
import {
  applyAISuggestion,
  applyEdit,
  changeStatus,
  commitAutosave,
  createDocument,
  manualSnapshot,
  restoreVersion,
  undoAIChange,
  type DocumentState,
} from '../domain/writing/store'
import { ConflictError, StaleSuggestionError, TransitionBlockedError } from '../domain/writing/model'

test('diffText finds a word-level edit and can rebuild both sides', () => {
  const before = 'Mahasiswa harus menulis latar belakang dengan jelas.'
  const after = 'Mahasiswa wajib menulis latar belakang dengan sangat jelas.'
  const result = diffText(before, after)
  assert.equal(hasChanges(result), true)
  assert.equal(opsToText(result.ops, 'before'), before)
  assert.equal(opsToText(result.ops, 'after'), after)
})

test('diffText on identical text produces no changes', () => {
  const result = diffText('Teks sama', 'Teks sama')
  assert.equal(hasChanges(result), false)
})

test('countWords ignores citation placeholders', () => {
  assert.equal(countWords('Dua kata [[cite:src-aabbccdd|Jones 2020]] tiga kata'), 4)
  assert.equal(countWords(''), 0)
  assert.equal(countWords('   '), 0)
})

test('redactSecrets masks common API key shapes but leaves prose intact', () => {
  const text = 'Kuncinya sk-live-abcdefgh12345678 jangan dibagikan ke siapa pun.'
  const redacted = redactSecrets(text)
  assert.ok(!redacted.includes('abcdefgh12345678'))
  assert.ok(redacted.includes('jangan dibagikan'))
})

test('citation placeholder round-trips and reports verification state', () => {
  const source = { id: 'src-1', title: 'Digital learning and persistence', verified: true }
  const placeholder = buildCitationPlaceholder(source)
  const text = `Temuan ini konsisten ${placeholder} dengan studi lain.`
  const refs = extractCitations(text, [source])
  assert.equal(refs.length, 1)
  assert.equal(refs[0].state, 'verified')

  const unverifiedSource = { id: 'src-2', title: 'Unverified paper', verified: false }
  const refsMissing = extractCitations(buildCitationPlaceholder(unverifiedSource), [])
  assert.equal(refsMissing[0].state, 'missing')
})

test('summarizeCitations deduplicates repeated citations of the same source', () => {
  const source = { id: 'src-1', title: 'Paper', verified: true }
  const placeholder = buildCitationPlaceholder(source)
  const summary = summarizeCitations(extractCitations(`${placeholder} ... ${placeholder}`, [source]))
  assert.equal(summary.total, 2)
  assert.equal(summary.distinct.length, 1)
  assert.equal(summary.verified, 1)
})

test('newCitationKeys reports only citations introduced by a suggestion', () => {
  const source = { id: 'src-1', title: 'Paper', verified: true }
  const placeholder = buildCitationPlaceholder(source)
  const before = 'Kalimat awal.'
  const after = `Kalimat awal ${placeholder}.`
  assert.deepEqual(newCitationKeys(before, after), [extractCitations(after, [source])[0].key])
  assert.deepEqual(newCitationKeys(after, after), [])
})

test('evidenceCoverage links claims by outline node and flags uncited sources', () => {
  const source = { id: 'src-1', title: 'Paper', verified: true }
  const claims = [{ id: 'c1', text: 'Klaim', outlineNodeId: '1.1', sourceIds: ['src-1'] }]
  const results = [{ claimId: 'c1', status: 'supported' }]
  const coverage = evidenceCoverage('1.1', 'Teks tanpa sitasi.', claims, results, [source])
  assert.equal(coverage.linkedClaims, 1)
  assert.equal(coverage.supportedPercent, 100)
  assert.equal(coverage.uncitedSources.length, 1)

  const cited = evidenceCoverage('1.1', buildCitationPlaceholder(source), claims, results, [source])
  assert.equal(cited.uncitedSources.length, 0)
})

test('checkCompletion blocks finishing an empty section or one with unverified citations', () => {
  const emptySource = { id: 'src-1', title: 'Paper', verified: false }
  const result = checkCompletion({
    content: '',
    wordCount: 0,
    targetWords: 500,
    sources: [emptySource],
    hasUnreviewedAI: false,
    openRevisionCount: 0,
  })
  assert.equal(result.allowed, false)
  assert.ok(result.blockers.some(item => item.code === 'empty'))

  const withUnverified = checkCompletion({
    content: buildCitationPlaceholder(emptySource),
    wordCount: 50,
    targetWords: 500,
    sources: [emptySource],
    hasUnreviewedAI: false,
    openRevisionCount: 0,
  })
  assert.ok(withUnverified.blockers.some(item => item.code === 'unverified-citations'))

  const verifiedSource = { ...emptySource, verified: true }
  const clean = checkCompletion({
    content: buildCitationPlaceholder(verifiedSource),
    wordCount: 600,
    targetWords: 500,
    sources: [verifiedSource],
    hasUnreviewedAI: false,
    openRevisionCount: 0,
  })
  assert.equal(clean.allowed, true)
  assert.deepEqual(clean.blockers, [])
})

test('checkCompletion blocks on unreviewed AI text even when citations are fine', () => {
  const result = checkCompletion({
    content: 'Ada isi.',
    wordCount: 10,
    targetWords: 0,
    sources: [],
    hasUnreviewedAI: true,
    openRevisionCount: 0,
  })
  assert.equal(result.allowed, false)
  assert.ok(result.blockers.some(item => item.code === 'unreviewed-ai'))
})

test('buildAIActionRequest never lets instruction text override the sandboxing framing, and strips secrets', () => {
  const { system, prompt } = buildAIActionRequest({
    actionType: 'improve-clarity',
    segment: 'Latar belakang penelitian ini membahas X.',
    context: {
      thesisTopic: 'Pengaruh X terhadap Y',
      sectionTitle: 'Latar Belakang',
      sectionObjective: 'Menjelaskan konteks masalah.',
      instruction: 'Pakai key sk-live-zzzzzzzzzzzzzzzz untuk cek sesuatu',
    },
  })
  assert.ok(system.includes('Jangan mengarang sumber'))
  assert.ok(prompt.includes('MULAI TEKS'))
  assert.ok(!prompt.includes('sk-live-zzzzzzzzzzzzzzzz'))
})

test('buildSuggestion computes a diff and flags newly introduced citations', () => {
  const content = 'Kalimat pertama. Kalimat kedua yang perlu diperjelas. Kalimat ketiga.'
  const source = { id: 'src-1', title: 'Paper', verified: false }
  const start = content.indexOf('Kalimat kedua')
  const end = start + 'Kalimat kedua yang perlu diperjelas.'.length
  const suggestion = buildSuggestion({
    documentId: 'doc-1',
    content,
    range: { start, end },
    proposedSegment: `Kalimat kedua kini lebih jelas ${buildCitationPlaceholder(source)}.`,
    actionType: 'improve-clarity',
    provider: 'openai',
    model: 'gpt-test',
  })
  assert.equal(suggestion.originalSegment, 'Kalimat kedua yang perlu diperjelas.')
  assert.ok(hasChanges(suggestion.diff))
  assert.ok(suggestion.warnings.some(item => item.code === 'new-citations'))
})

test('detectSuggestionWarnings reports no-change when AI returns the same text', () => {
  const warnings = detectSuggestionWarnings('Teks sama', 'Teks sama')
  assert.deepEqual(warnings.map(item => item.code), ['no-change'])
})

test('writing store: edit, autosave, status change, and undo build a traceable ledger', () => {
  const document = createDocument('1.1')
  const edited = applyEdit(document, 'Draf pertama latar belakang.')
  let state: DocumentState = { document: edited, versions: [], ledger: [] }
  state = commitAutosave(state)
  assert.equal(state.versions.length, 1)
  assert.equal(state.ledger.length, 1)

  state = { ...state, document: applyEdit(state.document, 'Draf pertama latar belakang yang lebih panjang.') }
  state = manualSnapshot(state, 'Sebelum bimbingan')
  assert.equal(state.versions.filter(item => item.pinned).length, 1)

  assert.throws(() => changeStatus(state, 'complete'), TransitionBlockedError)

  const source = { id: 'src-1', title: 'Paper', verified: true }
  state = { ...state, document: applyEdit(state.document, `Draf final ${buildCitationPlaceholder(source)}.`) }
  state = changeStatus(state, 'complete', {
    completion: {
      content: state.document.content,
      wordCount: state.document.wordCount,
      targetWords: 100,
      sources: [source],
      hasUnreviewedAI: false,
      openRevisionCount: 0,
    },
  })
  assert.equal(state.document.status, 'complete')
})

test('writing store: AI suggestion apply is traceable and reversible, and refuses stale suggestions', () => {
  const document = applyEdit(createDocument('1.2'), 'Kalimat yang akan diperbaiki.')
  let state: DocumentState = { document, versions: [], ledger: [] }
  state = commitAutosave(state)

  const suggestion = buildSuggestion({
    documentId: document.id,
    content: state.document.content,
    range: { start: 0, end: state.document.content.length },
    proposedSegment: 'Kalimat yang telah diperbaiki dengan lebih jelas.',
    actionType: 'improve-clarity',
    provider: 'openai',
    model: 'gpt-test',
  })

  const beforeApply = state.document.content
  state = applyAISuggestion(state, suggestion)
  assert.notEqual(state.document.content, beforeApply)
  const applyEntry = state.ledger.find(item => item.kind === 'ai-apply')!
  assert.ok(applyEntry.provenance)
  assert.equal(applyEntry.provenance?.actionType, 'improve-clarity')

  state = undoAIChange(state, applyEntry.id)
  assert.equal(state.document.content, beforeApply)

  // Content changed again since the suggestion was generated -> stale.
  state = { ...state, document: applyEdit(state.document, 'Kalimat yang akan diperbaiki, dengan tambahan.') }
  assert.throws(() => applyAISuggestion(state, suggestion), StaleSuggestionError)
})

test('writing store: restoreVersion brings back old content and keeps a safety snapshot of current content', () => {
  const document = applyEdit(createDocument('1.3'), 'Versi satu.')
  let state: DocumentState = { document, versions: [], ledger: [] }
  state = commitAutosave(state)
  const v1 = state.versions[0]

  state = { ...state, document: applyEdit(state.document, 'Versi dua yang berbeda.') }
  state = commitAutosave(state)

  state = restoreVersion(state, v1.id)
  assert.equal(state.document.content, 'Versi satu.')
  assert.ok(state.versions.some(item => item.reason === 'before-restore'))
})

test('writing store: conflict detection flags concurrent edits and forceOverwrite backs up the server copy', async () => {
  const { assertNoConflict, forceOverwrite } = await import('../domain/writing/store')
  const document = applyEdit(createDocument('1.4'), 'Lokal.')
  const persisted = { ...document, content: 'Dari tab lain.', rev: 5 }
  assert.throws(() => assertNoConflict(0, persisted), ConflictError)

  let state: DocumentState = { document, versions: [], ledger: [] }
  state = forceOverwrite(state, persisted)
  assert.ok(state.versions.some(item => item.reason === 'conflict-backup' && item.content === 'Dari tab lain.'))
  assert.equal(state.document.rev, persisted.rev + 1)
})

test('hashText is deterministic and sensitive to small changes', () => {
  assert.equal(hashText('abc'), hashText('abc'))
  assert.notEqual(hashText('abc'), hashText('abd'))
})
