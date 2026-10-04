export interface ResearchSource {
  id: string
  title: string
  url: string
  author?: string
  publishedDate?: string
  snippet?: string
  doi?: string
  evidenceLevel: 'metadata' | 'snippet' | 'abstract' | 'full-text'
}

export function normalizeDoi(value?: string | null) {
  if (!value) return null
  const decoded = decodeURIComponent(value).trim().toLowerCase()
  const match = decoded.match(/10\.\d{4,9}\/[-._;()/:a-z0-9]+/i)
  return match?.[0]?.replace(/[.)\],;]+$/, '') ?? null
}

export function canonicalSourceKey(source: Pick<ResearchSource, 'url' | 'title' | 'doi'>) {
  const doi = normalizeDoi(source.doi || source.url)
  if (doi) return `doi:${doi}`
  try {
    const url = new URL(source.url)
    url.hash = ''
    ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'].forEach(key => url.searchParams.delete(key))
    return `url:${url.toString().replace(/\/$/, '').toLowerCase()}`
  } catch {
    return `title:${source.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()}`
  }
}

export function deduplicateSources(sources: ResearchSource[]) {
  const seen = new Set<string>()
  return sources.filter(source => {
    const key = canonicalSourceKey(source)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}