/**
 * Thin wrapper around POST /api/ai so writing-workspace components don't
 * duplicate the request shape already used by the AI Lab in pages/app.vue.
 */

export interface AiCompletionProvider {
  type: string
  apiKey: string
  model: string
  baseUrl: string
  temperature: number
}

export interface AiCompletionThinking {
  enabled: boolean
  level: string
  budgetTokens: number
}

export async function requestAICompletion(input: {
  provider: AiCompletionProvider
  thinking: AiCompletionThinking
  system: string
  prompt: string
}): Promise<string> {
  const result = await $fetch<{ text: string }>('/api/ai', {
    method: 'POST',
    body: {
      provider: input.provider.type,
      apiKey: input.provider.apiKey,
      model: input.provider.model,
      baseUrl: input.provider.baseUrl,
      temperature: input.provider.temperature,
      thinking: {
        enabled: input.thinking.enabled,
        level: input.thinking.level,
        budgetTokens: input.thinking.budgetTokens,
      },
      system: input.system,
      prompt: input.prompt,
    },
  })
  return result.text
}

export function describeAiError(error: any): string {
  return error?.data?.statusMessage || error?.statusMessage || 'Permintaan ke AI gagal. Periksa koneksi provider.'
}
