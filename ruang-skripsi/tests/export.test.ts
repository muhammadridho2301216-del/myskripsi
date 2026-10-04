import assert from 'node:assert/strict'
import test from 'node:test'
import JSZip from 'jszip'
import { getOutlineTemplate } from '../server/utils/outline/engine'
import { evaluateOutlineReadiness } from '../server/utils/outline/engine'
import { evaluateConsistency } from '../server/utils/consistency/engine'
import { buildCitationPlaceholder } from '../domain/writing/citations'
import { getTemplate, type ExportSnapshot } from '../domain/export/model'
import { evaluateExportReadiness, citationSummaryForSnapshot } from '../domain/export/gate'
import { generateDocx, validateDocxBuffer, ExportBlockedError } from '../domain/export/generate'
import { buildCitationOrder, buildBibliography, apaInText, ieeeInText } from '../domain/citation-style'
import { parseSourceMeta } from '../domain/citation-style/parseMeta'

const outline = getOutlineTemplate('quantitative')!.nodes

function baseSnapshot(overrides: Partial<ExportSnapshot> = {}): ExportSnapshot {
  return {
    kind: 'draft',
    generatedAt: new Date('2026-10-04T00:00:00Z').toISOString(),
    thesisTitle: 'Pengaruh Ruang Belajar Digital terhadap Konsistensi Mahasiswa',
    profile: { name: 'Mahasiswa Uji', university: 'Universitas Uji', program: 'Teknik Informatika', stage: 'Menyusun proposal' },
    researchType: 'quantitative',
    outlineNodes: outline,
    sections: [],
    sources: [],
    matrix: [],
    citationStyle: 'apa',
    template: getTemplate('generic-id'),
    aiAssistedSectionIds: [],
    ...overrides,
  }
}

test('parseSourceMeta extracts author and year without fabricating missing parts', () => {
  assert.deepEqual(parseSourceMeta('Jane Doe · 2023'), { author: 'Jane Doe', year: '2023' })
  assert.deepEqual(parseSourceMeta('Metadata dari hasil pencarian'), {})
  assert.deepEqual(parseSourceMeta(undefined), {})
})

test('APA and IEEE in-text forms differ and never invent a year', () => {
  const withYear = { id: 's1', title: 'Paper', verified: true, author: 'Jane Doe', year: '2023' }
  const withoutYear = { id: 's2', title: 'Paper Two', verified: true }
  assert.equal(apaInText(withYear), '(Jane Doe, 2023)')
  assert.equal(apaInText(withoutYear), '(Paper Two, t.t.)')
  assert.equal(ieeeInText(3), '[3]')
})

test('buildCitationOrder follows first-appearance order across documents', () => {
  const sourceA = { id: 'a', title: 'Source A', verified: true }
  const sourceB = { id: 'b', title: 'Source B', verified: true }
  const docs = [
    `Teks awal ${buildCitationPlaceholder(sourceB)}.`,
    `Teks lain ${buildCitationPlaceholder(sourceA)} dan lagi ${buildCitationPlaceholder(sourceB)}.`,
  ]
  assert.deepEqual(buildCitationOrder(docs, [sourceA, sourceB]), ['b', 'a'])
})

test('buildBibliography only includes cited sources and flags incomplete entries', () => {
  const cited = { id: 'cited', title: 'Cited Paper', verified: true, author: 'Jane Doe', year: '2023', url: 'https://example.test/cited' }
  const uncited = { id: 'uncited', title: 'Uncited Paper', verified: true, author: 'John Roe', year: '2022' }
  const incomplete = { id: 'incomplete', title: 'Incomplete Paper', verified: false }

  const order = buildCitationOrder([buildCitationPlaceholder(cited), buildCitationPlaceholder(incomplete)], [cited, uncited, incomplete])
  const apaEntries = buildBibliography(order, [cited, uncited, incomplete], 'apa')
  assert.equal(apaEntries.length, 2)
  assert.ok(!apaEntries.some(entry => entry.sourceId === 'uncited'))
  const incompleteEntry = apaEntries.find(entry => entry.sourceId === 'incomplete')!
  assert.equal(incompleteEntry.complete, false)
  assert.deepEqual(incompleteEntry.missing.sort(), ['author', 'url', 'year'])

  const ieeeEntries = buildBibliography(order, [cited, uncited, incomplete], 'ieee')
  assert.equal(ieeeEntries[0].inText, '[1]')
})

