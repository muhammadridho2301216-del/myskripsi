import type { BibliographySource } from './types'

/**
 * IEEE-style numeric citation. Numbering is driven by first-appearance order
 * in the manuscript (see bibliography.ts#buildCitationOrder), not alphabetic.
 */

export function ieeeInText(order: number): string {
  return `[${order}]`
}

export function ieeeBibliographyEntry(source: BibliographySource, order: number): string {
  const author = source.author?.trim() || 'Penulis tidak diketahui'
  const title = source.title.trim() || '[Judul tidak tersedia]'
  const year = source.year?.trim() || 't.t.'
  const url = source.url?.trim()
  return `[${order}] ${author}, "${title}," ${year}.${url ? ` [Online]. Available: ${url}` : ''}`
}
