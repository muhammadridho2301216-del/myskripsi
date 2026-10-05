/**
 * Response size limiting (SUBTASK-11.07.06). `safeProviderFetch` in
 * server/utils/network/safeEndpoint.ts already blocks redirects (limits
 * them to zero — SUBTASK-11.07.04/05 are satisfied by `redirect: 'error'`)
 * and applies a 70s timeout, but does not cap response body size — a
 * malicious or compromised "AI provider" endpoint could otherwise stream
 * an unbounded body at the server.
 *
 * This is a standalone reader rather than a change to safeProviderFetch's
 * signature, so adopting it in server/api/ai.post.ts and
 * server/api/ai/models.post.ts (both working since Batch 1) is a deliberate
 * follow-up, not bundled into this change.
 */

export class ResponseTooLargeError extends Error {
  constructor(public readonly limitBytes: number) {
    super(`Respons provider melebihi batas ${limitBytes} byte.`)
    this.name = 'ResponseTooLargeError'
  }
}

export async function readLimitedText(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return response.text()

  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel().catch(() => {})
      throw new ResponseTooLargeError(maxBytes)
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString('utf8')
}

export async function readLimitedJson<T = unknown>(response: Response, maxBytes: number): Promise<T> {
  const text = await readLimitedText(response, maxBytes)
  return JSON.parse(text) as T
}

/** Default cap for AI provider responses: generous for long completions, far below a DoS-scale payload. */
export const DEFAULT_PROVIDER_RESPONSE_LIMIT_BYTES = 10 * 1024 * 1024
