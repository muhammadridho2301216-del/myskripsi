interface Counter {
  count: number
  resetAt: number
}

const counters = new Map<string, Counter>()

export function enforceMemoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = counters.get(key)
  if (!current || current.resetAt <= now) {
    counters.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  if (current.count >= limit) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Terlalu banyak permintaan. Coba lagi setelah beberapa saat.',
      data: { retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) },
    })
  }
  current.count += 1
}