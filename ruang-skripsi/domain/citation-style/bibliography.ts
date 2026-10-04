import { citationKey, extractCitations } from '../writing/citations'
import { apaBibliographyEntry, apaInText, apaSortKey } from './apa'
import { ieeeBibliographyEntry, ieeeInText } from './ieee'
import type { BibliographyEntry, BibliographySource, CitationStyle, MissingField } from './types'

/**
 * Scans documents in a fixed order (the outline order the caller passes in)
 * and returns source ids in the order each is FIRST cited. IEEE numbering
 * must follow this; APA ignores it and sorts alphabetically instead.
 */
export function buildCitationOrder(orderedTexts: string[], sources: BibliographySource[]): string[] {
  const seen: string[] = []
  const known = new Set(seen)
  for (const text of orderedTexts) {
    for (const ref of extractCitations(text, sources)) {
      if (ref.source && !known.has(ref.source.id)) {
        known.add(ref.source.id)
        seen.push(ref.source.id)
      }
    }
  }
  return seen
}

function missingFields(source: BibliographySource): MissingField[] {
  const missing: MissingField[] = []
  if (!source.author?.trim()) missing.push('author')
  if (!source.year?.trim()) missing.push('year')
  if (!source.url?.trim()) missing.push('url')
  return missing
}

/**
 * Builds one bibliography entry per cited source — sources that were never
 * actually referenced in the manuscript are left out, so the bibliography
 * never claims support for an idea that was not sourced in text.
 */
export function buildBibliography(
  citedSourceIds: string[],
  sources: BibliographySource[],
  style: CitationStyle,
): BibliographyEntry[] {
  const byId = new Map(sources.map(source => [source.id, source]))
  const cited = citedSourceIds.map(id => byId.get(id)).filter((source): source is BibliographySource => Boolean(source))

  const ordered = style === 'ieee'
    ? cited.map((source, index) => ({ source, order: index + 1 }))
    : [...cited]
      .sort((a, b) => apaSortKey(a).localeCompare(apaSortKey(b), 'id'))
      .map((source, index) => ({ source, order: index + 1 }))

  return ordered.map(({ source, order }) => {
    const missing = missingFields(source)
    return {
      sourceId: source.id,
      order,
      inText: style === 'ieee' ? ieeeInText(order) : apaInText(source),
      full: style === 'ieee' ? ieeeBibliographyEntry(source, order) : apaBibliographyEntry(source),
      complete: missing.length === 0,
      missing,
      verified: source.verified,
    }
  })
}

/** Looks up the in-text form for a specific citation key appearing in a document. */
export function inTextFor(entries: BibliographyEntry[], sourceId: string): string | null {
  return entries.find(entry => entry.sourceId === sourceId)?.inText ?? null
}

export { citationKey }
