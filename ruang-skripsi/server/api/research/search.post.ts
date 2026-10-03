import { deduplicateSources, normalizeDoi, type ResearchSource } from '../../utils/research/sources'
import { enforceMemoryRateLimit } from '../../utils/rateLimit'
import { searchPrices } from '../../utils/ai/pricing'

interface SearchRequest {
  query: string
  numResults?: number
  startPublishedDate?: string
  includeDomains?: string[]
  openAccessOnly?: boolean
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const config = useRuntimeConfig(event)
  if (!config.exaApiKey) throw createError({ statusCode: 503, statusMessage: 'Exa Search belum dikonfigurasi.' })

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  enforceMemoryRateLimit(`research-search:${ip}`, 20, 60_000)

  const body = await readBody<SearchRequest>(event)
  const query = body?.query?.trim()
  if (!query || query.length < 4) throw createError({ statusCode: 400, statusMessage: 'Query pencarian terlalu pendek.' })
  if (query.length > 500) throw createError({ statusCode: 413, statusMessage: 'Query pencarian terlalu panjang.' })

  const numResults = Math.max(1, Math.min(10, Number(body.numResults || 10)))
  const includeDomains = (body.includeDomains ?? [])
    .map(value => value.trim().toLowerCase())
    .filter(value => /^[a-z0-9.-]+$/.test(value))
    .slice(0, 10)

  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(25_000),
    headers: {
      Authorization: `Bearer ${config.exaApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      type: 'instant',
      numResults,
      ...(body.startPublishedDate ? { startPublishedDate: body.startPublishedDate } : {}),
      ...(includeDomains.length ? { includeDomains } : {}),
    }),
  })
  if (!response.ok) {
    const providerMessage = (await response.text()).slice(0, 500)
    throw createError({
      statusCode: response.status === 429 ? 429 : 502,
      statusMessage: `Search provider menolak permintaan (${response.status}).`,
      data: { providerMessage },
    })
  }

  const data = await response.json() as any
  const sources: ResearchSource[] = (data.results ?? []).map((item: any) => ({
    id: String(item.id || item.url),
    title: String(item.title || 'Tanpa judul'),
    url: String(item.url),
    author: item.author ? String(item.author) : undefined,
    publishedDate: item.publishedDate ? String(item.publishedDate) : undefined,
    snippet: item.text ? String(item.text).slice(0, 800) : undefined,
    doi: normalizeDoi(item.url),
    evidenceLevel: item.text ? 'snippet' : 'metadata',
  }))

  return {
    query,
    sources: deduplicateSources(sources),
    provenance: {
      provider: 'exa',
      searchType: 'instant',
      contentsFetched: false,
      estimatedSearchCostUsd: searchPrices.exaInstantPerRequestUsd,
    },
    policy: {
      message: 'Hasil berupa link dan metadata. Isi penuh tidak diambil pada tahap pencarian.',
      openAccessRequested: Boolean(body.openAccessOnly),
    },
  }
})