test('evaluateExportReadiness blocks final blueprint on empty sections but never blocks draft export', () => {
  const snapshot = baseSnapshot({ kind: 'final-blueprint' })
  const result = evaluateExportReadiness(snapshot)
  assert.equal(result.allowed, false)
  assert.ok(result.warnings.some(item => item.code === 'empty-section' && item.severity === 'critical'))

  const draft = evaluateExportReadiness({ ...snapshot, kind: 'draft' })
  assert.equal(draft.allowed, true)
  assert.ok(draft.warnings.some(item => item.code === 'empty-section' && item.severity === 'notice'))
})

test('evaluateExportReadiness blocks final blueprint on unverified or missing citation sources', () => {
  const unverified = { id: 's1', title: 'Unverified', verified: false }
  const section = { nodeId: '1.1', content: `Latar belakang ${buildCitationPlaceholder(unverified)}.`, wordCount: 10, status: 'drafting', notes: '' }
  const snapshot = baseSnapshot({ kind: 'final-blueprint', sections: [section], sources: [unverified] })
  const result = evaluateExportReadiness(snapshot)
  assert.ok(result.warnings.some(item => item.code === 'unverified-citation' && item.severity === 'critical'))

  const missingSource = { nodeId: '1.1', content: `Latar belakang ${buildCitationPlaceholder({ id: 'ghost', title: 'Ghost', verified: true })}.`, wordCount: 10, status: 'drafting', notes: '' }
  const snapshotMissing = baseSnapshot({ kind: 'final-blueprint', sections: [missingSource], sources: [] })
  const resultMissing = evaluateExportReadiness(snapshotMissing)
  assert.ok(resultMissing.warnings.some(item => item.code === 'missing-citation-source'))
})

test('evaluateExportReadiness respects readiness/consistency gates for final blueprint', () => {
  const readiness = evaluateOutlineReadiness({ nodes: outline })
  assert.equal(readiness.readyForFinalExport, false)
  const snapshot = baseSnapshot({ kind: 'final-blueprint', readiness })
  const result = evaluateExportReadiness(snapshot)
  assert.ok(result.warnings.some(item => item.code === 'outline-not-ready'))

  const consistency = evaluateConsistency({
    title: '',
    problemStatements: [],
    objectives: [],
    outlineNodes: outline,
    claims: [],
  })
  const snapshotConsistency = baseSnapshot({ kind: 'final-blueprint', consistency })
  const resultConsistency = evaluateExportReadiness(snapshotConsistency)
  assert.ok(resultConsistency.warnings.some(item => item.code === 'consistency-not-ready'))
})

test('citationSummaryForSnapshot deduplicates across sections', () => {
  const source = { id: 's1', title: 'Paper', verified: true }
  const placeholder = buildCitationPlaceholder(source)
  const snapshot = baseSnapshot({
    sections: [
      { nodeId: '1.1', content: placeholder, wordCount: 5, status: 'drafting', notes: '' },
      { nodeId: '1.2', content: placeholder, wordCount: 5, status: 'drafting', notes: '' },
    ],
    sources: [source],
  })
  const summary = citationSummaryForSnapshot(snapshot)
  assert.equal(summary.total, 2)
  assert.equal(summary.distinct.length, 1)
})

