import { NormalizedAIError, type NormalizedAIResponse } from '../request'
import type { HttpRequestSpec, ProviderAdapter } from './types'

export function createGoogleAdapter(): ProviderAdapter {
  return {
    buildHttpRequest({ request, apiKey, accessToken, baseUrl }): HttpRequestSpec {
      const model = request.model.replace(/^models\//, '')
      const contents = request.messages
        .filter(message => message.role !== 'system')
        .map(message => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] }))
      const body: Record<string, unknown> = {
        contents,
        ...(request.system ? { systemInstruction: { parts: [{ text: request.system }] } } : {}),
        generationConfig: {
          ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
          maxOutputTokens: request.maxOutputTokens ?? 1800,
        },
      }
      if (request.tools?.length) {
        body.tools = [{
          functionDeclarations: request.tools.map(tool => ({ name: tool.name, description: tool.description, parameters: tool.parameters })),
        }]
      }
      return {
        url: `${baseUrl.replace(/\/$/, '')}/models/${encodeURIComponent(model)}:generateContent`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-goog-api-key': apiKey } : { Authorization: `Bearer ${accessToken ?? ''}` }),
        },
        body: JSON.stringify(body),
      }
    },

    parseHttpResponse(body: any): NormalizedAIResponse {
      const candidate = body?.candidates?.[0]
      const parts = candidate?.content?.parts ?? []
      const text = parts.filter((part: any) => typeof part.text === 'string').map((part: any) => part.text).join('\n')
      const toolCalls = parts
        .filter((part: any) => part.functionCall)
        .map((part: any, index: number) => ({
          id: `call_${index}`,
          name: part.functionCall.name,
          arguments: part.functionCall.args ?? {},
        }))
      return {
        text,
        usage: body?.usageMetadata
          ? {
              inputTokens: body.usageMetadata.promptTokenCount ?? 0,
              outputTokens: body.usageMetadata.candidatesTokenCount ?? 0,
              reasoningTokens: body.usageMetadata.thoughtsTokenCount,
            }
          : null,
        toolCalls,
        rawFinishReason: candidate?.finishReason,
      }
    },

    parseHttpError(status, body: any) {
      const providerMessage = typeof body === 'string' ? body : body?.error?.message
      const statusText = body?.error?.status
      if (status === 401 || status === 403 || statusText === 'PERMISSION_DENIED' || statusText === 'UNAUTHENTICATED') {
        return new NormalizedAIError('auth', 'API key atau akses Google tidak valid.', status, providerMessage)
      }
      if (status === 429 || statusText === 'RESOURCE_EXHAUSTED') {
        return new NormalizedAIError('rate-limit', 'Terlalu banyak permintaan ke Google. Coba lagi nanti.', status, providerMessage)
      }
      if (status === 404 || statusText === 'NOT_FOUND') {
        return new NormalizedAIError('model-not-found', 'Model Google tidak ditemukan.', status, providerMessage)
      }
      if (statusText === 'INVALID_ARGUMENT' || status === 400) {
        return new NormalizedAIError('invalid-request', 'Permintaan ditolak Google karena tidak valid.', status, providerMessage)
      }
      if (status >= 500 || statusText === 'UNAVAILABLE') {
        return new NormalizedAIError('provider-unavailable', 'Google sedang tidak dapat diakses.', status, providerMessage)
      }
      return new NormalizedAIError('unknown', 'Google menolak permintaan.', status, providerMessage)
    },
  }
}
