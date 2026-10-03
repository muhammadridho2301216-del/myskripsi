export interface ModelPrice {
  provider: string
  model: string
  inputPerMillionUsd: number
  outputPerMillionUsd: number
  sourceDate: string
  note?: string
}

// Admin-curated snapshot. Never bill from this file without a reviewed effective date.
export const modelPrices: ModelPrice[] = [
  { provider: 'openai', model: 'gpt-6-luna', inputPerMillionUsd: 0.1, outputPerMillionUsd: 0.5, sourceDate: '2026-10-02', note: 'Standard short-context public price snapshot.' },
  { provider: 'openai', model: 'gpt-6.1-sol', inputPerMillionUsd: 2, outputPerMillionUsd: 10, sourceDate: '2026-10-02' },
  { provider: 'deepseek', model: 'deepseek-flash', inputPerMillionUsd: 0.3, outputPerMillionUsd: 1.2, sourceDate: '2026-10-02', note: 'Peak price; off-peak can be lower.' },
  { provider: 'google', model: 'gemini-3.5-flash-lite', inputPerMillionUsd: 0.3, outputPerMillionUsd: 2.5, sourceDate: '2026-10-02' },
  { provider: 'anthropic', model: 'claude-haiku-4.5', inputPerMillionUsd: 1, outputPerMillionUsd: 5, sourceDate: '2026-10-02' },
  { provider: 'anthropic', model: 'claude-sonnet-5.5', inputPerMillionUsd: 2, outputPerMillionUsd: 10, sourceDate: '2026-10-02' },
  { provider: 'together', model: 'Qwen3.8-Flash', inputPerMillionUsd: 0.09, outputPerMillionUsd: 0.28, sourceDate: '2026-10-02' },
]

export function estimateModelCost(provider: string, model: string, inputTokens: number, outputTokens: number) {
  const price = modelPrices.find(item => item.provider === provider && item.model === model)
  if (!price) return null
  return {
    estimatedUsd: (inputTokens / 1_000_000) * price.inputPerMillionUsd + (outputTokens / 1_000_000) * price.outputPerMillionUsd,
    price,
  }
}

export const searchPrices = {
  exaInstantPerRequestUsd: 0.004,
  exaFastPerRequestUsd: 0.007,
  exaContentsPerPageUsd: 0.001,
  effectiveDate: '2026-10-02',
}