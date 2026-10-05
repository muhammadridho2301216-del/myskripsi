/**
 * Model discovery cache (SUBTASK-11.08.05/07). The /api/ai/models endpoint
 * (server/api/ai/models.post.ts) hits the provider's live API every call
 * today; this cache lets a server route avoid refetching within a TTL
 * window and lets the UI show "diperbarui 2 menit lalu" instead of nothing.
 *
 * Deliberately in-memory (like server/utils/rateLimit.ts's counter map,
 * the existing pattern in this codebase) rather than backed by Appwrite —
 * discovery results are cheap to recompute and not worth a database
 * round-trip or cross-instance consistency concern for a prototype.
 */

export interface DiscoveredModel {
  id: string
  name: string
}

export interface DiscoveryCacheEntry {
  models: DiscoveredModel[]
  source: 'endpoint' | 'native' | 'curated' | 'manual'
  fetchedAt: number
}

const DEFAULT_TTL_MS = 10 * 60 * 1000
const cache = new Map<string, DiscoveryCacheEntry>()

function cacheKey(provider: string, apiKeyFingerprint: string): string {
  return `${provider}:${apiKeyFingerprint}`
}

/**
 * Callers must pass a fingerprint of the credential (never the raw key) —
 * see domain/writing/text.ts#hashText for the hashing helper already used
 * elsewhere in this codebase for exactly this "don't store the secret
 * itself" reason.
 */
export function getCachedModels(provider: string, apiKeyFingerprint: string, ttlMs = DEFAULT_TTL_MS): DiscoveryCacheEntry | null {
  const entry = cache.get(cacheKey(provider, apiKeyFingerprint))
  if (!entry) return null
  if (Date.now() - entry.fetchedAt > ttlMs) {
    cache.delete(cacheKey(provider, apiKeyFingerprint))
    return null
  }
  return entry
}

export function setCachedModels(provider: string, apiKeyFingerprint: string, models: DiscoveredModel[], source: DiscoveryCacheEntry['source']): void {
  cache.set(cacheKey(provider, apiKeyFingerprint), { models, source, fetchedAt: Date.now() })
}

/** Handles empty/partial listings (SUBTASK-11.08.06): never caches a transient empty result. */
export function setCachedModelsIfNonEmpty(provider: string, apiKeyFingerprint: string, models: DiscoveredModel[], source: DiscoveryCacheEntry['source']): void {
  if (models.length === 0) return
  setCachedModels(provider, apiKeyFingerprint, models, source)
}

export function clearDiscoveryCache(): void {
  cache.clear()
}
