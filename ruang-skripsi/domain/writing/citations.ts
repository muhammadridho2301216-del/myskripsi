import { hashText } from './text'
import type { Issue, SectionStatus } from './model'

/**
 * Citation placeholders are written as  [[cite:<key>|<short label>]].
 * The key is derived from the source id, so renaming a source never breaks the
 * link, and the label is display-only. Style formatting (APA/IEEE) and the
 * bibliography belong to Batch 5; this module only tracks *what is cited* and
 * *whether that citation can be trusted yet*.
 */

export interface CitationSource {
  id: string
  title: string
  url?: string
  verified: boolean
}

export type CitationState = 'verified' | 'unverified' | 'missing'

export interface CitationRef {
  key: string
  label: string
  raw: string
  index: number
  state: CitationState
  source?: CitationSource
}

const PLACEHOLDER = /\[\[cite:([A-Za-z0-9_-]+)(?:\|([^\]]*))?\]\]/g

export function citationKey(sourceId: string): string {
  return `src-${hashText(sourceId)}`
}

function sanitizeLabel(label: string): string {
  return label.replace(/[\][|\n\r]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 48)
}

export function buildCitationPlaceholder(source: CitationSource): string {
  const label = sanitizeLabel(source.title)
  return `[[cite:${citationKey(source.id)}${label ? `|${label}` : ''}]]`
}

export function extractCitations(text: string, sources: CitationSource[]): CitationRef[] {
  const byKey = new Map(sources.map(source => [citationKey(source.id), source]))
  const refs: CitationRef[] = []
  for (const match of text.matchAll(PLACEHOLDER)) {
    const key = match[1]
    const source = byKey.get(key)
    refs.push({
      key,
      label: match[2]?.trim() || source?.title || key,
      raw: match[0],
      index: match.index ?? 0,
      source,
      state: !source ? 'missing' : source.verified ? 'verified' : 'unverified',
    })
  }
  return refs
}

export interface CitationSummary {
  total: number
  verified: number
  unverified: number
  missing: number
  /** Distinct sources, deduplicated by key, each with its worst-case state. */
  distinct: CitationRef[]
}

export function summarizeCitations(refs: CitationRef[]): CitationSummary {
  const distinct = new Map<string, CitationRef>()
  for (const ref of refs) if (!distinct.has(ref.key)) distinct.set(ref.key, ref)
  const list = [...distinct.values()]
  return {
    total: refs.length,
    verified: list.filter(ref => ref.state === 'verified').length,
    unverified: list.filter(ref => ref.state === 'unverified').length,
    missing: list.filter(ref => ref.state === 'missing').length,
    distinct: list,
  }
}

export type PreviewSegment =
  | { kind: 'text', text: string }
  | { kind: 'cite', ref: CitationRef }

/** Splits text so a UI can render citation badges without using v-html. */
export function segmentWithCitations(text: string, sources: CitationSource[]): PreviewSegment[] {
  const refs = extractCitations(text, sources)
  const segments: PreviewSegment[] = []
  let cursor = 0
  for (const ref of refs) {
    if (ref.index > cursor) segments.push({ kind: 'text', text: text.slice(cursor, ref.index) })
    segments.push({ kind: 'cite', ref })
    cursor = ref.index + ref.raw.length
  }
  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) })
  return segments
}

/** Citation keys that appear in `after` but not in `before`. */
export function newCitationKeys(before: string, after: string): string[] {
  const existing = new Set([...before.matchAll(PLACEHOLDER)].map(match => match[1]))
  return [...new Set([...after.matchAll(PLACEHOLDER)].map(match => match[1]))].filter(key => !existing.has(key))
}

/* -------------------------------------------------------------------------- */
/* Evidence coverage                                                          */
/* -------------------------------------------------------------------------- */

export interface CoverageClaim { id: string, text: string, outlineNodeId?: string, sourceIds: string[] }
export interface CoverageResult { claimId: string, status: string }

