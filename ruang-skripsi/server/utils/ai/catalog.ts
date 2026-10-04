export type ThinkingCapability =
  | { mode: 'unsupported' }
  | { mode: 'fixed' }
  | { mode: 'toggle'; defaultEnabled: boolean }
  | { mode: 'levels'; levels: string[]; defaultLevel: string }
  | { mode: 'budget'; minTokens: number; maxTokens: number; defaultTokens: number }
  | { mode: 'provider-native'; schema: string }

export interface ModelCapabilities {
  textInput: boolean
  imageInput: boolean
  fileInput: boolean
  streaming: boolean
  toolCalling: boolean
  structuredOutput: boolean
  maxContextTokens?: number
  maxOutputTokens?: number
  thinking: ThinkingCapability
}

export interface ProviderDefinition {
  id: string
  label: string
  protocol: 'openai' | 'anthropic' | 'google'
  defaultBaseUrl: string
  modelsPath?: string
  authentication: Array<'api-key' | 'oauth'>
  customBaseUrl: boolean
  status: 'available' | 'planned'
}

export const providerCatalog: ProviderDefinition[] = [
  { id: 'openai', label: 'OpenAI', protocol: 'openai', defaultBaseUrl: 'https://api.openai.com/v1', modelsPath: '/models', authentication: ['api-key'], customBaseUrl: false, status: 'available' },
  { id: 'anthropic', label: 'Anthropic', protocol: 'anthropic', defaultBaseUrl: 'https://api.anthropic.com/v1', modelsPath: '/models?limit=100', authentication: ['api-key'], customBaseUrl: false, status: 'available' },
  { id: 'google', label: 'Google Gemini', protocol: 'google', defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta', modelsPath: '/models?pageSize=1000', authentication: ['api-key', 'oauth'], customBaseUrl: false, status: 'available' },
  { id: 'openrouter', label: 'OpenRouter', protocol: 'openai', defaultBaseUrl: 'https://openrouter.ai/api/v1', modelsPath: '/models', authentication: ['api-key'], customBaseUrl: false, status: 'available' },
  { id: 'deepseek', label: 'DeepSeek', protocol: 'openai', defaultBaseUrl: 'https://api.deepseek.com', modelsPath: '/models', authentication: ['api-key'], customBaseUrl: false, status: 'available' },
  { id: 'groq', label: 'Groq', protocol: 'openai', defaultBaseUrl: 'https://api.groq.com/openai/v1', modelsPath: '/models', authentication: ['api-key'], customBaseUrl: false, status: 'available' },
  { id: 'mistral', label: 'Mistral', protocol: 'openai', defaultBaseUrl: 'https://api.mistral.ai/v1', modelsPath: '/models', authentication: ['api-key'], customBaseUrl: false, status: 'available' },
  { id: 'together', label: 'Together AI', protocol: 'openai', defaultBaseUrl: 'https://api.together.xyz/v1', modelsPath: '/models', authentication: ['api-key'], customBaseUrl: false, status: 'available' },
  { id: 'fireworks', label: 'Fireworks AI', protocol: 'openai', defaultBaseUrl: 'https://api.fireworks.ai/inference/v1', modelsPath: '/models', authentication: ['api-key'], customBaseUrl: false, status: 'available' },
  { id: 'cerebras', label: 'Cerebras', protocol: 'openai', defaultBaseUrl: 'https://api.cerebras.ai/v1', modelsPath: '/models', authentication: ['api-key'], customBaseUrl: false, status: 'available' },
  { id: 'xai', label: 'xAI', protocol: 'openai', defaultBaseUrl: 'https://api.x.ai/v1', modelsPath: '/models', authentication: ['api-key'], customBaseUrl: false, status: 'available' },
  { id: 'custom', label: 'OpenAI-compatible', protocol: 'openai', defaultBaseUrl: '', modelsPath: '/models', authentication: ['api-key'], customBaseUrl: true, status: 'available' },
  { id: 'azure-openai', label: 'Azure OpenAI', protocol: 'openai', defaultBaseUrl: '', authentication: ['api-key', 'oauth'], customBaseUrl: true, status: 'planned' },
  { id: 'vertex-ai', label: 'Google Vertex AI', protocol: 'google', defaultBaseUrl: '', authentication: ['oauth'], customBaseUrl: true, status: 'planned' },
  { id: 'bedrock', label: 'Amazon Bedrock', protocol: 'anthropic', defaultBaseUrl: '', authentication: ['api-key'], customBaseUrl: true, status: 'planned' },
]

export const conservativeCapabilities: ModelCapabilities = {
  textInput: true,
  imageInput: false,
  fileInput: false,
  streaming: true,
  toolCalling: false,
  structuredOutput: false,
  thinking: { mode: 'unsupported' },
}

export const curatedCapabilities: Record<string, Partial<ModelCapabilities>> = {
  'deepseek-flash': {
    imageInput: true,
    toolCalling: true,
    structuredOutput: true,
    maxContextTokens: 1_000_000,
    maxOutputTokens: 384_000,
    thinking: { mode: 'toggle', defaultEnabled: true },
  },
}

export const logicalModels = {
  'ruang-fast': {
    purpose: 'Metadata, klasifikasi, query, dan quick actions.',
    primary: 'openai:gpt-6-luna',
    fallbacks: ['deepseek:deepseek-flash'],
    dataClasses: ['public', 'academic-public'],
  },
  'ruang-research': {
    purpose: 'Sintesis, research gap, outline, dan consistency.',
    primary: 'openai:gpt-6.1-sol',
    fallbacks: ['anthropic:claude-sonnet-5.5'],
    dataClasses: ['public', 'academic-public', 'user-document'],
  },
  'ruang-builder': {
    purpose: 'Coding dan tool execution dalam sandbox.',
    primary: 'openai:gpt-5.3-codex',
    fallbacks: ['anthropic:claude-sonnet-5.5'],
    dataClasses: ['public', 'academic-public', 'sandbox-source'],
  },
} as const

export function getProvider(providerId: string) {
  return providerCatalog.find(item => item.id === providerId)
}

export function resolveCapabilities(modelId: string): ModelCapabilities {
  return { ...conservativeCapabilities, ...(curatedCapabilities[modelId] ?? {}) }
}