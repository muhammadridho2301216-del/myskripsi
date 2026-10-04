import { diffText, type DiffResult } from './diff'
import { newCitationKeys } from './citations'
import type { AIActionType, AIProvenance } from './model'
import { clip, hashText, newId, redactSecrets } from './text'

/** Actions that propose replacement text (and therefore need preview + apply). */
export const rewriteActions: ReadonlySet<AIActionType> = new Set<AIActionType>(['improve-clarity'])
/** Actions that only return observations and can never change the document. */
export const commentaryActions: ReadonlySet<AIActionType> = new Set<AIActionType>([
  'critique-argument',
  'find-unsupported-claims',
  'check-terminology',
])

export const actionLabels: Record<AIActionType, string> = {
  'improve-clarity': 'Perjelas tulisan',
  'critique-argument': 'Kritik argumen',
  'find-unsupported-claims': 'Cari klaim tanpa dukungan',
  'check-terminology': 'Periksa konsistensi istilah',
}

export type SuggestionWarningCode = 'new-citations' | 'new-figures' | 'much-shorter' | 'much-longer' | 'no-change'
export interface SuggestionWarning { code: SuggestionWarningCode, message: string }

export interface Suggestion {
  id: string
  documentId: string
  actionType: AIActionType
  /** Hash of the FULL document text the suggestion was generated from. */
  baseHash: string
  range: { start: number, end: number }
  originalSegment: string
  proposedSegment: string
  diff: DiffResult
  warnings: SuggestionWarning[]
  provenance: AIProvenance
  createdAt: string
}

const FIGURE = /\d+(?:[.,]\d+)?\s?%?/g

function figuresIn(text: string): Set<string> {
  return new Set((text.match(FIGURE) ?? []).map(value => value.replace(/\s/g, '')))
}

/**
 * Models sometimes wrap output in a code fence or add a preamble line. We only
 * strip a surrounding fence; anything else is left visible in the diff so the
 * author decides.
 */
export function cleanRewriteOutput(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/)
  return (fenced ? fenced[1] : trimmed).trim()
}

export function detectSuggestionWarnings(original: string, proposed: string): SuggestionWarning[] {
  const warnings: SuggestionWarning[] = []
  if (original.trim() === proposed.trim()) {
    warnings.push({ code: 'no-change', message: 'AI tidak mengusulkan perubahan.' })
    return warnings
  }
  const addedCitations = newCitationKeys(original, proposed)
  if (addedCitations.length) {
    warnings.push({
      code: 'new-citations',
      message: `AI menambahkan ${addedCitations.length} sitasi baru. Sitasi dari AI tidak dianggap benar sebelum sumbernya Anda verifikasi.`,
    })
  }
  const before = figuresIn(original)
  const newFigures = [...figuresIn(proposed)].filter(value => !before.has(value))
  if (newFigures.length) {
    warnings.push({
      code: 'new-figures',
      message: `Angka baru muncul dalam saran (${newFigures.slice(0, 4).join(', ')}). Pastikan ada sumbernya.`,
    })
  }
  if (original.length > 400 && proposed.length < original.length * 0.5) {
    warnings.push({ code: 'much-shorter', message: 'Hasil jauh lebih pendek dari teks asli; mungkin ada bagian yang hilang atau terpotong.' })
  }
  if (proposed.length > original.length * 1.6 && proposed.length - original.length > 200) {
    warnings.push({ code: 'much-longer', message: 'Hasil jauh lebih panjang dari teks asli; periksa klaim atau isi tambahan.' })
  }
  return warnings
}

export function buildSuggestion(input: {
  documentId: string
  content: string
  range: { start: number, end: number }
  proposedSegment: string
  actionType: AIActionType
  provider: string
  model: string
  instruction?: string
  now?: Date
}): Suggestion {
  const { content, range } = input
  if (range.start < 0 || range.end > content.length || range.start >= range.end) {
    throw new RangeError('Rentang teks tidak valid.')
  }
  const originalSegment = content.slice(range.start, range.end)
  const proposedSegment = cleanRewriteOutput(input.proposedSegment)
  const id = newId('sug')
  return {
    id,
    documentId: input.documentId,
    actionType: input.actionType,
    baseHash: hashText(content),
    range,
    originalSegment,
    proposedSegment,
    diff: diffText(originalSegment, proposedSegment),
    warnings: detectSuggestionWarnings(originalSegment, proposedSegment),
    provenance: {
      provider: input.provider,
      model: input.model,
      actionType: input.actionType,
      instruction: input.instruction ? clip(redactSecrets(input.instruction), 300) : undefined,
      suggestionId: id,
    },
    createdAt: (input.now ?? new Date()).toISOString(),
  }
}

export function applySuggestionToText(content: string, suggestion: Suggestion): string {
  return content.slice(0, suggestion.range.start) + suggestion.proposedSegment + content.slice(suggestion.range.end)
}