test('generateDocx produces a real, structurally valid DOCX file for a draft export', async () => {
  const source = { id: 's1', title: 'Digital learning and persistence', verified: true, author: 'Jane Doe', year: '2023', url: 'https://example.test/paper' }
  const snapshot = baseSnapshot({
    kind: 'draft',
    sections: [
      { nodeId: '1.1', content: `Latar belakang penelitian ini membahas X ${buildCitationPlaceholder(source)}.\n\nParagraf kedua.`, wordCount: 20, status: 'drafting', notes: 'catatan pribadi' },
    ],
    sources: [source],
    matrix: [{ title: source.title, objective: 'Menjelaskan X', method: 'Survei', finding: 'X berpengaruh', limitation: 'Sampel kecil', verified: true }],
    aiAssistedSectionIds: ['1.1'],
  })

  const { buffer, metadata, warnings } = await generateDocx(snapshot)
  assert.ok(buffer.length > 1000, 'DOCX buffer should not be trivially small')
  assert.equal(metadata.kind, 'draft')
  assert.ok(metadata.fileName.endsWith('.docx'))
  assert.ok(Array.isArray(warnings))

  const validation = await validateDocxBuffer(buffer)
  assert.deepEqual(validation.errors, [])
  assert.equal(validation.valid, true)

  // Open it for real and check actual rendered content, not just structure.
  const zip = await JSZip.loadAsync(buffer)
  const documentXml = await zip.file('word/document.xml')!.async('string')
  assert.ok(documentXml.includes('Pengaruh Ruang Belajar Digital'), 'title should appear in the document body')
  assert.ok(documentXml.includes('Jane Doe, 2023'), 'APA in-text citation should be rendered, not the raw placeholder')
  assert.ok(!documentXml.includes('[[cite:'), 'raw citation placeholders must never leak into the final document')
  assert.ok(documentXml.includes('Research Matrix'))
  assert.ok(documentXml.includes('Daftar Pustaka'))
  assert.ok(documentXml.includes('Keterangan Bantuan AI'))
})

test('generateDocx throws ExportBlockedError for final blueprint with critical warnings, and never for draft', async () => {
  const snapshot = baseSnapshot({ kind: 'final-blueprint' })
  await assert.rejects(() => generateDocx(snapshot), ExportBlockedError)

  const draftSnapshot = baseSnapshot({ kind: 'draft' })
  const result = await generateDocx(draftSnapshot)
  assert.ok(result.buffer.length > 0)
})

test('generateDocx succeeds for a final blueprint once all critical gates are satisfied', async () => {
  const source = { id: 's1', title: 'Paper', verified: true, author: 'Jane Doe', year: '2023', url: 'https://example.test' }
  const sections = outline.flatMap(function flatten(node): any[] {
    return [node, ...node.children]
  }).filter(node => node.level > 1).map(node => ({
    nodeId: node.id,
    content: `Isi lengkap untuk ${node.title} ${node.requiresEvidence ? buildCitationPlaceholder(source) : ''}.`.trim(),
    wordCount: 500,
    status: 'complete',
    notes: '',
  }))
  const readiness = evaluateOutlineReadiness({
    title: 'Judul lengkap',
    problemStatements: ['Rumusan A'],
    objectives: ['Tujuan A'],
    methodology: 'Kuantitatif',
    nodes: outline.map(node => ({ ...node, sourceIds: node.requiresEvidence ? ['s1'] : node.sourceIds })),
  })
  const consistency = evaluateConsistency({
    title: 'Judul lengkap',
    problemStatements: [{ id: 'p1', text: 'Rumusan A' }],
    objectives: [{ id: 'o1', text: 'Tujuan A', problemId: 'p1' }],
    methodology: 'Kuantitatif',
    outlineNodes: outline,
    claims: [],
  })

  const snapshot = baseSnapshot({
    kind: 'final-blueprint',
    sections,
    sources: [source],
    readiness,
    consistency,
  })
  const readinessCheck = evaluateExportReadiness(snapshot)
  const criticalWarnings = readinessCheck.warnings.filter(item => item.severity === 'critical')
  assert.deepEqual(criticalWarnings, [], `unexpected critical warnings: ${JSON.stringify(criticalWarnings)}`)

  const { buffer } = await generateDocx(snapshot)
  const validation = await validateDocxBuffer(buffer)
  assert.equal(validation.valid, true)
})

test('validateDocxBuffer rejects garbage input instead of pretending it is a valid document', async () => {
  const garbage = Buffer.from('this is not a docx file at all')
  const result = await validateDocxBuffer(garbage)
  assert.equal(result.valid, false)
  assert.ok(result.errors.length > 0)
})
