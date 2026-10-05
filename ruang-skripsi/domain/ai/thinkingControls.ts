import type { NormalizedThinkingRequest } from './request'
import type { ThinkingCapability } from '../../server/utils/ai/catalog'

/**
 * Runtime parameter validation for thinking controls (SUBTASK-12.03.07).
 * This is the single place that decides what thinking payload is actually
 * safe to send to a provider for a given model's resolved capability —
 * server/api/ai.post.ts should call this instead of re-deriving the same
 * if/else chain inline (it currently does so inline; see Batch 7 PR notes
 * for the follow-up to delegate to this function without touching the
 * working Batch 1-6 request flow in the same change).
 */
export function validateThinkingRequest(
  capability: ThinkingCapability,
  requested: NormalizedThinkingRequest | undefined,
): NormalizedThinkingRequest | undefined {
  if (!requested) return undefined
  switch (capability.mode) {
    case 'unsupported':
      return undefined
    case 'fixed':
      return { enabled: true }
    case 'toggle':
      return { enabled: typeof requested.enabled === 'boolean' ? requested.enabled : capability.defaultEnabled }
    case 'levels': {
      const level = requested.level && capability.levels.includes(requested.level) ? requested.level : capability.defaultLevel
      return { level }
    }
    case 'budget': {
      const budget = requested.budgetTokens
        ? Math.max(capability.minTokens, Math.min(capability.maxTokens, requested.budgetTokens))
        : capability.defaultTokens
      return { budgetTokens: budget }
    }
    case 'provider-native':
      // Native schema is provider-specific and not modeled here; pass the
      // request through unchanged and let the adapter decide what it means.
      return requested
    default:
      return undefined
  }
}