export interface EvidenceCoverage {
  linkedClaims: number
  byStatus: Record<'unsupported' | 'weak' | 'supported' | 'conflicting', number>
  /** supported / linked, 0-100. Null when the section has no linked claims. */
  supportedPercent: number | null
  /** Sources attached through claims that are not yet cited in the text. */
  uncitedSources: CitationSource[]
}

export function evidenceCoverage(
  nodeId: string,
  text: string,
  claims: CoverageClaim[],
  results: CoverageResult[],
  sources: CitationSource[],
): EvidenceCoverage {
  const linked = claims.filter(claim => claim.outlineNodeId === nodeId)
  const byStatus = { unsupported: 0, weak: 0, supported: 0, conflicting: 0 }
  for (const claim of linked) {
    const status = (results.find(result => result.claimId === claim.id)?.status ?? 'unsupported') as keyof typeof byStatus
    byStatus[status in byStatus ? status : 'unsupported'] += 1
  }
  const citedKeys = new Set(extractCitations(text, sources).map(ref => ref.key))
  const linkedSourceIds = new Set(linked.flatMap(claim => claim.sourceIds))
  const uncitedSources = sources.filter(source => linkedSourceIds.has(source.id) && !citedKeys.has(citationKey(source.id)))
  return {
    linkedClaims: linked.length,
    byStatus,
    supportedPercent: linked.length ? Math.round((byStatus.supported / linked.length) * 100) : null,
    uncitedSources,
  }
}

/* -------------------------------------------------------------------------- */
/* Completion gate                                                            */
/* -------------------------------------------------------------------------- */

export interface CompletionContext {
  content: string
  wordCount: number
  targetWords: number
  sources: CitationSource[]
  /** AI-applied text the author has not acknowledged yet. */
  hasUnreviewedAI: boolean
  openRevisionCount: number
  coverage?: EvidenceCoverage
}

/**
 * Rules for moving a section to "Selesai". Blockers stop the change; warnings
 * are shown but do not. Moving to earlier statuses is never blocked.
 */
export function checkCompletion(context: CompletionContext): { allowed: boolean, blockers: Issue[], warnings: Issue[] } {
  const blockers: Issue[] = []
  const warnings: Issue[] = []
  const summary = summarizeCitations(extractCitations(context.content, context.sources))

  if (context.wordCount === 0) blockers.push({ code: 'empty', message: 'Bagian ini belum berisi tulisan.' })
  if (summary.unverified) {
    blockers.push({ code: 'unverified-citations', message: `${summary.unverified} sitasi masih merujuk sumber yang belum diverifikasi.` })
  }
  if (summary.missing) {
    blockers.push({ code: 'missing-citations', message: `${summary.missing} sitasi merujuk sumber yang tidak ada di perpustakaan.` })
  }
  if (context.hasUnreviewedAI) {
    blockers.push({ code: 'unreviewed-ai', message: 'Ada teks hasil saran AI yang belum Anda tinjau.' })
  }

  if (context.targetWords > 0 && context.wordCount > 0 && context.wordCount < context.targetWords * 0.8) {
    warnings.push({ code: 'below-target', message: `Baru ${context.wordCount} dari ${context.targetWords} kata target.` })
  }
  if (context.openRevisionCount > 0) {
    warnings.push({ code: 'open-revisions', message: `${context.openRevisionCount} revisi terkait belum selesai.` })
  }
  const weakClaims = context.coverage
    ? context.coverage.byStatus.unsupported + context.coverage.byStatus.weak + context.coverage.byStatus.conflicting
    : 0
  if (weakClaims > 0) {
    warnings.push({ code: 'weak-claims', message: `${weakClaims} klaim terkait belum didukung kuat.` })
  }
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function isForwardToComplete(from: SectionStatus, to: SectionStatus): boolean {
  return to === 'complete' && from !== 'complete'
}
