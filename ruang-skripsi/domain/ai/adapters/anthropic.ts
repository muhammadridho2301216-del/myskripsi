import { NormalizedAIError, type NormalizedAIResponse } from '../request'
import type { HttpRequestSpec, ProviderAdapter } from './types'

export function createAnthropicAdapter(): ProviderAdapter {
  return {
    buildHttpRequest({ request, apiKey, baseUrl }): HttpRequestSpec {
      const body: Record<string, unknown> = {
        model: request.model,
        max_tokens: request.maxOutputTokens ?? 1800,
        messages: request.messages
          .filter(message => message.role !== 'system')
          .map(message => ({ role: message.role, content: message.content })),
        ...(request.system ? { system: request.system } : {}),
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      }
      if (request.tools?.length) {
        body.tools = request.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.parameters,
        }))
      }
      if (request.thinking?.budgetTokens) {
        body.thinking = { type: 'enabled', budget_tokens: request.thinking.budgetTokens }
      }
      return {
        url: `${baseUrl.replace(/\/$/, '')}/messages`,
        method: 'POST',
        headers: {
          'x-api-key': apiKey ?? '',
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    },

    parseHttpResponse(body: any): NormalizedAIResponse {
      const blocks = Array.isArray(body?.content) ? body.content : []
      const text = blocks.filter((part: any) => part.type === 'text').map((part: any) => part.text).join('\n')
      const toolCalls = blocks
        .filter((part: any) => part.type === 'tool_use')
        .map((part: any) => ({ id: part.id, name: part.name, arguments: part.input ?? {} }))
      return {
        text,
        usage: body?.usage
          ? { inputTokens: body.usage.input_tokens ?? 0, outputTokens: body.usage.output_tokens ?? 0 }
          : null,
        toolCalls,
        rawFinishReason: body?.stop_reason,
      }
    },

    parseHttpError(status, body: any) {
      const providerMessage = typeof body === 'string' ? body : body?.error?.message
      const errorType = body?.error?.type
      if (status === 401 || errorType === 'authentication_error') {
        return new NormalizedAIError('auth', 'API key Anthropic tidak valid.', status, providerMessage)
      }
      if (status === 429 || errorType === 'rate_limit_error') {
        return new NormalizedAIError('rate-limit', 'Terlalu banyak permintaan ke Anthropic. Coba lagi nanti.', status, providerMessage)
      }
      if (status === 404 || errorType === 'not_found_error') {
        return new NormalizedAIError('model-not-found', 'Model Anthropic tidak ditemukan.', status, providerMessage)
      }
      if (status === 400 || errorType === 'invalid_request_error') {
        return new NormalizedAIError('invalid-request', 'Permintaan ditolak Anthropic karena tidak valid.', status, providerMessage)
      }
      if (status >= 500 || errorType === 'overloaded_error') {
        return new NormalizedAIError('provider-unavailable', 'Anthropic sedang tidak dapat diakses.', status, providerMessage)
      }
      return new NormalizedAIError('unknown', 'Anthropic menolak permintaan.', status, providerMessage)
    },
  }
}
