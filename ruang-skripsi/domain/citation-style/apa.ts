import type { BibliographySource } from './types'
import { clip } from '../writing/text'

/**
 * APA 7th-ish formatting. Deliberately simplified (prototype, single
 * author/organization, no edition/volume handling) but never fabricates a
 * missing field — "t.t." (tanpa tanggal) and "[URL tidak tersedia]" are
 * explicit placeholders, not guesses.
 */

function authorOrTitle(source: BibliographySource): string {
  return source.author?.trim() || clip(source.title, 60)
}

export function apaInText(source: BibliographySource): string {
  const who = source.author?.trim() || clip(source.title, 40)
  const year = source.year?.trim() || 't.t.'
  return `(${who}, ${year})`
}

export function apaBibliographyEntry(source: BibliographySource): string {
  const year = source.year?.trim() || 't.t.'
  const title = source.title.trim() || '[Judul tidak tersedia]'
  const url = source.url?.trim()
  if (source.author?.trim()) {
    return `${source.author.trim()} (${year}). ${title}.${url ? ` Diakses dari ${url}` : ''}`
  }
  return `${title}. (${year}).${url ? ` Diakses dari ${url}` : ''}`
}

export function apaSortKey(source: BibliographySource): string {
  return authorOrTitle(source).toLowerCase()
}
