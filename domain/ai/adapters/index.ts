import { createAnthropicAdapter } from './anthropic'
import { createGoogleAdapter } from './google'
import { createOpenAICompatibleAdapter } from './openaiCompatible'
import type { ProviderAdapter } from './types'

export * from './types'

const adapters: Record<'openai' | 'anthropic' | 'google', ProviderAdapter> = {
  openai: createOpenAICompatibleAdapter(),
  anthropic: createAnthropicAdapter(),
  google: createGoogleAdapter(),
}

/** `protocol` matches ProviderDefinition.protocol from server/utils/ai/catalog.ts. */
export function getAdapterForProtocol(protocol: 'openai' | 'anthropic' | 'google'): ProviderAdapter {
  return adapters[protocol]
}
