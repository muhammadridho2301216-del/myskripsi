/**
 * Best-effort extraction of "Author · Year" out of the free-text `meta`
 * string the journal search UI already stores (see pages/app.vue
 * `journals.value = result.sources.map(... meta: [author, publishedDate]...)`
 * and server/api/research/search.post.ts). Never invents a value: a part is
 * only accepted as a year if it is exactly four digits, and as an author
 * only if it isn't itself a plausible year or empty.
 */

const YEAR = /^\d{4}$/

export function parseSourceMeta(meta: string | undefined): { author?: string, year?: string } {
  if (!meta) return {}
  const parts = meta.split('·').map(part => part.trim()).filter(Boolean)
  let author: string | undefined
  let year: string | undefined
  for (const part of parts) {
    const yearMatch = part.match(/\b\d{4}\b/)
    if (!year && YEAR.test(part)) {
      year = part
      continue
    }
    if (!year && yearMatch) year = yearMatch[0]
    if (!author && !YEAR.test(part) && part.toLowerCase() !== 'metadata dari hasil pencarian') author = part
  }
  const result: { author?: string, year?: string } = {}
  if (author) result.author = author
  if (year) result.year = year
  return result
}
