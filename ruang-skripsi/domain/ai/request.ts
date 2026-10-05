/**
 * Normalized AI request/response contract (TASK-11.01). Every provider
 * adapter in domain/ai/adapters/ speaks this shape in and out; server
 * routes (server/api/ai.post.ts, server/api/ai/models.post.ts) convert
 * to/from provider-native JSON at the edges, never in the middle of
 * business logic. This is what lets ai.post.ts stay protocol-agnostic.
 */

export interface NormalizedMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface NormalizedToolDef {
  name: string
  description: string
  /** JSON Schema for the tool's input. */
  parameters: Record<string, unknown>
}

export interface NormalizedThinkingRequest {
  enabled?: boolean
  level?: string
  budgetTokens?: number
}

export interface NormalizedAIRequest {
  model: string
  system?: string
  messages: NormalizedMessage[]
  temperature?: number
  maxOutputTokens?: number
  tools?: NormalizedToolDef[]
  thinking?: NormalizedThinkingRequest
}

export interface NormalizedUsage {
  inputTokens: number
  outputTokens: number
  /** Present only when the provider reports a separate reasoning/thinking token count. */
  reasoningTokens?: number
}

export interface NormalizedToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface NormalizedAIResponse {
  text: string
  usage: NormalizedUsage | null
  toolCalls: NormalizedToolCall[]
  /** Raw provider finish reason, kept for debugging; not interpreted by callers. */
  rawFinishReason?: string
}

/**
 * Streaming event schema (SUBTASK-11.01.03). Not every adapter in this
 * batch implements streaming (today's /api/ai endpoint is request/response
 * only), but the shape is defined now so a future streaming adapter has a
 * contract to target instead of inventing one per provider.
 */
export type NormalizedStreamEvent =
  | { type: 'text-delta', text: string }
  | { type: 'tool-call', call: NormalizedToolCall }
  | { type: 'usage', usage: NormalizedUsage }
  | { type: 'done', rawFinishReason?: string }
  | { type: 'error', error: NormalizedAIError }

/**
 * Error normalization (SUBTASK-11.01.05). Every adapter's parseError must
 * return one of these categories so the UI can react consistently
 * (e.g. 'auth' -> prompt to re-enter API key, 'rate-limit' -> show retry
 * timing) instead of showing a different message shape per provider.
 */
export type NormalizedErrorCategory =
  | 'auth'
  | 'rate-limit'
  | 'invalid-request'
  | 'model-not-found'
  | 'content-filtered'
  | 'provider-unavailable'
  | 'unknown'

export class NormalizedAIError extends Error {
  constructor(
    public readonly category: NormalizedErrorCategory,
    message: string,
    public readonly httpStatus: number,
    public readonly providerMessage?: string,
  ) {
    super(message)
    this.name = 'NormalizedAIError'
  }
}

/**
 * Cancellation contract (SUBTASK-11.01.06): every adapter call takes a
 * standard AbortSignal rather than a provider-specific cancel token, so
 * callers (server routes, future streaming UI) have one cancellation
 * mechanism regardless of which provider is in use.
 */
export interface AdapterCallOptions {
  signal: AbortSignal
}
