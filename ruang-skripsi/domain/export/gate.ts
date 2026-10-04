import { flattenOutline } from '../../server/utils/outline/engine'
import { extractCitations, summarizeCitations } from '../writing/citations'
import { buildCitationOrder, buildBibliography } from '../citation-style/bibliography'
import type { ExportSnapshot, ExportWarning } from './model'

/**
 * Final Blueprint gate (PRD §1.8 "Draft dan Final Blueprint DOCX export").
 * Draft export always succeeds — this function only decides whether a
 * FINAL export may proceed, and always returns the full warning list either
 * way so the UI can show "N warning" even for drafts.
 */
export function evaluateExportReadiness(snapshot: ExportSnapshot): { allowed: boolean, warnings: ExportWarning[] } {
  const warnings: ExportWarning[] = []
  const sectionNodes = flattenOutline(snapshot.outlineNodes).filter(node => node.level > 1)
  const byNodeId = new Map(snapshot.sections.map(doc => [doc.nodeId, doc]))

  for (const node of sectionNodes) {
    const doc = byNodeId.get(node.id)
    const content = doc?.content ?? ''
    if (!content.trim()) {
      warnings.push({ code: 'empty-section', severity: snapshot.kind === 'final-blueprint' ? 'critical' : 'notice', message: `"${node.title}" belum berisi tulisan.`, nodeId: node.id })
      continue
    }
    if (doc && node.targetWords > 0 && doc.wordCount < node.targetWords * 0.6) {
      warnings.push({ code: 'below-target-words', severity: 'notice', message: `"${node.title}" baru ${doc.wordCount} dari ${node.targetWords} target kata.`, nodeId: node.id })
    }
    const refs = extractCitations(content, snapshot.sources)
    for (const ref of refs) {
      if (ref.state === 'missing') {
        warnings.push({ code: 'missing-citation-source', severity: 'critical', message: `"${node.title}" menyitasi sumber yang tidak ada di perpustakaan (${ref.label}).`, nodeId: node.id })
      } else if (ref.state === 'unverified') {
        warnings.push({ code: 'unverified-citation', severity: snapshot.kind === 'final-blueprint' ? 'critical' : 'notice', message: `"${node.title}" menyitasi sumber yang belum diverifikasi (${ref.source?.title}).`, nodeId: node.id, sourceId: ref.source?.id })
      }
    }
    if (snapshot.aiAssistedSectionIds.includes(node.id)) {
      warnings.push({ code: 'ai-assisted-section', severity: 'notice', message: `"${node.title}" mengandung teks hasil saran AI yang telah diterapkan.`, nodeId: node.id })
    }
  }

  const citedIds = buildCitationOrder(sectionNodes.map(node => byNodeId.get(node.id)?.content ?? ''), snapshot.sources)
  const bibliography = buildBibliography(citedIds, snapshot.sources, snapshot.citationStyle)
  for (const entry of bibliography) {
    if (!entry.complete) {
      warnings.push({
        code: 'incomplete-bibliography-entry',
        severity: 'notice',
        message: `Entri bibliografi tidak lengkap (${entry.missing.join(', ')}): ${entry.full}`,
        sourceId: entry.sourceId,
      })
    }
  }

  if (snapshot.kind === 'final-blueprint') {
    if (snapshot.readiness && !snapshot.readiness.readyForFinalExport) {
      warnings.push({ code: 'outline-not-ready', severity: 'critical', message: 'Kerangka belum memenuhi syarat kritis (lihat tab Kerangka).' })
    }
    if (snapshot.consistency && !snapshot.consistency.criticalPassed) {
      warnings.push({ code: 'consistency-not-ready', severity: 'critical', message: 'Pemeriksaan konsistensi kritis belum terpenuhi.' })
    }
  }

  const criticalCount = warnings.filter(item => item.severity === 'critical').length
  return {
    allowed: snapshot.kind === 'draft' || criticalCount === 0,
    warnings,
  }
}

export function citationSummaryForSnapshot(snapshot: ExportSnapshot) {
  const sectionNodes = flattenOutline(snapshot.outlineNodes).filter(node => node.level > 1)
  const byNodeId = new Map(snapshot.sections.map(doc => [doc.nodeId, doc]))
  const allRefs = sectionNodes.flatMap(node => extractCitations(byNodeId.get(node.id)?.content ?? '', snapshot.sources))
  return summarizeCitations(allRefs)
}
