import { NormalizedAIError, type NormalizedAIResponse } from '../request'
import type { HttpRequestSpec, ProviderAdapter } from './types'

/**
 * Shared by OpenAI, OpenRouter, DeepSeek, Groq, Mistral, Together,
 * Fireworks, Cerebras, xAI, and the generic "custom" OpenAI-compatible
 * connector — they all speak the /chat/completions shape. Thinking/
 * reasoning parameter mapping differs by capability mode (handled by the
 * caller via `extraBody`, since the mapping depends on resolveCapabilities
 * which lives outside this adapter to avoid a circular import).
 */
export function createOpenAICompatibleAdapter(): ProviderAdapter {
  return {
    buildHttpRequest({ request, apiKey, baseUrl }): HttpRequestSpec {
      const messages = [
        ...(request.system ? [{ role: 'system', content: request.system }] : []),
        ...request.messages.map(message => ({ role: message.role, content: message.content })),
      ]
      const body: Record<string, unknown> = {
        model: request.model,
        messages,
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
        ...(request.maxOutputTokens !== undefined ? { max_tokens: request.maxOutputTokens } : {}),
      }
      if (request.tools?.length) {
        body.tools = request.tools.map(tool => ({
          type: 'function',
          function: { name: tool.name, description: tool.description, parameters: tool.parameters },
        }))
      }
      return {
        url: `${baseUrl.replace(/\/$/, '')}/chat/completions`,
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey ?? ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    },

    parseHttpResponse(body: any): NormalizedAIResponse {
      const choice = body?.choices?.[0]
      const message = choice?.message
      const toolCalls = (message?.tool_calls ?? []).map((call: any) => ({
        id: call.id,
        name: call.function?.name,
        arguments: safeParseJsonObject(call.function?.arguments),
      }))
      return {
        text: message?.content ?? '',
        usage: body?.usage
          ? {
              inputTokens: body.usage.prompt_tokens ?? 0,
              outputTokens: body.usage.completion_tokens ?? 0,
              reasoningTokens: body.usage.completion_tokens_details?.reasoning_tokens,
            }
          : null,
        toolCalls,
        rawFinishReason: choice?.finish_reason,
      }
    },

    parseHttpError(status, body: any) {
      const providerMessage = typeof body === 'string' ? body : body?.error?.message
      const code = typeof body === 'object' ? body?.error?.code ?? body?.error?.type : undefined
      if (status === 401 || status === 403 || code === 'invalid_api_key') {
        return new NormalizedAIError('auth', 'API key tidak valid atau tidak memiliki akses.', status, providerMessage)
      }
      if (status === 429) {
        return new NormalizedAIError('rate-limit', 'Terlalu banyak permintaan ke provider. Coba lagi nanti.', status, providerMessage)
      }
      if (status === 404 || code === 'model_not_found') {
        return new NormalizedAIError('model-not-found', 'Model tidak ditemukan pada provider ini.', status, providerMessage)
      }
      if (status === 400) {
        return new NormalizedAIError('invalid-request', 'Permintaan ditolak provider karena tidak valid.', status, providerMessage)
      }
      if (status >= 500) {
        return new NormalizedAIError('provider-unavailable', 'Provider sedang tidak dapat diakses.', status, providerMessage)
      }
      return new NormalizedAIError('unknown', 'Provider menolak permintaan.', status, providerMessage)
    },
  }
}

function safeParseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string') return {}
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}
