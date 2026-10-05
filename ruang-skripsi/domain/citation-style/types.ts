import type { CitationSource } from '../writing/citations'

export type CitationStyle = 'apa' | 'ieee'

export const citationStyleLabels: Record<CitationStyle, string> = {
  apa: 'APA 7th',
  ieee: 'IEEE',
}

/**
 * Everything the citation formatters need. Extends the lightweight
 * CitationSource already used by the writing editor (Batch 4) rather than
 * replacing it, so the same saved-source objects flow through unchanged.
 */
export interface BibliographySource extends CitationSource {
  author?: string
  /** Four-digit year as a string, or undefined when unknown. */
  year?: string
  evidenceLevel?: string
}

export type MissingField = 'author' | 'year' | 'url'

export interface BibliographyEntry {
  sourceId: string
  /** 1-based order of first citation in the manuscript. Used by IEEE numbering. */
  order: number
  inText: string
  full: string
  complete: boolean
  missing: MissingField[]
  verified: boolean
}
