import type { NormalizedAIRequest, NormalizedAIResponse } from '../request'

/**
 * What every provider adapter must implement. `buildHttpRequest` and
 * `parseHttpResponse`/`parseHttpError` are pure functions (no fetch inside
 * them) so they can be unit-tested with fixture JSON instead of live HTTP
 * calls — see tests/aiAdapters.test.ts. The actual `fetch` call stays in
 * the server route, which also owns SSRF protection (safeProviderFetch).
 */
export interface HttpRequestSpec {
  url: string
  method: 'GET' | 'POST'
  headers: Record<string, string>
  body?: string
}

export interface ProviderAdapter {
  /** Builds the provider-native HTTP request for a normalized AI request. */
  buildHttpRequest(input: {
    request: NormalizedAIRequest
    apiKey?: string
    accessToken?: string
    baseUrl: string
  }): HttpRequestSpec

  /** Parses a successful provider HTTP response body into the normalized shape. */
  parseHttpResponse(body: unknown): NormalizedAIResponse

  /**
   * Classifies a non-2xx response. `status` is the HTTP status code;
   * `body` is the parsed JSON body when available, or the raw text
   * otherwise (providers are inconsistent about returning JSON on error).
   */
  parseHttpError(status: number, body: unknown): import('../request').NormalizedAIError
}
